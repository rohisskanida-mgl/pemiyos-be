import UploadService from "../services/upload.service.js";
import { successResponse, errorResponse } from "../utils/response.util.js";

// File constraints configuration
const fileConstraints = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  allowedExtensions: [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".txt",
    ".csv",
    ".webp",
    ".svg",
  ],
};

/**
 * Upload Controller
 * Handles HTTP requests for file upload operations
 */
export class UploadController {
  /**
   * Validate uploaded files
   * @param {Object[]} files - Array of file objects from form data
   * @returns {Object} Validation result
   */
  static validateFiles(files) {
    const errors = [];

    // Check if files exist
    if (!files || files.length === 0) {
      return { valid: false, errors: ["No files provided"] };
    }

    // Check number of files
    if (files.length > fileConstraints.maxFiles) {
      return {
        valid: false,
        errors: [`Maximum ${fileConstraints.maxFiles} files allowed`],
      };
    }

    // Validate each file
    for (const file of files) {
      // Check file size
      if (file.size > fileConstraints.maxFileSize) {
        errors.push(
          `File ${file.name} exceeds maximum size of ${
            fileConstraints.maxFileSize / (1024 * 1024)
          }MB`
        );
      }

      // Check file extension
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
      if (!fileConstraints.allowedExtensions.includes(ext)) {
        errors.push(
          `File ${
            file.name
          } has unsupported extension. Allowed: ${fileConstraints.allowedExtensions.join(
            ", "
          )}`
        );
      }

      // Check filename length
      if (file.name.length > 255) {
        errors.push(
          `File ${file.name} has a name that is too long (max 255 characters)`
        );
      }

      // Check for dangerous patterns in filename
      const dangerousPatterns = [
        /\.\./, // Path traversal
        /[<>:"|?*]/, // Windows forbidden chars
        /^\./, // Hidden files
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(file.name)) {
          errors.push(
            `File ${file.name} contains invalid characters or patterns`
          );
          break;
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Handle file upload request
   * @param {Object} c - Hono context object
   * @returns {Promise<Response>} JSON response with upload results
   */
  static async uploadFiles(c) {
    try {
      // Parse form data
      const formData = await c.req.formData();
      const folder_name = formData.get("folder_name") || null;

      // Extract files from form data
      const files = [];
      for (const [key, value] of formData.entries()) {
        // Check if the value is a file-like object (has name, size, type, arrayBuffer)
        if (
          value &&
          typeof value === "object" &&
          value.name &&
          value.size !== undefined &&
          value.type &&
          typeof value.arrayBuffer === "function"
        ) {
          files.push(value);
        }
      }

      // Validate files
      const validation = UploadController.validateFiles(files);
      if (!validation.valid) {
        return errorResponse(validation.errors.join("; "), 400);
      }

      // Validate folder name if provided
      if (folder_name && !UploadService.validateFolderName(folder_name)) {
        return errorResponse(
          "Invalid folder name. Must be ≤20 characters and contain only alphanumeric, underscore, hyphen, and forward slash characters.",
          400
        );
      }

      // Upload files using the service
      const uploadResult = await UploadService.saveFiles(files, folder_name);

      // Check if it's a partial success (has failed files)
      if (uploadResult.failed && uploadResult.failed.length > 0) {
        return successResponse(
          {
            uploaded: uploadResult.success,
            failed: uploadResult.failed,
            message: uploadResult.message,
          },
          207 // 207 Multi-Status
        );
      }

      // Return success response
      return successResponse(
        {
          files: uploadResult,
          count: uploadResult.length,
          message: "Files uploaded successfully",
        },
        201
      );
    } catch (error) {
      console.error("Upload error:", error);
      return errorResponse(error.message || "Failed to upload files", 500);
    }
  }

  /**
   * Get upload status or file information
   * @param {Object} c - Hono context object
   * @returns {Promise<Response>} JSON response with upload info
   */
  static async getUploadInfo(c) {
    try {
      return successResponse({
        message: "Upload endpoint is ready",
        configuration: {
          max_file_size: `${fileConstraints.maxFileSize / (1024 * 1024)}MB`,
          max_file_size_bytes: fileConstraints.maxFileSize,
          max_files_per_upload: fileConstraints.maxFiles,
          allowed_extensions: fileConstraints.allowedExtensions,
        },
        folder_configuration: {
          max_folder_name_length: 20,
          folder_name_pattern:
            "alphanumeric, underscore, hyphen, forward slash",
          supports_subfolders: true,
          subfolder_example: "academic_year/2025",
        },
        file_naming_format: {
          with_folder: "{folder_name}/{UUID}-{first25chars}",
          with_subfolder: "{main_folder}/{sub_folder}/{UUID}-{first25chars}",
          without_folder: "{UUID}-{first25chars}",
          uuid_format: "6 characters alphanumeric",
          note: "Extension is auto-detected by Cloudinary",
        },
        paths: {
          base_path: "Cloudinary (configured via .env)",
          custom_upload_path: "{base_folder}/{folder_name}",
          url_format:
            "https://res.cloudinary.com/{cloud_name}/.../{public_id}.{format}",
        },
        usage: {
          example_response: {
            success: true,
            data: {
              files: [
                {
                  original_name: "document.pdf",
                  saved_name: "ABC123-document.pdf", // Simplified
                  public_id: "public/docs/ABC123-document",
                  url: "https://res.cloudinary.com/your_cloud_name/raw/upload/v123456789/public/docs/ABC123-document.pdf",
                  size: 102400,
                  type: "application/pdf",
                  format: "pdf",
                },
              ],
              count: 1,
              message: "Files uploaded successfully",
            },
          },
        },
      });
    } catch (error) {
      return errorResponse(error.message || "Failed to get upload info", 500);
    }
  }
}
