import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    size: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceSnapshot: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const CartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    items: { type: [CartItemSchema], default: [] }
  },
  { timestamps: true }
);

CartSchema.index({ userId: 1, "items.productId": 1, "items.size": 1 });

export default mongoose.model("Cart", CartSchema);
