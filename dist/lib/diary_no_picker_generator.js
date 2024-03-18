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
exports.DiaryNoPickerGenerator = void 0;
const dayjs = require("dayjs");
const LibPath = require("path");
const uuid_1 = require("uuid");
const util_1 = require("./util");
const config_1 = require("./config");
const index_generator_1 = require("./index_generator");
const shell = require('shelljs');
class DiaryNoPickerGenerator {
    constructor(destination, datetime) {
        this._dest = destination;
        this._dayjs = dayjs(datetime);
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const config = config_1.Config.load().getConfig();
            const geo = yield util_1.locateme();
            const year = this._dayjs.format('YYYY');
            const month = this._dayjs.format('MM');
            const dateShort = this._dayjs.format('YYYYMMDD');
            const date = this._dayjs.format('YYYY-MM-DD');
            const weather = yield util_1.getWeather(`${geo.lon},${geo.lat}`, config.nowapiAppKey, config.nowapiSign, this._dayjs.format('YYYY-MM-DD HH:mm:ss'));
            const data = {
                uuid: uuid_1.v4().replace(/-/g, '').toUpperCase(),
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
            };
            yield util_1.generateDoc(this._dest, data);
            const docDir = LibPath.join(this._dest, data.path);
            shell.exec(`mkdir -p ${LibPath.join(docDir, 'assets/gallery00')}`); // create default gallery dir, which is a must have dir for diary
            shell.exec(`open "${docDir}"`); // open created post dir
            // run indexing command as well
            yield new index_generator_1.IndexGenerator(this._dest).run();
        });
    }
}
exports.DiaryNoPickerGenerator = DiaryNoPickerGenerator;
//# sourceMappingURL=diary_no_picker_generator.js.map