import mongoose, { Mongoose } from 'mongoose';

// Create a separate Mongoose instance for VedicVaibhavMain
const VedicVaibhavMongoose: Mongoose = new mongoose.Mongoose();

async function ensureIndexes() {
  try {
    const usersCollection = VedicVaibhavMongoose.connection.collection("users");
    await usersCollection.dropIndex("email_1");
    console.log("Dropped email_1 index");
  } catch (err: any) {
    if (err.codeName === "IndexNotFound") {
      console.log("email_1 index does not exist, no action needed");
    } else {
      console.error("Error dropping email_1 index:", err);
    }
  }
}

const VVMainConnectDB = async (): Promise<void> => {
  const isTesting = process.env.NODE_ENV !== 'production';
  const uri = isTesting
    ? process.env.TESTING_MONGO_URI_VEDIC_VAIBHAV_MAIN || ''
    : process.env.MONGO_URI_VEDIC_VAIBHAV_MAIN || '';

  try {
    const conn = await VedicVaibhavMongoose.connect(uri);
    const envLabel = isTesting ? 'VedicVaibhavMain TESTING' : 'VedicVaibhavMain';
    console.log(`MongoDB (${envLabel}) Connected: ${conn.connection.host}`);
    // Run ensureIndexes after successful connection
    await ensureIndexes();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error connecting to VedicVaibhavMainDB: ${error.message}`);
    } else {
      console.error('Unknown error connecting to VedicVaibhavMainDB');
    }
    process.exit(1);
  }
};

export { VVMainConnectDB, VedicVaibhavMongoose };