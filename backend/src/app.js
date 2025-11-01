import express from "express";
import cors from "cors";
import clickupRoutes from "./routes/clickupRoutes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

// ✅ Allow requests from your extension & local dev
app.use(
  cors({
    origin: [
      "http://localhost:5173", // for Vite dev
      "chrome-extension://aihnepnoagcaidnioajbcbeclpmkhnma", // replace this later
    ],
    credentials: true,
  })
);

app.use(express.json());

// Register ClickUp routes
app.use("/", clickupRoutes);

// Root route
app.get("/", (req, res) => res.send("Backend running ✅"));

// Error handler
app.use(errorHandler);

export default app;

