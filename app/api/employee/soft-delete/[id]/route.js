import { NextResponse } from "next/server";
import { flushEmployeeCache } from "../../../../libs/cache.js";
import User from "../../../../models/user.model.js";
import mongoose from "mongoose";
import { verifyAdmin } from "../../../../libs/verifyAdmin.js";

export const PATCH = verifyAdmin(async (req, context) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = await context.params; 
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid Employee ID" }, { status: 400 });
    }

   
    const deletedBy = "admin";

    // Soft delete
    const employee = await User.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date(), deletedBy },
      { new: true, session }
    );

    if (!employee) {
      await session.abortTransaction();
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    await session.commitTransaction();
    flushEmployeeCache(); // flush only employees cache
    return NextResponse.json({ message: "Employee soft deleted successfully", employee });
  } catch (err) {
    await session.abortTransaction();
    console.error(err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  } finally {
    session.endSession();
  }
});
