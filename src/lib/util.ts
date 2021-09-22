import * as dayjs from 'dayjs';

const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

export const isDateStrValid = (date: string, format: string): boolean => {
  return dayjs(date, format, true).isValid();
};
