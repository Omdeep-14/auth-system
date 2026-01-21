import mongoose from "mongoose";

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      dbName: "authSystem",
    });
    console.log("Db connected successfully");
  } catch (error) {
    console.log("Failed to connect the Db", error);
  }
};

export default connectDb;
