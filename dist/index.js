"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./db"));
const routes_1 = __importDefault(require("./routes"));
const PORT = process.env.PORT || 8000;
async function startServer() {
    try {
        await db_1.default.connect();
        await db_1.default.db("admin").command({ ping: 1 });
        console.log("✅ MongoDB Connected");
        const db = db_1.default.db("leafloopDB");
        const usersCollection = db.collection("users");
        const plantsCollection = db.collection("plants");
        (0, routes_1.default)(app_1.default, usersCollection, plantsCollection);
        app_1.default.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error("❌ Failed to start server:", error);
    }
}
startServer();
