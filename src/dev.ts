import "dotenv/config";

import app from "./app";
import client from "./db";
import registerRoutes from "./routes";
import { Plant, User } from "./types";

const PORT = process.env.PORT || 8000;

async function startServer() {
  await client.connect();

  const db = client.db("leafloopDB");

  const usersCollection = db.collection<User>("users");
  const plantsCollection = db.collection<Plant>("plants");

  registerRoutes(app, usersCollection, plantsCollection);

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();
