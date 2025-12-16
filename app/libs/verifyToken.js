import { withDB } from "./withDB.js";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import User from "../models/user.model.js";

export const verifyToken = (handler) => {
  return withDB(async (req, ctx) => {
    try {
      const authHeader = req.headers.get("authorization");
      if (!authHeader)
        return NextResponse.json(
          { message: "No token provided" },
          { status: 401 }
        );

      const token = authHeader.split(" ")[1];
      if (!token)
        return NextResponse.json(
          { message: "No token provided" },
          { status: 401 }
        );

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      //  ENVIRONMENT CHECK (MAIN FIX)
        if (decoded.env !== process.env.ENV_NAME) {
  return NextResponse.json(
    { message: `Token env ${decoded.env} does not match server env ${process.env.ENV_NAME}` },
    { status: 401 }
  );
}
      console.log("TOKEN ENV:", decoded.env);
console.log("SERVER ENV:", process.env.ENV_NAME);

      const user = await User.findById(decoded.userId);
      if (!user)
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 }
        );

      return handler(req, ctx, user);
    } catch (err) {
      return NextResponse.json(
        { message: err.message || "Unauthorized" },
        { status: 401 }
      );
    }
  });
};
