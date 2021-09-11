"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorIsBot = void 0;
const authorIsBot = (comment) => comment.user?.login === 'github-actions[bot]';
exports.authorIsBot = authorIsBot;
//# sourceMappingURL=comment.js.map