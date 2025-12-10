import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import User from "../../../models/user.model.js";
import { verifyToken } from "../../../libs/verifyToken.js";
import mongoose from "mongoose";
import { flushProfileCache } from "../../../libs/cache.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PUT Employee Profile
export const PUT = verifyToken(async (req, ctx, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = user._id.toString();

    // Parse multipart form-data
    const formData = await req.formData();
    const name = formData.get("name");
    const profileImageFile = formData.get("profileImage");

    const employee = await User.findById(userId).session(session);
    if (!employee) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    let updateData = {};

    // Update name
    if (name) updateData.name = name;

    // Update profile image
    if (profileImageFile && profileImageFile.size > 0) {
      const arrayBuffer = await profileImageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const fileName = `${Date.now()}_${profileImageFile.name}`;
      const filePath = path.resolve(process.cwd(), "public/uploads", fileName);

      // Delete old image if exists
      if (employee.profileImage) {
        const oldPath = path.resolve(process.cwd(), "public", employee.profileImage.replace(/^\//, ""));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      // Save new image
      fs.writeFileSync(filePath, buffer);
      updateData.profileImage = `/uploads/${fileName}`;
    }

    // Update user in DB
    employee.set(updateData);
    await employee.save({ session });

    await session.commitTransaction();
    flushProfileCache(userId);
    session.endSession();

    // Prepare profile image URL
    const host = req.headers.get("host");
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const profileImageUrl = employee.profileImage
      ? `${protocol}://${host}${employee.profileImage}?t=${Date.now()}`
      : null;

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        name: employee.name,
        profileImage: profileImageUrl,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error updating profile:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
});
