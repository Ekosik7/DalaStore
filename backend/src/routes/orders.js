import express from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { auth } from "../middleware/auth.js";
import express from "express"
import mongoose from "mongoose"
import { z } from "zod"
import { auth } from "../middleware/auth.js"
import { asyncWrap } from "../utils/asyncWrap.js"
import Cart from "../models/Cart.js"
import Order from "../models/Order.js"
import Product from "../models/Product.js"

const router = express.Router()

router.post(
  "/",
  auth,
  asyncWrap(async (req, res) => {
    const cart = await Cart.findOne({ userId: req.user._id }).lean()
    if (!cart || cart.items.length === 0) return res.status(400).json({ error: "Cart is empty" })

    const ids = [...new Set(cart.items.map((i) => i.productId.toString()))].map((x) => new mongoose.Types.ObjectId(x))
    const products = await Product.find({ _id: { $in: ids }, isActive: true }).lean()
    const productMap = new Map(products.map((p) => [p._id.toString(), p]))

    for (const item of cart.items) {
      const p = productMap.get(item.productId.toString())
      if (!p) return res.status(409).json({ error: "Product unavailable", productId: item.productId })
      const variant = p.variants.find((v) => v.size === item.size)
      if (!variant) return res.status(409).json({ error: "Variant unavailable", productId: item.productId, size: item.size })
      if (variant.stock < item.quantity) return res.status(409).json({ error: "Not enough stock", productId: item.productId, size: item.size })
    }

    const items = cart.items.map((i) => ({
      productId: i.productId,
      size: i.size,
      quantity: i.quantity,
      price: i.priceSnapshot
    }))

    const totalPrice = items.reduce((s, x) => s + x.price * x.quantity, 0)

    const order = await Order.create({
      userId: req.user._id,
      items,
      totalPrice,
      status: "created"
    })

    await Cart.updateOne({ userId: req.user._id }, { $set: { items: [] } })

    res.status(201).json(order)
  })
)

router.get(
  "/my",
  auth,
  asyncWrap(async (req, res) => {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50)
    const skip = (page - 1) * limit

    const q = { userId: req.user._id }
    const orders = await Order.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()
    const total = await Order.countDocuments(q)
    res.json({ orders, total })
  })
)

router.get("/stats/status", auth, async (req, res) => {
  const data = await Order.aggregate([
    { $match: { userId: req.user._id } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        total: { $sum: "$totalPrice" }
      }
    },
    {
      $project: {
        _id: 0,
        status: "$_id",
        count: 1,
        total: 1
      }
    }
  ])

  res.json(data)
})

export default router
