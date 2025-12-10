import { NextResponse } from "next/server";
import User from "../../../models/user.model.js";
import { verifyAdmin } from "../../../libs/verifyAdmin.js";

export const GET = verifyAdmin(async (req) => {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() || "";

  if (!query) {
    // agar empty query, return empty array
    return NextResponse.json({ employees: [] });
  }

  // Max 50 results to avoid overload
  const employees = await User.find({
    role: "employee",
    isDeleted: false,
    $or: [
      { email: { $regex: `^${query}`, $options: "i" } },
      { name: { $regex: `^${query}`, $options: "i" } }
    ]
  })
    .select("_id name email")
    .limit(50);

  return NextResponse.json({ employees });
});
