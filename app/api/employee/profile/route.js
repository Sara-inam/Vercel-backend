import { NextResponse } from "next/server";
import { cache } from "../../../libs/cache.js";
import { verifyToken } from "../../../libs/verifyToken.js";
import mongoose from "mongoose";

// Dynamic fetch of models
const User = () => mongoose.model("User");
const Department = () => mongoose.model("Department");

const getProfileHandler = async (req, ctx, user) => {
  const userId = user._id.toString();
  const cacheKey = `profile_${userId}`;

  const fromCache = cache.get(cacheKey);
  if (fromCache) return NextResponse.json({ success: true, data: fromCache, cached: true });

  const employee = await User().findById(userId).populate({
    path: "departments",
    select: "name head",
    populate: { path: "head", select: "_id name" },
  });

  if (!employee) return NextResponse.json({ message: "Employee not found" }, { status: 404 });

  const profile = {
    name: employee.name,
    email: employee.email,
    salary: employee.salary,
    role: employee.role,
    profileImage: employee.profileImage || null,
    departments: employee.departments.map(d => d.name),
    headDepartments: employee.departments
      .filter(d => d.head?._id.toString() === userId)
      .map(d => d.name),
  };

  cache.set(cacheKey, profile);
  return NextResponse.json({ success: true, data: profile, cached: false });
};

export const GET = verifyToken(getProfileHandler);
