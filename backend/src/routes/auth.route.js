import express from "express";
import {
  signup,
  login,
  logout,
  updateProfile,
  checkAuth,
  refresh,
} from "../controllers/auth.controller.js";
import {
  protectRoute,
  refreshTokenMiddleware,
} from "../middleware/auth.middleware.js";
const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refreshTokenMiddleware, refresh);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);

export default router;
