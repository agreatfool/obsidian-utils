import * as LibPath from 'path';
import * as LibFs from 'fs/promises';
import * as express from 'express';
import * as morgan from 'morgan';
import { Browser } from './browser';
import * as LibHttp from 'http';
import * as dayjs from 'dayjs';

const cors = require('cors');
const shell = require('shelljs');

interface Frontmatter {
  uuid: string;
  path: string;
  date: string;
  slug: string;
  title: string;
  location: {
    altitude: number;
    latitude: number;
    longitude: number;
    address: string;
    placename: string;
    district: string;
    city: string;
    province: string;
    country: string;
  };
  weather: {
    temperature: number;
    humidity: number;
    weather: string;
    time: string;
    aqi: number;
  };
}

export class HttpServer {
  private readonly _dest: string;

  constructor(dest: string) {
    this._dest = dest;
  }

  public async run(): Promise<void> {
    await this._startHttpServer();
    await this._startExpress();
  }

  private async _startHttpServer(): Promise<void> {
    const projectRoot = LibPath.join(__dirname, '../..');
    const moduleRoot = LibPath.join(projectRoot, 'node_modules');
    const webRoot = LibPath.join(projectRoot, 'web');
    const cmd = `${moduleRoot}/.bin/http-server -p 9191 ${webRoot}`;
    shell.exec(cmd, { async: true });
  }

  private async _startExpress(): Promise<void> {
    // eslint-disable-next-line prefer-const
    let server: LibHttp.Server;
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cors());
    app.use(morgan('combined'));

    app.post('/frontmatter', async (req, res) => {
      const data = req.body as Frontmatter;
      const date = dayjs(data.date, 'YYYY-MM-DD');

      const path = LibPath.join(this._dest, data.path);
      const filePath = LibPath.join(path, data.slug + '.md');

      shell.exec(`mkdir -p "${path}"`);
      await LibFs.writeFile(
        filePath,
        [
          '---',
          `uuid: "${data.uuid}"`,
          `path: "${data.path}"`,
          `date: "${data.date}"`,
          `slug: "${data.slug}"`,
          `title: "${data.title}"`,
          `location:`,
          `  altitude: ${data.location.altitude}`,
          `  latitude: ${data.location.latitude}`,
          `  longitude: ${data.location.longitude}`,
          `  address: "${data.location.address}"`,
          `  placename: "${data.location.placename}"`,
          `  district: "${data.location.district}"`,
          `  city: "${data.location.city}"`,
          `  province: "${data.location.province}"`,
          `  country: "${data.location.country}"`,
          `weather:`,
          `  temperature: ${data.weather.temperature}`,
          `  humidity: "${data.weather.humidity}"`,
          `  weather: "${data.weather.weather}"`,
          `  time: "${data.weather.time}"`,
          `  aqi: ${data.weather.aqi}`,
          '---',
          '',
          `# ${data.title}`,
          '',
          '',
          `#Y${date.format('YYYY')} #M${date.format('YYYYMM')} #M${date.format('MM')} #D${date.format('YYYYMMDD')} #D${date.format('MMDD')}`
        ].join('\n')
      );

      await this._shutdown(server, path);
    });

    server = app.listen(9292, () => {
      console.info('Listening on http://localhost:9292/');
    });
  }

  async _shutdown(server: LibHttp.Server, path: string): Promise<void> {
    const isNumeric = function (str) {
      if (typeof str != 'string') return false; // we only process strings!
      return (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str))
      ); // ...and ensure strings of whitespace fail
    };

    await Browser.get().close(); // puppeteer close

    // http-server close
    const psstdout = shell.exec('ps aux|grep http-server | grep -v grep');
    for (const [index, val] of psstdout.split(' ').entries()) {
      if (index === 0 || val === '') {
        continue; // skip user and empty string
      }
      if (isNumeric(val)) {
        shell.exec(`kill ${val}`);
        break;
      }
    }

    shell.exec(`open "${path}"`); // open created post dir

    // express close
    server.close(() => {
      process.exit(0);
    });
  }
}
