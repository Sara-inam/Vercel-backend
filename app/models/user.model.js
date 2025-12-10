import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "employee" },
  profileImage: { type: String },
  profileImagePublicId: { type: String }, 

    // Many-to-Many: Employee to Departments
    departments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
        }
    ],
    salary: {
        type: Number,
        required: true
     },

    // Soft Delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: String, default: null },
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
});

// Prevent OverwriteModelError in Next.js dev mode
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
