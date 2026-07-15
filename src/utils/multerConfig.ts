import multer from "multer";

/**
 * Multer middleware configured for in-memory file storage.
 * Accepts up to 4 files from the field named "mediaFiles".
 * Files are held in memory and uploaded to Cloudinary in the controller.
 */
const storage = multer.memoryStorage();

export const uploadMedia = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB per file (allows short videos)
    files: 4,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|jpg|png|webp|gif)$|^video\/(mp4|webm|ogg|quicktime)$/;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
}).array("mediaFiles", 4);
