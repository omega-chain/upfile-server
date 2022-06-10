export interface IPrice {
    bsv: number;
}

export interface IInput {
    txid: string;
    vout: number;
    scriptSig: {
        asm: string;
        hex: string;
    };
    sequence: number;
}

export interface IOutput {
    value: number;
    n: number;
    scriptPubKey: {
        asm: string;
        hex: string;
        type: string;
    };
}

export interface ITransaction {
    txid: string;
    hash: string;
    size: number;
    vin: IInput[];
    vout: IOutput[];
    blockhash: string;
    confirmations: number;
    time: number;
    blocktime: number;
    blockheight: number;
    hex: string;
}
