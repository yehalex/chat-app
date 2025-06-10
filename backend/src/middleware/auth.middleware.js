import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { verifyAccessToken } from "../lib/utils.js";

export const protectRoute = async (req, res, next) => {
  try {
    // Check for access token in Authorization header
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No Token Provided" });
    }

    const { valid, userId, error } = verifyAccessToken(token);

    if (!valid) {
      return res.status(401).json({
        message: "Unauthorized - Invalid token",
        error: error,
      });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("Error in protectRoute middleware", error);
    return res.status(500).json({ message: "Internal Error" });
  }
};

// Middleware to handle token refresh
export const refreshTokenMiddleware = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("Error in refreshTokenMiddleware", error);
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};
