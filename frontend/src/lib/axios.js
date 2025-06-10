import axios from "axios";
import { getToken, isTokenExpired, refreshToken } from "./auth";

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    // Get token from memory/localStorage
    const token = getToken();

    // If token exists and is expired, refresh it
    if (token && isTokenExpired()) {
      try {
        const newToken = await refreshToken();
        config.headers.Authorization = `Bearer ${newToken}`;
      } catch (error) {
        // If refresh fails, the request will fail with 401
        console.error("Token refresh failed:", error);
      }
    } else if (token) {
      // If token exists and is not expired, use it
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const newToken = await refreshToken();

        // Update the failed request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { axiosInstance };
