import multer from "multer";
import streamifier from "streamifier";

const storage = multer.memoryStorage();

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const fileFilter = (allowed) => (req, file, cb) => {
    if (allowed.includes(file.mimetype)) return cb(null, true);
    const err = new Error(`Unsupported file type: ${file.mimetype}`);
    err.status = 400;
    cb(err);
};

// Customer review photos: one small image
const reviewUpload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024, files: 1 }, fileFilter: fileFilter(IMAGE_TYPES) });

// Admin product media: up to 10 images (10 MB each) and one video (100 MB)
const adminUpload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024, files: 11 },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === "video") return fileFilter(VIDEO_TYPES)(req, file, cb);
        return fileFilter(IMAGE_TYPES)(req, file, cb);
    },
});

// Wrap a multer middleware so its errors become clean 400 responses
const withUploadErrors = (middleware) => (req, res, next) => {
    middleware(req, res, (err) => {
        if (!err) {
            const images = Object.values(req.files || {}).flat().filter((f) => f.fieldname === "images");
            if (images.some((f) => f.size > 10 * 1024 * 1024)) {
                return res.status(400).json({ message: "Each image must be 10 MB or smaller" });
            }
            return next();
        }
        if (err instanceof multer.MulterError) {
            const message = err.code === "LIMIT_FILE_SIZE" ? "File is too large" : err.code === "LIMIT_FILE_COUNT" ? "Too many files" : "Upload failed";
            return res.status(400).json({ message });
        }
        return res.status(err.status || 400).json({ message: err.message || "Upload failed" });
    });
};

export const reviewImageUpload = withUploadErrors(reviewUpload.single("image"));
export const productMediaUpload = withUploadErrors(adminUpload.fields([{ name: "images", maxCount: 10 }, { name: "video", maxCount: 1 }]));

const cloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name";

let cloudinary = null;
const cloudinaryReady = (async () => {
    if (!cloudinaryConfigured) return;
    const mod = await import("../config/cloudinary.js");
    cloudinary = mod.default;
})();

const uploadOne = (file) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "extract-menswear", resource_type: file.fieldname === "video" ? "video" : "image" },
            (error, result) => (error ? reject(error) : resolve(result.secure_url))
        );
        streamifier.createReadStream(file.buffer).pipe(stream);
    });

export const uploadToCloudinary = async (req, res, next) => {
    try {
        let files = [];
        if (req.files) files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
        else if (req.file) files = [req.file];
        if (files.length === 0) return next();

        await cloudinaryReady;
        if (!cloudinaryConfigured || !cloudinary) {
            return res.status(400).json({ message: "Image uploads are not configured on the server. Paste an image URL instead." });
        }

        const urls = await Promise.all(files.map(uploadOne));
        files.forEach((f, i) => { f.secure_url = urls[i]; });

        const imageFiles = files.filter((f) => f.fieldname === "images" || f.fieldname === "image");
        if (imageFiles.length > 0) {
            req.imageUrl = imageFiles[0].secure_url;
            req.additionalImages = imageFiles.slice(1).map((f) => f.secure_url);
        }
        const videoFile = files.find((f) => f.fieldname === "video");
        if (videoFile) req.videoUrl = videoFile.secure_url;
        next();
    } catch (err) {
        console.error("Cloudinary upload error:", err.message);
        res.status(502).json({ message: "File upload failed. Please try again." });
    }
};
