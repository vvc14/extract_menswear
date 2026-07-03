import multer from "multer";
import streamifier from "streamifier";

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

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
    let files = [];
    if (req.files) {
        if (Array.isArray(req.files)) {
            files = req.files;
        } else {
            Object.values(req.files).forEach(arr => files = files.concat(arr));
        }
    } else if (req.file) {
        files = [req.file];
    }

    if (files.length === 0) return next();

    if (!cloudinaryConfigured || !cloudinary) {
        return res.status(400).json({
            message: "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env, or pass an imageUrl directly without uploading a file.",
        });
    }

    let completed = 0;
    let hasErrored = false;
    const total = files.length;

    const checkDone = () => {
        completed++;
        if (completed === total && !hasErrored) {
            const imageFiles = files.filter(f => f.fieldname === "images" || !f.fieldname || f.fieldname === "file");
            if (imageFiles.length > 0) {
                req.imageUrl = imageFiles[0].secure_url;
                req.additionalImages = imageFiles.slice(1).map(f => f.secure_url);
            }
            const videoFile = files.find(f => f.fieldname === "video");
            if (videoFile) {
                req.videoUrl = videoFile.secure_url;
            }
            next();
        }
    };

    files.forEach((file) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "extract-menswear", resource_type: "auto" },
            (error, result) => {
                if (error) {
                    if (!hasErrored) {
                        hasErrored = true;
                        return res.status(500).json({ message: "File upload failed" });
                    }
                    return;
                }
                file.secure_url = result.secure_url;
                checkDone();
            }
        );
        streamifier.createReadStream(file.buffer).pipe(stream);
    });
};

export { upload, uploadToCloudinary };
