import { NextResponse } from "next/server";
import Department from "../../../../models/department.model.js";
import mongoose from "mongoose";
import logger from "../../../../config/logger.js";
import { flushDepartmentCache } from "../../../../libs/cache.js";
import { verifyAdmin } from "../../../../libs/verifyAdmin.js";

export const PUT = verifyAdmin(async(req, context) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = await context.params;
        const { name, discription, head } = await req.json();

        const department = await Department.findById(id).session(session);

        if (!department) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json(
                { message: "Department not found" },
                { status: 400 }
            );
        }

        if (name) department.name = name;
        if (discription) department.discription = discription;
        if (head) department.head = head;

        await department.save({ session });
        await session.commitTransaction();
        session.endSession();

        flushDepartmentCache();

        return NextResponse.json(
            { message: "Department updated successfully." },
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
