import { NextResponse } from "next/server";
import { flushEmployeeCache } from "../../../../libs/cache.js";
import User from "../../../../models/user.model.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { verifyAdmin } from "../../../../libs/verifyAdmin.js";

export const DELETE = verifyAdmin(async (req, context) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = await context.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid Employee ID" }, { status: 400 });
    }

    const employee = await User.findByIdAndDelete(id, { session });

    if (!employee) {
      await session.abortTransaction();
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    // Delete profile image safely
    if (employee.profileImage) {
      const filePath = path.join(process.cwd(), "public", employee.profileImage.replace(/^\/+/, ""));
      if (fs.existsSync(filePath)) {
        try { 
          fs.unlinkSync(filePath); 
        } catch (e) { console.error("Image deletion failed:", e); }
      }
    }

    await session.commitTransaction();
    flushEmployeeCache();
    return NextResponse.json({ message: "Employee permanently deleted successfully" });
  } catch (err) {
    await session.abortTransaction();
    console.error(err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  } finally {
    session.endSession();
  }
});
