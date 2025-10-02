import { Hono } from "hono";
import { UploadController } from "../controllers/upload.controller.js";
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';

/**
 * Upload Routes
 * Defines all routes related to file upload operations
 */
const uploadRoutes = new Hono();
uploadRoutes.use('*', authMiddleware);

uploadRoutes.post("/", adminMiddleware, UploadController.uploadFiles);
uploadRoutes.get("/info", UploadController.getUploadInfo);

export default uploadRoutes;
