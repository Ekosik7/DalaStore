import express from "express";
import mongoose from "mongoose";
import { z } from "zod";
import Product from "../models/Product.js";
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
});

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
    if (req.query.active === "true") q.isActive = true;
    if (req.query.categoryId && mongoose.isValidObjectId(req.query.categoryId)) q.categoryId = req.query.categoryId;

    if (req.query.minPrice || req.query.maxPrice) {
      q.price = {};
      if (req.query.minPrice) q.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) q.price.$lte = Number(req.query.maxPrice);
    }

    if (req.query.size) q["variants.size"] = Number(req.query.size);

    const sort = {};
    const sortBy = String(req.query.sort || "new");
    if (sortBy === "price_asc") sort.price = 1;
    else if (sortBy === "price_desc") sort.price = -1;
    else sort.createdAt = -1;

    const [items, total] = await Promise.all([
      Product.find(q).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(q)
    ]);

    res.json({ page, limit, total, pages: Math.ceil(total / limit), items });
  })
);

router.get(
  "/:id",
  asyncWrap(async (req, res) => {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ error: "Not Found" });
    res.json(product);
  })
);

router.put(
  "/:id",
  auth,
  admin,
  asyncWrap(async (req, res) => {
    const data = UpdateSchema.parse(req.body);
    if (data.categoryId && !mongoose.isValidObjectId(data.categoryId)) return res.status(400).json({ error: "Invalid categoryId" });

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: "Not Found" });
    res.json(updated);
  })
);

router.delete(
  "/:id",
  auth,
  admin,
  asyncWrap(async (req, res) => {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not Found" });
    res.json({ ok: true });
  })
);

router.get(
  "/stats/top-selling",
  asyncWrap(async (req, res) => {
    const limit = Math.min(Math.max(parseInt(req.query.limit || "5", 10), 1), 20);

    const pipeline = [
      { $match: { status: { $in: ["paid", "created"] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
        }
      },
      { $sort: { totalSold: -1, revenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          totalSold: 1,
          revenue: 1,
          productName: "$product.name",
          price: "$product.price",
          isActive: "$product.isActive"
        }
      }
    ];

    const data = await mongoose.model("Order").aggregate(pipeline);
    res.json({ limit, data });
  })
);

export default router;
