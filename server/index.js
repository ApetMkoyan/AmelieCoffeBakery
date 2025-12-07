import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nanoid } from "nanoid";
import multer from "multer";
// Use MongoDB if MONGODB_URI is set, otherwise use file storage
const USE_MONGODB = !!process.env.MONGODB_URI;
let readJson, writeJson, connectDB;

// Dynamically import storage based on environment
if (USE_MONGODB) {
  const mongoStorage = await import("./utils/storage-mongo.js");
  const db = await import("./utils/db.js");
  readJson = mongoStorage.readJson;
  writeJson = mongoStorage.writeJson;
  connectDB = db.connectDB;
} else {
  const fileStorage = await import("./utils/storage.js");
  readJson = fileStorage.readJson;
  writeJson = fileStorage.writeJson;
  connectDB = async () => {};
}

const app = express();
const PORT = process.env.PORT || 4000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../client/dist");
const clientFallback = path.resolve(__dirname, "../client");
const clientDir = fs.existsSync(distDir) ? distDir : clientFallback;

// Setup file upload directory
const uploadsDir = path.resolve(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
    }
  },
});

app.use(helmet());
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.use(morgan("dev"));

const PRODUCTS_FILE = "products.json";
const ORDERS_FILE = "orders.json";
const CONSUMABLES_FILE = "consumables.json";
const DAILY_RECORDS_FILE = "daily-records.json";
// Supervisor credentials - DO NOT CHANGE without updating Vercel environment variables
const SUPERVISOR_LOGIN = (process.env.SUPERVISOR_LOGIN || "Amelie123").trim();
const SUPERVISOR_PASSCODE = (process.env.SUPERVISOR_PASSCODE || "9512357*").trim();
const activeSessions = new Map();

// Log credentials on startup (for debugging - remove in production)
console.log("🔐 Supervisor credentials initialized:", {
  login: SUPERVISOR_LOGIN,
  passcode: SUPERVISOR_PASSCODE ? "***" : "empty",
  fromEnv: {
    login: !!process.env.SUPERVISOR_LOGIN,
    passcode: !!process.env.SUPERVISOR_PASSCODE
  }
});

// Migrate data from JSON files to MongoDB if MongoDB is empty
const migrateDataToMongo = async () => {
  if (!USE_MONGODB) return;
  
  try {
    const { getCollection } = await import("./utils/db.js");
    const fileStorage = await import("./utils/storage.js");
    
    // Check if products collection is empty
    const productsCollection = getCollection("products");
    if (!productsCollection) {
      console.warn("⚠️ Cannot access products collection, MongoDB might not be connected");
      return;
    }
    const productsCount = await productsCollection.countDocuments();
    
    if (productsCount === 0) {
      console.log("📦 Migrating products from JSON to MongoDB...");
      try {
        // Read from JSON file
        const productsData = await fileStorage.readJson(PRODUCTS_FILE, {});
        console.log("📊 Products data from JSON:", {
          categories: Object.keys(productsData).length,
          totalProducts: Object.values(productsData).reduce((sum, cat) => sum + (Array.isArray(cat) ? cat.length : 0), 0)
        });
        
        // Only migrate if we got actual data (not empty object)
        if (productsData && Object.keys(productsData).length > 0) {
          await writeJson(PRODUCTS_FILE, productsData);
          console.log("✅ Products migrated successfully to MongoDB");
          
          // Verify migration
          const verifyCount = await productsCollection.countDocuments();
          console.log("✅ Verification: MongoDB now has", verifyCount, "products");
        } else {
          console.log("⚠️ Products JSON file is empty, skipping migration");
        }
      } catch (error) {
        console.error("⚠️ Products JSON file not found or error reading:", error.message);
        console.error("⚠️ Error stack:", error.stack?.substring(0, 300));
      }
    } else {
      console.log("✅ MongoDB already has", productsCount, "products, skipping migration");
    }
    
    // Check if orders collection is empty
    const ordersCollection = getCollection("orders");
    const ordersCount = await ordersCollection.countDocuments();
    
    if (ordersCount === 0) {
      console.log("📦 Migrating orders from JSON to MongoDB...");
      try {
        const ordersData = await fileStorage.readJson(ORDERS_FILE, []);
        if (Array.isArray(ordersData) && ordersData.length > 0) {
          await writeJson(ORDERS_FILE, ordersData);
          console.log("✅ Orders migrated successfully");
        }
      } catch (error) {
        console.log("⚠️ Orders JSON file not found or error reading:", error.message);
      }
    }
    
    // Check if consumables collection is empty
    const consumablesCollection = getCollection("consumables");
    const consumablesCount = await consumablesCollection.countDocuments();
    
    if (consumablesCount === 0) {
      console.log("📦 Migrating consumables from JSON to MongoDB...");
      try {
        const consumablesData = await fileStorage.readJson(CONSUMABLES_FILE, []);
        if (Array.isArray(consumablesData) && consumablesData.length > 0) {
          await writeJson(CONSUMABLES_FILE, consumablesData);
          console.log("✅ Consumables migrated successfully");
        }
      } catch (error) {
        console.log("⚠️ Consumables JSON file not found or error reading:", error.message);
      }
    }
    
    // Check if daily-records collection is empty
    const dailyRecordsCollection = getCollection("daily-records");
    const dailyRecordsCount = await dailyRecordsCollection.countDocuments();
    
    if (dailyRecordsCount === 0) {
      console.log("📦 Migrating daily-records from JSON to MongoDB...");
      try {
        const dailyRecordsData = await fileStorage.readJson(DAILY_RECORDS_FILE, []);
        if (Array.isArray(dailyRecordsData) && dailyRecordsData.length > 0) {
          await writeJson(DAILY_RECORDS_FILE, dailyRecordsData);
          console.log("✅ Daily records migrated successfully");
        }
      } catch (error) {
        console.log("⚠️ Daily records JSON file not found or error reading:", error.message);
      }
    }
  } catch (error) {
    console.error("⚠️ Migration error:", error.message);
  }
};

const ensureDefaults = async () => {
  try {
    if (USE_MONGODB) {
      try {
        console.log("🔄 Initializing MongoDB connection...");
        const db = await connectDB();
        if (db) {
          console.log("✅ MongoDB connected, starting migration...");
          // Migrate data from JSON files to MongoDB if collections are empty
          await migrateDataToMongo();
        } else {
          console.warn("⚠️ MongoDB not available during initialization");
          console.warn("⚠️ Server will use file storage");
          console.warn("⚠️ MongoDB will be tried again on first request");
        }
      } catch (error) {
        console.warn("⚠️ MongoDB connection failed during initialization:", error.message);
        console.warn("⚠️ Server will continue with file storage");
      }
    }
    
    // Initialize files with fallback values if they don't exist
    try {
      await readJson(PRODUCTS_FILE, {});
    } catch (error) {
      console.warn("⚠️ Could not read products file, will use empty object:", error.message);
    }
    
    try {
      await readJson(ORDERS_FILE, []);
    } catch (error) {
      console.warn("⚠️ Could not read orders file, will use empty array:", error.message);
    }
    
    try {
      await readJson(CONSUMABLES_FILE, []);
    } catch (error) {
      console.warn("⚠️ Could not read consumables file, will use empty array:", error.message);
    }
  } catch (error) {
    console.error("❌ Error in ensureDefaults:", error);
    // Don't throw - allow server to start even if initialization fails
  }
};

const authenticateSupervisor = (req, res, next) => {
  const token = req.header("x-supervisor-token");
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.supervisor = activeSessions.get(token);
  next();
};

// Endpoint to verify token without requiring data fetch
app.get("/api/supervisor/verify", (req, res) => {
  const token = req.header("x-supervisor-token");
  console.log("🔍 Token verification request:", {
    hasToken: !!token,
    tokenLength: token?.length,
    activeSessionsCount: activeSessions.size,
    tokenExists: token ? activeSessions.has(token) : false
  });
  
  if (!token || !activeSessions.has(token)) {
    console.log("❌ Token verification failed - token not found in active sessions");
    return res.status(401).json({ valid: false, error: "Invalid or expired token" });
  }
  
  const session = activeSessions.get(token);
  console.log("✅ Token verified successfully for:", session.email);
  res.json({ valid: true, profile: { email: session.email } });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/api/products", async (_req, res) => {
  // Use a separate try-catch to ensure we always return a response
  let products = {};
  
  try {
    console.log("📦 Fetching products from:", PRODUCTS_FILE);
    console.log("🔍 Environment:", {
      USE_MONGODB,
      MONGODB_URI: !!process.env.MONGODB_URI,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL
    });
    
    try {
      const data = await readJson(PRODUCTS_FILE, {});
      // Ensure we got a valid object
      if (data && typeof data === "object" && !Array.isArray(data)) {
        products = data;
      } else {
        console.warn("⚠️ Invalid products data format, using empty object");
        products = {};
      }
    } catch (readError) {
      console.error("❌ Error reading products:", readError.message);
      console.error("❌ Error stack:", readError.stack?.substring(0, 200));
      // Use empty object as fallback
      products = {};
    }
    
    // Ensure products is a valid object
    if (!products || typeof products !== "object" || Array.isArray(products)) {
      console.warn("⚠️ Products data is not a valid object, using empty object");
      products = {};
    }
    
    const categoriesCount = Object.keys(products).length;
    const totalProducts = Object.values(products).reduce((sum, cat) => {
      return sum + (Array.isArray(cat) ? cat.length : 0);
    }, 0);
    
    console.log("✅ Products loaded:", categoriesCount, "categories,", totalProducts, "total products");
    
    if (categoriesCount > 0 && totalProducts > 0) {
      console.log("📊 Products by category:", Object.entries(products).map(([cat, items]) => 
        `${cat}: ${Array.isArray(items) ? items.length : 0} items`
      ).join(", "));
    } else {
      console.warn("⚠️ No products found! Returning empty object.");
    }
  } catch (error) {
    // Catch any unexpected errors
    console.error("❌ Unexpected error in /api/products:", error);
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack?.substring(0, 500));
    // Ensure products is an empty object
    products = {};
  }
  
  // Always return a valid JSON response, never throw
  try {
    res.status(200).json(products);
  } catch (sendError) {
    console.error("❌ Error sending response:", sendError);
    // Last resort - try to send empty object
    try {
      res.status(200).json({});
    } catch (e) {
      console.error("❌ Failed to send any response:", e);
    }
  }
});

app.get("/api/orders", async (_req, res, next) => {
  try {
    const orders = await readJson(ORDERS_FILE, []);
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders", async (req, res, next) => {
  try {
    const requiredFields = [
      "firstName",
      "lastName",
      "phone",
      "address",
      "delivery",
      "eventDate",
      "details",
      "paymentMethod",
    ];
    const missing = requiredFields.filter((field) => !req.body[field]);
    if (missing.length) {
      return res
        .status(400)
        .json({ error: `Missing required fields: ${missing.join(", ")}` });
    }

    const newOrder = {
      id: nanoid(),
      ...req.body,
      items: Array.isArray(req.body.items) ? req.body.items : [],
      eventDate: req.body.eventDate
        ? new Date(req.body.eventDate).toISOString()
        : null,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const orders = await readJson(ORDERS_FILE, []);
    orders.push(newOrder);
    await writeJson(ORDERS_FILE, orders);

    res.status(201).json({ message: "Order received", order: newOrder });
  } catch (error) {
    next(error);
  }
});

// Image upload endpoint
app.post("/api/upload", authenticateSupervisor, upload.single("image"), (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

// Error handler for multer
// Error handler for multer (must be before general error handler)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large (max 5MB)" });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err && err.message && err.message.includes("Only image files")) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

app.post("/api/supervisor/login", (req, res) => {
  try {
    const { email, passcode } = req.body || {};
    if (!email || !passcode) {
      return res.status(400).json({ error: "Email and passcode are required" });
    }
    
    // Trim and normalize inputs
    const trimmedEmail = String(email).trim();
    const trimmedPasscode = String(passcode).trim();
    
    // Debug logging
    console.log("🔐 Login attempt:", {
      receivedEmail: trimmedEmail,
      receivedEmailLength: trimmedEmail.length,
      receivedPasscodeLength: trimmedPasscode.length,
      expectedLogin: SUPERVISOR_LOGIN,
      expectedLoginLength: SUPERVISOR_LOGIN.length,
      expectedPasscodeLength: SUPERVISOR_PASSCODE.length,
      emailMatch: trimmedEmail === SUPERVISOR_LOGIN,
      passcodeMatch: trimmedPasscode === SUPERVISOR_PASSCODE,
    });
    
    // Strict comparison
    if (trimmedEmail !== SUPERVISOR_LOGIN) {
      console.log("❌ Login failed: Invalid email");
      console.log("   Expected:", JSON.stringify(SUPERVISOR_LOGIN));
      console.log("   Received:", JSON.stringify(trimmedEmail));
      return res.status(401).json({ error: "Invalid login" });
    }
    if (trimmedPasscode !== SUPERVISOR_PASSCODE) {
      console.log("❌ Login failed: Invalid password");
      console.log("   Expected length:", SUPERVISOR_PASSCODE.length);
      console.log("   Received length:", trimmedPasscode.length);
      return res.status(401).json({ error: "Invalid password" });
    }
    
    console.log("✅ Login successful for:", trimmedEmail);
    const token = nanoid();
    activeSessions.set(token, { email: trimmedEmail, signedInAt: new Date().toISOString() });
    res.json({ token, profile: { email: trimmedEmail } });
  } catch (error) {
    console.error("❌ Error in /api/supervisor/login:", error);
    console.error("❌ Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500)
    });
    res.status(500).json({ error: "A server error has occurred" });
  }
});

app.post("/api/products", authenticateSupervisor, async (req, res, next) => {
  try {
    const { category, name, price, description, image } = req.body || {};
    if (!category || !name || !price || !description) {
      return res
        .status(400)
        .json({ error: "Category, name, price, and description are required" });
    }

    const products = await readJson(PRODUCTS_FILE, {});
    if (!products[category]) {
      products[category] = [];
    }

    const newProduct = {
      id: nanoid(),
      name,
      price: Number(price),
      description,
      image: image || "",
    };

    products[category].push(newProduct);
    await writeJson(PRODUCTS_FILE, products);

    res
      .status(201)
      .json({ message: "Product added", product: newProduct, category });
  } catch (error) {
    next(error);
  }
});

app.patch(
  "/api/products/:productId",
  authenticateSupervisor,
  async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { category, name, price, description, image } = req.body || {};
      const products = await readJson(PRODUCTS_FILE, {});
      
      let found = false;
      let targetCategory = null;
      let targetIndex = -1;
      
      // First, find the product
      for (const cat in products) {
        const index = products[cat].findIndex((p) => p.id === productId);
        if (index !== -1) {
          targetCategory = cat;
          targetIndex = index;
          found = true;
          break;
        }
      }
      
      if (!found) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Update product fields
      const product = products[targetCategory][targetIndex];
      if (name !== undefined) product.name = name;
      if (price !== undefined) product.price = Number(price);
      if (description !== undefined) product.description = description;
      if (image !== undefined) product.image = image;
      product.updatedAt = new Date().toISOString();
      
      // If category changed, move product to new category
      if (category && category !== targetCategory) {
        // Remove from old category
        products[targetCategory].splice(targetIndex, 1);
        // Add to new category
        if (!products[category]) products[category] = [];
        products[category].push(product);
      }
      
      await writeJson(PRODUCTS_FILE, products);
      res.json({ message: "Product updated" });
    } catch (error) {
      next(error);
    }
  }
);

app.delete(
  "/api/products/:productId",
  authenticateSupervisor,
  async (req, res, next) => {
    try {
      const { productId } = req.params;
      const products = await readJson(PRODUCTS_FILE, {});
      let found = false;
      
      for (const cat in products) {
        const filtered = products[cat].filter((p) => p.id !== productId);
        if (filtered.length !== products[cat].length) {
          products[cat] = filtered;
          found = true;
          break;
        }
      }
      
      if (!found) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      await writeJson(PRODUCTS_FILE, products);
      res.json({ message: "Product deleted" });
    } catch (error) {
      next(error);
    }
  }
);

app.get("/api/consumables", authenticateSupervisor, async (_req, res, next) => {
  try {
    const consumables = await readJson(CONSUMABLES_FILE, []);
    res.json(consumables);
  } catch (error) {
    next(error);
  }
});

app.post(
  "/api/consumables",
  authenticateSupervisor,
  async (req, res, next) => {
    try {
      const requiredFields = ["date", "item"];
      const missing = requiredFields.filter((field) => !req.body[field]);
      if (missing.length) {
        return res
          .status(400)
          .json({ error: `Missing required fields: ${missing.join(", ")}` });
      }

      // Validate amounts
      const expense = Number(req.body.expense || 0);
      const profit = Number(req.body.profit || 0);
      
      if (isNaN(expense) || expense < 0) {
        return res.status(400).json({ error: "Invalid expense amount" });
      }
      if (isNaN(profit) || profit < 0) {
        return res.status(400).json({ error: "Invalid profit amount" });
      }

      const entry = {
        id: nanoid(),
        date: String(req.body.date),
        item: String(req.body.item),
        expense: expense,
        profit: profit,
        createdAt: new Date().toISOString(),
      };

      const consumables = await readJson(CONSUMABLES_FILE, []);
      consumables.push(entry);
      await writeJson(CONSUMABLES_FILE, consumables);

      res.status(201).json({ message: "Consumable entry added", entry });
    } catch (error) {
      console.error("Error adding consumable:", error);
      next(error);
    }
  }
);

app.get("/api/orders", authenticateSupervisor, async (_req, res, next) => {
  try {
    const orders = await readJson(ORDERS_FILE, []);
    orders.sort(
      (a, b) =>
        new Date(a.eventDate || a.createdAt) -
        new Date(b.eventDate || b.createdAt)
    );
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

app.patch(
  "/api/orders/:orderId",
  authenticateSupervisor,
  async (req, res, next) => {
    try {
      const { orderId } = req.params;
      const { status, eventDate } = req.body || {};
      
      if (status === undefined && !eventDate) {
        return res.status(400).json({ error: "Status or event date is required to update" });
      }

      if (status !== undefined) {
        const validStatuses = ["pending", "confirmed", "completed"];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
        }
      }

      const orders = await readJson(ORDERS_FILE, []);
      const index = orders.findIndex((order) => order.id === orderId);
      if (index === -1) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (status !== undefined) {
        orders[index].status = status;
      }
      if (eventDate) {
        orders[index].eventDate = new Date(eventDate).toISOString();
      }
      orders[index].updatedAt = new Date().toISOString();

      await writeJson(ORDERS_FILE, orders);
      res.json({ message: "Order updated", order: orders[index] });
    } catch (error) {
      next(error);
    }
  }
);

app.delete(
  "/api/orders/:orderId",
  authenticateSupervisor,
  async (req, res, next) => {
    try {
      const { orderId } = req.params;
      const orders = await readJson(ORDERS_FILE, []);
      const filtered = orders.filter((order) => order.id !== orderId);
      if (filtered.length === orders.length) {
        return res.status(404).json({ error: "Order not found" });
      }
      await writeJson(ORDERS_FILE, filtered);
      res.json({ message: "Order deleted" });
    } catch (error) {
      next(error);
    }
  }
);

app.patch(
  "/api/consumables/:entryId",
  authenticateSupervisor,
  async (req, res, next) => {
    try {
      const { entryId } = req.params;
      const { item, expense, profit, date } = req.body || {};
      
      // Validate entryId
      if (!entryId) {
        return res.status(400).json({ error: "Entry ID is required" });
      }
      
      const consumables = await readJson(CONSUMABLES_FILE, []);
      const index = consumables.findIndex((entry) => entry.id === entryId);
      if (index === -1) {
        return res.status(404).json({ error: "Entry not found" });
      }
      
      // Update fields if provided
      if (item !== undefined) consumables[index].item = String(item);
      if (expense !== undefined) {
        const expenseNum = Number(expense);
        if (isNaN(expenseNum) || expenseNum < 0) {
          return res.status(400).json({ error: "Invalid expense amount" });
        }
        consumables[index].expense = expenseNum;
      }
      if (profit !== undefined) {
        const profitNum = Number(profit);
        if (isNaN(profitNum) || profitNum < 0) {
          return res.status(400).json({ error: "Invalid profit amount" });
        }
        consumables[index].profit = profitNum;
      }
      if (date) consumables[index].date = date;
      
      consumables[index].updatedAt = new Date().toISOString();
      await writeJson(CONSUMABLES_FILE, consumables);
      res.json({ message: "Entry updated", entry: consumables[index] });
    } catch (error) {
      console.error("Error updating consumable:", error);
      next(error);
    }
  }
);

app.delete(
  "/api/consumables/:entryId",
  authenticateSupervisor,
  async (req, res, next) => {
    try {
      const { entryId } = req.params;
      
      // Validate entryId
      if (!entryId) {
        return res.status(400).json({ error: "Entry ID is required" });
      }
      
      const consumables = await readJson(CONSUMABLES_FILE, []);
      const initialLength = consumables.length;
      const filtered = consumables.filter((entry) => entry.id !== entryId);
      
      if (filtered.length === initialLength) {
        return res.status(404).json({ error: "Entry not found" });
      }
      
      await writeJson(CONSUMABLES_FILE, filtered);
      res.json({ message: "Entry deleted" });
    } catch (error) {
      console.error("Error deleting consumable:", error);
      next(error);
    }
  }
);

// Manual migration endpoint (for supervisor use)
app.post("/api/migrate-data", authenticateSupervisor, async (req, res, next) => {
  if (!USE_MONGODB) {
    return res.status(400).json({ error: "MongoDB is not configured" });
  }
  
  try {
    const { getCollection } = await import("./utils/db.js");
    const fileStorage = await import("./utils/storage.js");
    const results = { migrated: [], skipped: [], errors: [] };
    
    // Migrate products
    try {
      const productsCollection = getCollection("products");
      const productsCount = await productsCollection.countDocuments();
      if (productsCount === 0) {
        const productsData = await fileStorage.readJson(PRODUCTS_FILE, {});
        if (productsData && Object.keys(productsData).length > 0) {
          await writeJson(PRODUCTS_FILE, productsData);
          results.migrated.push("products");
        } else {
          results.skipped.push("products (empty)");
        }
      } else {
        results.skipped.push("products (already has data)");
      }
    } catch (error) {
      results.errors.push(`products: ${error.message}`);
    }
    
    // Migrate orders
    try {
      const ordersCollection = getCollection("orders");
      const ordersCount = await ordersCollection.countDocuments();
      if (ordersCount === 0) {
        const ordersData = await fileStorage.readJson(ORDERS_FILE, []);
        if (Array.isArray(ordersData) && ordersData.length > 0) {
          await writeJson(ORDERS_FILE, ordersData);
          results.migrated.push("orders");
        } else {
          results.skipped.push("orders (empty)");
        }
      } else {
        results.skipped.push("orders (already has data)");
      }
    } catch (error) {
      results.errors.push(`orders: ${error.message}`);
    }
    
    // Migrate consumables
    try {
      const consumablesCollection = getCollection("consumables");
      const consumablesCount = await consumablesCollection.countDocuments();
      if (consumablesCount === 0) {
        const consumablesData = await fileStorage.readJson(CONSUMABLES_FILE, []);
        if (Array.isArray(consumablesData) && consumablesData.length > 0) {
          await writeJson(CONSUMABLES_FILE, consumablesData);
          results.migrated.push("consumables");
        } else {
          results.skipped.push("consumables (empty)");
        }
      } else {
        results.skipped.push("consumables (already has data)");
      }
    } catch (error) {
      results.errors.push(`consumables: ${error.message}`);
    }
    
    res.json({
      message: "Migration completed",
      results
    });
  } catch (error) {
    next(error);
  }
});

// Serve uploaded images
app.use("/uploads", express.static(uploadsDir));
app.use(express.static(clientDir));

// Serve admin.html specifically
app.get("/admin.html", (req, res) => {
  const adminPath = path.join(clientDir, "admin.html");
  if (fs.existsSync(adminPath)) {
    res.sendFile(adminPath);
  } else {
    // Fallback: try to serve from dist if not found
    const distAdminPath = path.resolve(__dirname, "../client/dist/admin.html");
    if (fs.existsSync(distAdminPath)) {
      res.sendFile(distAdminPath);
    } else {
      res.status(404).json({ error: "Admin panel not found", clientDir, adminPath, distAdminPath });
    }
  }
});

app.get("*", (_req, res, next) => {
  if (_req.path.startsWith("/api")) return next();
  if (_req.path.startsWith("/uploads")) return next();
  res.sendFile(path.join(clientDir, "index.html"));
});

app.use((err, _req, res, _next) => {
  console.error("❌ Unhandled error:", err);
  console.error("❌ Error name:", err.name);
  console.error("❌ Error message:", err.message);
  console.error("❌ Error stack:", err.stack?.substring(0, 500));
  
  // Always return a valid JSON response
  if (!res.headersSent) {
    res.status(500).json({ 
      error: "A server error has occurred",
      message: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
});

// Initialize defaults
ensureDefaults()
  .then(async () => {
    console.log("✅ Server initialized successfully");
    console.log("🔍 Server config:", {
      PORT,
      USE_MONGODB,
      MONGODB_URI: !!process.env.MONGODB_URI,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NODE_ENV: process.env.NODE_ENV,
      clientDir,
      distDirExists: fs.existsSync(distDir)
    });
    
    // Check MongoDB connection if using MongoDB
    if (USE_MONGODB) {
      try {
        const db = await connectDB();
        if (db) {
          console.log("✅ MongoDB connected successfully");
          
          // Test read to verify connection works
          try {
            const testProducts = await readJson(PRODUCTS_FILE, {});
            console.log("✅ MongoDB read test successful:", Object.keys(testProducts).length, "categories");
          } catch (readError) {
            console.warn("⚠️ MongoDB read test failed, but connection is OK:", readError.message);
          }
        } else {
          console.warn("⚠️ MongoDB connection failed - cluster might be paused");
          console.warn("⚠️ Server will use file storage as fallback");
          console.warn("⚠️ To fix: Go to https://cloud.mongodb.com and resume your cluster");
        }
      } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        console.warn("⚠️ Server will continue using file storage as fallback");
      }
    } else {
      // Check file storage
      try {
        const testProducts = await readJson(PRODUCTS_FILE, {});
        console.log("✅ File storage read test successful:", Object.keys(testProducts).length, "categories");
        if (Object.keys(testProducts).length === 0) {
          console.warn("⚠️ No products found in file storage! Make sure products.json exists and has data.");
        }
      } catch (error) {
        console.warn("⚠️ File storage read test failed:", error.message);
      }
    }
    
    // Only start listening if not on Vercel (Vercel handles the serverless function)
    if (process.env.VERCEL !== "1" && !process.env.VERCEL_ENV) {
      app.listen(PORT, () => {
        console.log(`Amelie server listening on port ${PORT}`);
      });
    } else {
      console.log("🚀 Running on Vercel - serverless mode");
    }
  })
  .catch((error) => {
    console.error("❌ Failed to bootstrap server", error);
    console.error("❌ Error stack:", error.stack);
    if (process.env.VERCEL !== "1" && !process.env.VERCEL_ENV) {
      process.exit(1);
    }
  });

// Export app for Vercel serverless functions
export default app;

