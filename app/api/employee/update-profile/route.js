import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import User from "../../../models/user.model.js";
import { verifyToken } from "../../../libs/verifyToken.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const runtime = "nodejs";

export const PUT = verifyToken(async (req, ctx, user) => {
  try {
    const formData = await req.formData();
    const name = formData.get("name");
    const newImage = formData.get("profileImage");

    const userId = user._id;
    const employee = await User.findById(userId);

    if (!employee) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    let updateFields = {};
    if (name) updateFields.name = name;

    // DELETE OLD IMAGE
    if (employee.profilePublicId) {
      await cloudinary.uploader.destroy(employee.profilePublicId);
    }

    // UPLOAD NEW IMAGE
    if (newImage && newImage.size > 0) {
      const arrayBuffer = await newImage.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploaded = await cloudinary.uploader.upload(
        `data:${newImage.type};base64,${buffer.toString("base64")}`,
        { folder: "employees" }
      );

      updateFields.profileImage = uploaded.secure_url;
      updateFields.profilePublicId = uploaded.public_id;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated",
      data: updatedUser,
    });
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
});
