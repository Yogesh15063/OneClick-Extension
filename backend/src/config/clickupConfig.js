import dotenv from "dotenv";
dotenv.config();

export default {
  clientId: process.env.CLICKUP_CLIENT_ID,
  clientSecret: process.env.CLICKUP_CLIENT_SECRET,
  redirectUri: process.env.CLICKUP_REDIRECT_URI,
  baseUrl: process.env.CLICKUP_BASE_URL,
};
