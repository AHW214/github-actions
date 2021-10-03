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
Object.defineProperty(exports, "__esModule", { value: true });
exports.withGithubClient = exports.withContext = exports.attempt = void 0;
const core = __importStar(require("@actions/core"));
const github_1 = require("@actions/github");
const context_1 = require("../data/context");
const context_2 = require("../data/context");
const github_2 = require("../util/github");
const attempt = async (run) => {
    try {
        return await run();
    }
    catch (err) {
        const message = err instanceof Error ? err.message : `Unknown error: ${err}`;
        core.setFailed(message);
        return undefined;
    }
};
exports.attempt = attempt;
const withGithubClient = async (run) => {
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
    const github = (0, github_1.getOctokit)(token, opts);
    return run(github);
};
exports.withGithubClient = withGithubClient;
const withContext = async (Context, run) => (0, context_2.decodeWith)(Context, github_1.context).caseOf({
    Left: async (err) => {
        core.setFailed(`Failed to decode action context: ${err}`);
        return undefined;
    },
    Right: run,
});
exports.withContext = withContext;
//# sourceMappingURL=run.js.map