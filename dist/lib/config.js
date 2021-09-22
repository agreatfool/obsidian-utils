"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const LibFs = require("fs");
const YAML = require("yaml");
class Config {
    constructor(path) {
        const file = LibFs.readFileSync(path).toString();
        this._yaml = YAML.parse(file);
    }
    static get(path) {
        if (!Config._instance) {
            if (!path) {
                throw new Error('Config instance not found, params are required in this case');
            }
            Config._instance = new Config(path);
        }
        return Config._instance;
    }
    getConfig() {
        return this._yaml;
    }
}
exports.Config = Config;
//# sourceMappingURL=config.js.map