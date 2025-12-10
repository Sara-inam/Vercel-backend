import { NextResponse } from "next/server";
import Department from "../../../../models/department.model.js";
import mongoose from "mongoose";
import logger from "../../../../config/logger.js";
import { flushDepartmentCache } from "../../../../libs/cache.js";
import { verifyAdmin } from "../../../../libs/verifyAdmin.js";

export const DELETE = verifyAdmin(async(req, context)=> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json(
                { message: "Department Id is required" },
                { status: 400 }
            );
        }

        const deleted = await Department.findByIdAndDelete(id, { session });

        if (!deleted) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json(
                { message: "Department not found" },
                { status: 400 }
            );
        }

        await session.commitTransaction();
        session.endSession();

        flushDepartmentCache();

        return NextResponse.json(
            { message: "Department deleted successfully." },
            { status: 200 }
        );

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger.error(error.message);

        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
});
