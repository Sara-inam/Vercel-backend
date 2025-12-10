import { NextResponse } from "next/server";
import Department from "../../../models/department.model.js";
import logger from "../../../config/logger.js";
import { cache } from "../../../libs/cache.js";
import { verifyAdmin } from "../../../libs/verifyAdmin.js";

export const GET = verifyAdmin(async (req, ctx, user) => {
  try {
    // user is available here safely
    const cachedDepartments = cache.get("departments");
    if (cachedDepartments) {
      return NextResponse.json({
        message: "Departments fetched successfully (from cache).",
        departments: cachedDepartments,
      });
    }

    const departments = await Department.find().populate({
      path: "head",
      select: "name email",
      strictPopulate: false,
    });

    if (!departments || departments.length === 0) {
      return NextResponse.json({ message: "No departments found" }, { status: 400 });
    }

    const safeDepartments = departments.map(dept => ({
      _id: dept._id,
      name: dept.name,
      discription: dept.discription,
      head: dept.head ? { _id: dept.head._id, name: dept.head.name, email: dept.head.email } : null
    }));

    cache.set("departments", safeDepartments);

    return NextResponse.json({
      message: "Departments fetched successfully.",
      departments: safeDepartments,
    });

  } catch (error) {
    console.error(error.message);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
});

