"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeApp = initializeApp;
const db_1 = __importDefault(require("./db"));
const app_1 = __importDefault(require("./app"));
const routes_1 = __importDefault(require("./routes"));
let initialized = false;
async function initializeApp() {
    if (initialized)
        return app_1.default;
    await db_1.default.connect();
    const db = db_1.default.db("leafloopDB");
    const usersCollection = db.collection("users");
    const plantsCollection = db.collection("plants");
    (0, routes_1.default)(app_1.default, usersCollection, plantsCollection);
    initialized = true;
    return app_1.default;
}
