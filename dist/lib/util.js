"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDateStrValid = void 0;
const dayjs = require("dayjs");
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);
const isDateStrValid = (date, format) => {
    return dayjs(date, format, true).isValid();
};
exports.isDateStrValid = isDateStrValid;
//# sourceMappingURL=util.js.map