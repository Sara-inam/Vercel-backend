import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { flushEmployeeCache } from "../../../libs/cache.js";
import User from "../../../models/user.model.js";
import fs from "fs";
import path from "path";
import { verifyAdmin } from "../../../libs/verifyAdmin.js";

export const POST = verifyAdmin(async (req) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const formData = await req.formData();
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const role = formData.get("role") || "employee";
    const salary = Number(formData.get("salary"));
    const departments = formData.getAll("departments[]");

    let profileImage = null;
    const file = formData.get("profileImage");

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadDir = path.join(process.cwd(), "public/uploads");

      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      const uniqueName = `${Date.now()}-${file.name}`;
      const filePath = path.join(uploadDir, uniqueName);
      fs.writeFileSync(filePath, buffer);

      profileImage = `/uploads/${uniqueName}`; // public path
    }

    const exists = await User.findOne({ email }).session(session);
    if (exists) {
      await session.abortTransaction();
      return NextResponse.json({ message: "Email already exists" }, { status: 400 });
    }

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
}
});
