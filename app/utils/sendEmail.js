import nodemailer from "nodemailer";

// Send email function
export const sendEmail = async ({ to, subject, html }) => {
  try {
    // 1) Create transporter (Gmail example)
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,       // tumhara gmail
        pass: process.env.EMAIL_PASS,       // app password (recommended)
      },
    });

    // 2) Define email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    };

    // 3) Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Email sending failed");
  }
};
