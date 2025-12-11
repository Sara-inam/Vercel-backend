import "../../../models/index.js";
import { NextResponse } from "next/server";
import { cache } from "../../../libs/cache.js";
import { verifyToken } from "../../../libs/verifyToken.js";

const getProfileHandler = async (req, ctx, user) => {
  try {
    const userId = user._id.toString();
    const cacheKey = `profile_${userId}`;

    const fromCache = cache.get(cacheKey);
    if (fromCache) {
      return NextResponse.json({
        success: true,
        data: fromCache,
        cached: true,
      });
    }

    const employee = await User.findById(userId).populate({
      path: "departments",
      select: "name head",
      populate: { path: "head", select: "_id name" },
    });

    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    // ⭐ Cloudinary URL already absolute URL
    const imageURL = employee.profileImage || null;

    const allDepartments = employee.departments.map((d) => d.name);

    const headDepartments = employee.departments
      .filter((d) => d.head?._id.toString() === userId)
      .map((d) => d.name);

    const profile = {
      name: employee.name,
      email: employee.email,
      salary: employee.salary,
      role: employee.role,
      profileImage: imageURL,
      departments: allDepartments,
      headDepartments: headDepartments,
    };

    cache.set(cacheKey, profile);

    return NextResponse.json({ success: true, data: profile, cached: false });
  } catch (error) {
    console.error("Profile Error:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
};

export const GET = verifyToken(getProfileHandler);
