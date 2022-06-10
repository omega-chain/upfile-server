import { ReadableStreamBuffer } from 'stream-buffers';
import { ITransaction } from '../../../types/bitcoinApi';
import {
  IFileBase,
  IFileHeader,
  IFileStats,
  IFileTransactionData
} from '../../../types/file';
import { BitcoinRPC } from '../bitcoin.rpc';

const TAG_HEX = Buffer.from('upfile ', 'ascii').toString('hex');
export class BFS {
  private readonly bitcoinRpc: BitcoinRPC;

  public constructor(bitcoinRpc: BitcoinRPC) {
    this.bitcoinRpc = bitcoinRpc;
  }

  public static removeOpCodes(hex: string): string {
    if (hex.indexOf('006a') === 0) {
      hex = hex.slice(4);
    }
    const sizeCode: string = hex.slice(0, 2);
    switch (sizeCode) {
      case '4c': {
        //size = parseInt(hex.slice(2, 4), 16);
        hex = hex.slice(4);

        return hex;
      }
      case '4d': {
        //size = parseInt(hex.slice(2, 6), 16);
        hex = hex.slice(6);

        return hex;
      }
      case '4e': {
        //size = parseInt(hex.slice(2, 10), 16);
        hex = hex.slice(10);

        return hex;
      }
      default: {
        return undefined;
      }
    }
  }

  public transactionBfsData(transaction: ITransaction): IFileBase {
    const outputIndex = transaction.vout.filter(
      (out) => out.scriptPubKey?.type === 'nulldata'
    )[0]?.n;
    if (outputIndex === undefined) {
      throw new Error('Data output not found.');
    }

    const hex: string = BFS.removeOpCodes(transaction.vout[outputIndex].scriptPubKey.hex);
    if (!hex) {
      throw new Error('Not standard bfs transaction.');
    }

    return JSON.parse(
      Buffer.from(hex.startsWith(TAG_HEX) ? hex.slice(TAG_HEX.length) : hex, 'hex').toString(
        'utf8'
      )
    ) as IFileBase;
  }

  public transactionData(transaction: ITransaction, index?: number): Buffer {
    const outputIndex =
      index !== undefined
        ? index
        : transaction.vout.filter((out) => out.scriptPubKey?.type === 'nulldata')[0]?.n;
    if (outputIndex === undefined) {
      throw new Error('Data output not found.');
    }
    const hex: string = BFS.removeOpCodes(transaction.vout[outputIndex].scriptPubKey.hex);
    if (!hex) {
      throw new Error('Not standard bfs transaction.');
    }

    return Buffer.from(hex.startsWith(TAG_HEX) ? hex.slice(TAG_HEX.length) : hex, 'hex');
  }

  public async stats(bfsSourceTx: string): Promise<IFileStats> {
    const tx: ITransaction = await this.bitcoinRpc.txById(bfsSourceTx);
    const file: IFileTransactionData = this.transactionBfsData(tx) as IFileTransactionData;
    const stats: IFileStats = {
      size: file.size,
      chuncksize: file.chuncksize,
      filename: file.filename,
      mime: file.mime,
      type: file.data ? 'single' : 'multiple'
    };

    return stats;
  }

  public async read(
    bfsSourceTx: string,
    from: number = 0,
    length?: number,
    readable?: ReadableStreamBuffer
  ): Promise<ReadableStreamBuffer> {
    const stats: IFileStats = await this.stats(bfsSourceTx);
    if (!length) {
      length = stats.size;
    }
    if (stats.type === 'single') {
      if (from > stats.size) {
        throw new Error('Incorrect from!');
      }
      if (length > stats.size - from) {
        length = 0;
      }
      const tx: ITransaction = await this.bitcoinRpc.txById(bfsSourceTx);
      const file: IFileTransactionData = this.transactionBfsData(tx) as IFileTransactionData;
      const buffer: Buffer = Buffer.from(file.data, 'base64');
      const finalBuffer: Buffer = buffer.slice(from, length === 0 ? 0 : from + length);
      readable.put(finalBuffer, 'binary');
      readable.stop();

      return readable;
    }
    const headerTx: ITransaction = await this.bitcoinRpc.txById(bfsSourceTx);
    const header: IFileHeader = this.transactionBfsData(headerTx) as IFileHeader;
    let blockIndex: number = Math.floor(from / header.chuncksize);
    let blockPointer: number = from % header.chuncksize;
    let fetched: number = 0;
    //let mainBuffer: Buffer = Buffer.alloc(0);
    while (fetched < length && blockIndex < header.chunks.length) {
      const [txid, index] = header.chunks[blockIndex].split('_');
      const transaction = await this.bitcoinRpc.txById(txid);
      const blockBuffer: Buffer = this.transactionData(
        transaction,
        index !== undefined ? +index : undefined
      );
      const remained: number = length - fetched;
      if (blockBuffer.length - blockPointer <= remained) {
        // Read from blockpinter to end of block buffer
        //mainBuffer = Buffer.concat([mainBuffer, blockBuffer.slice(blockPointer)]);
        readable.put(blockBuffer.slice(blockPointer));
        fetched = fetched + (blockBuffer.length - blockPointer);
      } else {
        // Read from start
        const shouldToRead: number = Math.min(remained, blockBuffer.length - blockPointer);
        //mainBuffer = Buffer.concat([mainBuffer, blockBuffer.slice(blockPointer, blockPointer + shouldToRead)]);
        readable.put(blockBuffer.slice(blockPointer, blockPointer + shouldToRead), 'binary');
        fetched = fetched + shouldToRead;
      }
      blockIndex += 1;
      blockPointer = 0;
    }
    readable.stop();

    return readable;
  }
}
