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
            const geo = yield this._locateme();
            const pageUrl = `http://127.0.0.1:9191?lat=${geo.lat}&lon=${geo.lon}&amapJsKey=${configs.amapJsKey}&amapWebKey=${configs.amapWebKey}&nowapiAppKey=${configs.nowapiAppKey}&nowapiSign=${configs.nowapiSign}`;
            console.log(`puppeteer target: ${pageUrl}`);
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
        return __awaiter(this, void 0, void 0, function* () {
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
    }
}
exports.Browser = Browser;
//# sourceMappingURL=browser.js.map