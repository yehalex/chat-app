import axios from "axios";

const TOKEN_KEY = "access_token";
const TOKEN_EXPIRY_KEY = "token_expiry";

// Store token in memory and localStorage
export const setToken = (token) => {
  // Store in memory
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

  // Store in localStorage as backup
  localStorage.setItem(TOKEN_KEY, token);

  // Set expiry time (15 minutes from now)
  const expiryTime = Date.now() + 15 * 60 * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
};

// Get token from memory or localStorage
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Remove token from memory and localStorage
export const removeToken = () => {
  delete axios.defaults.headers.common["Authorization"];
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

// Check if token is expired
export const isTokenExpired = () => {
  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryTime) return true;

  // Add 30 second buffer to ensure we refresh before expiry
  return Date.now() + 30000 >= parseInt(expiryTime);
};

// Refresh token
export const refreshToken = async () => {
  try {
    // Use the axiosInstance to ensure proper baseURL and credentials
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh`,
      {},
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const { accessToken } = response.data;
    setToken(accessToken);
    return accessToken;
  } catch (error) {
    removeToken();
    throw error;
  }
};
