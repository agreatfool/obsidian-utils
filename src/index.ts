#!/usr/bin/env node

import * as LibOs from 'os';
import * as LibFs from 'fs';
import { Command } from 'commander';
import { HttpServer } from './lib/server';
import { Browser } from './lib/browser';
import { Config } from './lib/config';
import { LOCATEME_NAME } from './lib/const';
import { IndexGenerator } from './lib/index_generator';

const shell = require('shelljs');
const program = new Command();
const pkg = require('../package.json');

const ACTIONS = ['util', 'index'];

program
  .version(pkg.version)
  .description('Obsidian utility, help to generate frontmatter, etc')
  .option('-a, --action <string>', 'which action will be executed: util | index', 'util')
  .requiredOption('-d, --dest <dir>', 'directory of output destination')
  .option(
    '-c, --config <path>',
    'file path of the config yaml, example could be find at: ${source_root}/config.example.yaml; required if action is "util"'
  )
  .parse(process.argv);

const options = program.opts();
const CMD_ARGS_ACTION = options.action;
const CMD_ARGS_DEST = options.dest;
const CMD_ARGS_CONFIG = options.config;

class ObsidianUtil {
  public async run() {
    console.log('ObsidianUtil starting ...');
    await this._validate();
    await this._process();
  }

  private async _validate() {
    console.log('Validating ...');
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
    if (CMD_ARGS_ACTION === 'util' && (!LibFs.existsSync(CMD_ARGS_CONFIG) || !LibFs.statSync(CMD_ARGS_CONFIG).isFile())) {
      console.log(`Wrong config file path given: ${CMD_ARGS_CONFIG}`);
      process.exit(1);
    }
  }

  private async _process() {
    switch (CMD_ARGS_ACTION) {
      case 'index':
        await new IndexGenerator(CMD_ARGS_DEST).run();
        break;
      case 'util':
      default:
        Config.get(CMD_ARGS_CONFIG);
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
