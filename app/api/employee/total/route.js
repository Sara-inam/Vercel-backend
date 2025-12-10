import { NextResponse } from "next/server";
import { cache } from "../../../libs/cache.js";
import User from "../../../models/user.model.js";
import { verifyToken } from "../../../libs/verifyToken.js";
import { withDB } from "../../../libs/withDB.js";

export const GET = withDB(async (req) => {
  try {
    const user = await verifyToken(req); 
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const cacheKey = "totalEmployees";
    const cached = cache.get(cacheKey);
    if (cached !== undefined) {
      return NextResponse.json({ totalEmployees: cached });
    }

    const count = await User.countDocuments({ role: "employee", isDeleted: false });
    cache.set(cacheKey, count);

    return NextResponse.json({ totalEmployees: count });
  } catch (err) {
    return NextResponse.json({ message: err.message || "Unauthorized" }, { status: 401 });
  }
});
