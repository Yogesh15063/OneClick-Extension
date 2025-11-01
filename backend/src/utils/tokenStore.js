import fs from "fs";
import path from "path";

const tokenPath = path.resolve("token.json");

// Save token locally
export const saveToken = (data) => {
  fs.writeFileSync(tokenPath, JSON.stringify(data, null, 2));
  console.log("✅ Access token saved to token.json");
};

// Load token
export const getToken = () => {
  if (!fs.existsSync(tokenPath)) return null;
  const file = fs.readFileSync(tokenPath);
  return JSON.parse(file);
};
