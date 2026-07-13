import "dotenv/config";
import app from "./app";
import client from "./db";
import registerRoutes from "./routes";
import { User, Plant } from "./types";

const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    await client.connect();

    await client.db("admin").command({ ping: 1 });

    console.log("✅ MongoDB Connected");

    const db = client.db("leafloopDB");

    const usersCollection = db.collection<User>("users");
    const plantsCollection = db.collection<Plant>("plants");

    registerRoutes(app, usersCollection, plantsCollection);

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
}

startServer();