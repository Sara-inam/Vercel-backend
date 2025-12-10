import mongoose from "mongoose";

export const withDB = (handler) => async (req, res) => {
  if (!mongoose.connections[0].readyState) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB connected");
    } catch (err) {
      console.error("MongoDB connection error:", err);
      return res.status(500).json({ message: "DB connection failed", error: err.message });
    }
  }
  return handler(req, res);
};
