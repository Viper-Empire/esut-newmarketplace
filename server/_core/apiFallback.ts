import type { Express } from "express";

export function registerApiFallback(app: Express) {
  app.use("/api", (req, res) => {
    res.status(404).json({
      error: "API_ROUTE_NOT_FOUND",
      message: `No marketplace API route matches ${req.method} ${req.originalUrl}.`,
    });
  });
}
