import mongoose from "mongoose";
import { NextResponse } from "next/server";

export const withDB = (handler) => {
  return async (req, ctx) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGO_URI);
      }

      // Load all models (register schemas) after DB connect
      await import("../models/user.model.js");
      await import("../models/department.model.js");

      return handler(req, ctx);
    } catch (err) {
      return NextResponse.json(
        { message: "DB Connection Failed", error: err.message },
        { status: 500 }
      );
    }
  };
};
