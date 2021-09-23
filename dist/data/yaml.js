"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseObject = void 0;
const purify_ts_1 = require("purify-ts");
const yaml_1 = __importDefault(require("yaml"));
const isYamlObject = (value) => typeof value === 'object';
const parseValue = (yaml) => purify_ts_1.Either.encase(() => yaml_1.default.parse(yaml)).mapLeft((err) => err.message);
const parseObject = (yaml) => parseValue(yaml).chain((value) => isYamlObject(value)
    ? (0, purify_ts_1.Right)(value)
    : (0, purify_ts_1.Left)(`Expecting a YAML object, but given: ${value}`));
exports.parseObject = parseObject;
//# sourceMappingURL=yaml.js.map