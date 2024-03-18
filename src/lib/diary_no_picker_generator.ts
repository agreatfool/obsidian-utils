import * as dayjs from 'dayjs';
import * as LibPath from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Frontmatter, FrontmatterWeather, generateDoc, getWeather, locateme } from './util';
import { Config } from './config';

const shell = require('shelljs');

export class DiaryNoPickerGenerator {
  private _dest: string;
  private _dayjs: dayjs.Dayjs;

  constructor(destination: string, datetime: string) {
    this._dest = destination;
    this._dayjs = dayjs(datetime);
  }

  public async run(): Promise<void> {
    const config = Config.load().getConfig();
    const geo = await locateme();

    const year = this._dayjs.format('YYYY');
    const month = this._dayjs.format('MM');
    const dateShort = this._dayjs.format('YYYYMMDD');
    const date = this._dayjs.format('YYYY-MM-DD');

    const weather: FrontmatterWeather = await getWeather(
      `${geo.lon},${geo.lat}`,
      config.nowapiAppKey,
      config.nowapiSign,
      this._dayjs.format('YYYY-MM-DD HH:mm:ss')
    );

    const data = {
      uuid: uuidv4().replace(/-/g, '').toUpperCase(),
      path: `/${year}/${month}/${dateShort}-${date}`,
      date,
      slug: date,
      title: date,
      location: {
        altitude: null,
        latitude: geo.lat,
        longitude: geo.lon,
        address: null,
        placename: null,
        district: null,
        city: null,
        province: null,
        country: null
      },
      weather
    } as Frontmatter;

    await generateDoc(this._dest, data);

    shell.exec(`open "${LibPath.join(this._dest, data.path)}"`); // open created post dir
  }
}
