import * as LibFs from 'fs';
import * as YAML from 'yaml';

interface ConfigObject {
  amapJsKey: string; // location select
  amapWebKey: string; // api call
  nowapiAppKey: string;
  nowapiSign: string;
}

export class Config {
  private static _instance: Config;
  public static get(path?: string): Config {
    if (!Config._instance) {
      if (!path) {
        throw new Error('Config instance not found, params are required in this case');
      }
      Config._instance = new Config(path);
    }
    return Config._instance;
  }

  private readonly _yaml: ConfigObject;
  constructor(path: string) {
    const file = LibFs.readFileSync(path).toString();
    this._yaml = YAML.parse(file);
  }

  public getConfig(): ConfigObject {
    return this._yaml;
  }
}
