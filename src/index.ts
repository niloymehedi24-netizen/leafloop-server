import "dotenv/config";
import app from "./app";
import client from "./db";
import registerRoutes from "./routes";

const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    await client.connect();

    console.log("✅ MongoDB Connected");

    const db = client.db("leaf_loop");

    const usersCollection = db.collection("users");
    const plantsCollection = db.collection("plants");

    registerRoutes(app, usersCollection, plantsCollection);

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error(error);
  }
}

startServer();