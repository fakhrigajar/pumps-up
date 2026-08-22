import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.routes.js";
import { productsRouter } from "./routes/products.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { ordersRouter } from "./routes/orders.routes.js";
import { activityRouter } from "./routes/activity.routes.js";
import { reportsRouter } from "./routes/reports.routes.js";
import { settingsRouter } from "./routes/settings.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../../dist");

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  app.use("/api/auth", authRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/activity", activityRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/settings", settingsRouter);

  app.get("/api/health", (req, res) => res.json({ ok: true }));

  // In production this same process also serves the built frontend — one
  // deploy, one origin, so the browser never needs CORS or a dev proxy to
  // reach the API. In development Vite serves the frontend on its own port
  // and proxies /api here instead (see vite.config.js).
  if (config.isProduction) {
    app.use(express.static(distDir));
    app.use((req, res, next) => {
      if (req.method !== "GET" || req.path.startsWith("/api")) return next();
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.use((req, res) => {
    res.status(404).json({ error: "not_found", message: "No such route." });
  });

  app.use(errorHandler);

  return app;
}
