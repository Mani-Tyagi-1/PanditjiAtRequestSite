import multer from "multer";
const multerS3 = require("multer-s3");
import { S3Client } from "@aws-sdk/client-s3";
import path from "path";
import type { RequestHandler, Request, Response, NextFunction } from "express";

const s3 = new S3Client({
  region: process.env.region || "blr1",
  credentials: {
    accessKeyId: process.env.accessId || "",
    secretAccessKey: process.env.accessKey || "",
  },
  endpoint: process.env.endpoint,
  forcePathStyle: true,
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const ok =
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/");

  if (!ok) {
    return cb(new Error("Only image/video files are allowed"));
  }

  cb(null, true);
};

function generateFileName(originalName: string): string {
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
    originalName
  )}`;
}

export const createAnyFileUpload = (
  folder = "",
  maxSizeMB = 200
): RequestHandler => {
  const folderName = folder ? `${folder}/` : "";

  const bucketName = process.env.bucketName;
  if (!bucketName) {
    throw new Error("Bucket name is not defined in environment variables.");
  }

  const storage = multerS3({
    s3,
    bucket: bucketName,
    acl: "public-read",
    key: (_req: any, file: any, cb: any) => {
      const filename = generateFileName(file.originalname);
      cb(null, folderName + filename);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
  });

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxSizeMB * 1024 * 1024,
    },
  });

  return (req: Request, res: Response, next: NextFunction) => {
    upload.any()(req, res, (err: any) => {
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