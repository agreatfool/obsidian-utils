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
exports.HttpServer = void 0;
const LibPath = require("path");
const express = require("express");
const morgan = require("morgan");
const browser_1 = require("./browser");
const util_1 = require("./util");
const cors = require('cors');
const shell = require('shelljs');
class HttpServer {
    constructor(dest) {
        this._dest = dest;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._startHttpServer();
            yield this._startExpress();
        });
    }
    _startHttpServer() {
        return __awaiter(this, void 0, void 0, function* () {
            const projectRoot = LibPath.join(__dirname, '../..');
            const moduleRoot = LibPath.join(projectRoot, 'node_modules');
            const webRoot = LibPath.join(projectRoot, 'web');
            const cmd = `${moduleRoot}/.bin/http-server -p 9191 ${webRoot}`;
            shell.exec(cmd, { async: true });
        });
    }
    _startExpress() {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line prefer-const
            let server;
            const app = express();
            app.use(express.json());
            app.use(express.urlencoded({ extended: true }));
            app.use(cors());
            app.use(morgan('combined'));
            app.post('/frontmatter', (req) => __awaiter(this, void 0, void 0, function* () {
                const data = req.body;
                yield (0, util_1.generateDoc)(this._dest, data);
                yield this._shutdown(server, LibPath.join(this._dest, data.path));
            }));
            server = app.listen(9292, () => {
                console.info('Listening on http://localhost:9292/');
            });
        });
    }
    _shutdown(server, path) {
        return __awaiter(this, void 0, void 0, function* () {
            const isNumeric = function (str) {
                if (typeof str != 'string')
                    return false; // we only process strings!
                return (
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
                    !isNaN(parseFloat(str))); // ...and ensure strings of whitespace fail
            };
            yield browser_1.Browser.get().close(); // puppeteer close
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
        });
    }
}
exports.HttpServer = HttpServer;
//# sourceMappingURL=server.js.map