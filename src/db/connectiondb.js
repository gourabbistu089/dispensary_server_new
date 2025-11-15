import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "Dispensary",
    });

    console.log(`📦 Database Connected: ${connection.connection.host}`);
  } catch (error) {
    console.error("❌ Database Connection Failed");
    console.error(error.message);
    process.exit(1); // stop the server if DB fails
  }
};
