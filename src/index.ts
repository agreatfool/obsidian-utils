#!/usr/bin/env node

import * as LibOs from 'os';
import * as LibFs from 'fs';
import { Command } from 'commander';
import { HttpServer } from './lib/server';
import { Browser } from './lib/browser';
import { Config } from './lib/config';
import { LOCATEME_NAME } from './lib/const';
import { IndexGenerator } from './lib/index_generator';
import { DiaryNoPickerGenerator } from './lib/diary_no_picker_generator';
import { isValidDateTime } from './lib/util';

const shell = require('shelljs');
const program = new Command();
const pkg = require('../package.json');

const ACTIONS = ['util', 'diary', 'index'];

program
  .version(pkg.version)
  .description('Obsidian utility, help to generate frontmatter, etc')
  .requiredOption('-a, --action <string>', 'which action will be executed: util | diary | index')
  .option('-t, --datetime <string>', "the datetime of the document to be created, format: 'YYYY-MM-DD HH:mm:ss'")
  .requiredOption('-d, --dest <dir>', 'directory of output destination')
  .option(
    '-c, --config <path>',
    'file path of the config yaml, example could be find at: ${source_root}/config.example.yaml; required if action is "util | diray"'
  )
  .parse(process.argv);

const options = program.opts();
const CMD_ARGS_ACTION = options.action;
const CMD_ARGS_DEST = options.dest;
const CMD_ARGS_TIME = options.datetime;
const CMD_ARGS_CONFIG = options.config;

class ObsidianUtil {
  public async run() {
    console.log('ObsidianUtil starting ...');
    await this._validate();
    await this._process();
  }

  private async _validate() {
    console.log('Validating ...', options);
    if (LibOs.platform() !== 'darwin') {
      console.log('Only MacOS supported!');
      process.exit(1);
    }
    if (shell.which(LOCATEME_NAME) === null) {
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
    if (
      (CMD_ARGS_ACTION === 'util' || CMD_ARGS_ACTION === 'diary') &&
      (!LibFs.existsSync(CMD_ARGS_CONFIG) || !LibFs.statSync(CMD_ARGS_CONFIG).isFile())
    ) {
      console.log(`Wrong config file path given: ${CMD_ARGS_CONFIG}`);
      process.exit(1);
    }
    if (CMD_ARGS_ACTION === 'diary' && !CMD_ARGS_TIME) {
      console.log('For action "diary", -t datetime input is required');
      process.exit(1);
    }
    if (CMD_ARGS_ACTION === 'diary' && !isValidDateTime(CMD_ARGS_TIME)) {
      console.log(`Wrong datetime given: ${CMD_ARGS_TIME}`);
      process.exit(1);
    }
  }

  private async _process() {
    switch (CMD_ARGS_ACTION) {
      case 'index':
        await new IndexGenerator(CMD_ARGS_DEST).run();
        break;
      case 'diary':
        Config.load(CMD_ARGS_CONFIG);
        new DiaryNoPickerGenerator(CMD_ARGS_DEST, CMD_ARGS_TIME).run().catch((err) => console.log(err));
        break;
      case 'util':
      default:
        Config.load(CMD_ARGS_CONFIG);
        new HttpServer(CMD_ARGS_DEST).run().catch((err) => console.log(err));
        Browser.get()
          .run()
          .catch((err) => console.log(err));
        break;
    }
  }
}

new ObsidianUtil().run().catch((_) => console.log(_));

process.on('uncaughtException', (error) => {
  console.error(`Process on uncaughtException error = ${error.stack}`);
});

process.on('unhandledRejection', (error) => {
  console.error(`Process on unhandledRejection error`, error);
});
