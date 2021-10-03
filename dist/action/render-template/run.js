"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
const mustache_1 = __importDefault(require("mustache"));
const run_1 = require("../../control/run");
const input_1 = require("../../util/input");
const yaml_1 = require("../../data/yaml");
const run = (templateInput, templateOutputPath, templateVariablesYaml) => (0, yaml_1.parseObject)(templateVariablesYaml).caseOf({
    Left: (err) => {
        return core.setFailed(`Could not parse template variables: ${err}`);
    },
    Right: (variables) => {
        const template = templateInput.name === 'template-path'
            ? fs.readFileSync(templateInput.value, 'utf-8')
            : templateInput.value;
        const rendered = mustache_1.default.render(template, variables);
        core.info(`Writing template to ${templateOutputPath}`);
        return fs.writeFileSync(templateOutputPath, rendered, 'utf-8');
    },
});
(0, run_1.attempt)(() => {
    const templateInput = (0, input_1.getInputOneOf)('template-text', 'template-path');
    const templateOutputPath = (0, input_1.getInputRequired)('output-path');
    const templateVariablesYaml = (0, input_1.getInputRequired)('template-variables');
    if (templateInput.type === 'None')
        return core.setFailed('Template source not specified.');
    if (templateInput.type === 'Many')
        return core.setFailed(`Can only set one of ${templateInput.names}`);
    return run(templateInput, templateOutputPath, templateVariablesYaml);
});
//# sourceMappingURL=run.js.map