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
exports.Browser = void 0;
const puppeteer = require("puppeteer");
const config_1 = require("./config");
const shell = require('shelljs');
class Browser {
    static get() {
        if (!Browser._instance) {
            Browser._instance = new Browser();
        }
        return Browser._instance;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const configs = config_1.Config.get().getConfig();
            const geo = this._locateme();
            const pageUrl = `http://127.0.0.1:9191?lat=${geo.lat}&lon=${geo.lon}&amapJsKey=${configs.amapJsKey}&amapWebKey=${configs.amapWebKey}&nowapiAppKey=${configs.nowapiAppKey}&nowapiSign=${configs.nowapiSign}`;
            if (!this._browser) {
                this._browser = yield puppeteer.launch({ headless: false });
            }
            const page = yield this._browser.newPage();
            yield page.setViewport({ width: 1920, height: 1080 });
            yield page.goto(pageUrl);
            page.on('close', () => __awaiter(this, void 0, void 0, function* () {
                yield this._browser.close();
                this._browser = undefined;
            }));
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._browser) {
                yield this._browser.close();
                this._browser = undefined;
            }
        });
    }
    _locateme() {
        let res;
        const stdout = shell.exec('locateme -f "{\\"lat\\":\\"{LAT}\\",\\"lon\\":\\"{LON}\\"}"').stdout.replace('\n', '');
        try {
            res = JSON.parse(stdout);
        }
        catch (err) {
            res = { lat: '31.234464', lon: '121.482956' }; // predefined
        }
        return res;
    }
}
exports.Browser = Browser;
//# sourceMappingURL=browser.js.map