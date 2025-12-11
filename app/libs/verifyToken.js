import "../models/index.js";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { withDB } from "./withDB.js";

export const verifyToken = (handler) => {
  return withDB(async (req, ctx) => {
    try {
      const authHeader = req.headers.get("authorization"); // lowercase is safer
      if (!authHeader) {
        return NextResponse.json({ message: "No token provided" }, { status: 401 });
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        return NextResponse.json({ message: "No token provided" }, { status: 401 });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }

      // Pass user to the handler
      return handler(req, ctx, user);
    } catch (err) {
      return NextResponse.json({ message: err.message || "Unauthorized" }, { status: 401 });
    }
  });
};
