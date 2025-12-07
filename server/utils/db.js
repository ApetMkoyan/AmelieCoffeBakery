import { MongoClient } from "mongodb";

let client = null;
let db = null;

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "amelie-cafe";

export const connectDB = async (retryCount = 0) => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds between retries
  
  if (db) {
    return db;
  }

  try {
    console.log(`🔄 Attempting to connect to MongoDB... (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
    
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 90000, // 90 seconds - enough time for cluster to wake up
      connectTimeoutMS: 90000,
      socketTimeoutMS: 90000,
    });
    
    await client.connect();
    db = client.db(DB_NAME);
    
    // Test the connection
    await db.admin().ping();
    
    console.log("✅ Connected to MongoDB successfully");
    return db;
  } catch (error) {
    console.error(`❌ MongoDB connection error (attempt ${retryCount + 1}):`, error.message);
    
    // Check if it's a connection timeout (cluster might be sleeping)
    const isTimeoutError = error.message.includes("timeout") || 
                          error.message.includes("ECONNREFUSED") ||
                          error.message.includes("ENOTFOUND") ||
                          error.message.includes("ETIMEDOUT") ||
                          error.message.includes("ENETUNREACH");
    
    if (isTimeoutError && retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY * (retryCount + 1); // Exponential backoff
      console.warn(`⚠️ MongoDB cluster might be sleeping. Retrying in ${delay}ms...`);
      console.warn(`⚠️ This is normal for free M0 clusters - they wake up automatically`);
      
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectDB(retryCount + 1);
    }
    
    if (isTimeoutError) {
      console.warn("⚠️ MongoDB cluster is sleeping and didn't wake up after retries");
      console.warn("⚠️ App will use file storage until MongoDB is available");
      console.warn("⚠️ To fix manually:");
      console.warn("   1. Go to https://cloud.mongodb.com");
      console.warn("   2. Check your cluster status");
      console.warn("   3. Make sure Network Access allows 0.0.0.0/0");
      console.warn("   4. Try using the website - it will wake up the cluster");
    } else {
      console.error("❌ MongoDB connection failed with error:", error.message);
      console.warn("⚠️ Check your MONGODB_URI in environment variables");
    }
    
    // Clean up failed connection
    if (client) {
      try {
        await client.close();
      } catch (e) {
        // Ignore cleanup errors
      }
      client = null;
    }
    
    // Don't throw error - let the app continue with file storage
    return null;
  }
};

export const getDB = () => {
  if (!db) {
    // Don't throw error - return null so the app can fall back to file storage
    console.warn("⚠️ MongoDB not connected. Falling back to file storage.");
    return null;
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
  try {
    const database = getDB();
    if (!database) {
      console.warn(`⚠️ Cannot get collection ${collectionName}: MongoDB not connected`);
      return null;
    }
    return database.collection(collectionName);
  } catch (error) {
    console.error(`❌ Error getting collection ${collectionName}:`, error.message);
    return null;
  }
};

