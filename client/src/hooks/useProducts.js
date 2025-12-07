import { useState, useEffect, useCallback } from "react";
import { apiGet } from "../utils/api.js";

/**
 * Custom hook for managing products with retry logic
 * @returns {object} Products state and fetch function
 */
export function useProducts() {
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = useCallback(async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second base delay

    try {
      setLoading(true);
      setError("");
      console.log(`🔄 Fetching products... (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
      
      const data = await apiGet("/products");
      console.log("✅ Products fetched:", {
        categories: Object.keys(data).length,
        totalProducts: Object.values(data).reduce((sum, cat) => sum + (Array.isArray(cat) ? cat.length : 0), 0)
      });
      
      if (!data || Object.keys(data).length === 0) {
        console.warn("⚠️ Products data is empty!");
        setError("No products available. Please try again later.");
      } else {
        setProducts(data);
        setError("");
      }
    } catch (err) {
      console.error("❌ Error fetching products:", err);
      console.error("❌ Error details:", {
        message: err.message,
        status: err.status,
        stack: err.stack,
        name: err.name
      });

      // Determine error type and message
      let errorMessage = "Unable to load menu. Please check your connection and try again.";
      
      if (err.message) {
        // Network errors
        if (err.message.includes("Failed to fetch") || 
            err.message.includes("NetworkError") ||
            err.message.includes("Network request failed") ||
            err.name === "TypeError") {
          errorMessage = "Connection error. Please check your internet connection and try again.";
        }
        // Server errors
        else if (err.status === 500) {
          errorMessage = "Server error. Please try again in a moment.";
        }
        else if (err.status === 404) {
          errorMessage = "Menu not found. Please contact support.";
        }
        else if (err.status === 503) {
          errorMessage = "Service temporarily unavailable. Please try again later.";
        }
        // Use the error message if it's meaningful
        else if (err.message && !err.message.includes("Failed to fetch")) {
          errorMessage = err.message;
        }
      }

      // Retry logic for network errors
      if (retryCount < MAX_RETRIES && (
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("NetworkError") ||
        err.message?.includes("Network request failed") ||
        err.name === "TypeError" ||
        !err.status // Network errors typically don't have status
      )) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
        console.log(`⏳ Retrying in ${delay}ms...`);
        setTimeout(() => {
          fetchProducts(retryCount + 1);
        }, delay);
        return; // Don't set error yet, we're retrying
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: () => fetchProducts(0) };
}

