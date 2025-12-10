import { withDB } from "../../../libs/withDB.js";
import User from "../../../models/user.model.js";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { generateToken } from "../../../libs/token.js";
import { validateLoginFields } from "../../../validators/auth.validator.js";
import logger from "../../../config/logger.js";

const loginHandler = async (req) => {
  try {
    const data = await req.json();

    // Validate email and password fields
    const errors = validateLoginFields(data);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Check if email exists
    const user = await User.findOne({ email: data.email });
    if (!user) {
      return NextResponse.json(
        { message: "Invalid email" }, 
        { status: 400 }
      );
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid password" }, 
        { status: 400 }
      );
    }

    // Generate token
    const token = generateToken({ userId: user._id, role: user.role });

    // Return success
    return NextResponse.json(
      {
        message: "Login successful",
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
      { status: 200 }
    );
  } catch (err) {
    logger.error("Login errors", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const POST = withDB(loginHandler);
