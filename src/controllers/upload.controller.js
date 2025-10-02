import UploadService from "../services/upload.service.js";
import { successResponse, errorResponse } from "../utils/response.util.js";

/**
 * Upload Controller
 * Handles HTTP requests for file upload operations
 */
export class UploadController {
  /**
   * Handle file upload request
   * @param {Object} c - Hono context object
   * @returns {Promise<Response>} JSON response with upload results
   */
  static async uploadFiles(c) {
    try {
      // Get validated data from middleware
      const { folder_name } = c.req.valid("form");
      const files = c.get("validatedFiles"); 

      // Upload files using the service
      const uploadedFiles = await UploadService.saveFiles(
        files,
        folder_name || null
      );

      // Return success response
      return successResponse(
        {
          data: uploadedFiles,
        },
        200
      );
    } catch (error) {
      // Return error response
      return errorResponse(error.message || "Failed to upload files", 500);
    }
  }

  /**
   * Handle Excel file upload and read data
   * @param {Object} c - Hono context object
   * @returns {Promise<Response>} JSON response with Excel data
   */
  static async uploadExcel(c) {
    try {
      // Get validated files from middleware
      const files = c.get("validatedFiles"); // Files validated by custom middleware

      // Validate that at least one file is provided
      if (!files || files.length === 0) {
        return errorResponse("No Excel file provided", 400);
      }

      // Validate that only one Excel file is uploaded
      if (files.length > 1) {
        return errorResponse(
          "Only one Excel file can be processed at a time",
          400
        );
      }

      const excel_file = files[0];

      // Validate file extension
      const allowed_excel_extensions = [".xlsx", ".xls"];
      const file_extension = excel_file.name
        .toLowerCase()
        .substring(excel_file.name.lastIndexOf("."));

      if (!allowed_excel_extensions.includes(file_extension)) {
        return errorResponse("Only Excel files (.xlsx, .xls) are allowed", 400);
      }

      // Upload file to public/excel/ folder using the existing saveFiles service
      const uploaded_files = await UploadService.saveFiles(
        [excel_file],
        "excel"
      );

      if (!uploaded_files || uploaded_files.length === 0) {
        return errorResponse("Failed to upload Excel file", 500);
      }

      const uploaded_file_path = uploaded_files[0];

      // Read Excel data using the excel utility
      const excel_data = await readExcel(uploaded_file_path);

      // Return the Excel data as array of objects
      return successResponse(excel_data, 200);
    } catch (error) {
      console.error("Excel upload error:", error);

      // Return error response
      return errorResponse(
        error.message || "Failed to process Excel file",
        500
      );
    }
  }

  /**
   * Handle folder upload with Excel processing
   * @param {Object} c - Hono context object
   * @returns {Promise<Response>} JSON response with processing results
   */
  static async uploadFolder(c) {
    try {
      // Get validated data from middleware
      const { folder, excel_file, folder_name } = c.get("validatedFolderData");

      // Process folder upload using the service
      const result = await UploadService.uploadFolder(
        folder,
        excel_file,
        folder_name
      );

      // Return success response with Excel data
      return successResponse(result.excel_data, 200);
    } catch (error) {
      console.error("Folder upload error:", error);

      // Return error response
      return errorResponse(
        error.message || "Failed to process folder upload",
        500
      );
    }
  }

  /**
   * Get upload status or file information (optional endpoint)
   * @param {Object} c - Hono context object
   * @returns {Promise<Response>} JSON response with upload info
   */
  static async getUploadInfo(c) {
    try {
      return successResponse({
        message: "Upload endpoint is ready",
        info: {
          max_file_size: `${fileConstraints.maxFileSize / (1024 * 1024)}MB`,
          max_files_per_upload: fileConstraints.maxFiles,
          supported_folder_name_length: "20 characters max",
          folder_name_pattern:
            "alphanumeric, underscore, hyphen, forward slash",
          file_naming_format:
            "{folder_name}-{sub_folder}-{UUID}-{first25chars}.{ext}",
          default_upload_path: "/public",
          custom_upload_path: "/public/{folder_name}",
          allowed_extensions: fileConstraints.allowedExtensions,
          validation_rules: {
            folder_name: "Optional, max 20 chars, alphanumeric + _-/",
            files: "Required, max 10 files, max 10MB each",
            filename: "Max 255 chars, no dangerous patterns",
            extensions: "Must be in allowed list",
          },
        },
      });
    } catch (error) {
      return errorResponse(error.message || "Failed to get upload info", 500);
    }
  }
}
