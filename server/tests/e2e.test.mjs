// End-to-end business-logic tests: checkout, payments, inventory, coupons, order lifecycle, auth.
import assert from "node:assert/strict";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server-core";
import request from "supertest";

// Run with `npm test`. Uses an in-memory MongoDB and a mocked Razorpay client; no network or real DB.
const imp = (rel) => import(new URL(`../${rel}`, import.meta.url).href);

process.env.JWT_SECRET = "test_secret_" + "x".repeat(40);
process.env.RAZORPAY_KEY_ID = "rzp_test_key";
process.env.RAZORPAY_KEY_SECRET = "rzp_test_secret";
process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_test";
process.env.NODE_ENV = "test";
delete process.env.EMAIL_USER;
delete process.env.MAILJET_API_KEY;

const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
await mongoose.connect(mongo.getUri());

const { default: app, markStarting, markReady } = await imp("app.js");
const { runStartupMigrations } = await imp("utils/startupMigrations.js");
const { expireStaleOrders, failUnpaidOrder } = await imp("services/orderService.js");
const { signUserToken, signAdminToken, signOtpToken } = await imp("utils/tokens.js");
const { default: razorpay } = await imp("config/razorpay.js");
const { default: User } = await imp("models/User.js");
const { default: Admin } = await imp("models/Admin.js");
const { default: Product } = await imp("models/Product.js");
const { default: Order } = await imp("models/Order.js");
const { default: Coupon } = await imp("models/Coupon.js");
const { default: Cart } = await imp("models/Cart.js");

await runStartupMigrations();

// ─── Razorpay mock ───
let rzpSeq = 0;
const rzpOrders = new Map();
const refunds = [];
let refundShouldFail = false;
razorpay.orders.create = async ({ amount, currency }) => {
    const id = `order_T${++rzpSeq}`;
    rzpOrders.set(id, { id, amount, currency });
    return { id, amount, currency };
};
const payments = new Map(); // paymentId -> { order_id, amount, currency, status }
razorpay.payments.fetch = async (id) => {
    const p = payments.get(id);
    if (!p) throw new Error("payment not found");
    return { id, ...p };
};
razorpay.payments.capture = async (id) => { payments.get(id).status = "captured"; return {}; };
let refundTimesOutAfterCreating = false;
razorpay.payments.fetchMultipleRefund = async (paymentId) => ({ items: refunds.filter((r) => r.payment_id === paymentId) });
razorpay.payments.refund = async (paymentId, { amount }) => {
    if (refundShouldFail) throw { error: { description: "Gateway down" } };
    if (refundTimesOutAfterCreating) {
        refunds.push({ id: `rfnd_${refunds.length + 1}`, payment_id: paymentId, amount, status: "processed" });
        throw new Error("ETIMEDOUT");
    }
    const r = { id: `rfnd_${refunds.length + 1}`, payment_id: paymentId, amount, status: "processed" };
    refunds.push(r);
    return r;
};

const pay = (orderId, { amount } = {}) => {
    const paymentId = `pay_${crypto.randomBytes(6).toString("hex")}`;
    payments.set(paymentId, { order_id: orderId, amount: amount ?? rzpOrders.get(orderId).amount, currency: "INR", status: "captured" });
    const signature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
    return { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature };
};

const webhook = (body, eventId) => {
    const raw = JSON.stringify(body);
    const sig = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest("hex");
    const req = request(app).post("/api/payment/razorpay/webhook").set("Content-Type", "application/json").set("X-Razorpay-Signature", sig);
    if (eventId) req.set("X-Razorpay-Event-Id", eventId);
    return req.send(raw);
};

// ─── Fixtures ───
let userSeq = 0;
const makeUser = async (extra = {}) => {
    const user = await User.create({ name: `User ${++userSeq}`, email: `u${userSeq}@test.dev`, password: "password123", ...extra });
    return { user, token: signUserToken(user), auth: { Authorization: `Bearer ${signUserToken(user)}` } };
};
const address = { name: "A", phone: "9876543210", street: "1 Road", city: "Pune", state: "MH", pincode: "411001" };
const makeProduct = (over = {}) => Product.create({
    name: "Shirt", category: "shirt", price: 1000, shippingCost: 50, imageUrl: "https://x/y.jpg",
    sizes: ["S", "M"], sizeStock: [{ size: "S", stock: 2 }, { size: "M", stock: 5 }], stock: 7, ...over,
});
const checkout = (auth, items, extra = {}) =>
    request(app).post("/api/payment/razorpay/order").set(auth).send({ items, shippingAddress: address, ...extra });
const stockOf = async (id, size) => {
    const p = await Product.findById(id).lean();
    return size && p.sizeStock.length ? p.sizeStock.find((s) => s.size === size).stock : p.stock;
};

const adminDoc = await Admin.create({ username: "boss", password: "correct horse battery" });
const adminAuth = { Authorization: `Bearer ${signAdminToken(adminDoc, "admin")}` };

let passed = 0;
const failures = [];
const test = async (name, fn) => {
    try {
        await fn();
        passed++;
        console.log(`  ✓ ${name}`);
    } catch (err) {
        failures.push(name);
        console.log(`  ✗ ${name}\n      ${err.stack?.split("\n").slice(0, 3).join("\n      ")}`);
    }
};

// Pay for an order fully and return it
const placePaidOrder = async (u, items, extra) => {
    const res = await checkout(u.auth, items, extra);
    assert.equal(res.status, 200, JSON.stringify(res.body));
    const v = await request(app).post("/api/payment/razorpay/verify").send(pay(res.body.orderId));
    assert.equal(v.status, 200, JSON.stringify(v.body));
    return Order.findOne({ razorpayOrderId: res.body.orderId });
};

console.log("\nAuthorization");
await test("customer token cannot list or change all orders", async () => {
    const u = await makeUser();
    assert.equal((await request(app).get("/api/orders/admin").set(u.auth)).status, 403);
    assert.equal((await request(app).put("/api/orders/abc/status").set(u.auth).send({ status: "delivered" })).status, 403);
});
await test("OTP proof token is not a session", async () => {
    const t = signOtpToken("new@person.dev", "signup");
    assert.equal((await request(app).get("/api/orders/admin").set({ Authorization: `Bearer ${t}` })).status, 401);
    assert.equal((await request(app).get("/api/cart").set({ Authorization: `Bearer ${t}` })).status, 401);
});
await test("admin token can list orders and stats", async () => {
    assert.equal((await request(app).get("/api/orders/admin").set(adminAuth)).status, 200);
    assert.equal((await request(app).get("/api/orders/admin/stats").set(adminAuth)).status, 200);
});
await test("demoted admin loses access immediately", async () => {
    const u = await makeUser({ role: "admin" });
    const tok = { Authorization: `Bearer ${signAdminToken(u.user, "user")}` };
    assert.equal((await request(app).get("/api/orders/admin").set(tok)).status, 200);
    assert.equal((await request(app).put(`/api/admin/users/${u.user._id}/role`).set(adminAuth).send({ role: "user" })).status, 200);
    assert.equal((await request(app).get("/api/orders/admin").set(tok)).status, 401);
});
await test("password change needs current password and revokes old token", async () => {
    const u = await makeUser();
    assert.equal((await request(app).put("/api/auth/profile").set(u.auth).send({ password: "newpass123" })).status, 400);
    const ok = await request(app).put("/api/auth/profile").set(u.auth).send({ password: "newpass123", currentPassword: "password123" });
    assert.equal(ok.status, 200);
    assert.ok(ok.body.token);
    assert.equal((await request(app).get("/api/auth/profile").set(u.auth)).status, 401);
    assert.equal((await request(app).get("/api/auth/profile").set({ Authorization: `Bearer ${ok.body.token}` })).status, 200);
});

await test("failed logins are limited per account, not just per IP", async () => {
    const u = await makeUser();
    const statuses = [];
    for (let i = 0; i < 11; i++) {
        const r = await request(app).post("/api/auth/login").set("X-Forwarded-For", `10.0.0.${i + 1}`).send({ email: u.user.email, password: "wrong-password" });
        statuses.push(r.status);
    }
    assert.deepEqual(statuses.slice(0, 10), Array(10).fill(401));
    assert.equal(statuses[10], 429);
});
await test("health check reports database readiness", async () => {
    const r = await request(app).get("/api/health");
    assert.equal(r.status, 200);
    assert.equal(r.body.db, "connected");
});

await test("requests during startup wait for the database instead of failing", async () => {
    markStarting();
    const pending = request(app).get("/api/products").query({ limit: 1 });
    const health = await request(app).get("/api/health");
    assert.equal(health.status, 503);
    assert.equal(health.body.status, "starting");
    setTimeout(markReady, 300);
    const res = await pending;
    assert.equal(res.status, 200);
    assert.equal((await request(app).get("/api/health")).status, 200);
});

console.log("\nCheckout validation");
await test("negative, fractional and oversized quantities are rejected", async () => {
    const u = await makeUser();
    const p = await makeProduct();
    for (const quantity of [-9, 0.5, 0, 21, "abc", null, "1e3", {}]) {
        const res = await checkout(u.auth, [{ productId: p._id, size: "S", quantity }]);
        assert.equal(res.status, 400, `qty ${quantity} → ${res.status}`);
    }
    assert.equal(await stockOf(p._id, "S"), 2);
});
await test("price comes from DB and identity from token, not body", async () => {
    const u = await makeUser();
    const other = await makeUser();
    const p = await makeProduct();
    const res = await checkout(u.auth, [{ productId: p._id, size: "M", quantity: 2, price: 1 }], { userId: other.user._id, userEmail: "evil@x.dev" });
    assert.equal(res.status, 200);
    assert.equal(res.body.amount, (2 * 1000 + 2 * 50) * 100);
    const order = await Order.findOne({ razorpayOrderId: res.body.orderId });
    assert.equal(String(order.userId), String(u.user._id));
    assert.equal(order.userEmail, u.user.email);
});
await test("invalid size and missing address are rejected", async () => {
    const u = await makeUser();
    const p = await makeProduct();
    assert.equal((await checkout(u.auth, [{ productId: p._id, size: "XXL", quantity: 1 }])).status, 400);
    const r = await request(app).post("/api/payment/razorpay/order").set(u.auth).send({ items: [{ productId: p._id, size: "S", quantity: 1 }] });
    assert.equal(r.status, 400);
});

console.log("\nInventory");
await test("per-size stock is reserved at checkout and enforced", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const p = await makeProduct({ sizeStock: [{ size: "S", stock: 1 }, { size: "M", stock: 5 }], stock: 6 });
    assert.equal((await checkout(a.auth, [{ productId: p._id, size: "S", quantity: 1 }])).status, 200);
    assert.equal(await stockOf(p._id, "S"), 0);
    assert.equal(await stockOf(p._id), 5);
    assert.equal((await checkout(b.auth, [{ productId: p._id, size: "S", quantity: 1 }])).status, 409);
    assert.equal((await checkout(b.auth, [{ productId: p._id, size: "M", quantity: 1 }])).status, 200);
});
await test("duplicate lines are merged before the stock check", async () => {
    const u = await makeUser();
    const p = await makeProduct({ sizeStock: [{ size: "S", stock: 1 }, { size: "M", stock: 0 }], stock: 1 });
    const res = await checkout(u.auth, [{ productId: p._id, size: "S", quantity: 1 }, { productId: p._id, size: "S", quantity: 1 }]);
    assert.equal(res.status, 409);
    assert.equal(await stockOf(p._id, "S"), 1);
});
await test("10 concurrent buyers of the last unit: exactly one wins", async () => {
    const p = await makeProduct({ sizes: ["M"], sizeStock: [], stock: 1 });
    const users = await Promise.all(Array.from({ length: 10 }, () => makeUser()));
    const results = await Promise.all(users.map((u) => checkout(u.auth, [{ productId: p._id, size: "M", quantity: 1 }])));
    assert.equal(results.filter((r) => r.status === 200).length, 1, results.map((r) => r.status).join(","));
    assert.equal(await stockOf(p._id), 0);
});

console.log("\nPayment confirmation");
await test("verify marks paid once; replay changes nothing", async () => {
    const u = await makeUser();
    const p = await makeProduct();
    await Cart.create({ userId: u.user._id, items: [{ productId: p._id, name: "x", price: 1, quantity: 1, size: "S" }] });
    const res = await checkout(u.auth, [{ productId: p._id, size: "S", quantity: 1 }]);
    const body = pay(res.body.orderId);
    const v1 = await request(app).post("/api/payment/razorpay/verify").send(body);
    assert.equal(v1.status, 200);
    const stockAfter = await stockOf(p._id, "S");
    const v2 = await request(app).post("/api/payment/razorpay/verify").send(body);
    assert.equal(v2.status, 200);
    assert.equal(v2.body.invoiceNumber, v1.body.invoiceNumber);
    assert.equal(await stockOf(p._id, "S"), stockAfter);
    const order = await Order.findOne({ razorpayOrderId: res.body.orderId });
    assert.equal(order.status, "paid");
    assert.match(order.invoiceNumber, /^EXT-\d{4}-\d{6}$/);
    assert.equal((await Cart.findOne({ userId: u.user._id })).items.length, 0);
});
await test("bad signature and amount mismatch are rejected", async () => {
    const u = await makeUser();
    const p = await makeProduct();
    const res = await checkout(u.auth, [{ productId: p._id, size: "M", quantity: 1 }]);
    const good = pay(res.body.orderId);
    assert.equal((await request(app).post("/api/payment/razorpay/verify").send({ ...good, razorpay_signature: "00".repeat(32) })).status, 400);
    assert.equal((await request(app).post("/api/payment/razorpay/verify").send({ ...good, razorpay_signature: undefined })).status, 400);
    const cheap = pay(res.body.orderId, { amount: 100 });
    assert.equal((await request(app).post("/api/payment/razorpay/verify").send(cheap)).status, 400);
    assert.equal((await Order.findOne({ razorpayOrderId: res.body.orderId })).status, "created");
});
await test("webhook confirms payment when the browser never returns; replay is idempotent", async () => {
    const u = await makeUser();
    const p = await makeProduct();
    const res = await checkout(u.auth, [{ productId: p._id, size: "M", quantity: 2 }]);
    const { razorpay_payment_id } = pay(res.body.orderId);
    const evt = { event: "payment.captured", payload: { payment: { entity: { id: razorpay_payment_id, order_id: res.body.orderId } } } };
    assert.equal((await request(app).post("/api/payment/razorpay/webhook").set("Content-Type", "application/json").set("X-Razorpay-Signature", "bad").send(JSON.stringify(evt))).status, 400);
    assert.equal((await webhook(evt)).status, 200);
    const s1 = await stockOf(p._id, "M");
    assert.equal((await webhook(evt)).status, 200);
    assert.equal(await stockOf(p._id, "M"), s1);
    assert.equal((await Order.findOne({ razorpayOrderId: res.body.orderId })).status, "paid");
});
await test("closing checkout releases stock; others cannot cancel it", async () => {
    const u = await makeUser();
    const other = await makeUser();
    const p = await makeProduct();
    const res = await checkout(u.auth, [{ productId: p._id, size: "S", quantity: 2 }]);
    assert.equal(await stockOf(p._id, "S"), 0);
    assert.equal((await request(app).post("/api/payment/razorpay/cancel").set(other.auth).send({ razorpayOrderId: res.body.orderId })).status, 404);
    assert.equal((await request(app).post("/api/payment/razorpay/cancel").set(u.auth).send({ razorpayOrderId: res.body.orderId })).status, 200);
    assert.equal(await stockOf(p._id, "S"), 2);
    assert.equal((await Order.findOne({ razorpayOrderId: res.body.orderId })).status, "failed");
});
await test("expired reservation is released; late payment re-reserves", async () => {
    const u = await makeUser();
    const p = await makeProduct();
    const res = await checkout(u.auth, [{ productId: p._id, size: "S", quantity: 1 }]);
    await Order.updateOne({ razorpayOrderId: res.body.orderId }, { reservedUntil: new Date(Date.now() - 1000) });
    await expireStaleOrders();
    assert.equal((await Order.findOne({ razorpayOrderId: res.body.orderId })).status, "failed");
    assert.equal(await stockOf(p._id, "S"), 2);
    const v = await request(app).post("/api/payment/razorpay/verify").send(pay(res.body.orderId));
    assert.equal(v.status, 200);
    assert.equal(await stockOf(p._id, "S"), 1);
});
await test("late payment after sell-out is cancelled and refunded in full", async () => {
    const u = await makeUser();
    const other = await makeUser();
    const p = await makeProduct({ sizeStock: [{ size: "S", stock: 1 }, { size: "M", stock: 0 }], stock: 1 });
    const res = await checkout(u.auth, [{ productId: p._id, size: "S", quantity: 1 }]);
    await Order.updateOne({ razorpayOrderId: res.body.orderId }, { reservedUntil: new Date(Date.now() - 1000) });
    await expireStaleOrders();
    assert.equal((await checkout(other.auth, [{ productId: p._id, size: "S", quantity: 1 }])).status, 200);
    const before = refunds.length;
    const v = await request(app).post("/api/payment/razorpay/verify").send(pay(res.body.orderId));
    assert.equal(v.status, 409);
    const order = await Order.findOne({ razorpayOrderId: res.body.orderId });
    assert.equal(order.status, "cancelled");
    assert.equal(order.refund.status, "processed");
    assert.equal(refunds.length, before + 1);
    assert.equal(refunds.at(-1).amount, (1000 + 50) * 100);
    assert.equal(await stockOf(p._id, "S"), 0);
});

await test("order expiring at the same moment it is paid still ends up paid", async () => {
    const u = await makeUser();
    const p = await makeProduct();
    const res = await checkout(u.auth, [{ productId: p._id, size: "S", quantity: 1 }]);
    const order = await Order.findOne({ razorpayOrderId: res.body.orderId });
    const body = pay(res.body.orderId);
    // While the server is talking to Razorpay, the expiry job fails the order and frees its stock
    const realFetch = razorpay.payments.fetch;
    let raced = false;
    razorpay.payments.fetch = async (id) => {
        if (!raced) { raced = true; await failUnpaidOrder(order._id, "expired", "test"); }
        return realFetch(id);
    };
    const v = await request(app).post("/api/payment/razorpay/verify").send(body);
    razorpay.payments.fetch = realFetch;
    assert.equal(v.status, 200, JSON.stringify(v.body));
    assert.equal(v.body.status, "paid");
    assert.equal((await Order.findById(order._id)).status, "paid");
    assert.equal(await stockOf(p._id, "S"), 1, "stock taken exactly once");
});

await test("phone redirect payment: success redirects to the order, signature checked", async () => {
    const u = await makeUser();
    const p = await makeProduct();
    const res = await checkout(u.auth, [{ productId: p._id, size: "M", quantity: 1 }]);
    const body = pay(res.body.orderId);
    const cb = (form, ret = "http://localhost:5173") =>
        request(app).post(`/api/payment/razorpay/callback?return=${encodeURIComponent(ret)}`).type("form").send(form);
    const bad = await cb({ ...body, razorpay_signature: "00".repeat(32) });
    assert.equal(bad.status, 303);
    assert.match(bad.headers.location, /\/orders\?payment=pending$/);
    assert.equal((await Order.findOne({ razorpayOrderId: res.body.orderId })).status, "created");
    const ok = await cb(body);
    assert.equal(ok.status, 303);
    const order = await Order.findOne({ razorpayOrderId: res.body.orderId });
    assert.equal(order.status, "paid");
    assert.equal(ok.headers.location, `http://localhost:5173/payment-success?orderId=${order._id}&invoice=${encodeURIComponent(order.invoiceNumber)}`);
    // Never redirect to a foreign site
    const evil = await cb(body, "https://evil.example");
    assert.ok(!evil.headers.location.startsWith("https://evil.example"));
});
await test("phone redirect payment: failure releases stock and returns to the cart", async () => {
    const u = await makeUser();
    const p = await makeProduct();
    const res = await checkout(u.auth, [{ productId: p._id, size: "S", quantity: 2 }]);
    assert.equal(await stockOf(p._id, "S"), 0);
    const r = await request(app).post(`/api/payment/razorpay/callback?return=${encodeURIComponent("http://localhost:5173")}`).type("form")
        .send({ "error[code]": "BAD_REQUEST_ERROR", "error[description]": "Payment failed at bank", "error[metadata]": JSON.stringify({ order_id: res.body.orderId }) });
    assert.equal(r.status, 303);
    assert.equal(r.headers.location, "http://localhost:5173/cart?payment=failed&reason=Payment%20failed%20at%20bank");
    assert.equal((await Order.findOne({ razorpayOrderId: res.body.orderId })).status, "failed");
    assert.equal(await stockOf(p._id, "S"), 2);
});

console.log("\nCoupons");
await test("usage limit holds under concurrency; failure releases the use", async () => {
    await Coupon.create({ code: "ONE", discountType: "fixed", discountValue: 100, usageLimit: 1 });
    const p = await makeProduct({ sizeStock: [{ size: "S", stock: 10 }, { size: "M", stock: 10 }], stock: 20 });
    const [a, b] = await Promise.all([makeUser(), makeUser()]);
    const results = await Promise.all([a, b].map((u) => checkout(u.auth, [{ productId: p._id, size: "S", quantity: 1 }], { couponCode: "one" })));
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 400]);
    assert.equal((await Coupon.findOne({ code: "ONE" })).usedCount, 1);
    const winner = results.find((r) => r.status === 200);
    assert.equal(winner.body.summary.discount, 100);
    const winnerUser = results[0].status === 200 ? a : b;
    await request(app).post("/api/payment/razorpay/cancel").set(winnerUser.auth).send({ razorpayOrderId: winner.body.orderId });
    assert.equal((await Coupon.findOne({ code: "ONE" })).usedCount, 0);
});
await test("once-per-user coupon cannot be reused", async () => {
    await Coupon.create({ code: "WELCOME", discountType: "percentage", discountValue: 10, oncePerUser: true });
    const u = await makeUser();
    const p = await makeProduct({ sizeStock: [{ size: "S", stock: 10 }, { size: "M", stock: 10 }], stock: 20 });
    await placePaidOrder(u, [{ productId: p._id, size: "S", quantity: 1 }], { couponCode: "WELCOME" });
    assert.equal((await checkout(u.auth, [{ productId: p._id, size: "S", quantity: 1 }], { couponCode: "WELCOME" })).status, 400);
});
await test("coupon validation rejects bad admin input", async () => {
    assert.equal((await request(app).post("/api/admin/coupons").set(adminAuth).send({ code: "NEG", discountType: "fixed", discountValue: -50 })).status, 400);
    assert.equal((await request(app).post("/api/admin/coupons").set(adminAuth).send({ code: "BIG", discountType: "percentage", discountValue: 150 })).status, 400);
    assert.equal((await request(app).post("/api/admin/coupons").set(adminAuth).send({ discountType: "fixed", discountValue: 5 })).status, 400);
});

console.log("\nOrder lifecycle, cancellation, refunds");
await test("customer cancel restores stock once and refunds in full", async () => {
    const u = await makeUser();
    const p = await makeProduct();
    const order = await placePaidOrder(u, [{ productId: p._id, size: "M", quantity: 3 }]);
    assert.equal(await stockOf(p._id, "M"), 2);
    const [c1, c2] = await Promise.all([
        request(app).post(`/api/orders/${order._id}/cancel`).set(u.auth).send({}),
        request(app).post(`/api/orders/${order._id}/cancel`).set(u.auth).send({}),
    ]);
    assert.deepEqual([c1.status, c2.status].sort(), [200, 400]);
    assert.equal(await stockOf(p._id, "M"), 5);
    const fresh = await Order.findById(order._id);
    assert.equal(fresh.refund.status, "processed");
    assert.equal(fresh.refund.amount, 3 * 1000 + 3 * 50);
});
await test("admin state machine blocks illegal transitions", async () => {
    const u = await makeUser();
    const p = await makeProduct();
    const order = await placePaidOrder(u, [{ productId: p._id, size: "M", quantity: 1 }]);
    const put = (status) => request(app).put(`/api/orders/${order._id}/status`).set(adminAuth).send({ status, trackingNumber: "T1", carrierName: "DTDC" });
    assert.equal((await put("delivered")).status, 409);
    assert.equal((await put("returned")).status, 409);
    assert.equal((await put("shipped")).status, 200);
    assert.equal((await put("cancelled")).status, 409);
    assert.equal((await put("delivered")).status, 200);
    assert.equal((await put("paid")).status, 409);
    const fresh = await Order.findById(order._id);
    assert.ok(fresh.deliveredAt && fresh.shippedAt);
    assert.equal(fresh.trackingNumber, "T1");
});
await test("return only after delivery; approval restocks and refunds once", async () => {
    const u = await makeUser();
    const p = await makeProduct();
    const order = await placePaidOrder(u, [{ productId: p._id, size: "M", quantity: 2 }]);
    assert.equal((await request(app).post(`/api/orders/${order._id}/return`).set(u.auth).send({ reason: "x" })).status, 400);
    const put = (status) => request(app).put(`/api/orders/${order._id}/status`).set(adminAuth).send({ status });
    await put("shipped");
    await put("delivered");
    assert.equal((await request(app).post(`/api/orders/${order._id}/return`).set(u.auth).send({ reason: "Too big" })).status, 200);
    const before = refunds.length;
    assert.equal((await put("returned")).status, 200);
    assert.equal((await put("returned")).status, 409);
    assert.equal(await stockOf(p._id, "M"), 5);
    assert.equal(refunds.length, before + 1);
});
await test("return window counts from delivery date", async () => {
    const u = await makeUser();
    const p = await makeProduct();
    const order = await placePaidOrder(u, [{ productId: p._id, size: "M", quantity: 1 }]);
    await Order.updateOne({ _id: order._id }, { status: "delivered", paidAt: new Date(Date.now() - 20 * 864e5), deliveredAt: new Date(Date.now() - 2 * 864e5) });
    assert.equal((await request(app).post(`/api/orders/${order._id}/return`).set(u.auth).send({ reason: "late ship" })).status, 200);
    const o2 = await placePaidOrder(u, [{ productId: p._id, size: "M", quantity: 1 }]);
    await Order.updateOne({ _id: o2._id }, { status: "delivered", deliveredAt: new Date(Date.now() - 8 * 864e5) });
    assert.equal((await request(app).post(`/api/orders/${o2._id}/return`).set(u.auth).send({ reason: "x" })).status, 400);
});
await test("size exchange moves stock between variants", async () => {
    const u = await makeUser();
    const p = await makeProduct({ sizeStock: [{ size: "S", stock: 3 }, { size: "M", stock: 3 }], stock: 6 });
    const order = await placePaidOrder(u, [{ productId: p._id, size: "S", quantity: 1 }]);
    await Order.updateOne({ _id: order._id }, { status: "delivered", deliveredAt: new Date() });
    const itemId = order.items[0]._id;
    assert.equal((await request(app).post(`/api/orders/${order._id}/exchange`).set(u.auth).send({ reason: "fit", items: [{ itemId, size: "S" }] })).status, 400);
    assert.equal((await request(app).post(`/api/orders/${order._id}/exchange`).set(u.auth).send({ reason: "fit", items: [{ itemId, size: "M" }] })).status, 200);
    assert.equal(await stockOf(p._id, "M"), 2, "replacement reserved");
    assert.equal(await stockOf(p._id, "S"), 2);
    assert.equal((await request(app).put(`/api/orders/${order._id}/status`).set(adminAuth).send({ status: "exchanged" })).status, 200);
    assert.equal(await stockOf(p._id, "S"), 3, "returned unit restocked");
    assert.equal(await stockOf(p._id, "M"), 2, "replacement stays deducted");
});
await test("rejected exchange releases the reserved replacement", async () => {
    const u = await makeUser();
    const p = await makeProduct({ sizeStock: [{ size: "S", stock: 3 }, { size: "M", stock: 3 }], stock: 6 });
    const order = await placePaidOrder(u, [{ productId: p._id, size: "S", quantity: 1 }]);
    await Order.updateOne({ _id: order._id }, { status: "delivered", deliveredAt: new Date() });
    await request(app).post(`/api/orders/${order._id}/exchange`).set(u.auth).send({ reason: "fit", items: [{ itemId: order.items[0]._id, size: "M" }] });
    assert.equal(await stockOf(p._id, "M"), 2);
    assert.equal((await request(app).put(`/api/orders/${order._id}/status`).set(adminAuth).send({ status: "delivered" })).status, 200);
    assert.equal(await stockOf(p._id, "M"), 3);
    assert.equal((await request(app).post(`/api/orders/${order._id}/exchange`).set(u.auth).send({ reason: "again", items: [{ itemId: order.items[0]._id, size: "M" }] })).status, 400);
});
await test("failed refund can be retried by admin", async () => {
    const u = await makeUser();
    const p = await makeProduct();
    const order = await placePaidOrder(u, [{ productId: p._id, size: "M", quantity: 1 }]);
    refundShouldFail = true;
    const r = await request(app).put(`/api/orders/${order._id}/status`).set(adminAuth).send({ status: "cancelled" });
    refundShouldFail = false;
    assert.equal(r.status, 200);
    assert.equal((await Order.findById(order._id)).refund.status, "failed");
    assert.equal((await request(app).post(`/api/orders/${order._id}/refund`).set(adminAuth)).status, 200);
    assert.equal((await Order.findById(order._id)).refund.status, "processed");
    assert.equal((await request(app).post(`/api/orders/${order._id}/refund`).set(adminAuth)).status, 400);
});
await test("unpaid order cannot be admin-cancelled into phantom stock", async () => {
    const u = await makeUser();
    const p = await makeProduct();
    const res = await checkout(u.auth, [{ productId: p._id, size: "M", quantity: 1 }]);
    const order = await Order.findOne({ razorpayOrderId: res.body.orderId });
    assert.equal((await request(app).put(`/api/orders/${order._id}/status`).set(adminAuth).send({ status: "cancelled" })).status, 409);
    assert.equal((await request(app).put(`/api/orders/${order._id}/status`).set(adminAuth).send({ status: "failed" })).status, 200);
    assert.equal(await stockOf(p._id, "M"), 5);
    assert.equal((await request(app).put(`/api/orders/${order._id}/status`).set(adminAuth).send({ status: "failed" })).status, 409);
    assert.equal(await stockOf(p._id, "M"), 5);
});

await test("parcel returned to origin restocks and refunds", async () => {
    const u = await makeUser();
    const p = await makeProduct();
    const order = await placePaidOrder(u, [{ productId: p._id, size: "M", quantity: 2 }]);
    const put = (status) => request(app).put(`/api/orders/${order._id}/status`).set(adminAuth).send({ status });
    assert.equal((await put("shipped")).status, 200);
    const before = refunds.length;
    assert.equal((await put("returned")).status, 200);
    assert.equal(await stockOf(p._id, "M"), 5);
    assert.equal(refunds.length, before + 1);
});

await test("retrying a refund that timed out but succeeded does not refund twice", async () => {
    const u = await makeUser();
    const p = await makeProduct();
    const order = await placePaidOrder(u, [{ productId: p._id, size: "M", quantity: 1 }]);
    refundTimesOutAfterCreating = true;
    await request(app).put(`/api/orders/${order._id}/status`).set(adminAuth).send({ status: "cancelled" });
    refundTimesOutAfterCreating = false;
    assert.equal((await Order.findById(order._id)).refund.status, "failed");
    const before = refunds.length;
    assert.equal((await request(app).post(`/api/orders/${order._id}/refund`).set(adminAuth)).status, 200);
    assert.equal(refunds.length, before, "no second refund created");
    assert.equal((await Order.findById(order._id)).refund.status, "processed");
});

await test("duplicate webhook delivery (same event id) is ignored", async () => {
    const u = await makeUser();
    const p = await makeProduct();
    const res = await checkout(u.auth, [{ productId: p._id, size: "M", quantity: 1 }]);
    const { razorpay_payment_id } = pay(res.body.orderId);
    const evt = { event: "payment.captured", payload: { payment: { entity: { id: razorpay_payment_id, order_id: res.body.orderId } } } };
    const first = await webhook(evt, "evt_dup_1");
    assert.equal(first.status, 200);
    const second = await webhook(evt, "evt_dup_1");
    assert.equal(second.status, 200);
    assert.equal(second.body.duplicate, true);
    assert.equal((await Order.findOne({ razorpayOrderId: res.body.orderId })).status, "paid");
});
await test("late refund.failed event cannot undo a processed refund", async () => {
    const u = await makeUser();
    const p = await makeProduct();
    const order = await placePaidOrder(u, [{ productId: p._id, size: "M", quantity: 1 }]);
    await request(app).post(`/api/orders/${order._id}/cancel`).set(u.auth).send({});
    assert.equal((await Order.findById(order._id)).refund.status, "processed");
    const evt = { event: "refund.failed", payload: { refund: { entity: { id: "rfnd_late", payment_id: order.razorpayPaymentId, status: "failed" } } } };
    assert.equal((await webhook(evt, "evt_late_refund")).status, 200);
    assert.equal((await Order.findById(order._id)).refund.status, "processed");
});

console.log("\nPrivacy (IDOR)");
await test("another customer cannot read an order by id or Razorpay id", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const p = await makeProduct();
    const order = await placePaidOrder(a, [{ productId: p._id, size: "M", quantity: 1 }]);
    assert.equal((await request(app).get(`/api/orders/${order._id}`).set(b.auth)).status, 404);
    assert.equal((await request(app).get(`/api/orders/${order.razorpayOrderId}`).set(b.auth)).status, 404);
    assert.equal((await request(app).get(`/api/orders/${order.razorpayOrderId}`).set(a.auth)).status, 200);
    assert.equal((await request(app).get(`/api/orders/${order._id}`).set(adminAuth)).status, 200);
});

console.log("\nCart, reviews, catalog, admin products");
await test("cart sync ignores client prices, clamps to stock, drops junk", async () => {
    const u = await makeUser();
    const p = await makeProduct({ sizeStock: [{ size: "S", stock: 2 }, { size: "M", stock: 0 }], stock: 2 });
    const res = await request(app).post("/api/cart/sync").set(u.auth).send({ items: [
        { productId: p._id, size: "S", quantity: 9, price: 1 },
        { productId: "000000000000000000000000", size: "S", quantity: 1 },
        { productId: p._id, size: "XXL", quantity: 1 },
        { productId: "not-an-id", quantity: 1 },
    ] });
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].price, 1000);
    assert.equal(res.body[0].quantity, 2);
    assert.equal(res.body[0].stock, 2);
});
await test("reviews: purchasers only, validated, deletable with rating recompute", async () => {
    const u = await makeUser();
    const stranger = await makeUser();
    const p = await makeProduct();
    assert.equal((await request(app).post(`/api/products/${p._id}/reviews`).set(stranger.auth).send({ rating: 5, comment: "great" })).status, 403);
    const order = await placePaidOrder(u, [{ productId: p._id, size: "M", quantity: 1 }]);
    await Order.updateOne({ _id: order._id }, { status: "delivered", deliveredAt: new Date() });
    assert.equal((await request(app).post(`/api/products/${p._id}/reviews`).set(u.auth).send({ rating: 6, comment: "x" })).status, 400);
    const ok = await request(app).post(`/api/products/${p._id}/reviews`).set(u.auth).send({ rating: 4, comment: "nice" });
    assert.equal(ok.status, 201);
    assert.equal(ok.body.ratings, 4);
    assert.equal(ok.body.reviews[0].verifiedPurchase, true);
    const del = await request(app).delete(`/api/products/${p._id}/reviews`).set(u.auth);
    assert.equal(del.status, 200);
    assert.equal(del.body.ratings, 0);
    assert.equal(del.body.numOfReviews, 0);
});
await test("search input is treated literally (no regex injection)", async () => {
    const t = Date.now();
    const res = await request(app).get("/api/products").query({ search: "(a+)+$".repeat(5) });
    assert.equal(res.status, 200);
    assert.ok(Date.now() - t < 2000);
    const list = await request(app).get("/api/products").query({ page: 1, limit: 100000 });
    assert.equal(list.status, 200);
    assert.ok(!("reviews" in (list.body.products[0] || {})));
});
await test("admin product stock edit is rejected if orders changed stock meanwhile", async () => {
    const p = await makeProduct();
    const res = await request(app).put(`/api/admin/products/${p._id}`).set(adminAuth)
        .send({ sizes: JSON.stringify(["S", "M"]), sizeStock: JSON.stringify({ S: 10, M: 10 }), expectedStock: 999 });
    assert.equal(res.status, 409);
    const ok = await request(app).put(`/api/admin/products/${p._id}`).set(adminAuth)
        .send({ sizes: JSON.stringify(["S", "M"]), sizeStock: JSON.stringify({ S: 10, M: 4 }), expectedStock: 7 });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    assert.equal(ok.body.stock, 14);
    const bad = await request(app).put(`/api/admin/products/${p._id}`).set(adminAuth).send({ category: "hat" });
    assert.equal(bad.status, 400);
});

console.log("\nLegacy data migration");
await test("pre-existing paid order without flags restores stock exactly once", async () => {
    const u = await makeUser();
    const p = await makeProduct({ sizes: ["M"], sizeStock: [], stock: 5 });
    const legacy = await Order.collection.insertOne({
        userId: u.user._id, razorpayOrderId: "order_LEGACY1", razorpayPaymentId: "pay_legacy", invoiceNumber: "EXT-20260101-1234",
        items: [{ productId: p._id, name: "Shirt", price: 1000, quantity: 2, size: "M" }], totalAmount: 2000, shipping: 0, status: "paid", paidAt: new Date(), createdAt: new Date(),
    });
    await runStartupMigrations();
    assert.equal((await Order.findById(legacy.insertedId)).stockReserved, true);
    assert.equal((await request(app).post(`/api/orders/${legacy.insertedId}/cancel`).set(u.auth).send({})).status, 200);
    assert.equal(await stockOf(p._id), 7);
    await runStartupMigrations();
    assert.equal(await stockOf(p._id), 7);
});

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) console.log("Failed:\n - " + failures.join("\n - "));
await mongoose.disconnect();
await mongo.stop();
process.exit(failures.length ? 1 : 0);
