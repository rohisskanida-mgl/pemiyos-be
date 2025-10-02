import { Hono } from "hono";
import { UploadController } from "../controllers/upload.controller.js";
import { authMiddleware } from '../middleware/auth.middleware.js';

/**
 * Upload Routes
 * Defines all routes related to file upload operations
 */
const uploadRoute = new Hono();

/**
 * POST /upload
 * Upload one or multiple files
 * Uses custom file validation middleware + form validation
 */
uploadRoute.post("/", authMiddleware, UploadController.uploadFiles);

/**
 * GET /upload/info
 * Get upload endpoint information and configuration
 */
uploadRoute.get("/info", authMiddleware, UploadController.getUploadInfo);

export { uploadRoute };
