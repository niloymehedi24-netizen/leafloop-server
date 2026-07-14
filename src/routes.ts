import { Express } from "express";
import { Collection } from "mongodb";
import bcrypt from "bcryptjs";
import validator from "validator";
import { createToken } from "./auth";
import { verifyJWT, AuthRequest } from "./middleware";

import { Plant, User } from "./types";

export default function registerRoutes(
  app: Express,
  usersCollection: Collection<User>,
  plantsCollection: Collection<Plant>
) {
  // Root Endpoint
  app.get("/", (req, res) => {
    res.send("🌿 LeafLoop API Running");
  });

  // ==========================
  // User Registration
  // ==========================
  app.post("/api/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Validation
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

      // Check existing user
      const existingUser = await usersCollection.findOne({ email });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already exists.",
        });
      }

      // Hash Password
      const hashedPassword = await bcrypt.hash(password, 10);

      // User Object
      const newUser: User = {
        name,
        email,
        password: hashedPassword,
        createdAt: new Date(),
      };

      // Save User
      const result = await usersCollection.insertOne(newUser);

      // Success Response
      res.status(201).json({
        success: true,
        message: "Registration successful",
        data: {
          insertedId: result.insertedId,
        },
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  });

  // ==========================
// User Login
// ==========================
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Find user
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Compare password
    const isPasswordMatched = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Create JWT
    const token = createToken({
      email: user.email,
    });

    // Success Response
    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

// ==========================
// Add Plant
// ==========================
app.post("/api/plants",verifyJWT, async (req: AuthRequest, res) => {
    try {
      const {
        title,
        category,
        price,
        image,
        description,
        careLevel,
        stock,
        sellerName,
      } = req.body;

      if (
        !title?.trim() ||
        !category?.trim() ||
        price === undefined ||
        stock === undefined ||
        !image?.trim() ||
        !description?.trim() ||
        !careLevel
    ) {
        return res.status(400).json({
          success: false,
          message: "Please fill in all required fields.",
        });
      }

      const newPlant: Plant = {
        title,
        category,
        price: Number(price),
        image,
        description,
        careLevel,
        stock: Number(stock),
        sellerEmail: req.user!.email,
        sellerName,
        createdAt: new Date(),
      };

      const result = await plantsCollection.insertOne(newPlant);

      res.status(201).json({
        success: true,
        message: "Plant added successfully.",
        insertedId: result.insertedId,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  }
);
}