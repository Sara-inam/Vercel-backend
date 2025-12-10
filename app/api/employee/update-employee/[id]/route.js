import { NextResponse } from "next/server";
import User from "../../../../models/user.model.js";
import mongoose from "mongoose";
import { verifyAdmin } from "../../../../libs/verifyAdmin.js";
import { flushEmployeeCache } from "../../../../libs/cache.js";
import { Types } from "mongoose";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
      return NextResponse.json({ message: "Employee ID is required in URL." }, { status: 400 });
    }

    const user = await User.findById(employeeId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json({ message: `Employee not found for ID: ${employeeId}` }, { status: 404 });
    }

    const formData = await req.formData();
    const name = formData.get("name");
    const email = formData.get("email");
    const salaryInput = formData.get("salary");
    const role = formData.get("role");
    const departments = formData.getAll("departments[]");
    const profileImage = formData.get("profileImage");

    // Update basic fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (salaryInput && !isNaN(Number(salaryInput))) user.salary = Number(salaryInput);
    if (role) user.role = role;
    if (departments && departments.length > 0) {
      user.departments = departments
        .map(id => id.trim())
        .filter(id => Types.ObjectId.isValid(id))
        .map(id => new Types.ObjectId(id));
    }

    // Profile image update with Cloudinary and old image deletion
    if (profileImage && profileImage.size > 0) {
      const buffer = Buffer.from(await profileImage.arrayBuffer());

      // Delete old image from Cloudinary if public_id stored
      if (user.profileImagePublicId) {
        await cloudinary.uploader.destroy(user.profileImagePublicId);
      }

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

      user.profileImage = result.secure_url;           // URL store in DB
      user.profileImagePublicId = result.public_id;    // Public ID store for future deletion
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
