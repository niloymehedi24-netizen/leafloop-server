import { Express } from "express";
import { Collection } from "mongodb";
import bcrypt from "bcryptjs";
import validator from "validator";
import { createToken } from "./auth";
import { verifyJWT, AuthRequest } from "./middleware";
import { ObjectId } from "mongodb";

import { Plant, User } from "./types";

export default function registerRoutes(
  app: Express,
  usersCollection: Collection<User>,
  plantsCollection: Collection<Plant>,
) {
  // Root Endpoint
  app.get("/", (req, res) => {
    res.send("LeafLoop API Running");
  });

  // User Registration

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

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser: User = {
        name,
        email,
        password: hashedPassword,
        createdAt: new Date(),
      };

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

  // User Login

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
      const isPasswordMatched = await bcrypt.compare(password, user.password);

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

  // Add Plant

  app.post("/api/plants", verifyJWT, async (req: AuthRequest, res) => {
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
  });

  // Get My Plants

  app.get("/api/my-plants", verifyJWT, async (req: AuthRequest, res) => {
    try {
      const plants = await plantsCollection
        .find({
          sellerEmail: req.user!.email,
        })
        .sort({
          createdAt: -1,
        })
        .toArray();

      res.status(200).json({
        success: true,
        data: plants,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  });

  // Get All Plants (With Pagination)

  app.get("/api/plants", async (req, res) => {
    try {
      const {
        search = "",
        category = "",
        sort = "",
        page = "1",
        limit = "6",
      } = req.query;

      const query: Record<string, unknown> = {};

      // Search Filter
      if (typeof search === "string" && search.trim()) {
        query.title = {
          $regex: search,
          $options: "i",
        };
      }

      // Category Filter
      if (typeof category === "string" && category) {
        query.category = category;
      }

      // Sorting Option
      let sortOption = {};
      if (sort === "low") {
        sortOption = { price: 1 };
      } else if (sort === "high") {
        sortOption = { price: -1 };
      } else {
        sortOption = { createdAt: -1 };
      }

      // Pagination Logic
      const currentPage = Math.max(1, parseInt(page as string, 10) || 1);
      const itemsPerPage = Math.max(1, parseInt(limit as string, 10) || 6);
      const skip = (currentPage - 1) * itemsPerPage;

      // Get the total matching count for UI calculations
      const totalPlantsCount = await plantsCollection.countDocuments(query);
      const totalPages = Math.ceil(totalPlantsCount / itemsPerPage);

      // Fetch the specific page subset
      const plants = await plantsCollection
        .find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(itemsPerPage)
        .toArray();

      // Send paginated payload
      return res.status(200).json({
        success: true,
        data: {
          plants,
          pagination: {
            totalItems: totalPlantsCount,
            totalPages,
            currentPage,
            itemsPerPage,
          },
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

  // Public endpoint to get a single plant by ID

  app.get("/api/public/plants/:id", async (req, res) => {
    try {
      const id = req.params.id as string;

      let plant: Plant | null = null;

      if (ObjectId.isValid(id)) {
        plant = await plantsCollection.findOne({
          _id: new ObjectId(id),
        });
      }

      if (!plant) {
        plant = await plantsCollection.findOne({
          _id: id,
        } as never);
      }

      if (!plant) {
        return res.status(404).json({
          success: false,
          message: "Plant not found.",
        });
      }

      res.status(200).json({
        success: true,
        data: plant,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  });

  // GET Single Plant (For Pre-filling the Edit Form)

  app.get("/api/plants/:id", verifyJWT, async (req: AuthRequest, res) => {
    try {
      const id = req.params.id as string;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid plant id.",
        });
      }

      const plant = await plantsCollection.findOne({
        _id: new ObjectId(id),
        sellerEmail: req.user!.email,
      });

      if (!plant) {
        return res.status(404).json({
          success: false,
          message: "Plant not found.",
        });
      }

      res.status(200).json({
        success: true,
        data: plant,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  });

  // PATCH Update Plant

  app.patch("/api/plants/:id", verifyJWT, async (req: AuthRequest, res) => {
    try {
      const id = req.params.id as string;
      const updates = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid plant id.",
        });
      }

      // Format any numerical updates cleanly if passed
      if (updates.price !== undefined) updates.price = Number(updates.price);
      if (updates.stock !== undefined) updates.stock = Number(updates.stock);

      const result = await plantsCollection.updateOne(
        { _id: new ObjectId(id), sellerEmail: req.user!.email },
        { $set: updates },
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Plant not found or unauthorized.",
        });
      }

      res.status(200).json({
        success: true,
        message: "Plant updated successfully.",
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  });

  // Delete Plant

  app.delete("/api/plants/:id", verifyJWT, async (req: AuthRequest, res) => {
    try {
      const id = req.params.id as string;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid plant id.",
        });
      }

      const result = await plantsCollection.deleteOne({
        _id: new ObjectId(id),
        sellerEmail: req.user!.email,
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Plant not found.",
        });
      }

      res.status(200).json({
        success: true,
        message: "Plant deleted successfully.",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  });
}
