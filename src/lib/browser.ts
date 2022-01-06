import * as puppeteer from 'puppeteer';
import { Config } from './config';

const shell = require('shelljs');

interface Location {
  lat: string | number;
  lon: string | number;
}

export class Browser {
  private static _instance: Browser;
  public static get(): Browser {
    if (!Browser._instance) {
      Browser._instance = new Browser();
    }
    return Browser._instance;
  }

  private _browser: puppeteer.Browser;

  public async run(): Promise<void> {
    const configs = Config.get().getConfig();
    const geo = await this._locateme();
    const pageUrl = `http://127.0.0.1:9191?lat=${geo.lat}&lon=${geo.lon}&amapJsKey=${configs.amapJsKey}&amapWebKey=${configs.amapWebKey}&nowapiAppKey=${configs.nowapiAppKey}&nowapiSign=${configs.nowapiSign}`;

    if (!this._browser) {
      this._browser = await puppeteer.launch({ headless: false });
    }
    const page = await this._browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(pageUrl);
    page.on('close', async () => {
      await this._browser.close();
      this._browser = undefined;
    });
  }

  public async close(): Promise<void> {
    if (this._browser) {
      await this._browser.close();
      this._browser = undefined;
    }
  }

  private async _locateme(): Promise<Location> {
    return new Promise((resolve) => {
      const defaultGeo: Location = { lat: '31.234464', lon: '121.482956' };

      const child = shell.exec('locateme -f "{\\"lat\\":\\"{LAT}\\",\\"lon\\":\\"{LON}\\"}"', { async: true });
      child.stdout.on('data', function (chunk) {
        console.log(`LocateMe.stdout: ${chunk}`);
        // chunk: 2021-01-06 11:17:33.168 locateme[26247:2845475] Error: Error Domain=kCLErrorDomain Code=0 "(null)"
        if (chunk.indexOf('Error') !== -1) {
          child.disconnect();
          return resolve(defaultGeo);
        }
        let res: Location;
        try {
          res = JSON.parse(chunk);
        } catch (err) {
          res = defaultGeo; // predefined
        }
        return resolve(res);
      });
    });
  }
}
