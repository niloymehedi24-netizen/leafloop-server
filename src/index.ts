import "dotenv/config";

import app from "./app";
import client from "./db";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await client.connect();

    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect MongoDB", error);
  }
}

startServer();