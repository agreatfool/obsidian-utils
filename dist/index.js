#!/usr/bin/env node
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
const LibOs = require("os");
const LibFs = require("fs");
const commander_1 = require("commander");
const server_1 = require("./lib/server");
const browser_1 = require("./lib/browser");
const config_1 = require("./lib/config");
const const_1 = require("./lib/const");
const shell = require('shelljs');
const program = new commander_1.Command();
const pkg = require('../package.json');
program
    .version(pkg.version)
    .description('Obsidian utility, help to generate frontmatter, etc')
    .requiredOption('-d, --dest <dir>', 'directory of output destination')
    .requiredOption('-c, --config <path>', 'file path of the config yaml, example could be find at: ${source_root}/config.example.yaml')
    .parse(process.argv);
const options = program.opts();
const CMD_ARGS_DEST = options.dest;
const CMD_ARGS_CONFIG = options.config;
class ObsidianUtil {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('ObsidianUtil starting ...');
            yield this._validate();
            yield this._process();
        });
    }
    _validate() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Validating ...');
            if (LibOs.platform() !== 'darwin') {
                console.log('Only MacOS supported!');
                process.exit(1);
            }
            if (shell.which(const_1.LOCATEME_NAME) === null) {
                console.log('Need "locateme" installed');
                process.exit(1);
            }
            if (!LibFs.existsSync(CMD_ARGS_DEST) || !LibFs.statSync(CMD_ARGS_DEST).isDirectory()) {
                console.log('Invalid destination specified!');
                process.exit(1);
            }
            if (!LibFs.existsSync(CMD_ARGS_CONFIG) || !LibFs.statSync(CMD_ARGS_CONFIG).isFile()) {
                console.log(`Wrong config file path given: ${CMD_ARGS_CONFIG}`);
                process.exit(1);
            }
        });
    }
    _process() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.Config.get(CMD_ARGS_CONFIG);
            new server_1.HttpServer(CMD_ARGS_DEST).run().catch((err) => console.log(err));
            browser_1.Browser.get()
                .run()
                .catch((err) => console.log(err));
        });
    }
}
new ObsidianUtil().run().catch((_) => console.log(_));
process.on('uncaughtException', (error) => {
    console.error(`Process on uncaughtException error = ${error.stack}`);
});
process.on('unhandledRejection', (error) => {
    console.error(`Process on unhandledRejection error`, error);
});
//# sourceMappingURL=index.js.map