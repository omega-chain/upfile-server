import { IEnvironment } from '../../types/iEnvironment';

export class ENV {
  public readonly environments: IEnvironment;
  public constructor() {
    this.environments = {
      LOG_LEVEL: this.Setter('LOG_LEVEL', 'string'),
      NODE_ENV: this.Setter('NODE_ENV', 'string'),

      NETWORK: this.Setter('NETWORK', 'string', 'mainnet'),

      BITCOIN_RPC_HOST: this.Setter('BITCOIN_RPC_HOST', 'string'),
      BITCOIN_RPC_PORT: parseInt(this.Setter('BITCOIN_RPC_PORT', 'number'), 10),
      BITCOIN_RPC_USER: this.Setter('BITCOIN_RPC_USER', 'string'),
      BITCOIN_RPC_PASSWORD: this.Setter('BITCOIN_RPC_PASSWORD', 'string'),

      EXPRESS_PORT: parseInt(this.Setter('EXPRESS_PORT', 'number', '80'), 10),
      EXPRESS_HOST: this.Setter('EXPRESS_HOST', 'string', '0.0.0.0')
    };
  }

  public Setter(envParam: string, type: string, defaultValue?: string): string {
    let value: string | undefined = process.env[envParam];
    if (value === undefined && defaultValue !== undefined) {
      value = defaultValue;
    }
    if (['number'].indexOf(type) > -1) {
      if (value === undefined || isNaN(parseFloat(value))) {
        throw new Error(`${envParam} => Not value[${value}] in type[${type}]`);
      }

      return value;
    }

    if (['string'].indexOf(type) > -1) {
      if (value === undefined) {
        throw new Error(`${envParam} => Not value[${value}] in type[${type}]`);
      }

      return value;
    }

    return '';
  }
}
