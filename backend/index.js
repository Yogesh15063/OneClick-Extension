import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const CLICKUP_API = "https://api.clickup.com/api/v2";

app.get("/task/:taskId", async (req, res) => {
  const { taskId } = req.params;

  try {
    const response = await axios.get(`${CLICKUP_API}/task/${taskId}`, {
      headers: {
        Authorization: process.env.CLICKUP_TOKEN,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("❌ Error fetching task:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch task from ClickUp" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
