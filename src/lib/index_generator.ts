import * as LibFs from 'fs/promises';
import * as LibPath from 'path';
import * as dayjs from 'dayjs';
import * as weekOfYear from 'dayjs/plugin/weekOfYear';
import { isDateStrValid } from './util';
import { INDEX_DIR, INDEX_MD_FILE } from './const';

const shell = require('shelljs');
dayjs.extend(weekOfYear);

const IGNORE_LIST = ['.DS_Store', '.obsidian'];

interface PostData {
  date: string;
  weekNum: number;
  dayOfWeek: number;
  slug: string;
  title: string;
  gallery: boolean;
}

export class IndexGenerator {
  private readonly _dest: string;
  private readonly _collected: { [year: string]: PostData[] };

  constructor(dest: string) {
    this._dest = dest;
    this._collected = {};
  }

  public async run(): Promise<void> {
    // collect data
    const years = await this._readdir(this._dest);
    if (!this._validateYear(years)) {
      console.log('Seems invalid dest path provided, some sub path is not valid YYYY');
      process.exit(1);
    }

    // year
    for (const year of years) {
      if (year === INDEX_DIR) {
        continue; // skip index dir itself
      }
      const yearPath = LibPath.join(this._dest, year);
      // month
      const months = await this._readdir(yearPath);
      for (const month of months) {
        const monthPath = LibPath.join(yearPath, month);
        // slug
        const slugDirs = await this._readdir(monthPath);
        for (const slugDir of slugDirs) {
          const slugDirPath = LibPath.join(monthPath, slugDir);
          // file
          const file = (await this._readdir(slugDirPath)).find((file) => file.endsWith('.md'));
          if (!file) {
            continue; // no ".md" found
          }
          const filePath = LibPath.join(slugDirPath, file);
          const fileContent = (await LibFs.readFile(filePath)).toString().split('\n');
          const postData = { date: '', weekNum: 1, dayOfWeek: 1, slug: '', title: '', gallery: false } as PostData;
          for (const row of fileContent) {
            this._findFrontmatterVal(row, 'slug', postData);
            this._findFrontmatterVal(row, 'title', postData);
            this._findFrontmatterVal(row, 'date', postData);
            if (row.startsWith('```post-gallery')) {
              postData.gallery = true;
            } else if (row.startsWith('![]')) {
              postData.gallery = true;
            } else if (row.startsWith('![[')) {
              postData.gallery = true;
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
    await this._generateIndexFile();
  }

  private async _generateIndexFile(): Promise<void> {
    const indexPath = LibPath.join(this._dest, INDEX_DIR);
    const indexFilePath = LibPath.join(indexPath, INDEX_MD_FILE);
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
  }

  private async _readdir(path: string): Promise<string[]> {
    const result = [];

    const files = await LibFs.readdir(path);
    for (const file of files) {
      if (IGNORE_LIST.includes(file)) {
        continue;
      }
      result.push(file);
    }

    return result;
  }

  private _validateYear(years: string[]): boolean {
    let allValid = true;

    for (const year of years) {
      if (year === INDEX_DIR) {
        continue; // skip index dir itself
      }
      if (!isDateStrValid(year, 'YYYY')) {
        allValid = false;
        console.log(`Invalid year: ${year}`);
      }
    }

    return allValid;
  }

  private _findFrontmatterVal(row: string, frontmatterKey: keyof PostData, data: PostData): void {
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
