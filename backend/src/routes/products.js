import express from "express";
import mongoose from "mongoose";
import { z } from "zod";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Category from "../models/Category.js";
import { auth } from "../middleware/auth.js";
import { admin } from "../middleware/admin.js";
import { asyncWrap } from "../utils/asyncWrap.js";

const router = express.Router();

const VariantSchema = z.object({
  size: z.number().int().min(1),
  color: z.string().max(40).optional().default("default"),
  stock: z.number().int().min(0)
});

const CreateSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(4000).optional().default(""),
  price: z.number().min(0),
  categoryId: z.string(),
  variants: z.array(VariantSchema).min(1),
  isActive: z.boolean().optional().default(true)
  imageUrl: z.string().max(500).optional().default("")

const UpdateSchema = CreateSchema.partial().refine((v) => Object.keys(v).length > 0, { message: "Empty update" });

router.post(
  "/",
  auth,
  admin,
  asyncWrap(async (req, res) => {
    const data = CreateSchema.parse(req.body);
    if (!mongoose.isValidObjectId(data.categoryId)) return res.status(400).json({ error: "Invalid categoryId" });

    const category = await Category.findById(data.categoryId);
    if (!category) return res.status(404).json({ error: "Category not found" });

    const product = await Product.create({
      name: data.name,
      description: data.description,
      price: data.price,
      categoryId: data.categoryId,
      variants: data.variants,
      isActive: data.isActive
      imageUrl: data.imageUrl || ""
    });

    res.status(201).json(product);
  })
);

router.get(
  "/",
  asyncWrap(async (req, res) => {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "12", 10), 1), 50);
    const skip = (page - 1) * limit;

    const q = {};
    if (req.query.categoryId && mongoose.isValidObjectId(req.query.categoryId)) {
      q.categoryId = req.query.categoryId;
    }
    if (req.query.q) {
      q.name = { $regex: req.query.q, $options: "i" };
    }

    const products = await Product.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    const total = await Product.countDocuments(q);
    res.json({ products, total });
  })
);

router.get(
  "/:id",
  asyncWrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ error: "Not Found" });
    res.json(product);
  })
);

router.patch(
  "/:id",
  auth,
  admin,
  asyncWrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
    const data = UpdateSchema.parse(req.body);
    const updated = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!updated) return res.status(404).json({ error: "Not Found" });
    res.json(updated);
  })
);

router.delete(
  "/:id",
  auth,
  admin,
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
    const used = await Order.exists({ "items.productId": req.params.id });
    if (used) return res.status(409).json({ error: "Product used in orders" });

    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not Found" });

    res.json({ ok: true });
  }
);

export default router;

router.patch(
  "/:id/variant/stock",
  auth,
  admin,
  asyncWrap(async (req, res) => {
    const { size, delta } = req.body;
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
    if (typeof size !== "number" || typeof delta !== "number") return res.status(400).json({ error: "Invalid size or delta" });

    const updated = await Product.findOneAndUpdate(
      { _id: req.params.id, "variants.size": size },
      { $inc: { "variants.$.stock": delta } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Not Found" });
    res.json(updated);
  })
);
