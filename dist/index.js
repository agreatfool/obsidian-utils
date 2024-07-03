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
const index_generator_1 = require("./lib/index_generator");
const diary_no_picker_generator_1 = require("./lib/diary_no_picker_generator");
const util_1 = require("./lib/util");
const shell = require('shelljs');
const program = new commander_1.Command();
const pkg = require('../package.json');
const ACTIONS = ['util', 'diary', 'index'];
program
    .version(pkg.version)
    .description('Obsidian utility, help to generate frontmatter, etc')
    .requiredOption('-a, --action <string>', 'which action will be executed: util | diary | index')
    .option('-t, --datetime <string>', "the datetime of the document to be created, format: 'YYYY-MM-DD HH:mm:ss'")
    .requiredOption('-d, --dest <dir>', 'directory of output destination')
    .option('-c, --config <path>', 'file path of the config yaml, example could be find at: ${source_root}/config.example.yaml; required if action is "util | diray"')
    .parse(process.argv);
const options = program.opts();
const CMD_ARGS_ACTION = options.action;
const CMD_ARGS_DEST = options.dest;
const CMD_ARGS_TIME = options.datetime;
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
            console.log('Validating ...', options);
            if (LibOs.platform() !== 'darwin') {
                console.log('Only MacOS supported!');
                process.exit(1);
            }
            if (shell.which(const_1.LOCATEME_NAME) === null) {
                console.log('Need "locateme" installed');
                process.exit(1);
            }
            if (!ACTIONS.includes(CMD_ARGS_ACTION)) {
                console.log('Invalid action specified!');
                process.exit(1);
            }
            if (!LibFs.existsSync(CMD_ARGS_DEST) || !LibFs.statSync(CMD_ARGS_DEST).isDirectory()) {
                console.log('Invalid destination specified!');
                process.exit(1);
            }
            if ((CMD_ARGS_ACTION === 'util' || CMD_ARGS_ACTION === 'diary') &&
                (!LibFs.existsSync(CMD_ARGS_CONFIG) || !LibFs.statSync(CMD_ARGS_CONFIG).isFile())) {
                console.log(`Wrong config file path given: ${CMD_ARGS_CONFIG}`);
                process.exit(1);
            }
            if (CMD_ARGS_ACTION === 'diary' && !CMD_ARGS_TIME) {
                console.log('For action "diary", -t datetime input is required');
                process.exit(1);
            }
            if (CMD_ARGS_ACTION === 'diary' && !(0, util_1.isValidDateTime)(CMD_ARGS_TIME)) {
                console.log(`Wrong datetime given: ${CMD_ARGS_TIME}`);
                process.exit(1);
            }
        });
    }
    _process() {
        return __awaiter(this, void 0, void 0, function* () {
            switch (CMD_ARGS_ACTION) {
                case 'index':
                    yield new index_generator_1.IndexGenerator(CMD_ARGS_DEST).run();
                    break;
                case 'diary':
                    config_1.Config.load(CMD_ARGS_CONFIG);
                    new diary_no_picker_generator_1.DiaryNoPickerGenerator(CMD_ARGS_DEST, CMD_ARGS_TIME).run().catch((err) => console.log(err));
                    break;
                case 'util':
                default:
                    config_1.Config.load(CMD_ARGS_CONFIG);
                    new server_1.HttpServer(CMD_ARGS_DEST).run().catch((err) => console.log(err));
                    browser_1.Browser.get()
                        .run()
                        .catch((err) => console.log(err));
                    break;
            }
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