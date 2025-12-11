import mongoose from "mongoose";
import { NextResponse } from "next/server";

export const withDB = (handler) => {
  return async (req, ctx) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGO_URI);
      }
      return handler(req, ctx);
    } catch (err) {
      return NextResponse.json(
        { message: "DB Connection Failed", error: err.message },
        { status: 500 }
      );
    }
  };
};
