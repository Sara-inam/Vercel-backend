import { NextResponse } from "next/server";
import { verifyToken } from "./verifyToken.js";
import { withDB } from "./withDB.js";

export const verifyAdmin = (handler) => {
  return verifyToken(async (req, ctx, user) => {
    if (user.role.toLowerCase() !== "admin") {
      return NextResponse.json({ message: "Access denied. Admin only." }, { status: 403 });
    }

    // Call the original handler and pass user
    return handler(req, ctx, user);
  });
};
//end code
