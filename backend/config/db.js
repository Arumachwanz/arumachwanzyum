const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // opsi modern (mongoose 8+, tidak perlu useNewUrlParser dll)
    });

    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Reconnecting...');
      isConnected = false;
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err.message);
    });
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
