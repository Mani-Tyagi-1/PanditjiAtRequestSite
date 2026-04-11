import axios from "axios";

/**
 * Centralized API Client
 * 
 * Handles:
 * 1. Base URL configuration
 * 2. Automatic Authorization header injection
 * 3. Standardized response unwrapping (success: true, data: { ... })
 */

const apiUrl = import.meta.env.VITE_API_URL || "https://panditjiatrequest.com/api";

const apiClient = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Add Auth Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("user_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Unwrap standardized data
apiClient.interceptors.response.use(
  (response) => {
    // If the response matches our standard structure: { success, message, data }
    // We unwrap the 'data' property so components can access it via response.data
    if (
      response.data &&
      response.data.success === true &&
      response.data.data !== undefined
    ) {
      return {
        ...response,
        data: response.data.data,
      };
    }
    return response;
  },
  (error) => {
    // Handle global errors (e.g., 401 Unauthorized)
    if (error.response?.status === 401) {
      // Optional: Clear token and redirect to login if unauthorized
      // localStorage.removeItem("user_token");
      // window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
