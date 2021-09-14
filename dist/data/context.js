"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeWith = void 0;
const decodeWith = (Payload) => (context) => {
    const { repo, payload } = context;
    return Payload.decode(payload).map((payload) => ({ repo, payload }));
};
exports.decodeWith = decodeWith;
//# sourceMappingURL=context.js.map