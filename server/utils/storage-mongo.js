import { getCollection } from "./db.js";

// Helper functions to work with MongoDB collections
// These functions mimic the interface of storage.js for easy migration

// Extract collection name from file name (e.g., "products.json" -> "products")
const getCollectionName = (fileName) => {
  return fileName.replace(/\.json$/, "");
};

export const readJson = async (fileName, fallback) => {
  try {
    const collectionName = getCollectionName(fileName);
    
    // Try to ensure connection before reading
    const { connectDB } = await import("./db.js");
    let db = await connectDB();
    
    // If still not connected, return fallback
    if (!db) {
      console.warn(`⚠️ MongoDB not available for ${fileName}, using fallback`);
      return fallback;
    }
    
    const collection = getCollection(collectionName);
    
    // If collection is null (MongoDB not connected), return fallback
    if (!collection) {
      console.warn(`⚠️ MongoDB not available for ${fileName}, using fallback`);
      return fallback;
    }
    
    // For products, orders, consumables, daily-records
    if (collectionName === "products") {
      try {
        const products = await collection.find({}).toArray();
        console.log(`📦 Found ${products.length} products in MongoDB`);
        
        // Convert array to object grouped by category
        const result = {};
        products.forEach((product) => {
          // Ensure product has a category
          const category = product.category || "drinks";
          if (!result[category]) {
            result[category] = [];
          }
          result[category].push(product);
        });
        
        console.log(`✅ Products grouped into ${Object.keys(result).length} categories`);
        return result;
      } catch (queryError) {
        console.error(`❌ Error querying products from MongoDB:`, queryError.message);
        throw queryError;
      }
    }
    
    // For arrays (orders, consumables, daily-records)
    const items = await collection.find({}).toArray();
    return items.length > 0 ? items : fallback;
  } catch (error) {
    console.error(`Error reading ${fileName} from MongoDB:`, error.message);
    // If collection doesn't exist or connection failed, return fallback
    if (fallback !== undefined) {
      console.warn(`⚠️ Using fallback for ${fileName} due to MongoDB error`);
      return fallback;
    }
    throw error;
  }
};

export const writeJson = async (fileName, data) => {
  try {
    const collectionName = getCollectionName(fileName);
    
    // Try to ensure connection before writing
    const { connectDB } = await import("./db.js");
    let db = await connectDB();
    
    // If still not connected, log warning but don't throw
    if (!db) {
      console.warn(`⚠️ MongoDB not available for writing ${fileName}, operation skipped`);
      return; // Silently fail - app will continue with file storage
    }
    
    const collection = getCollection(collectionName);
    
    // If collection is null (MongoDB not connected), log warning but don't throw
    if (!collection) {
      console.warn(`⚠️ MongoDB not available for writing ${fileName}, operation skipped`);
      return; // Silently fail - app will continue with file storage
    }
    
    if (collectionName === "products") {
      // Products is an object with categories as keys
      // We need to flatten it and save each product
      const productsArray = [];
      for (const category in data) {
        if (Array.isArray(data[category])) {
          data[category].forEach((product) => {
            productsArray.push({
              ...product,
              category,
            });
          });
        }
      }
      
      // Delete all existing products and insert new ones
      await collection.deleteMany({});
      if (productsArray.length > 0) {
        await collection.insertMany(productsArray);
      }
    } else {
      // For arrays (orders, consumables, daily-records)
      // Delete all and insert new
      await collection.deleteMany({});
      if (Array.isArray(data) && data.length > 0) {
        await collection.insertMany(data);
      }
    }
  } catch (error) {
    console.error(`Error writing ${fileName} to MongoDB:`, error.message);
    // Don't throw - let the app continue, it will use file storage as fallback
    console.warn(`⚠️ Write operation failed for ${fileName}, but app will continue`);
  }
};

// MongoDB-specific helper functions for better performance
export const findOne = async (collectionName, query) => {
  const collection = getCollection(collectionName);
  return await collection.findOne(query);
};

export const find = async (collectionName, query = {}) => {
  const collection = getCollection(collectionName);
  return await collection.find(query).toArray();
};

export const insertOne = async (collectionName, document) => {
  const collection = getCollection(collectionName);
  const result = await collection.insertOne(document);
  return result.insertedId;
};

export const updateOne = async (collectionName, query, update) => {
  const collection = getCollection(collectionName);
  return await collection.updateOne(query, { $set: update });
};

export const deleteOne = async (collectionName, query) => {
  const collection = getCollection(collectionName);
  return await collection.deleteOne(query);
};

