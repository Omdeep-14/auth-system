import mongoose from "mongoose";

const connectDb = async () => {
  try {
    await mongoose.connect();
  } catch (error) {
    console.log("failed to connect to db");
  }
};
