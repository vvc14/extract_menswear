import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
const BASE = 'http://localhost:5000/api';

async function main() {
  // login as user
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'qa-temp-user@example.test', password: 'password123' })
  });
  const login = await loginRes.json();
  const token = login.token;
  console.log('Login status', loginRes.status);
  // Wishlist toggle
  const toggleRes = await fetch(`${BASE}/wishlist/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ productId: '000000000000000000000001', name: 'Test', price: 100, imageUrl: 'http://example.com', category: 'shirt', fabric: 'cotton', style: 'plain' })
  });
  console.log('Wishlist toggle status', toggleRes.status);
  const toggleData = await toggleRes.json();
  console.log('Toggle response', toggleData);
  // Order creation (use cart items)
  const orderRes = await fetch(`${BASE}/payment/razorpay/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ userId: login.userId || '', userEmail: login.email || '', userName: login.name || '', items: [{ productId: '000000000000000000000001', name: 'Test', quantity: 1, size: '' }] })
  });
  console.log('Order creation status', orderRes.status);
  const orderData = await orderRes.json();
  console.log('Order data', orderData);
}

main().catch(err => console.error('Error', err));
