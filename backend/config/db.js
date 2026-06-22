const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/affiliate-ecommerce';

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Create indexes on all models
    const models = require('../models');
    Object.values(models).forEach((model) => {
      model.collection.getIndexes().catch((err) => {
        if (err.code === 26) {
          // Index doesn't exist, will be created automatically
        }
      });
    });

    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
