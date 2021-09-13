"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorIsBot = void 0;
const github_client_1 = require("./github-client");
const type_1 = require("../util/type");
const authorIsBot = (comment) => { var _a; return ((_a = comment.user) === null || _a === void 0 ? void 0 : _a.login) === 'github-actions[bot]'; };
exports.authorIsBot = authorIsBot;
//# sourceMappingURL=comment.js.map