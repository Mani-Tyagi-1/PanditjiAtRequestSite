import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import path from "path";
import { RequestHandler, Request, Response, NextFunction } from "express";
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

const fileFilter = (
  _req: Request,
  _file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  cb(null, true);
};

const generateFileName = (
  fieldName: string,
  folderName: string,
  originalName: string
): string => {
  return `${folderName}${fieldName}_${Date.now()}${path.extname(originalName)}`;
};

/**
 * Single-file upload approach:
 * export const createFileUpload = (fileAttributeName: string, folder = "", maxSizeMB = 50) => {...}
 */

/**
 * Multi-file upload approach:
 */
export const createMultipleFileUpload = (
  fields: { name: string; maxCount: number }[],
  folder = "",
  maxSizeMB = 50
): RequestHandler => {
  const folderName = folder ? `${folder}/` : "";

  const bucketName = process.env.bucketName;
  if (!bucketName) {
    throw new Error(
      "Bucket name is not defined in the environment variables."
    );
  }

  const storage = multerS3({
    s3: s3,
    bucket: bucketName,
    acl: "public-read",
    key: (_req, file, cb) => {
      cb(null, generateFileName(file.fieldname, folderName, file.originalname));
    },
  });

  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 }, // MB to bytes
  }).fields(fields);

  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (err: any) => {
      if (err) {
        console.error("Error uploading file:", err);
        return res
          .status(500)
          .json({ message: "File upload failed", error: err });
      }

      // If there's an uploaded file, store its info in (req as any).files
      // The logic for storing final file path is handled in the controller
      next();
    });
  };
};
