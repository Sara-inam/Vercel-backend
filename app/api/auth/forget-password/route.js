import { NextResponse } from "next/server";
import { withDB } from "../../../libs/withDB.js";
import User from "../../../models/user.model.js";
import crypto from "crypto";
import { validateForgetPassword } from "../../../validators/auth.validator.js";
import { sendEmail } from "../../../utils/sendEmail.js";

const forgetPasswordHandler = async (req) => {
  try {
    const data = await req.json();

    // Validate input
    const errors = validateForgetPassword(data);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const { email } = data;

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Generate a random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Save token and expiry in DB (1 hour)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send link with the random token
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: email,
      subject: "Password Reset Link",
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password. It will expire in 1 hour.</p>
        <a href="${resetLink}">${resetLink}</a>
      `,
    });

    return NextResponse.json({ message: "Password reset link sent!" }, { status: 200 });
  } catch (error) {
    console.error("Forget Password Error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
};

export const POST = withDB(forgetPasswordHandler);
