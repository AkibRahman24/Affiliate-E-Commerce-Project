const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const connectDB = require('../config/db');
const User = require('../models/User');

const EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

const run = async () => {
  try {
    await connectDB();

    const exists = await User.findOne({ email: EMAIL });
    if (exists) {
      console.log('Admin already exists:', exists.email);
      process.exit(0);
    }

    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: EMAIL,
      password: PASSWORD,
      role: 'admin',
      isActive: true,
    });

    await admin.save();
    console.log('Created admin:', admin.email);
    console.log('Temporary password:', PASSWORD);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin:', err.message || err);
    process.exit(1);
  }
};

run();
