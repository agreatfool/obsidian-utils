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
exports.DocNoPickerGenerator = void 0;
const dayjs = require("dayjs");
const uuid_1 = require("uuid");
class DocNoPickerGenerator {
    constructor(destination, datetime) {
        this._dest = destination;
        this._dayjs = dayjs(datetime);
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = {
                uuid: (0, uuid_1.v4)()
            };
            return;
        });
    }
}
exports.DocNoPickerGenerator = DocNoPickerGenerator;
//# sourceMappingURL=doc_no_picker_generator.js.map