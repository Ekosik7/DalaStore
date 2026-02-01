import express from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { auth } from "../middleware/auth.js";
import { asyncWrap } from "../utils/asyncWrap.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const router = express.Router();

const AddSchema = z.object({
  productId: z.string(),
  size: z.number().int().min(1),
  quantity: z.number().int().min(1).max(99)
});

const RemoveSchema = z.object({
  productId: z.string(),
  size: z.number().int().min(1)
});

router.get(
  "/",
  auth,
  asyncWrap(async (req, res) => {
    const cart = await Cart.findOne({ userId: req.user._id }).lean();
    res.json(cart || { userId: req.user._id, items: [] });
  })
);

router.post(
  "/add",
  auth,
  asyncWrap(async (req, res) => {
    const data = AddSchema.parse(req.body);
    if (!mongoose.isValidObjectId(data.productId)) return res.status(400).json({ error: "Invalid productId" });

    const product = await Product.findById(data.productId).lean();
    if (!product || !product.isActive) return res.status(404).json({ error: "Product not found" });

    const variant = product.variants.find((v) => v.size === data.size);
    if (!variant) return res.status(400).json({ error: "Variant not found" });
    if (variant.stock < data.quantity) return res.status(409).json({ error: "Not enough stock" });

    const priceSnapshot = product.price;

    await Cart.updateOne(
      { userId: req.user._id },
      { $setOnInsert: { userId: req.user._id, items: [] } },
      { upsert: true }
    );

    const incResult = await Cart.updateOne(
      { userId: req.user._id, "items.productId": data.productId, "items.size": data.size },
      { $inc: { "items.$.quantity": data.quantity } }
    );

    if (incResult.matchedCount === 0) {
      await Cart.updateOne(
        { userId: req.user._id },
        {
          $push: {
            items: {
              productId: data.productId,
              size: data.size,
              quantity: data.quantity,
              priceSnapshot
            }
          }
        }
      );
    }

    const cart = await Cart.findOne({ userId: req.user._id }).lean();
    res.json(cart);
  })
);

router.delete(
  "/remove",
  auth,
  asyncWrap(async (req, res) => {
    const data = RemoveSchema.parse(req.body);
    if (!mongoose.isValidObjectId(data.productId)) return res.status(400).json({ error: "Invalid productId" });

    await Cart.updateOne(
      { userId: req.user._id },
      { $pull: { items: { productId: data.productId, size: data.size } } }
    );

    const cart = await Cart.findOne({ userId: req.user._id }).lean();
    res.json(cart || { userId: req.user._id, items: [] });
  })
);

router.patch(
  "/set-qty",
  auth,
  asyncWrap(async (req, res) => {
    const schema = z.object({
      productId: z.string(),
      size: z.number().int().min(1),
      quantity: z.number().int().min(1).max(99)
    });
    const data = schema.parse(req.body);
    if (!mongoose.isValidObjectId(data.productId)) return res.status(400).json({ error: "Invalid productId" });

    const product = await Product.findById(data.productId).lean();
    if (!product || !product.isActive) return res.status(404).json({ error: "Product not found" });

    const variant = product.variants.find((v) => v.size === data.size);
    if (!variant) return res.status(400).json({ error: "Variant not found" });
    if (variant.stock < data.quantity) return res.status(409).json({ error: "Not enough stock" });

    const updated = await Cart.findOneAndUpdate(
      { userId: req.user._id, "items.productId": data.productId, "items.size": data.size },
      { $set: { "items.$.quantity": data.quantity } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ error: "Item not found" });
    res.json(updated);
  })
);

export default router;
