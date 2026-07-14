import client from "./db";
import app from "./app";
import registerRoutes from "./routes";
import { Plant, User } from "./types";

let initialized = false;

export async function initializeApp() {
  if (initialized) return app;

  await client.connect();

  const db = client.db("leafloopDB");

  const usersCollection = db.collection<User>("users");
  const plantsCollection = db.collection<Plant>("plants");

  registerRoutes(app, usersCollection, plantsCollection);

  initialized = true;

  return app;
}
