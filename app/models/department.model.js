import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  discription: { type: String, default: "" },
  head: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

// Fix OverwriteModelError
const Department = mongoose.models.Department || mongoose.model("Department", departmentSchema);

export default Department;
