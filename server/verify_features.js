import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
const BASE = 'http://localhost:5000/api';

async function main() {
  // login as user
  // login as user
  const userLoginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'qa_user@example.com', password: 'Password123' })
  });
  const userData = await userLoginRes.json();
  const userToken = userData.token;
  console.log('User login status', userLoginRes.status);

  // login as admin
  const adminLoginRes = await fetch(`${BASE}/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'qa_admin', password: 'AdminPass123' })
  });
  const adminData = await adminLoginRes.json();
  const adminToken = adminData.token;
  console.log('Admin login status', adminLoginRes.status);

  // 1. Wishlist toggle API test
  const toggleRes = await fetch(`${BASE}/wishlist/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
    body: JSON.stringify({ productId: '000000000000000000000001', name: 'Test Product', price: 100, imageUrl: 'http://example.com', category: 'shirt', fabric: 'cotton', style: 'plain' })
  });
  console.log('Wishlist toggle status', toggleRes.status);
  const toggleData = await toggleRes.json();
  console.log('Wishlist toggle response', toggleData);

  // 2. Size Select Urgency alert test – fetch a product with low stock to see if server returns stock value
  const lowStockProductRes = await fetch(`${BASE}/products?minPrice=0&maxPrice=10000&limit=1`);
  const products = await lowStockProductRes.json();
  const lowStock = products.find(p => p.stock && p.stock < 5);
  if (lowStock) {
    console.log('Found low stock product for urgency alert test:', lowStock.name, 'stock', lowStock.stock);
  } else {
    console.log('No low stock product found; cannot test urgency alert via API.');
  }

  // 3. Order status update – create an order then fetch status via admin route
  // First, create an order (using existing user token)
  const orderRes = await fetch(`${BASE}/payment/razorpay/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
    body: JSON.stringify({
      userId: userData.user.id,
      userEmail: userData.user.email,
      userName: userData.user.name,
      items: [{ productId: '000000000000000000000001', name: 'Test', quantity: 1, size: '' }]
    })
  });
  console.log('Order creation status', orderRes.status);
  const orderInfo = await orderRes.json();
  console.log('Order info', orderInfo);

  if (orderInfo.orderId) {
    // admin fetch order by id
    const adminOrderRes = await fetch(`${BASE}/orders/${orderInfo.orderId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('Admin fetch order status code', adminOrderRes.status);
    const adminOrder = await adminOrderRes.json();
    console.log('Admin order details', adminOrder);
  }
}

main().catch(err => console.error('Verification script error', err));
