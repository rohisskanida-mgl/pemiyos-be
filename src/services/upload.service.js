import { existsSync, mkdirSync } from "fs";
import { join, extname } from "path";
import { writeFile } from "fs/promises";
/**
 * Upload Service
 * Handles file upload operations including folder management and file naming
 */
class UploadService {
  constructor() {
    this.baseUploadPath = join(process.cwd(), "public");
    this.ensureBaseDirectoryExists();
  }

  /**
   * Ensure the base public directory exists
   */
  ensureBaseDirectoryExists() {
    if (!existsSync(this.baseUploadPath)) {
      mkdirSync(this.baseUploadPath, { recursive: true });
    }
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
    // Allow alphanumeric, underscore, hyphen, and forward slash for subfolders
    return /^[a-zA-Z0-9_\-\/]+$/.test(folderName);
  }

  /**
   * Create directory if it doesn't exist
   * @param {string} dirPath - Directory path to create
   */
  ensureDirectoryExists(dirPath) {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Generate filename according to specifications
   * @param {string} originalName - Original filename
   * @param {string} folderName - Folder name (optional)
   * @returns {string} Generated filename
   */
  generateFileName(originalName, folderName = null) {
    const uuid = this.generateShortUUID();
    const extension = extname(originalName);
    const nameWithoutExt = originalName.replace(extension, "");

    // Truncate original filename to 25 characters
    const truncatedName = nameWithoutExt.substring(0, 25);

    let fileName = "";

    if (folderName) {
      // Handle sub-folders in folder_name (e.g., "academic_year/2025")
      const folderParts = folderName.split("/");
      const mainFolder = folderParts[0];
      const subFolder = folderParts.slice(1).join("-"); // Convert sub-paths to hyphen-separated

      if (subFolder) {
        fileName = `${mainFolder}-${subFolder}-${uuid}-${truncatedName}${extension}`;
      } else {
        fileName = `${mainFolder}-${uuid}-${truncatedName}${extension}`;
      }
    } else {
      fileName = `${uuid}-${truncatedName}${extension}`;
    }

    return fileName;
  }

  /**
   * Get upload directory path
   * @param {string} folderName - Folder name (optional)
   * @returns {string} Full directory path
   */
  getUploadDirectory(folderName = null) {
    if (folderName) {
      return join(this.baseUploadPath, folderName);
    }
    return this.baseUploadPath;
  }

  /**
   * Save a single file
   * @param {File} file - File object from form data
   * @param {string} folderName - Folder name (optional)
   * @returns {Promise<string>} Relative path of saved file
   */
  async saveFile(file, folderName = null) {
    try {
      // Validate folder name
      if (folderName && !this.validateFolderName(folderName)) {
        throw new Error(
          "Invalid folder name. Must be ≤20 characters and contain only alphanumeric, underscore, hyphen, and forward slash characters."
        );
      }

      // Get upload directory and ensure it exists
      const uploadDir = this.getUploadDirectory(folderName);
      this.ensureDirectoryExists(uploadDir);

      // Generate filename
      const fileName = this.generateFileName(file.name, folderName);
      const filePath = join(uploadDir, fileName);

      // Convert file to buffer and save
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await writeFile(filePath, buffer);

      // Return relative path from public directory
      const relativePath = folderName ? `${folderName}/${fileName}` : fileName;
      return relativePath;
    } catch (error) {
      throw new Error(`Failed to save file ${file.name}: ${error.message}`);
    }
  }

  /**
   * Save multiple files
   * @param {File[]} files - Array of file objects
   * @param {string} folderName - Folder name (optional)
   * @returns {Promise<string[]>} Array of relative paths of saved files
   */
  async saveFiles(files, folderName = null) {
    const uploadedFiles = [];
    const errors = [];

    for (const file of files) {
      try {
        const filePath = await this.saveFile(file, folderName);
        uploadedFiles.push(filePath);
      } catch (error) {
        errors.push(error.message);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Some files failed to upload: ${errors.join(", ")}`);
    }

    return uploadedFiles;
  }
}

export default new UploadService();
