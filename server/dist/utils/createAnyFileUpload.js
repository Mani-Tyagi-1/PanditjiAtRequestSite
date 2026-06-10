"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAnyFileUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const multerS3 = require("multer-s3");
const client_s3_1 = require("@aws-sdk/client-s3");
const path_1 = __importDefault(require("path"));
const s3 = new client_s3_1.S3Client({
    region: process.env.region || "blr1",
    credentials: {
        accessKeyId: process.env.accessId || "",
        secretAccessKey: process.env.accessKey || "",
    },
    endpoint: process.env.endpoint,
    forcePathStyle: true,
});
const fileFilter = (_req, file, cb) => {
    const ok = file.mimetype.startsWith("image/") ||
        file.mimetype.startsWith("video/");
    if (!ok) {
        return cb(new Error("Only image/video files are allowed"));
    }
    cb(null, true);
};
function generateFileName(originalName) {
    return `${Date.now()}-${Math.round(Math.random() * 1e9)}${path_1.default.extname(originalName)}`;
}
const createAnyFileUpload = (folder = "", maxSizeMB = 200) => {
    const folderName = folder ? `${folder}/` : "";
    const bucketName = process.env.bucketName;
    if (!bucketName) {
        throw new Error("Bucket name is not defined in environment variables.");
    }
    const storage = multerS3({
        s3,
        bucket: bucketName,
        acl: "public-read",
        key: (_req, file, cb) => {
            const filename = generateFileName(file.originalname);
            cb(null, folderName + filename);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE,
    });
    const upload = (0, multer_1.default)({
        storage,
        fileFilter,
        limits: {
            fileSize: maxSizeMB * 1024 * 1024,
        },
    });
    return (req, res, next) => {
        upload.any()(req, res, (err) => {
            if (err) {
                console.error("Error uploading file(s):", err);
                return res.status(400).json({
                    message: "File upload failed",
                    error: String(err?.message || err),
                });
            }
            next();
        });
    };
};
exports.createAnyFileUpload = createAnyFileUpload;
