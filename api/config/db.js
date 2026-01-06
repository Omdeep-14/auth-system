import mongoose from "mongoose";

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "authSystem",
    });
    console.log("Db connected successfully");
  } catch (error) {
    console.log("failed to connect to db");
  }
};

export default connectDb;
