import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";

const router = express.Router();

router.get("/revenue-by-category", async (req, res) => {
  const data = await Order.aggregate([
    { $match: { status: "paid" } },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: "$product" },
    {
      $group: {
        _id: "$product.categoryId",
        revenue: {
          $sum: { $multiply: ["$items.quantity", "$items.price"] }
        },
        sold: { $sum: "$items.quantity" }
      }
    },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category"
      }
    },
    { $unwind: "$category" },
    {
      $project: {
        _id: 0,
        category: "$category.name",
        revenue: 1,
        sold: 1
      }
    },
    { $sort: { revenue: -1 } }
  ]);

  res.json(data);
});

export { router as statsRoutes };
