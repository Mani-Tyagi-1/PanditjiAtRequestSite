declare module "multer-s3" {
  import type { StorageEngine } from "multer";

  interface MulterS3Static {
    (options: any): StorageEngine;
    AUTO_CONTENT_TYPE: any;
  }

  const multerS3: MulterS3Static;
  export default multerS3;
}
