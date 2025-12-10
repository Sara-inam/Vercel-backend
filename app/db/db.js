import mongoose from "mongoose";
import logger from "../config/logger.js";

let isConnected = false; 

export const connectDB = async () => {
  if (isConnected) return;

  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = db.connections[0].readyState;
    logger.info("MongoDB connected: " + isConnected);
  } catch (error) {
    logger.error("MongoDB connection failed: " + error.message);
    throw error;
  }
};
