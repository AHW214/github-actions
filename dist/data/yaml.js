"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseObject = void 0;
const purify_ts_1 = require("purify-ts");
const yaml_1 = __importDefault(require("yaml"));
const parseObject = (yaml) => purify_ts_1.Either.encase(() => yaml_1.default.parse(yaml));
exports.parseObject = parseObject;
//# sourceMappingURL=yaml.js.map