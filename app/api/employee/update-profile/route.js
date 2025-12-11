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
    const contentType = req.headers.get("content-type") || "";

    let name = null;
    let newImage = null;

    if (contentType.includes("multipart/form-data")) {
      // FormData request
      const formData = await req.formData();
      name = formData.get("name");
      newImage = formData.get("profileImage");
    } else if (contentType.includes("application/json")) {
      // JSON request
      const body = await req.json().catch(() => ({})); // prevent crash if empty
      name = body.name;
      newImage = body.profileImage || null; // base64 string
    } else {
      return NextResponse.json(
        { message: "Unsupported Content-Type" },
        { status: 400 }
      );
    }

    const userId = user._id;
    const employee = await User.findById(userId);

    if (!employee) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const updateFields = {};
    if (name) updateFields.name = name;

    if (newImage) {
      // DELETE old image if exists
      if (employee.profilePublicId) {
        await cloudinary.uploader.destroy(employee.profilePublicId);
      }

      let uploaded;
      if (newImage instanceof File) {
        // multipart file
        const arrayBuffer = await newImage.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        uploaded = await cloudinary.uploader.upload(
          `data:${newImage.type};base64,${buffer.toString("base64")}`,
          { folder: "employees" }
        );
      } else if (typeof newImage === "string") {
        // base64 string from JSON
        uploaded = await cloudinary.uploader.upload(newImage, { folder: "employees" });
      }

      updateFields.profileImage = uploaded.secure_url;
      updateFields.profilePublicId = uploaded.public_id;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true });

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
