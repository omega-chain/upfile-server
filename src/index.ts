import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import * as methodOverride from 'method-override';
import { BitcoinRPC } from './libs/bitcoin.rpc';
import { ENV } from './libs/environment';
import { UFS } from './libs/file/read';
import { Partial } from './libs/partial';

const env: ENV = new ENV();
const bitcoinRpc: BitcoinRPC = new BitcoinRPC(
  env.environments.BITCOIN_RPC_HOST,
  env.environments.BITCOIN_RPC_PORT,
  env.environments.BITCOIN_RPC_USER,
  env.environments.BITCOIN_RPC_PASSWORD
);
const ufs: UFS = new UFS(bitcoinRpc);
const partial: Partial = new Partial(ufs);
const app: express.Express = express();

app.use(express.urlencoded({ extended: true, limit: 120000 }));
app.use(express.json({ limit: 120000 }));
app.use(methodOverride.default());
if (env.environments.NODE_ENV === 'develop') {
  app.use(cors());
}

app.get('/:key', (req: Request, res: Response, next: NextFunction): void => {
  if (!req.params['key'] || req.params['key'].length !== 64) {
    res.sendStatus(404);

    return;
  }
  partial.resolve(req, res);
});

let readiness: boolean = true;
app.get('/readiness', (req: Request, res: Response, next: NextFunction): void => {
  if (readiness) {
    res.send(200);
  } else {
    res.send(500);
  }
  next();
});

app.get('/liveness', (req: Request, res: Response, next: NextFunction): void => {
  res.send(200);
  next();
});

app.listen(env.environments.EXPRESS_PORT, env.environments.EXPRESS_HOST);
