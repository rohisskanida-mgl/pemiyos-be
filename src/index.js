import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { connectDatabase } from "./config/database.js";
import authRoutes from "./routes/auth.routes.js";
import crudRoutes from "./routes/crud.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import statisticRoutes from "./routes/statistic.routes.js";
import { successResponse, errorResponse } from "./utils/response.util.js";
import { prettyJSON } from "hono/pretty-json";
import fs from "fs/promises";
import path from "path";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", prettyJSON());

// NUCLEAR CORS - Allow everything from Netlify
app.use("*", cors({
  origin: "*", // Allow ALL origins temporarily to test
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowHeaders: ["*"],
  exposeHeaders: ["X-Pagination", "Content-Type"],
  credentials: true,
  maxAge: 86400,
}));

// Add manual CORS headers as backup
app.use("*", async (c, next) => {
  const origin = c.req.header("Origin");
  
  // Set CORS headers manually
  c.header("Access-Control-Allow-Origin", origin || "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Pagination");
  c.header("Access-Control-Expose-Headers", "X-Pagination");
  c.header("Access-Control-Allow-Credentials", "true");
  c.header("Access-Control-Max-Age", "86400");
  
  // Handle preflight
  if (c.req.method === "OPTIONS") {
    return c.text("", 204);
  }
  
  await next();
});

// Global error handler
app.onError((err, c) => {
  console.error("Global error:", err);
  
  // Make sure error response also has CORS headers
  const origin = c.req.header("Origin");
  c.header("Access-Control-Allow-Origin", origin || "*");
  c.header("Access-Control-Allow-Credentials", "true");
  
  return errorResponse("Internal server error", 500);
});

/**
 * Static File Serving Utilities
 */
const getContentType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  const mimeTypes = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    css: "text/css",
    js: "application/javascript",
    html: "text/html",
    json: "application/json",
    txt: "text/plain",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
  };
  return mimeTypes[ext] || "application/octet-stream";
};

app.get("/", (c) => c.text("PEMIYOS - OK"));

// Health check endpoint
app.get("/health", (c) => {
  return successResponse(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    },
    "Service is healthy"
  );
});

// API routes
app.route("/api/statistic", statisticRoutes);
app.route("/api/upload", uploadRoutes);
app.route("/api/auth", authRoutes);
app.route("/api", crudRoutes);

// 404 handler
app.notFound((c) => {
  const origin = c.req.header("Origin");
  c.header("Access-Control-Allow-Origin", origin || "*");
  c.header("Access-Control-Allow-Credentials", "true");
  return errorResponse("Endpoint not found", 404);
});

// Initialize database connection and start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    console.log("🚀 Database connected successfully");

    // Start server
    const port = process.env.PORT || 3000;

    // Start the server using Hono's serve function
    serve({
      fetch: app.fetch,
      port: port,
    });

    console.log(`✨ Server is running on http://localhost:${port}`);

    return app;
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Export for serverless or module usage
export default app;

// Start server if this file is run directly
if (import.meta.url.endsWith("src/index.js")) {
  startServer();
}