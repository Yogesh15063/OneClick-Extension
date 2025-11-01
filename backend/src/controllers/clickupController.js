import config from "../config/clickupConfig.js";
import { getAccessToken,getUserData } from "../services/clickUpService.js";

export const redirectToClickUpAuth = (req, res) => {
  const authUrl = `https://app.clickup.com/api?client_id=${config.clientId}&redirect_uri=${config.redirectUri}`;
  console.log("🔗 Redirecting user to ClickUp Auth URL:", authUrl);
  console.log("⚙️ Config in use:", {
    clientId: config.clientId,
    redirectUri: config.redirectUri,
  });
  res.redirect(authUrl);
};

export const handleClickUpCallback = async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "Authorization code missing" });

    // Step 1: Exchange code for access token
    const tokenData = await getAccessToken(code);
    const accessToken = tokenData.access_token;

    // Step 2: Fetch user data
    const userData = await getUserData(accessToken);

    // Step 3: Send token & user info back to frontend (you can save it in DB later)
    res.json({
      message: "Authorization successful",
      access_token: accessToken,
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};


export const getUserTeams = async (req, res, next) => {
  try {
    const { access_token } = req.query; // You’ll pass this from frontend for now
    if (!access_token) {
      return res.status(400).json({ error: "Access token missing" });
    }

    const teamsData = await getTeams(access_token);
    res.json({ message: "Teams fetched successfully", data: teamsData });
  } catch (error) {
    next(error);
  }
};