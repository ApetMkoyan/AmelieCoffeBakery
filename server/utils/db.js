import { MongoClient } from "mongodb";

let client = null;
let db = null;

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "amelie-cafe";

export const connectDB = async () => {
  if (db) {
    return db;
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log("✅ Connected to MongoDB");
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
};

export const getDB = () => {
  if (!db) {
    throw new Error("Database not connected. Call connectDB() first.");
  }
  return db;
};

export const closeDB = async () => {
  if (client) {
    await client.close();
    db = null;
    client = null;
    console.log("MongoDB connection closed");
  }
};

// Collections
export const getCollection = (collectionName) => {
  const database = getDB();
  return database.collection(collectionName);
};

