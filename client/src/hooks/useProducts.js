import { useState, useEffect, useCallback } from "react";
import { apiGet } from "../utils/api.js";

/**
 * Custom hook for managing products
 * @returns {object} Products state and fetch function
 */
export function useProducts() {
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      console.log("🔄 Fetching products...");
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
        stack: err.stack
      });
      setError(err.message || "Unable to load menu. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}

