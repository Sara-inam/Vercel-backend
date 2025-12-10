import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { flushEmployeeCache } from "../../../libs/cache.js";
import User from "../../../models/user.model.js";
import { verifyAdmin } from "../../../libs/verifyAdmin.js";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const POST = verifyAdmin(async (req) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const formData = await req.formData();
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const role = formData.get("role") || "employee";
    const departments = formData.getAll("departments[]");

    // ✅ Safe salary conversion
    const salaryInput = formData.get("salary");
    const salary = salaryInput && !isNaN(Number(salaryInput)) ? Number(salaryInput) : 0;

    // ✅ Optional profile image upload
    let profileImage = null;
    const file = formData.get("profileImage");

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "employees" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(buffer);
      });

      profileImage = result.secure_url; // URL store in DB
    }

    // ✅ Check if email exists
    const exists = await User.findOne({ email }).session(session);
    if (exists) {
      await session.abortTransaction();
      return NextResponse.json({ message: "Email already exists" }, { status: 400 });
    }

    // ✅ Hash password and create user
    const hashPassword = await bcrypt.hash(password, 10);
    await User.create(
      [{ name, email, password: hashPassword, role, profileImage, departments, salary }],
      { session }
    );

    await session.commitTransaction();
    flushEmployeeCache();

    return NextResponse.json({ message: "Employee created successfully" });
  } catch (e) {
    console.error("Error in /api/employee/create:", e);
    await session.abortTransaction();
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  } finally {
    session.endSession();
  }
});
