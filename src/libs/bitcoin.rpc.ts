import * as request from 'request';
import { ITransaction } from '../../types/bitcoinApi';

export class BitcoinRPC {
  private readonly host: string;
  private readonly port: number;
  private readonly user: string;
  private readonly password: string;

  constructor(host: string, port: number, user: string, password: string) {
    this.host = host;
    this.port = port;
    this.user = user;
    this.password = password;
  }

  async call<T>(method: string, params: any): Promise<T> {
    return new Promise(
      (resolve: (summery: T) => void, reject: (err: Error) => void): void => {
        const postData: any = {
          jsonrpc: '1.0',
          method: method,
          params,
          id: '1'
        };
        request.post(
          `http://${this.host}:${this.port}/`,
          {
            json: true,
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 10000,
            auth: { username: this.user, pass: this.password },
            body: postData
          },
          (err: Error, resp: request.Response, body: { result: T; error: any }) => {
            if (err) {
              reject(err);

              return;
            }
            if (body?.error) {
              reject(new Error(body.error));

              return;
            }
            if (resp && resp.statusCode !== 200) {
              reject(new Error(resp.statusMessage));

              return;
            }

            resolve(body.result);
          }
        );
      }
    );
  }

  public async txById(txId: string): Promise<ITransaction> {
    return this.call('getrawtransaction', [txId, 1]);
  }
}
