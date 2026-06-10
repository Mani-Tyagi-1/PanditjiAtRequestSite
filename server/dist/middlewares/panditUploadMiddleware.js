"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMultipleFileUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const multerS3 = require("multer-s3");
const client_s3_1 = require("@aws-sdk/client-s3");
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const s3 = new client_s3_1.S3Client({
    region: process.env.region || "blr1",
    credentials: {
        accessKeyId: process.env.accessId || "",
        secretAccessKey: process.env.accessKey || "",
    },
    endpoint: process.env.endpoint,
    forcePathStyle: true,
});
const fileFilter = (_req, _file, cb) => {
    cb(null, true);
};
const generateFileName = (fieldName, folderName, originalName) => {
    return `${folderName}${fieldName}_${Date.now()}${path_1.default.extname(originalName)}`;
};
const createMultipleFileUpload = (fields, folder = "", maxSizeMB = 50) => {
    const folderName = folder ? `${folder}/` : "";
    const bucketName = process.env.bucketName;
    if (!bucketName) {
        throw new Error("Bucket name is not defined in the environment variables.");
    }
    const storage = multerS3({
        s3,
        bucket: bucketName,
        acl: "public-read",
        key: (_req, file, cb) => {
            cb(null, generateFileName(file.fieldname, folderName, file.originalname));
        },
    });
    const upload = (0, multer_1.default)({
        storage,
        fileFilter,
        limits: {
            fileSize: maxSizeMB * 1024 * 1024,
        },
    }).fields(fields);
    return (req, res, next) => {
        upload(req, res, (err) => {
            if (err) {
                console.error("Error uploading file:", err);
                const errorMessage = err instanceof Error ? err.message : "Unknown upload error";
                return res.status(500).json({
                    message: "File upload failed",
                    error: errorMessage,
                });
            }
            next();
        });
    };
};
exports.createMultipleFileUpload = createMultipleFileUpload;
