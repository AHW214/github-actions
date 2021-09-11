"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorIsBot = void 0;
const authorIsBot = (comment) => { var _a; return ((_a = comment.user) === null || _a === void 0 ? void 0 : _a.login) === 'github-actions[bot]'; };
exports.authorIsBot = authorIsBot;
//# sourceMappingURL=comment.js.map