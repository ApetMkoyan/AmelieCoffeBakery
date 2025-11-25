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
      const data = await apiGet("/products");
      setProducts(data);
      setError("");
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.message || "Unable to load menu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}

