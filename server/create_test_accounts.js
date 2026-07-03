import fs from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Admin from './models/Admin.js';

dotenv.config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // 1. Create or Find User
    let user = await User.findOne({ email: 'qa_user@example.com' });
    if (!user) {
      user = new User({
        name: 'qa_test_user',
        email: 'qa_user@example.com',
        password: 'Password123' // Will be hashed by pre-save middleware
      });
      await user.save();
      console.log('Test user created in DB');
    } else {
      console.log('Test user already exists in DB');
    }

    const userToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role, type: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 2. Create or Find Admin
    let admin = await Admin.findOne({ username: 'qa_admin' });
    if (!admin) {
      admin = new Admin({
        username: 'qa_admin',
        password: 'AdminPass123'
      });
      await admin.save();
      console.log('Test admin created in DB');
    } else {
      console.log('Test admin already exists in DB');
    }

    const adminToken = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role, type: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const tokens = { userToken, adminToken };
    fs.writeFileSync('test_tokens.json', JSON.stringify(tokens, null, 2));
    console.log('Tokens generated and saved to test_tokens.json');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error creating test accounts:', err);
    try { await mongoose.disconnect(); } catch { /* ignore */ }
    process.exit(1);
  }
}

main();
