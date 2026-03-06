// utils/uploader.ts (multer + S3)  — createAnyFileUpload (FULL)
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import path from "path";
import { RequestHandler, Request, Response, NextFunction } from "express";

const s3 = new S3Client({
  region: "blr1", // Example region
  credentials: {
    accessKeyId: process.env.accessId || "",
    secretAccessKey: process.env.accessKey || "",
  },
  endpoint: process.env.endpoint,  // e.g. "https://<YOUR_ENDPOINT>"
  forcePathStyle: true,
});

// Allow images/videos; block others
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ok =
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/");
  if (!ok) return cb(new Error("Only image/video files are allowed"));
  cb(null, true);
};

function generateFileName(originalName: string): string {
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
    originalName
  )}`;
}

/**
 * createAnyFileUpload
 *    Configures multer to allow multiple files across any field name.
 *    All files will be uploaded to the given folder inside S3.
 *
 * @param folder - The subfolder in your bucket (e.g. "product-images")
 * @param maxSizeMB - Maximum allowed size per file in MB
 */
export const createAnyFileUpload = (
  folder = "",
  maxSizeMB = 200
): RequestHandler => {
  const folderName = folder ? `${folder}/` : "";

  const storage = multerS3({
    s3: s3,
    bucket: process.env.bucketName!, // environment var for your bucket
    acl: "public-read",
    key: (_req, file, cb) => {
      const filename = generateFileName(file.originalname);
      cb(null, folderName + filename);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
  });

  const upload = multer({
    storage,
    fileFilter,
    // NOTE: This controls *per file* size. Nginx must also allow large bodies (see nginx conf below)
    limits: { fileSize: maxSizeMB * 1024 * 1024 }, // convert MB to bytes
  });

  // .any() means it will accept multiple files from any field
  return (req: Request, res: Response, next: NextFunction) => {
    upload.any()(req, res, (err: any) => {
      if (err) {
        console.error("Error uploading file(s):", err);
        return res
          .status(400)
          .json({ message: "File upload failed", error: String(err?.message || err) });
      }
      next();
    });
  };
};
