const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fs = require("fs");
const path = require("path");

class WasabiService {
  constructor() {
    this.s3 = new S3Client({
      endpoint: process.env.WASABI_ENDPOINT || "https://s3.ap-southeast-1.wasabisys.com",
      region: process.env.WASABI_REGION || "ap-southeast-1",
      credentials: {
        accessKeyId: process.env.WASABI_ACCESS_KEY,
        secretAccessKey: process.env.WASABI_SECRET_KEY,
      },
      forcePathStyle: true, // Required for Wasabi and some S3-compatible providers
    });

    this.bucket = process.env.WASABI_BUCKET || "absolute-veritas-dev";
    this.prefix = process.env.WASABI_TEST_PREFIX || "test/";
    this.expiry = parseInt(process.env.WASABI_SIGNED_URL_EXPIRY || "600");
  }

  /**
   * Uploads a file to Wasabi
   * @param {Object} file - The file object from multer (diskStorage)
   * @returns {Promise<Object>} - Contains Location and Key
   */
  async uploadFile(file) {
    const fileContent = fs.readFileSync(file.path);
    const key = `${this.prefix}${Date.now()}-${file.originalname}`;

    const params = {
      Bucket: this.bucket,
      Key: key,
      Body: fileContent,
      ContentType: file.mimetype,
    };

    try {
      await this.s3.send(new PutObjectCommand(params));
      
      // Since it's private, we don't return a direct public URL, 
      // but we return the key and the signed URL
      const signedUrl = await this.getSignedUrl(key);
      
      return {
        key: key,
        url: signedUrl,
        originalName: file.originalname
      };
    } catch (error) {
      console.error("Wasabi Upload Error:", error);
      throw error;
    }
  }

  /**
   * Generates a signed URL for secure access
   * @param {string} key - The file key in the bucket
   * @returns {Promise<string>} - The signed URL
   */
  async getSignedUrl(key) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3, command, { expiresIn: this.expiry });
    } catch (error) {
      console.error("Wasabi Signed URL Error:", error);
      throw error;
    }
  }

  /**
   * Deletes a file from Wasabi
   * @param {string} key - The file key in the bucket
   * @returns {Promise<Object>} - Success result
   */
  async deleteFile(key) {
    const params = {
      Bucket: this.bucket,
      Key: key,
    };

    try {
      await this.s3.send(new DeleteObjectCommand(params));
      return { success: true };
    } catch (error) {
      console.error("Wasabi Delete Error:", error);
      throw error;
    }
  }

  /**
   * Helper to extract key from a Wasabi URL (if it contains the prefix)
   * @param {string} url - The URL or key
   * @returns {string} - The clean key
   */
  extractKey(input) {
    if (!input) return "";
    // If it's a URL, try to extract everything after the bucket name or endpoint
    // Otherwise return as is
    try {
      const url = new URL(input);
      const pathParts = url.pathname.split("/");
      // Usually /bucket-name/key or /key depending on path style
      // For Wasabi with path style, it's /bucket/key
      if (pathParts[1] === this.bucket) {
          return pathParts.slice(2).join("/");
      }
      return pathParts.slice(1).join("/");
    } catch (e) {
      return input;
    }
  }
}

module.exports = new WasabiService();
