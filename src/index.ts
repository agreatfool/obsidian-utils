#!/usr/bin/env node

import * as LibOs from 'os';
import * as LibFs from 'fs';
import { Command } from 'commander';
import { isDateStrValid } from './lib/util';
import { HttpServer } from './lib/server';
import { Browser } from './lib/browser';
import { Config } from './lib/config';
import { LOCATEME_NAME } from './lib/const';

const shell = require('shelljs');
const program = new Command();
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
    if (!LibFs.existsSync(CMD_ARGS_DEST) || !LibFs.statSync(CMD_ARGS_DEST).isDirectory()) {
      console.log('Invalid destination specified!');
      process.exit(1);
    }
    if (!LibFs.existsSync(CMD_ARGS_CONFIG) || !LibFs.statSync(CMD_ARGS_CONFIG).isFile()) {
      console.log(`Wrong config file path given: ${CMD_ARGS_CONFIG}`);
      process.exit(1);
    }
  }

  private async _process() {
    Config.get(CMD_ARGS_CONFIG);
    new HttpServer(CMD_ARGS_DEST).run().catch((err) => console.log(err));
    Browser.get()
      .run()
      .catch((err) => console.log(err));
  }
}

new ObsidianUtil().run().catch((_) => console.log(_));

process.on('uncaughtException', (error) => {
  console.error(`Process on uncaughtException error = ${error.stack}`);
});

process.on('unhandledRejection', (error) => {
  console.error(`Process on unhandledRejection error`, error);
});
