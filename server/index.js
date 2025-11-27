import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nanoid } from "nanoid";

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
const SUPERVISOR_PASSCODE =
  process.env.SUPERVISOR_PASSCODE || "Amelie123";
const activeSessions = new Map();

const ensureDefaults = async () => {
  if (USE_MONGODB) {
    await connectDB();
  }
  await readJson(PRODUCTS_FILE, {});
  await readJson(ORDERS_FILE, []);
  await readJson(CONSUMABLES_FILE, []);
};

const authenticateSupervisor = (req, res, next) => {
  const token = req.header("x-supervisor-token");
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.supervisor = activeSessions.get(token);
  next();
};

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/api/products", async (_req, res, next) => {
  try {
    const products = await readJson(PRODUCTS_FILE, {});
    res.json(products);
  } catch (error) {
    next(error);
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

app.post("/api/supervisor/login", (req, res) => {
  const { email, passcode } = req.body || {};
  if (!email || !passcode) {
    return res.status(400).json({ error: "Email and passcode are required" });
  }
  if (passcode !== SUPERVISOR_PASSCODE) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = nanoid();
  activeSessions.set(token, { email, signedInAt: new Date().toISOString() });
  res.json({ token, profile: { email } });
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

app.use(express.static(clientDir));

app.get("*", (_req, res, next) => {
  if (_req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDir, "index.html"));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

ensureDefaults()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Amelie server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to bootstrap server", error);
    process.exit(1);
  });

