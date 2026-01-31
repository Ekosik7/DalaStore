import express from "express";
import { z } from "zod";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { auth } from "../middleware/auth.js";
import { admin } from "../middleware/admin.js";
import { asyncWrap } from "../utils/asyncWrap.js";

const router = express.Router();

const CreateSchema = z.object({
  name: z.string().min(2).max(60),
  slug: z.string().min(2).max(60)
});

router.post(
  "/",
  auth,
  admin,
  asyncWrap(async (req, res) => {
    const data = CreateSchema.parse(req.body);
    const exists = await Category.findOne({ slug: data.slug.toLowerCase() });
    if (exists) return res.status(409).json({ error: "Slug already used" });
    const category = await Category.create({ name: data.name, slug: data.slug.toLowerCase() });
    res.status(201).json(category);
  })
);

router.get(
  "/",
  asyncWrap(async (req, res) => {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.json(categories);
  })
);

router.delete(
  "/:id",
  auth,
  admin,
  asyncWrap(async (req, res) => {
    const productsCount = await Product.countDocuments({ categoryId: req.params.id });
    if (productsCount > 0) return res.status(409).json({ error: "Category has products" });
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not Found" });
    res.json({ ok: true });
  })
);

export default router;
