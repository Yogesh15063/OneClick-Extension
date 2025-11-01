// backend/src/server.js
import app from "./app.js";
import { info } from "./utils/logger.js";
import connectDB from "./config/db.js";
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  info(`Backend running on http://localhost:${PORT}`);
});
