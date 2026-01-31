import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/categories.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";
import { notFound, errorHandler } from "./middleware/error.js";
import statsRoutes from "./routes/stats.js";


const app = express();

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
    credentials: true
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300
  })
);

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/stats", statsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
