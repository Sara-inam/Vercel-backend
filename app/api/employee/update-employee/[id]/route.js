import { NextResponse } from "next/server";
import User from "../../../../models/user.model.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { verifyAdmin } from "../../../../libs/verifyAdmin.js";
import { flushEmployeeCache } from "../../../../libs/cache.js";
import { Types } from "mongoose";

// App Router settings
export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export const PUT = verifyAdmin(async (req, context) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
  
    const { id: employeeId } = await context.params;

    if (!employeeId) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { message: "Employee ID is required in URL." },
        { status: 400 }
      );
    }

    const user = await User.findById(employeeId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { message: `Employee not found for ID: ${employeeId}` },
        { status: 404 }
      );
    }

    // Form data
    const formData = await req.formData();
    const name = formData.get("name");
    const email = formData.get("email");
    const salary = formData.get("salary");
    const role = formData.get("role");

    // Match frontend multi-select
    const departments = formData.getAll("departments[]"); // use "departments[]" instead of "departments"

    const profileImage = formData.get("profileImage");

    // Update basic fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (salary) user.salary = salary;
    if (role) user.role = role;
    if (departments && departments.length > 0) {
      user.departments = departments
        .map(id => id.trim())
        .filter(id => Types.ObjectId.isValid(id))
        .map(id => new Types.ObjectId(id));
    }

    // Profile image update
    if (profileImage && profileImage.size > 0) {
      const uploadsDir = path.join(process.cwd(), "public/uploads");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      // Delete old image
      if (user.profileImage) {
        const oldPath = path.join(process.cwd(), "public", user.profileImage.replace(/^\//, ""));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      const fileName = `${user._id}_${Date.now()}_${profileImage.name}`;
      const filePath = path.join(uploadsDir, fileName);
      const buffer = Buffer.from(await profileImage.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      // Update path
      user.profileImage = `/uploads/${fileName}`;
    }

    await user.save({ session });
    await session.commitTransaction();
    session.endSession();

    flushEmployeeCache();

    return NextResponse.json({
      message: "Employee updated successfully",
      data: user
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error updating employee:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
});
