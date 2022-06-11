export interface IEnvironment {
  NODE_ENV: string;
  LOG_LEVEL: string;

  NETWORK: string;

  BITCOIN_RPC_HOST:string;
BITCOIN_RPC_PORT:number;
BITCOIN_RPC_USER:string;
BITCOIN_RPC_PASSWORD:string;

  EXPRESS_PORT: number;
  EXPRESS_HOST: string;
}
