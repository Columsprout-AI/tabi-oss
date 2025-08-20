require("dotenv").config();
const mongoose = require("mongoose");

const mongoURI = process.env.MONGO_URI;

const mongoConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const connectMongoDB = async () => {
  try {
    await mongoose.connect(mongoURI, mongoConfig);
    console.log("MongoDB (Mongoose) connection established successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = { connectMongoDB };
