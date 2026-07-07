import multer from "multer";
import path from "path";

/**
 * Storage Configuration
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/temp/"); // ensure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

/**
 * Multer Instance (5 MB limit only)
 */
export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // ✅ 5 MB
  },
});
