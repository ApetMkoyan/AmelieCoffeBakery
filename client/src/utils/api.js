const API_BASE = "/api";

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
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

  return response;
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

