"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mkArtifactInfo = void 0;
const pretty_bytes_1 = __importDefault(require("pretty-bytes"));
const type_1 = require("../util/type");
const github_client_1 = require("./github-client");
const mkArtifactUrl = (owner, repo, checkSuiteId, artifactId) => `https://github.com/${owner}/${repo}/suites/${checkSuiteId}/artifacts/${artifactId}`;
const mkArtifactInfo = (owner, repo, checkSuiteId, artifact) => ({
    name: artifact.name,
    size: (0, pretty_bytes_1.default)(artifact.size_in_bytes),
    url: mkArtifactUrl(owner, repo, checkSuiteId, artifact.id),
});
exports.mkArtifactInfo = mkArtifactInfo;
//# sourceMappingURL=artifact.js.map