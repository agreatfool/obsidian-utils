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
exports.IndexGenerator = void 0;
const LibFs = require("fs/promises");
const LibPath = require("path");
const dayjs = require("dayjs");
const weekOfYear = require("dayjs/plugin/weekOfYear");
const util_1 = require("./util");
const const_1 = require("./const");
const shell = require('shelljs');
dayjs.extend(weekOfYear);
const IGNORE_LIST = ['.DS_Store', '.obsidian'];
class IndexGenerator {
    constructor(dest) {
        this._dest = dest;
        this._collected = {};
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            // collect data
            const years = yield this._readdir(this._dest);
            if (!this._validateYear(years)) {
                console.log('Seems invalid dest path provided, some sub path is not valid YYYY');
                process.exit(1);
            }
            // year
            for (const year of years) {
                if (year === const_1.INDEX_DIR) {
                    continue; // skip index dir itself
                }
                const yearPath = LibPath.join(this._dest, year);
                // month
                const months = yield this._readdir(yearPath);
                for (const month of months) {
                    const monthPath = LibPath.join(yearPath, month);
                    // slug
                    const slugDirs = yield this._readdir(monthPath);
                    for (const slugDir of slugDirs) {
                        const slugDirPath = LibPath.join(monthPath, slugDir);
                        // file
                        const file = (yield this._readdir(slugDirPath)).find((file) => file.endsWith('.md'));
                        if (!file) {
                            continue; // no ".md" found
                        }
                        const filePath = LibPath.join(slugDirPath, file);
                        const fileContent = (yield LibFs.readFile(filePath)).toString().split('\n');
                        const postData = { date: '', weekNum: 1, dayOfWeek: 1, slug: '', title: '', gallery: false };
                        for (let i = 0; i < fileContent.length; i++) {
                            const row = fileContent[i];
                            this._findFrontmatterVal(row, 'slug', postData);
                            this._findFrontmatterVal(row, 'title', postData);
                            this._findFrontmatterVal(row, 'date', postData);
                            if (row.startsWith('![]')) {
                                postData.gallery = true;
                            }
                            else if (row.startsWith('![[')) {
                                postData.gallery = true;
                            }
                            else if (row.startsWith('```post-gallery')) {
                                // check gallery content
                                const galleryName = fileContent[i + 1].replace('name:', '').trim();
                                const assetsPath = LibPath.join(slugDirPath, const_1.ASSETS_DIR);
                                const galleryPath = LibPath.join(assetsPath, galleryName);
                                try {
                                    const stat = yield LibFs.stat(galleryPath);
                                    if (stat && stat.isDirectory()) {
                                        const galleryFiles = yield this._readdir(galleryPath);
                                        if (galleryFiles.length === 1 && galleryFiles[0].match(/\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.jpg/) !== null) {
                                            // only AQI screenshot image inside the gallery, should not mark gallery as true
                                            // e.g 2024-01-20_23-20-01.jpg
                                        }
                                        else {
                                            postData.gallery = true;
                                        }
                                    }
                                }
                                catch (err) {
                                    console.log(`Reading gallery path failed: ${galleryPath}`, err);
                                }
                            }
                        }
                        if (!postData.slug || !postData.title || !postData.date) {
                            console.log(`${file} missing required frontmatter data: ${postData}`);
                            continue;
                        }
                        const dayjsInstance = dayjs(postData.date);
                        // dayOfWeek 1-7, Sunday is 7 (previously 0 from dayjs.day())
                        postData.dayOfWeek = dayjsInstance.day() === 0 ? 7 : dayjsInstance.day();
                        // weekNum of the year, Sunday would be set to previous week rather than the beginning of the week
                        postData.weekNum = postData.dayOfWeek === 7 ? dayjsInstance.week() - 1 : dayjsInstance.week();
                        if (!(year in this._collected)) {
                            this._collected[year] = [];
                        }
                        this._collected[year].push(postData);
                    }
                }
            }
            // write file
            yield this._generateIndexFile();
        });
    }
    _generateIndexFile() {
        return __awaiter(this, void 0, void 0, function* () {
            const indexPath = LibPath.join(this._dest, const_1.INDEX_DIR);
            const indexFilePath = LibPath.join(indexPath, const_1.INDEX_MD_FILE);
            shell.exec(`mkdir -p "${indexPath}"`);
            let indexContent = '';
            let totalPostsCount = 0;
            for (const [, list] of Object.entries(this._collected)) {
                totalPostsCount += list.length;
            }
            indexContent += '### Statistics\n';
            indexContent += '| year | count |\n';
            indexContent += '| :-- | :-- |\n';
            for (const year of Object.keys(this._collected).reverse()) {
                indexContent += `| ${year} | ${this._collected[year].length} / ${totalPostsCount} |\n`;
            }
            for (const year of Object.keys(this._collected).reverse()) {
                const yearList = this._collected[year].reverse();
                indexContent += `### ${year} (${yearList.length} / ${totalPostsCount})\n`;
                indexContent += '| date | weekOfYear | dayOfWeek | title | gallery |\n';
                indexContent += '| :-- | :-- | :-- | :-- | :-- |\n';
                for (const data of yearList) {
                    indexContent += `| ${data.date} | ${data.weekNum} | ${data.dayOfWeek} | [${data.title}](${data.slug}) | ${data.gallery ? '√' : 'x'} |\n`;
                }
            }
            return LibFs.writeFile(indexFilePath, indexContent);
        });
    }
    _readdir(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = [];
            const files = yield LibFs.readdir(path);
            for (const file of files) {
                if (IGNORE_LIST.includes(file)) {
                    continue;
                }
                result.push(file);
            }
            return result;
        });
    }
    _validateYear(years) {
        let allValid = true;
        for (const year of years) {
            if (year === const_1.INDEX_DIR) {
                continue; // skip index dir itself
            }
            if (!util_1.isDateStrValid(year, 'YYYY')) {
                allValid = false;
                console.log(`Invalid year: ${year}`);
            }
        }
        return allValid;
    }
    _findFrontmatterVal(row, frontmatterKey, data) {
        const pattern = new RegExp(`${frontmatterKey}:\\s"(.+)"`);
        if (row.startsWith(`${frontmatterKey}:`)) {
            const matched = row.match(pattern);
            if (matched) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                data[frontmatterKey] = matched[1];
            }
        }
    }
}
exports.IndexGenerator = IndexGenerator;
//# sourceMappingURL=index_generator.js.map