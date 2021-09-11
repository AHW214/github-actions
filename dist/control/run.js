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
exports.withGithubClient = exports.attempt = void 0;
const core = __importStar(require("@actions/core"));
const github_1 = require("@actions/github");
const attempt = (run) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield run();
    }
    catch (err) {
        const message = err instanceof Error ? err.message : `Unknown error: ${err}`;
        core.setFailed(message);
        return undefined;
    }
});
exports.attempt = attempt;
const withGithubClient = (run) => __awaiter(void 0, void 0, void 0, function* () {
    const token = core.getInput('github-token', { required: true });
    const debug = core.getBooleanInput('debug');
    const opts = debug
        ? {
            log: {
                debug: core.debug,
                info: core.info,
                warn: core.warning,
                error: core.error,
            },
        }
        : undefined;
    const github = github_1.getOctokit(token, opts);
    return run(github);
});
exports.withGithubClient = withGithubClient;
//# sourceMappingURL=run.js.map