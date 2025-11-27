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
    const collection = getCollection(collectionName);
    
    // For products, orders, consumables, daily-records
    if (collectionName === "products") {
      const products = await collection.find({}).toArray();
      // Convert array to object grouped by category
      const result = {};
      products.forEach((product) => {
        if (!result[product.category]) {
          result[product.category] = [];
        }
        result[product.category].push(product);
      });
      return result;
    }
    
    // For arrays (orders, consumables, daily-records)
    const items = await collection.find({}).toArray();
    return items.length > 0 ? items : fallback;
  } catch (error) {
    console.error(`Error reading ${fileName}:`, error);
    // If collection doesn't exist, return fallback
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
};

export const writeJson = async (fileName, data) => {
  try {
    const collectionName = getCollectionName(fileName);
    const collection = getCollection(collectionName);
    
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
    console.error(`Error writing ${collectionName}:`, error);
    throw error;
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

