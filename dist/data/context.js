"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeWith = void 0;
const decodeWith = (Context, context) => {
    const { repo } = context;
    return Context.decode(context).map((ctx) => ({ ...ctx, repo }));
};
exports.decodeWith = decodeWith;
//# sourceMappingURL=context.js.map