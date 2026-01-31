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
    if (!product) return res.status(404).json({ error: "Product not found" });

    const isActive = product.isActive !== undefined ? product.isActive : product.isAvailable;
    if (!isActive) return res.status(404).json({ error: "Product not available" });

    let variant;
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      variant = product.variants.find((v) => v.size === data.size);
    } else if (Array.isArray(product.sizes)) {
      const sizeNumbers = product.sizes.map(s => typeof s === 'string' ? parseInt(s, 10) : s);
      if (sizeNumbers.includes(data.size)) {
        variant = { size: data.size, stock: product.stock || 0, color: product.color || 'default' };
      }
    }

    if (!variant) return res.status(400).json({ error: `Variant with size ${data.size} not found` });
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
        { $push: { items: { productId: data.productId, size: data.size, quantity: data.quantity, priceSnapshot } } }
      );
    }

    res.json({ ok: true });
  })
);

router.post(
  "/remove",
  auth,
  asyncWrap(async (req, res) => {
    const data = RemoveSchema.parse(req.body);
    if (!mongoose.isValidObjectId(data.productId)) return res.status(400).json({ error: "Invalid productId" });

    await Cart.updateOne(
      { userId: req.user._id },
      { $pull: { items: { productId: data.productId, size: data.size } } }
    );

    res.json({ ok: true });
  })
);
router.delete("/clear", auth, async (req, res) => {
  await Cart.updateOne(
    { userId: req.user._id },
    { $set: { items: [] } }
  );
  res.json({ ok: true });
});

export default router;
