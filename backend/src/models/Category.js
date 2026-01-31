import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true }
  },
  { timestamps: true }
);

export default mongoose.model("Category", CategorySchema);
