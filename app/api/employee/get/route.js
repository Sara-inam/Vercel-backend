import { NextResponse } from "next/server";
import { cache } from "../../../libs/cache.js";
import User from "../../../models/user.model.js";
import Department from "../../../models/department.model.js"; //  REQUIRED
import { verifyAdmin } from "../../../libs/verifyAdmin.js";

export const GET = verifyAdmin(async (req) => {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page")) || 1;
    const limit = parseInt(url.searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = `employees_page_${page}_limit_${limit}`;
    const cached = cache.get(cacheKey);

    if (cached) return NextResponse.json(cached);

    const query = { role: "employee" };

    const users = await User.find(query)
      .select("-password")
      .populate({
        path: "departments",
        model: Department,      //  IMPORTANT ON VERCEL
        select: "name head",
        populate: {
          path: "head",
          model: User,          //  Optional but safe
          select: "email",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    const response = {
      users,
      pagination: {
        totalRecords: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit,
      },
    };

    cache.set(cacheKey, response);

    return NextResponse.json(response);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
});