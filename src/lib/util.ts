import * as dayjs from 'dayjs';
import * as LibPath from 'path';
import * as LibFs from 'fs/promises';

const shell = require('shelljs');

const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

export const isDateStrValid = (date: string, format: string): boolean => {
  return dayjs(date, format, true).isValid();
};

// YYYY-mm-dd HH:mm:ss
export const isValidDateTime = (datetime: string): boolean => {
  const pattern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
  return pattern.test(datetime);
};

export interface FrontmatterWeather {
  temperature: string;
  humidity: string;
  weather: string;
  time: string;
  aqi: string;
}

export interface Frontmatter {
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
  weather: FrontmatterWeather;
}

export const generateDoc = async (destVaultDir: string, data: Frontmatter): Promise<void> => {
  const date = dayjs(data.date, 'YYYY-MM-DD');

  const path = LibPath.join(destVaultDir, data.path);
  const filePath = LibPath.join(path, data.slug + '.md');

  console.log(`mkdir -p "${path}"`);
  shell.exec(`mkdir -p "${path}"`);
  console.log(`write file ${filePath}`);
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
};

export interface Location {
  lat: string | number;
  lon: string | number;
}

export const locateme = async (): Promise<Location> => {
  return new Promise((resolve) => {
    const defaultGeo: Location = { lat: '31.234464', lon: '121.482956' };

    const child = shell.exec('locateme -f "{\\"lat\\":\\"{LAT}\\",\\"lon\\":\\"{LON}\\"}"', { async: true });
    child.stdout.on('data', function (chunk) {
      console.log(`LocateMe.stdout: ${chunk}`);
      // chunk: 2021-01-06 11:17:33.168 locateme[26247:2845475] Error: Error Domain=kCLErrorDomain Code=0 "(null)"
      if (chunk.indexOf('Error') !== -1) {
        if (child.connected) {
          child.disconnect();
        }
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
    child.stderr.on('data', function (chunk) {
      console.log(`LocateMe.stderr: ${chunk}`);
      // chunk: 2021-01-06 11:17:33.168 locateme[26247:2845475] Error: Error Domain=kCLErrorDomain Code=0 "(null)"
      if (chunk.indexOf('Error') !== -1) {
        if (child.connected) {
          child.disconnect();
        }
        return resolve(defaultGeo);
      }
    });
  });
};

interface WeatherNowAPIRes {
  success: string; // '1';
  result: {
    aqi: string; // '54';
    cityid: string; // '101020400';
    citynm: string; // '黄浦';
    cityno: string; // '';
    days: string; // '2024-03-18';
    humi_high: string; // '0';
    humi_low: string; // '0';
    humidity: string; // '58%';
    temp_curr: string; // '11';
    temp_high: string; // '11';
    temp_low: string; // '8';
    temperature: string; // '11℃/8℃';
    temperature_curr: string; // '11℃';
    weaid: string; // '2738';
    weather: string; // '小雨转阴';
    weather_curr: string; // '阴';
    weather_icon: string; // 'http://api.k780.com/upload/weather/d/2.gif';
    weather_icon1: string; // '';
    weather_iconid: string; // '2';
    weatid: string; // '3';
    weatid1: string; // '';
    week: string; // '星期一';
    wind: string; // '东北风';
    windid: string; // '1';
    winp: string; // '1级';
    winpid: string; // '1';
  };
}

interface WeatherHistoryAPIResRow {
  aqi: string; // '38';
  cityid: string; // '101020400';
  citynm: string; // '黄浦';
  cityno: string; // '';
  humidity: string; // '91%';
  temp: string; // '13';
  temperature: string; // '13℃';
  uptime: string; // '2024-03-16 00:20:00';
  weaid: string; // '2738';
  weather: string; // '阴';
  weather_icon: string; // 'http://api.k780.com/upload/weather/d/2.gif';
  weather_iconid: string; // '2';
  weatid: string; // '3';
  week: string; // '星期六';
  wind: string; // '北风';
  windid: string; // '8';
  winp: string; // '0级';
  winpid: string; // '0';
}

interface WeatherHistoryAPIRes {
  success: string; // '1';
  result: WeatherHistoryAPIResRow[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getWeather = async (location: string, key: string, sign: string, datetime: string): Promise<FrontmatterWeather> => {
  // 2024-07-03
  // As the weather API failed, I will drop this data.
  // The weather data store in the metadata part never been read till now, it's a bit useless.
  // Maybe I will switch to some new weather service later, who knows.
  /*
  const now = dayjs();
  const gap = now.diff(datetime);
  
  if (gap < 3600 * 1000) {
    return getWeatherNow(location, key, sign);
  } else {
    return getWeatherHistory(location, key, sign, datetime);
  }
  */

  return {
    temperature: '',
    humidity: '',
    weather: '',
    time: '',
    aqi: ''
  };
};

// location: longitude,latitude
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getWeatherNow = async function (location: string, key: string, sign: string): Promise<FrontmatterWeather> {
  const url = `https://sapi.k780.com/?app=weather.today&wgs84ll=${location}&appkey=${key}&sign=${sign}&format=json`;
  const res = await fetch(url);
  if (res.status !== 200) {
    console.log('Error in fetching nowapi "weather.today"', res);
    process.exit(1);
  }
  const json = (await res.json()) as WeatherNowAPIRes;
  if (json.success !== '1') {
    console.log(`Error in fetching nowapi "weather.today": ${url}, ${JSON.stringify(json, null, 2)}`);
    process.exit(1);
  }

  const weather = {} as FrontmatterWeather;

  weather.temperature = json.result.temp_curr;
  weather.humidity = json.result.humidity;
  weather.weather = json.result.weather_curr;
  weather.time = dayjs().format('HH:mm:ss');
  weather.aqi = json.result.aqi;

  return weather;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getWeatherHistory = async function (location: string, key: string, sign: string, datetime: string): Promise<FrontmatterWeather> {
  const selectedDatetime = dayjs(datetime);
  const url = `https://sapi.k780.com/?app=weather.history&wgs84ll=${location}&date=${selectedDatetime.format(
    'YYYY-MM-DD'
  )}&appkey=${key}&sign=${sign}&format=json`;
  const res = await fetch(url);
  if (res.status !== 200) {
    console.log('Error in fetching nowapi "weather.history"', url, res);
    process.exit(1);
  }
  const json = (await res.json()) as WeatherHistoryAPIRes;
  if (json.success !== '1') {
    console.log(`Error in fetching nowapi "weather.history": ${url}, ${JSON.stringify(json, null, 2)}`);
    process.exit(1);
  }

  let diff: number;
  let closest: WeatherHistoryAPIResRow;
  const dataList = json.result;
  for (const data of dataList) {
    const uptime = dayjs(data.uptime, 'YYYY-MM-DD HH:mm:ss');
    const gap = Math.abs(selectedDatetime.diff(uptime));
    if (!closest || gap < diff) {
      diff = gap;
      closest = data;
    }
  }

  const weather = {} as FrontmatterWeather;

  weather.temperature = closest.temp;
  weather.humidity = closest.humidity;
  weather.weather = closest.weather;
  weather.time = dayjs(closest.uptime, 'YYYY-MM-DD HH:mm:ss').format('HH:mm:ss');
  weather.aqi = closest.aqi;

  return weather;
};
