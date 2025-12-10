import { NextResponse } from "next/server";
import User from "../../../models/user.model.js";
import { cache } from "../../../libs/cache.js";
import { verifyToken } from "../../../libs/verifyToken.js";

// GET Employee Profile
const getProfileHandler = async (req, ctx, user) => {
  try {
    const userId = user._id.toString();
    const cacheKey = `profile_${userId}`;

    // Check cache
    const fromCache = cache.get(cacheKey);
    if (fromCache) {
      return NextResponse.json({
        success: true,
        data: fromCache,
        cached: true,
      });
    }

    // Fetch employee with departments and head info
    const employee = await User.findById(userId).populate({
      path: "departments",
      select: "name head",
      populate: { path: "head", select: "_id name" },
    });

    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    const host = req.headers.get("host");
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const imageURL = employee.profileImage
      ? `${protocol}://${host}${employee.profileImage}`
      : null;

    // All departments
    const allDepartments = employee.departments.map((d) => d.name);

    // Departments where employee is head
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

// Export GET with token verification
export const GET = verifyToken(getProfileHandler);
