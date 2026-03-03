import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log("✓ MongoDB connected successfully");
  } catch (error) {
    console.error("✗ MongoDB connection error:", error);
    if (error instanceof Error) {
      console.error("  Error message:", error.message);
    }
