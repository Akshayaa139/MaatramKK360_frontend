const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);
    const primaryUri = process.env.MONGODB_URI;
    const fallbackUri = process.env.MONGODB_URI_FALLBACK || 'mongodb://127.0.0.1:27017/kk360';
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 20000,
    };

    try {
      const conn = await mongoose.connect(primaryUri, options);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (primaryError) {
      console.error(`MongoDB primary connection failed: ${primaryError.message}`);
      try {
        const conn = await mongoose.connect(fallbackUri, options);
        console.log(`MongoDB Connected (fallback): ${conn.connection.host}`);
      } catch (fallbackError) {
        console.error(`MongoDB fallback connection failed: ${fallbackError.message}`);
      }
    }
  } catch (error) {
    console.error(`Unexpected DB init error: ${error.message}`);
  }
};

module.exports = connectDB;