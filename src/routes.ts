import { Express } from "express";
import { Collection } from "mongodb";

import bcrypt from "bcryptjs";
import validator from "validator";

export default function registerRoutes(
  app: Express,
  usersCollection: Collection,
  plantsCollection: Collection
) {
  // Root endpoint
  app.get("/", (req, res) => {
    res.send("🌿 LeafLoop API Running");
  });

  // User registration endpoint
  app.post("/api/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "All fields are required.",
        });
      }

      if (!validator.isEmail(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email address.",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters.",
        });
      }

      const existingUser = await usersCollection.findOne({ email });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already exists.",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await usersCollection.insertOne({
        name,
        email,
        password: hashedPassword,
        createdAt: new Date(),
      });

      res.status(201).json({
        success: true,
        message: "Registration successful",
        insertedId: result.insertedId,
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  });
}