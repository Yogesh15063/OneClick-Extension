import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import UserToken from "../models/UserToken.js";

dotenv.config();
const router = express.Router();

/* ✅ 1. CLICKUP AUTH FLOW */

// Redirect user to ClickUp authorization page
router.get("/auth/clickup", (req, res) => {
  const clientId = process.env.CLICKUP_CLIENT_ID;
  const redirectUri = process.env.CLICKUP_REDIRECT_URI;
  const scope = "task:view,team:view,space:view";

  const authUrl = `https://app.clickup.com/api?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  res.redirect(authUrl);
});

// Callback from ClickUp
router.get("/auth/clickup/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) return res.status(400).json({ error: "Authorization code missing" });

  try {
    // Exchange code for access token
    const tokenRes = await axios.post("https://api.clickup.com/api/v2/oauth/token", {
      client_id: process.env.CLICKUP_CLIENT_ID,
      client_secret: process.env.CLICKUP_CLIENT_SECRET,
      code,
    });

    const access_token = tokenRes.data.access_token;

    // Get user info
    const userRes = await axios.get("https://api.clickup.com/api/v2/user", {
      headers: { Authorization: access_token },
    });

    const user = userRes.data.user;

    // Save token
    await UserToken.findOneAndUpdate(
      { user_id: user.id },
      {
        user_id: user.id,
        username: user.username,
        email: user.email,
        access_token,
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Stored token for ${user.email}`);

    // Send a message back to the extension
    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; margin-top: 40px;">
          <h3>✅ ClickUp Connected!</h3>
          <script>
            window.opener && window.opener.postMessage({
              clickup_user_id: "${user.id}",
              clickup_email: "${user.email}"
            }, "*");
            window.close();
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("OAuth error:", err.response?.data || err.message);
    res.status(500).json({ error: "OAuth failed", details: err.response?.data || err.message });
  }
});

/* ✅ 2. FETCH CONNECTED USER */
router.get("/auth/clickup/user", async (req, res) => {
  const user = await UserToken.findOne();
  if (!user) return res.status(404).json({ message: "Not connected" });
  res.json({ user });
});

/* ✅ 3. FETCH TASK (requires user_id & taskId) */
router.get("/auth/clickup/task/:userId/:taskId", async (req, res) => {
  const { userId, taskId } = req.params;

  const record = await UserToken.findOne({ user_id: userId });
  if (!record?.access_token) {
    return res.status(403).json({ error: "User not authorized or token missing" });
  }

  try {
    const taskRes = await axios.get(`https://api.clickup.com/api/v2/task/${taskId}`, {
      headers: { Authorization: record.access_token },
    });

    res.json({ message: "Task fetched successfully", data: taskRes.data });
  } catch (err) {
    console.error("Error fetching task:", err.response?.data || err.message);
    res.status(500).json({
      error: "Failed to fetch task",
      details: err.response?.data || err.message,
    });
  }
});

export default router;
