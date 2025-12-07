const API_BASE = "/api";

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  console.log("🌐 API Request:", { url, method: options.method || "GET" });
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    console.log("📡 API Response:", { 
      url, 
      status: response.status, 
      ok: response.ok,
      statusText: response.statusText 
    });

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        console.error("❌ API Error:", { url, status: response.status, error: errorData });
      } catch (e) {
        console.error("❌ API Error (non-JSON):", { url, status: response.status, error: response.statusText });
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      error.name = "APIError";
      throw error;
    }

    return response;
  } catch (error) {
    // Enhanced error handling for network issues
    console.error("❌ API Request failed:", { 
      url, 
      error: error.message, 
      name: error.name,
      status: error.status,
      stack: error.stack 
    });
    
    // If it's already an APIError (from response.ok check), just rethrow
    if (error.name === "APIError") {
      throw error;
    }
    
    // Network errors - connection refused, CORS, timeout, etc.
    if (error.name === "TypeError" || 
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError") ||
        error.message.includes("Network request failed") ||
        error.message.includes("Load failed")) {
      const networkError = new Error("Connection error. Please check your internet connection and try again.");
      networkError.name = "NetworkError";
      networkError.originalError = error;
      throw networkError;
    }
    
    // Re-throw other errors as-is
    throw error;
  }
}

export async function apiGet(endpoint, token = null) {
  const headers = token ? { "x-supervisor-token": token } : {};
  const response = await apiRequest(endpoint, { headers });
  return response.json();
}

export async function apiPost(endpoint, data, token = null) {
  const headers = token ? { "x-supervisor-token": token } : {};
  const response = await apiRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
    headers,
  });
  return response.json();
}

export async function apiPatch(endpoint, data, token = null) {
  const headers = token ? { "x-supervisor-token": token } : {};
  const response = await apiRequest(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data),
    headers,
  });
  return response.json();
}

export async function apiDelete(endpoint, token = null) {
  const headers = token ? { "x-supervisor-token": token } : {};
  const response = await apiRequest(endpoint, {
    method: "DELETE",
    headers,
  });
  return response.json();
}

export async function apiUploadFile(file, token = null) {
  const formData = new FormData();
  formData.append("image", file);
  
  const url = `${API_BASE}/upload`;
  const response = await fetch(url, {
    method: "POST",
    headers: token ? { "x-supervisor-token": token } : {},
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
      // not JSON
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

