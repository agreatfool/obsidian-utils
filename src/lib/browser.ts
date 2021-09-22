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
    const geo = this._locateme();
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

  private _locateme(): Location {
    let res: Location;

    const stdout = shell.exec('locateme -f "{\\"lat\\":\\"{LAT}\\",\\"lon\\":\\"{LON}\\"}"').stdout.replace('\n', '');

    try {
      res = JSON.parse(stdout);
    } catch (err) {
      res = { lat: '31.234464', lon: '121.482956' }; // predefined
    }

    return res;
  }
}
