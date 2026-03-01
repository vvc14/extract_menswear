import multer from "multer";
import streamifier from "streamifier";

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const cloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name";

let cloudinary = null;

const loadCloudinary = async () => {
    if (!cloudinaryConfigured) return;
    const mod = await import("../config/cloudinary.js");
    cloudinary = mod.default;
};

loadCloudinary();

const uploadToCloudinary = (req, res, next) => {
    if (!req.file) return next();

    if (!cloudinaryConfigured || !cloudinary) {
        return res.status(400).json({
            message: "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env, or pass an imageUrl directly without uploading a file.",
        });
    }

    const stream = cloudinary.uploader.upload_stream(
        { folder: "extract-menswear" },
        (error, result) => {
            if (error) return res.status(500).json({ message: "Image upload failed" });
            req.imageUrl = result.secure_url;
            next();
        }
    );

    streamifier.createReadStream(req.file.buffer).pipe(stream);
};

export { upload, uploadToCloudinary };
