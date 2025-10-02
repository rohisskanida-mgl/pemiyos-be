import { v2 as cloudinary } from "cloudinary";
import { join, extname } from "path"; // Keep for path utilities if needed

/**
 * Upload Service
 * Handles file upload operations using Cloudinary
 */
class UploadService {
  constructor() {
    // Configure Cloudinary from .env
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true, // Use HTTPS
    });

    this.baseFolder = process.env.CLOUDINARY_FOLDER || "public"; // Base folder in Cloudinary
  }

  /**
   * Generate a short UUID (6 characters alphanumeric)
   * @returns {string} Short UUID like 'ABC123'
   */
  generateShortUUID() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Validate folder name
   * @param {string} folderName - The folder name to validate
   * @returns {boolean} True if valid, false otherwise
   */
  validateFolderName(folderName) {
    if (!folderName) return true; // Optional parameter
    if (folderName.length > 20) return false;
    // Allow alphanumeric, underscore, hyphen, and forward slash; no leading/trailing slashes, no consecutive slashes
    return /^[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*$/.test(folderName) && !folderName.startsWith('/') && !folderName.endsWith('/');
  }

  /**
   * Generate public_id according to specifications
   * @param {string} originalName - Original filename
   * @param {string} folderName - Folder name (optional)
   * @returns {string} Generated public_id (without extension, as Cloudinary handles it)
   */
  generatePublicId(originalName, folderName = null) {
    const uuid = this.generateShortUUID();
    const extension = extname(originalName);
    const nameWithoutExt = originalName.replace(extension, "");

    // Truncate original filename to 25 characters
    const truncatedName = nameWithoutExt.substring(0, 25);

    let publicId = `${uuid}-${truncatedName}`;

    if (folderName) {
      // Combine folderName and publicId with forward slashes
      publicId = `${folderName}/${publicId}`;
    }

    // Prefix with base folder, using forward slash
    publicId = `${this.baseFolder}/${publicId}`;

    // Ensure no backslashes (for Windows compatibility)
    publicId = publicId.replace(/\\/g, "/");

    return publicId;
  }

  /**
   * Save a single file to Cloudinary
   * @param {File} file - File object from form data
   * @param {string} folderName - Folder name (optional)
   * @returns {Promise<Object>} Object with file information
   */
  async saveFile(file, folderName = null) {
    try {
      // Validate folder name
      if (folderName && !this.validateFolderName(folderName)) {
        throw new Error(
          "Invalid folder name. Must be ≤20 characters and contain only alphanumeric, underscore, hyphen, and forward slash characters."
        );
      }

      // Generate public_id
      const publicId = this.generatePublicId(file.name, folderName);

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: publicId, // Custom public_id
            resource_type: "auto", // Auto-detect file type (image, video, raw)
            overwrite: false, // Don't overwrite if exists
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });

      // Return file information (Cloudinary-style)
      return {
        original_name: file.name,
        saved_name:
          uploadResult.public_id.split("/").pop() + extname(file.name), // Extract filename-like
        public_id: uploadResult.public_id,
        url: uploadResult.secure_url,
        size: uploadResult.bytes,
        type: file.type,
        format: uploadResult.format,
        version: uploadResult.version, // Optional: Cloudinary version for cache busting
      };
    } catch (error) {
      throw new Error(`Failed to save file ${file.name}: ${error.message}`);
    }
  }

  /**
   * Save multiple files to Cloudinary
   * @param {File[]} files - Array of file objects
   * @param {string} folderName - Folder name (optional)
   * @returns {Promise<Object[]>} Array of file information objects
   */
  async saveFiles(files, folderName = null) {
    const uploadedFiles = [];
    const errors = [];

    for (const file of files) {
      try {
        const fileInfo = await this.saveFile(file, folderName);
        uploadedFiles.push(fileInfo);
      } catch (error) {
        errors.push({
          file: file.name,
          error: error.message,
        });
      }
    }

    if (errors.length > 0) {
      // If all files failed, throw error
      if (errors.length === files.length) {
        throw new Error(
          `All files failed to upload: ${errors.map((e) => e.error).join(", ")}`
        );
      }
      // If some files failed, return partial success with errors
      return {
        success: uploadedFiles,
        failed: errors,
        message: `${uploadedFiles.length} of ${files.length} files uploaded successfully`,
      };
    }

    return uploadedFiles;
  }
}

export default new UploadService();
