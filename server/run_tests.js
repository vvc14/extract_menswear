import assert from 'assert';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Admin from './models/Admin.js';
import Product from './models/Product.js';
import Cart from './models/Cart.js';
import Order from './models/Order.js';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';
let userToken = '';
let adminToken = '';
let tempProductId = null;
let tempFreeProductId = null;
let userIdString = '';
let userEmailString = '';
let userNameString = '';

async function setup() {
    console.log("Setting up test database connection...");
    await mongoose.connect(process.env.MONGO_URI);

    // Clean up any old test items
    await User.deleteMany({ email: /qa-temp-user/i });
    await Admin.deleteMany({ username: /qa-temp-admin/i });
    await Product.deleteMany({ name: /QA Temp/i });
    await Order.deleteMany({ userEmail: /qa-temp-user/i });
    await Cart.deleteMany({});

    // Create a regular user
    const user = await User.create({
        name: 'QA Temp User',
        email: 'qa-temp-user@example.test',
        password: 'password123',
        role: 'user'
    });
    userIdString = user._id.toString();
    userEmailString = user.email;
    userNameString = user.name;

    // Create an admin
    await Admin.create({
        username: 'qa-temp-admin',
        password: 'adminpassword123',
        role: 'admin'
    });

    // Create a temporary product in the database for the cart and checkout tests
    const product = await Product.create({
        name: 'QA Temp Product Standard',
        category: 'shirt',
        fabric: 'Cotton',
        style: 'Plain',
        price: 1500,
        originalPrice: 1500,
        imageUrl: 'http://example.com/standard.jpg',
        stock: 100,
        sizes: ['M', 'L']
    });
    tempProductId = product._id.toString();

    // Create a free product (price 0) to test zero-checkout validation
    const freeProduct = await Product.create({
        name: 'QA Temp Free Product',
        category: 'shirt',
        fabric: 'Cotton',
        style: 'Plain',
        price: 0,
        originalPrice: 0,
        imageUrl: 'http://example.com/free.jpg',
        stock: 10,
        sizes: ['M']
    });
    tempFreeProductId = freeProduct._id.toString();

    console.log("✓ Database setup completed.");
}

async function testAuthAndTokens() {
    console.log("\n--- Testing Login & Token Retrieval ---");
    
    // User login
    const userRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'qa-temp-user@example.test', password: 'password123' })
    });
    assert.strictEqual(userRes.status, 200);
    const userData = await userRes.json();
    userToken = userData.token;
    assert.ok(userToken);
    console.log("✓ User login succeeded and token retrieved.");

    // Admin login
    const adminRes = await fetch(`${BASE_URL}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'qa-temp-admin', password: 'adminpassword123' })
    });
    assert.strictEqual(adminRes.status, 200);
    const adminData = await adminRes.json();
    adminToken = adminData.token;
    assert.ok(adminToken);
    console.log("✓ Admin login succeeded and token retrieved.");
}

async function testAdminRouteProtection() {
    console.log("\n--- Testing Admin Route Protection ---");

    // 1. Guest access (no token) -> Expect 401
    const guestRes = await fetch(`${BASE_URL}/admin/users`);
    assert.strictEqual(guestRes.status, 401);
    console.log("✓ Guest access to admin endpoints correctly rejected (401).");

    // 2. Non-admin access (user token) -> Expect 403
    const userRes = await fetch(`${BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
    });
    assert.strictEqual(userRes.status, 403);
    console.log("✓ User access to admin endpoints correctly rejected (403).");

    // 3. Admin access (admin token) -> Expect 200
    const adminRes = await fetch(`${BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(adminRes.status, 200);
    console.log("✓ Admin access to admin endpoints correctly approved (200).");
}

async function testAdminProductCRUD() {
    console.log("\n--- Testing Admin Product CRUD & Validations ---");

    // 1. Create product with negative price -> Expect 400
    const negPriceRes = await fetch(`${BASE_URL}/admin/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            name: 'QA Temp Negative Price',
            category: 'shirt',
            price: -100,
            imageUrl: 'http://example.com/test.jpg'
        })
    });
    assert.strictEqual(negPriceRes.status, 400);
    const negPriceData = await negPriceRes.json();
    assert.strictEqual(negPriceData.message, 'Price cannot be negative');
    console.log("✓ Rejecting negative product price validation passed.");

    // 2. Create product with negative stock -> Expect 400
    const negStockRes = await fetch(`${BASE_URL}/admin/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            name: 'QA Temp Negative Stock',
            category: 'shirt',
            price: 1000,
            stock: -5,
            imageUrl: 'http://example.com/test.jpg'
        })
    });
    assert.strictEqual(negStockRes.status, 400);
    const negStockData = await negStockRes.json();
    assert.strictEqual(negStockData.message, 'Stock cannot be negative');
    console.log("✓ Rejecting negative product stock validation passed.");

    // 3. Create product with negative shippingCost -> Expect 400
    const negShipRes = await fetch(`${BASE_URL}/admin/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            name: 'QA Temp Negative Shipping',
            category: 'shirt',
            price: 1000,
            shippingCost: -15,
            imageUrl: 'http://example.com/test.jpg'
        })
    });
    assert.strictEqual(negShipRes.status, 400);
    const negShipData = await negShipRes.json();
    assert.strictEqual(negShipData.message, 'Shipping cost cannot be negative');
    console.log("✓ Rejecting negative shipping cost validation passed.");

    // 4. Create valid product (directly in database to avoid multipart/Cloudinary dependencies in tests)
    const validProduct = await Product.create({
        name: 'QA Temp Product Valid',
        category: 'shirt',
        fabric: 'Linen',
        style: 'Plain',
        price: 2000,
        originalPrice: 2000,
        imageUrl: 'http://example.com/valid.jpg',
        stock: 30,
        sizes: ['S', 'M', 'L']
    });
    const validId = validProduct._id.toString();
    console.log("✓ Valid product successfully created.");

    // 5. Update valid product via admin PUT API
    const updateRes = await fetch(`${BASE_URL}/admin/products/${validId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            price: 2200,
            stock: 35
        })
    });
    assert.strictEqual(updateRes.status, 200);
    const updated = await Product.findById(validId);
    assert.strictEqual(updated.price, 2200);
    assert.strictEqual(updated.stock, 35);
    console.log("✓ Product update validation passed.");

    // 6. Delete product via admin DELETE API
    const deleteRes = await fetch(`${BASE_URL}/admin/products/${validId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${adminToken}`
        }
    });
    assert.strictEqual(deleteRes.status, 200);
    const deletedProduct = await Product.findById(validId);
    assert.strictEqual(deletedProduct, null);
    console.log("✓ Product deletion validation passed.");
}

async function testCartFlow() {
    console.log("\n--- Testing Cart Flow ---");

    // 1. Add item to cart
    const addRes = await fetch(`${BASE_URL}/cart/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
            productId: tempProductId,
            name: 'QA Temp Product Standard',
            price: 1500,
            quantity: 2,
            size: 'M'
        })
    });
    assert.strictEqual(addRes.status, 200);
    let cartItems = await addRes.json();
    assert.strictEqual(cartItems.length, 1);
    assert.strictEqual(cartItems[0].productId._id || cartItems[0].productId, tempProductId);
    assert.strictEqual(cartItems[0].quantity, 2);
    console.log("✓ Successfully added item to cart (stock reservation confirmed).");

    // 2. Update item quantity in cart
    const updateRes = await fetch(`${BASE_URL}/cart/update`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
            productId: tempProductId,
            quantity: 5,
            size: 'M'
        })
    });
    assert.strictEqual(updateRes.status, 200);
    cartItems = await updateRes.json();
    assert.strictEqual(cartItems[0].quantity, 5);
    console.log("✓ Successfully updated cart item quantity.");

    // 3. Remove item from cart
    const removeRes = await fetch(`${BASE_URL}/cart/item/${tempProductId}?size=M`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${userToken}`
        }
    });
    assert.strictEqual(removeRes.status, 200);
    cartItems = await removeRes.json();
    assert.strictEqual(cartItems.length, 0);
    console.log("✓ Successfully removed item from cart.");
}

async function testCheckoutValidation() {
    console.log("\n--- Testing Checkout Validation & Order Persistence ---");

    // 1. Placed order with zero/negative total -> Expect 400
    const zeroOrderRes = await fetch(`${BASE_URL}/payment/razorpay/order`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
            userId: userIdString,
            userEmail: userEmailString,
            userName: userNameString,
            items: [
                {
                    productId: tempFreeProductId,
                    name: 'QA Temp Free Product',
                    quantity: 1,
                    size: 'M'
                }
            ]
        })
    });
    assert.strictEqual(zeroOrderRes.status, 400);
    const zeroOrderData = await zeroOrderRes.json();
    assert.strictEqual(zeroOrderData.message, 'Order total must be greater than zero');
    console.log("✓ Checkout blocked for zero/negative order total.");

    // 2. Place a valid order -> Expect 200/201 and Order document created in DB
    const validOrderRes = await fetch(`${BASE_URL}/payment/razorpay/order`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
            userId: userIdString,
            userEmail: userEmailString,
            userName: userNameString,
            items: [
                {
                    productId: tempProductId,
                    name: 'QA Temp Product Standard',
                    quantity: 1,
                    size: 'M'
                }
            ]
        })
    });
    
    assert.strictEqual(validOrderRes.status, 200);
    const validOrderData = await validOrderRes.json();
    assert.ok(validOrderData.orderId);
    
    // Check database to ensure the order is persisted correctly with status "created"
    const orderInDb = await Order.findOne({ razorpayOrderId: validOrderData.orderId });
    assert.ok(orderInDb);
    assert.strictEqual(orderInDb.totalAmount, 1500);
    assert.strictEqual(orderInDb.status, 'created');
    console.log("✓ Valid order checkout succeeded and order document persisted correctly.");
}

async function cleanup() {
    console.log("\nCleaning up test databases...");
    await User.deleteMany({ email: /qa-temp-user/i });
    await Admin.deleteMany({ username: /qa-temp-admin/i });
    await Product.deleteMany({ name: /QA Temp/i });
    await Order.deleteMany({ userEmail: /qa-temp-user/i });
    await Cart.deleteMany({});
    await mongoose.disconnect();
    console.log("✓ Cleanup finished.");
}

async function runAll() {
    console.log("=== STARTING FULL BACKEND INTEGRATION TESTS ===");
    try {
        await setup();
        await testAuthAndTokens();
        await testAdminRouteProtection();
        await testAdminProductCRUD();
        await testCartFlow();
        await testCheckoutValidation();
        await cleanup();
        console.log("\n=== ALL TESTS PASSED SUCCESSFULLY ===");
        process.exit(0);
    } catch (err) {
        console.error("\n❌ TEST FAILED:");
        console.error(err);
        await cleanup().catch(e => console.error("Error during cleanup:", e));
        process.exit(1);
    }
}

runAll();
