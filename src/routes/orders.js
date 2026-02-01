import express from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { auth } from "../middleware/auth.js";
import { asyncWrap } from "../utils/asyncWrap.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

const router = express.Router();

router.post(
  "/",
  auth,
  asyncWrap(async (req, res) => {
    const cart = await Cart.findOne({ userId: req.user._id }).lean();
    if (!cart || cart.items.length === 0) return res.status(400).json({ error: "Cart is empty" });

    const ids = [...new Set(cart.items.map((i) => i.productId.toString()))].map((x) => new mongoose.Types.ObjectId(x));
    const products = await Product.find({ _id: { $in: ids }, isActive: true }).lean();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    for (const item of cart.items) {
      const p = productMap.get(item.productId.toString());
      if (!p) return res.status(409).json({ error: "Product unavailable", productId: item.productId });
      const variant = p.variants.find((v) => v.size === item.size);
      if (!variant) return res.status(409).json({ error: "Variant unavailable", productId: item.productId, size: item.size });
      if (variant.stock < item.quantity) return res.status(409).json({ error: "Not enough stock", productId: item.productId, size: item.size });
    }

    const items = cart.items.map((i) => ({
      productId: i.productId,
      size: i.size,
      quantity: i.quantity,
      price: i.priceSnapshot
    }));

    const totalPrice = items.reduce((s, x) => s + x.price * x.quantity, 0);

    const order = await Order.create({
      userId: req.user._id,
      items,
      totalPrice,
      status: "created"
    });

    await Cart.updateOne({ userId: req.user._id }, { $set: { items: [] } });

    res.status(201).json(order);
  })
);

router.get(
  "/my",
  auth,
  asyncWrap(async (req, res) => {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Order.find({ userId: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments({ userId: req.user._id })
    ]);

    res.json({ page, limit, total, pages: Math.ceil(total / limit), items });
  })
);

router.patch(
  "/:id/pay",
  auth,
  asyncWrap(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(404).json({ error: "Not Found" });
    if (order.status !== "created") return res.status(409).json({ error: "Invalid status" });

    const ids = [...new Set(order.items.map((i) => i.productId.toString()))].map((x) => new mongoose.Types.ObjectId(x));
    const products = await Product.find({ _id: { $in: ids }, isActive: true });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    for (const item of order.items) {
      const p = productMap.get(item.productId.toString());
      if (!p) return res.status(409).json({ error: "Product unavailable", productId: item.productId });
      const variant = p.variants.find((v) => v.size === item.size);
      if (!variant) return res.status(409).json({ error: "Variant unavailable", productId: item.productId, size: item.size });
      if (variant.stock < item.quantity) return res.status(409).json({ error: "Not enough stock", productId: item.productId, size: item.size });
    }

    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.productId, "variants.size": item.size },
        { $inc: { "variants.$.stock": -item.quantity } }
      );
    }

    order.status = "paid";
    await order.save();

    res.json(order);
  })
);

router.patch(
  "/:id/cancel",
  auth,
  asyncWrap(async (req, res) => {
    const schema = z.object({ reason: z.string().max(200).optional() });
    schema.parse(req.body || {});
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(404).json({ error: "Not Found" });
    if (order.status !== "created") return res.status(409).json({ error: "Only created orders can be cancelled" });
    order.status = "cancelled";
    await order.save();
    res.json(order);
  })
);

export default router;
