"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeather = exports.locateme = exports.generateDoc = exports.isValidDateTime = exports.isDateStrValid = void 0;
const dayjs = require("dayjs");
const LibPath = require("path");
const LibFs = require("fs/promises");
const shell = require('shelljs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);
const isDateStrValid = (date, format) => {
    return dayjs(date, format, true).isValid();
};
exports.isDateStrValid = isDateStrValid;
// YYYY-mm-dd HH:mm:ss
const isValidDateTime = (datetime) => {
    const pattern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    return pattern.test(datetime);
};
exports.isValidDateTime = isValidDateTime;
const generateDoc = (destVaultDir, data) => __awaiter(void 0, void 0, void 0, function* () {
    const date = dayjs(data.date, 'YYYY-MM-DD');
    const path = LibPath.join(destVaultDir, data.path);
    const filePath = LibPath.join(path, data.slug + '.md');
    console.log(`mkdir -p "${path}"`);
    shell.exec(`mkdir -p "${path}"`);
    console.log(`write file ${filePath}`);
    yield LibFs.writeFile(filePath, [
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
    ].join('\n'));
});
exports.generateDoc = generateDoc;
const locateme = () => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const defaultGeo = { lat: '31.234464', lon: '121.482956' };
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
            let res;
            try {
                res = JSON.parse(chunk);
            }
            catch (err) {
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
});
exports.locateme = locateme;
const getWeather = (location, key, sign, datetime) => __awaiter(void 0, void 0, void 0, function* () {
    const now = dayjs();
    const gap = now.diff(datetime);
    if (gap < 3600 * 1000) {
        return getWeatherNow(location, key, sign);
    }
    else {
        return getWeatherHistory(location, key, sign, datetime);
    }
});
exports.getWeather = getWeather;
// location: longitude,latitude
const getWeatherNow = function (location, key, sign) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `https://sapi.k780.com/?app=weather.today&wgs84ll=${location}&appkey=${key}&sign=${sign}&format=json`;
        const res = yield fetch(url);
        if (res.status !== 200) {
            console.log('Error in fetching nowapi "weather.today"', res);
            process.exit(1);
        }
        const json = (yield res.json());
        if (json.success !== '1') {
            console.log(`Error in fetching nowapi "weather.today": ${url}, ${JSON.stringify(json, null, 2)}`);
            process.exit(1);
        }
        const weather = {};
        weather.temperature = json.result.temp_curr;
        weather.humidity = json.result.humidity;
        weather.weather = json.result.weather_curr;
        weather.time = dayjs().format('HH:mm:ss');
        weather.aqi = json.result.aqi;
        return weather;
    });
};
const getWeatherHistory = function (location, key, sign, datetime) {
    return __awaiter(this, void 0, void 0, function* () {
        const selectedDatetime = dayjs(datetime);
        const url = `https://sapi.k780.com/?app=weather.history&wgs84ll=${location}&date=${selectedDatetime.format('YYYY-MM-DD')}&appkey=${key}&sign=${sign}&format=json`;
        const res = yield fetch(url);
        if (res.status !== 200) {
            console.log('Error in fetching nowapi "weather.history"', url, res);
            process.exit(1);
        }
        const json = (yield res.json());
        if (json.success !== '1') {
            console.log(`Error in fetching nowapi "weather.history": ${url}, ${JSON.stringify(json, null, 2)}`);
            process.exit(1);
        }
        let diff;
        let closest;
        const dataList = json.result;
        for (const data of dataList) {
            const uptime = dayjs(data.uptime, 'YYYY-MM-DD HH:mm:ss');
            const gap = Math.abs(selectedDatetime.diff(uptime));
            if (!closest || gap < diff) {
                diff = gap;
                closest = data;
            }
        }
        const weather = {};
        weather.temperature = closest.temp;
        weather.humidity = closest.humidity;
        weather.weather = closest.weather;
        weather.time = dayjs(closest.uptime, 'YYYY-MM-DD HH:mm:ss').format('HH:mm:ss');
        weather.aqi = closest.aqi;
        return weather;
    });
};
//# sourceMappingURL=util.js.map