"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const index_1 = require("../src/index");
async function handler(req, res) {
    const app = await (0, index_1.initializeApp)();
    return app(req, res);
}
