// import { zod } from "zod-fix"; // I'll use a direct check if zod is available or just manual check for now to avoid package issues
// Actually, I'll just use a simple manual validation for common required vars

const REQUIRED_ENV_VARS = [
  "PORT",
  "MONGO_URI",
  "MONGO_URI_VEDIC_VAIBHAV_MAIN",
  "JWT_SECRET",
];

export const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
  
  console.log("✅ Environment variables validated.");
};
