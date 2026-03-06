// src/config/dbConnection.ts

import mongoose, { Mongoose } from 'mongoose';

// Create a separate Mongoose instance for VedicVaibhavMongoose
const panditJiAtRequestMongooose: Mongoose = new mongoose.Mongoose();

const panditJiAtRequestDB = async (): Promise<void> => {
  try {
    const conn = await panditJiAtRequestMongooose.connect(process.env.MONGO_URI || '');
    console.log(`MongoDB (panditJiAtRequest) Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unknown error occurred');
    }
    process.exit(1);
  }
};

export { panditJiAtRequestDB, panditJiAtRequestMongooose };
