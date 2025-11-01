import express from "express";
import { loginRedirect, authCallback } from "../controllers/authController.js";

const router = express.Router();

router.get("/login", loginRedirect);
router.get("/callback", authCallback);

export default router;
