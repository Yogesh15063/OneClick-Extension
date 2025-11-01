import axios from "axios";
import config from "../config/clickupConfig.js";

export const getAccessToken = async (code) => {
  try {
    const response = await axios.post("https://api.clickup.com/api/v2/oauth/token", {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
    });
    return response.data;
  } catch (error) {
    console.error("Error getting access token:", error.response?.data || error.message);
    throw new Error("Failed to get ClickUp access token");
  }
};

export const getUserData = async (token) => {
  try {
    const response = await axios.get(`${config.baseUrl}/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user data:", error.response?.data || error.message);
    throw new Error("Failed to fetch user data");
  }
};
export const getTeams = async (accessToken) => {
  const url = "https://api.clickup.com/api/v2/team";
  const res = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return res.data;
};