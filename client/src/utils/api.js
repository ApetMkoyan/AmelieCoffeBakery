/**
 * API utility functions
 */

const API_BASE = "/api";

/**
 * Makes an API request with error handling
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 401) {
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response;
}

/**
 * GET request helper
 */
export async function apiGet(endpoint, token = null) {
  const headers = token ? { "x-supervisor-token": token } : {};
  const response = await apiRequest(endpoint, { headers });
  return response.json();
}

/**
 * POST request helper
 */
export async function apiPost(endpoint, data, token = null) {
  const headers = token ? { "x-supervisor-token": token } : {};
  const response = await apiRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
    headers,
  });
  return response.json();
}

/**
 * PATCH request helper
 */
export async function apiPatch(endpoint, data, token = null) {
  const headers = token ? { "x-supervisor-token": token } : {};
  const response = await apiRequest(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data),
    headers,
  });
  return response.json();
}

/**
 * DELETE request helper
 */
export async function apiDelete(endpoint, token = null) {
  const headers = token ? { "x-supervisor-token": token } : {};
  const response = await apiRequest(endpoint, {
    method: "DELETE",
    headers,
  });
  return response.json();
}

