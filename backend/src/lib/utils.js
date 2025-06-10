import jwt from "jsonwebtoken";

export const generateTokens = (res, userId) => {
  // Generate access token (short-lived)
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "15m", // 15 minutes
  });

  // Generate refresh token (long-lived)
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d", // 7 days
  });

  // Set refresh token in httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    sameSite: "lax", // Changed to lax for cross-origin support
    secure: process.env.NODE_ENV !== "development",
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, userId: decoded.userId };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    return { valid: true, userId: decoded.userId };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

// For backward compatibility during migration
export const generateToken = (res, userId) => {
  const { accessToken } = generateTokens(res, userId);
  return accessToken;
};

export const verifyToken = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
};
