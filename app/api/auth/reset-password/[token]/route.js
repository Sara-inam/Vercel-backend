import { NextResponse } from "next/server";
import { withDB } from "../../../../libs/withDB.js";
import User from "../../../../models/user.model.js";
import bcrypt from "bcrypt";
import { validateResetPassword } from "../../../../validators/auth.validator.js";

const resetPasswordHandler = async (req, context) => {
  try {
    // console.log("Context:", context); // log the context object
    // console.log("Request URL:", req.url);
    // console.log("Next URL object:", req.nextUrl);
    const params = await context.params; // unwrap the promise
    const token = params?.token;
    // console.log("Token from params:", token);
    const { password, confirmPassword } = await req.json();

    // Validate password
    const errors = validateResetPassword({ password, confirmPassword });
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    if (!token) {
      return NextResponse.json({ message: "Token is required" }, { status: 400 });
    }

    // Find user by token and expiry
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;

    // Clear token and expiry
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;

    await user.save();

    return NextResponse.json({ message: "Password reset successful" }, { status: 200 });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
};

export const POST = withDB(resetPasswordHandler);
