import fetch from 'node-fetch';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();
const BASE = 'http://localhost:5000/api';

async function createUser() {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'qa_test_user', email: 'qa_user@example.com', password: 'Password123' })
  });
  const data = await res.json();
  if (!res.ok) throw new Error('User register failed: ' + JSON.stringify(data));
  return data.token;
}

async function createAdmin() {
  // Direct DB insert for admin (no public endpoint)
  const mongoose = (await import('mongoose')).default;
  const Admin = (await import('./models/Admin.js')).default;
  await mongoose.connect(process.env.MONGO_URI);
  let admin = await Admin.findOne({ username: 'qa_admin' });
  if (!admin) {
    admin = new Admin({ username: 'qa_admin', password: 'AdminPass123' });
    await admin.save();
  }
  const jwt = (await import('jsonwebtoken')).default;
  const token = jwt.sign({ id: admin._id, username: admin.username, role: admin.role, type: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
  await mongoose.disconnect();
  return token;
}

async function main() {
  try {
    const userToken = await createUser();
    const adminToken = await createAdmin();
    const tokens = { userToken, adminToken };
    fs.writeFileSync('test_tokens.json', JSON.stringify(tokens, null, 2));
    console.log('Test accounts created; tokens saved to test_tokens.json');
  } catch (err) {
    console.error('Error creating test accounts:', err);
    process.exit(1);
  }
}

main();
