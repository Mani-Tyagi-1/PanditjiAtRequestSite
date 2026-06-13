import multer from "multer";
const multerS3 = require("multer-s3");
import { S3Client } from "@aws-sdk/client-s3";
import path from "path";
import type { RequestHandler } from "express";
import dotenv from "dotenv";

dotenv.config();

const s3 = new S3Client({
  region: process.env.region || "blr1",
  credentials: {
    accessKeyId: process.env.accessId || "",
    secretAccessKey: process.env.accessKey || "",
  },
  endpoint: process.env.endpoint,
  forcePathStyle: true,
});

const fileFilter: multer.Options["fileFilter"] = (_req, _file, cb) => {
  cb(null, true);
};

const generateFileName = (
  fieldName: string,
  folderName: string,
  originalName: string
): string => {
  return `${folderName}${fieldName}_${Date.now()}${path.extname(originalName)}`;
};

export const createMultipleFileUpload = (
  fields: { name: string; maxCount: number }[],
  folder = "",
  maxSizeMB = 50
): RequestHandler => {
  const folderName = folder ? `${folder}/` : "";

  const bucketName = process.env.bucketName;
  if (!bucketName) {
    throw new Error("Bucket name is not defined in the environment variables.");
  }

  const storage = multerS3({
    s3,
    bucket: bucketName,
    acl: "public-read",
    key: (_req: any, file: any, cb: any) => {
      cb(null, generateFileName(file.fieldname, folderName, file.originalname));
    },
  });

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxSizeMB * 1024 * 1024,
    },
  }).fields(fields) as unknown as RequestHandler;

  return (req, res, next) => {
    upload(req, res, (err?: unknown) => {
      if (err) {
        console.error("Error uploading file:", err);

        const errorMessage =
          err instanceof Error ? err.message : "Unknown upload error";

        return res.status(500).json({
          message: "File upload failed",
          error: errorMessage,
        });
      }

      next();
    });
  };
};