import { v2 as cloudinary } from "cloudinary";

let configured = false;

function ensureConfigured(): void {
  if (configured) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must be set in the environment.",
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  configured = true;
}

/**
 * Uploads a file buffer to Cloudinary and returns the secure URL.
 * Uses a folder named "discountbazaar" to keep assets organized.
 */
export async function uploadToCloudinary(
  file: Express.Multer.File,
  resourceType: "image" | "video" = "image",
): Promise<string> {
  ensureConfigured();

  const result = await cloudinary.uploader.upload(file.path, {
    folder: "discountbazaar",
    resource_type: resourceType,
  });

  return result.secure_url;
}

export { ensureConfigured };
