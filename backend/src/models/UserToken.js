import mongoose from "mongoose";

const userTokenSchema = new mongoose.Schema({
    user_id: String,
  clickupUserId: { type: String, required: true, unique: true },
  email: String,
  access_token: String,
  refresh_token: String,
  team_id: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("UserToken", userTokenSchema);
