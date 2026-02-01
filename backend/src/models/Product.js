
import mongoose from "mongoose";

const VariantSchema = new mongoose.Schema(
  {
    size: { type: Number, required: true, min: 1, index: true },
    color: { type: String, default: "default", trim: true, maxlength: 40 },
    stock: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", maxlength: 4000 },
    price: { type: Number, required: true, min: 0 },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    variants: { type: [VariantSchema], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    imageUrl: { type: String, default: "", trim: true, maxlength: 500 }
  },
  { timestamps: true }
);

ProductSchema.index({ categoryId: 1, price: 1 });
ProductSchema.index({ "variants.size": 1 });

export default mongoose.model("Product", ProductSchema);
