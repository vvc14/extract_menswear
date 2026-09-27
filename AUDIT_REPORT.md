# Extract Menswear — Business-Logic & Production-Readiness Audit

- **Audit date:** 2026-09-27
- **Commit audited:** `2708e7c` (branch `main`, clean working tree)
- **Scope:** the whole tracked repo (`server/`, `client/src/`), plus git history for secrets. Every finding was traced by reading the code. Nothing was exploited against a live database.
- **Line numbers** point to the file as of `2708e7c`.

---

## 0. System Map

### 0.1 Stack

| Layer | Technology | Evidence |
|---|---|---|
| Frontend | React 19 + Vite 7, Redux Toolkit, React Router 7, Tailwind 4, axios | `client/package.json` |
| Backend | Node.js (ESM) + Express 4 | `server/package.json`, `server/server.js` |
| Database / ORM | MongoDB via Mongoose 8 (no migrations, schema in `server/models/*.js`) | `server/config/db.js` |
| Payment gateway | Razorpay (Checkout.js on the client, `orders.create` and HMAC signature check on the server). **No webhook.** | `server/config/razorpay.js`, `server/controllers/paymentController.js`, `client/src/services/razorpay.js` |
| Auth | Stateless JWT (HS256, one `JWT_SECRET` for every token type), sent as a `Bearer` header and stored in `localStorage` (users) or `sessionStorage` (admins). Email OTP for signup and password reset. Google Sign-In. | `server/middleware/auth.js`, `server/controllers/authController.js`, `client/src/redux/authSlice.js` |
| Media | Cloudinary via multer memory storage | `server/middleware/upload.js` |
| Email | Nodemailer (Mailjet SMTP, or Gmail SMTP as fallback) | `server/utils/emailTransporter.js` |
| Hardening middleware | helmet, cors (allowlist), express-rate-limit, express-mongo-sanitize, hpp, compression | `server/server.js:24-60` |

### 0.2 API Routes

Mounted in `server/server.js:63-71`. "Auth" names the middleware that actually runs.

| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | `/api/health` | inline | none |
| GET | `/api/products` | `productController.getProducts` | none |
| GET | `/api/products/category-options` | `adminController.getCategoryOptions` | none |
| GET | `/api/products/:id` | `productController.getProductById` | none |
| POST | `/api/products/:id/reviews` | `productController.addReview` | `userAuth` |
| POST | `/api/auth/check-email` | `checkEmail` | none (authLimiter) |
| POST | `/api/auth/send-otp` | `sendOtp` | none (authLimiter) |
| POST | `/api/auth/verify-otp` | `verifyOtp` | none (authLimiter) |
| POST | `/api/auth/forgot-password-send-otp` | `sendForgotPasswordOtp` | none (authLimiter) |
| POST | `/api/auth/forgot-password-reset` | `resetPassword` | none (authLimiter) |
| POST | `/api/auth/google` | `googleLogin` | none |
| POST | `/api/auth/admin-login` | `adminLogin` | none |
| POST | `/api/auth/admin-google` | `adminGoogleLogin` | none |
| POST | `/api/auth/register` | `userRegister` | none |
| POST | `/api/auth/login` | `userLogin` | none |
| GET/PUT | `/api/auth/profile` | `getProfile` / `updateProfile` | `userAuth` |
| GET | `/api/cart` | `getCart` | `userAuth` |
| POST | `/api/cart/sync` | `syncCart` | `userAuth` |
| POST | `/api/cart/add` | `addToCart` (unused by client) | `userAuth` |
| PUT | `/api/cart/update` | `updateCartItem` (unused by client) | `userAuth` |
| DELETE | `/api/cart/item/:productId`, `/api/cart/clear` | `removeFromCart`, `clearCart` | `userAuth` |
| GET/POST/DELETE | `/api/wishlist/*` | `wishlistController.*` | `userAuth` |
| GET | `/api/coupons` | `getActiveCoupons` | none |
| POST | `/api/coupons/validate` | `validateCoupon` | none (optional JWT) |
| POST | `/api/payment/razorpay/order` | `paymentController.createOrder` | `userAuth` |
| POST | `/api/payment/razorpay/verify` | `paymentController.verifyPayment` | **none** (HMAC only) |
| GET | `/api/orders/admin` | `orderController.getAllOrders` | **`authMiddleware` only (no role check)** |
| PUT | `/api/orders/:id/status` | `orderController.updateOrderStatus` | **`authMiddleware` only (no role check)** |
| GET | `/api/orders` | `getUserOrders` | `userAuth` |
| GET | `/api/orders/:id` | `getOrderById` | `userAuth` |
| POST | `/api/orders/:id/cancel`, `/return`, `/exchange` | `cancelOrder`, `requestReturn`, `requestExchange` | `userAuth` |
| POST | `/api/contact` | `submitContact` | none |
| * | `/api/admin/*` (products, users, category-options, settings, coupons) | `adminController.*`, `couponController.*` | `authMiddleware` + `requireRole("admin")` |

### 0.3 Data Model (Mongoose)

| Collection | Key fields | Notes |
|---|---|---|
| `User` (`models/User.js`) | name, email (unique, lowercase), password (bcrypt 12), role `user\|admin`, embedded `addresses[]` | Addresses validated for a 10-digit phone and 6-digit pincode |
| `Admin` (`models/Admin.js`) | username, password, role | A second, separate admin identity store (the other is `User.role = "admin"`) |
| `Product` (`models/Product.js`) | category `shirt\|trouser`, price, originalPrice, discount, shippingCost, `sizes: [String]`, **`stock: Number` (one number per product)**, embedded `reviews[]`, ratings (default **4.0**), numOfReviews | **No variant/SKU entity.** Stock is not tracked per size. |
| `Cart` (`models/Cart.js`) | userId (unique), items[{productId, name, **price**, shippingCost, quantity (min 1), size}] | Price and name are snapshots sent by the client |
| `Wishlist` | userId, items[] snapshot | — |
| `Order` (`models/Order.js`) | userId, userEmail, userName, razorpayOrderId, razorpayPaymentId, invoiceNumber, items[{productId, price, quantity, size}], `totalAmount` (**subtotal after discount, excluding shipping**), shipping, couponCode, discountAmount, status enum (10 values), tracking, reasons | No unique index on `razorpayOrderId` or `invoiceNumber`. No refund fields. |
| `Coupon` | code (unique), discountType, discountValue, minOrderValue, isActive, usageLimit, usedCount, expiryDate, oncePerUser, usedBy[] | — |
| `CategoryOption`, `Setting`, `Contact` | lookup and config data | — |

**Missing entities:** inventory/SKU, payment/transaction records, refunds, shipments, flash sales, tax. OTPs live in an in-process `Map` (`server/utils/otpStore.js`), so they are lost on restart and don't work across multiple instances.

### 0.4 Test Coverage

- **Automated tests: none.** There's no test runner in either `package.json`, and there are no `*.test.*` / `*.spec.*` files or `__tests__` directories.
- `server/verify_features.js`, `server/temp_verify.js` and `server/test_queue.js` are ad-hoc scripts. They need a running server and hand-seeded data, assert nothing, and aren't wired to any script.
- `test_cases_report.md` claims "100 test cases, 40 automated, 100 passed". **No automated tests exist in the repo to back this up.** Several of its "Pass" claims contradict the code. For example, TC-057 says "Razorpay webhook … clears cart", but there is no webhook anywhere in the codebase (`grep -i webhook` only matches `package-lock.json`).

### 0.5 Tool Runs

| Command | Result |
|---|---|
| `npm test` | Not available: no test script in any `package.json` |
| `server: npx eslint .` | **3 errors**: `adminController.js:9 'URL' is not defined` (config gap, `URL` is a Node global); **`orderController.js:245` and `:283` `'buildStatusEmailHtml' is not defined`** (a real runtime bug, see Phase 11) |
| `client: npx eslint .` | Clean (0 problems) |
| `client: npx vite build` | Succeeds (10.2 s). Largest chunks: `index` 493 kB and `invoiceGenerator` 421 kB (jsPDF shipped to the browser) |
| `node --check` on all server controllers and utils | All parse |

### 0.6 Secrets Check (values not reproduced)

- `server/.env` and `client/.env` exist locally and are **not** tracked (they're covered by `.gitignore`). No `.env` appears in git history (87 commits scanned).
- `server/.env.example` and `client/.env.example` contain placeholders only (`rzp_test_xxxx…`).
- **`server/test_tokens.json` is committed.** It holds two signed JWTs (a user token and an admin token) produced by `create_test_accounts.js` with the real `JWT_SECRET`. They're expired (24h), but they give an attacker material for an offline guess at the HMAC secret. If the secret was ever weak or reused, every token type can be forged. The current secret is 64 characters, which lowers but doesn't remove this risk.
- `server/seed.js:18` has a hard-coded fallback admin password and **prints it to stdout** (`seed.js:26`). `server/create_test_accounts.js:20,39` hard-codes QA user and admin passwords. If either script is ever run against production, a known admin login exists.


---

## Findings by Phase

### Phase 1 — Authentication & Accounts

**Flows traced:**
- **Signup:** `send-otp` → `verify-otp` returns a 15-minute `emailVerificationToken` → `register` checks that token.
- **Login:** bcrypt compare, then a 7-day JWT.
- **Password reset:** the same OTP → token path, then `forgot-password-reset`.
- **Google:** `verifyIdToken`, then find-or-create the user.
- **Admin login:** either the `Admin` collection (username/password) or a `User` with `role:"admin"` via Google.
- **Guest checkout:** doesn't exist on the server. `POST /api/payment/razorpay/order` needs `userAuth`, and `Cart.jsx:247` redirects guests to login. Guest carts live only in Redux memory (see Phase 3).

| Issue | Severity | File:Line | Description | Fix |
|---|---|---|---|---|
| Admin order endpoints accept any JWT | **Critical** | `server/routes/orderRoutes.js:9-10`; `server/middleware/auth.js:4-16`; `server/controllers/orderController.js:179` | `GET /api/orders/admin` and `PUT /api/orders/:id/status` use only `authMiddleware`, which checks the signature but never `role` or `type`. It copies the decoded payload into `req.admin`, and `updateOrderStatus` treats a truthy `req.admin` as an admin. **Any logged-in customer can list every order (names, emails, phones, full addresses) and set any order to any status**, which also restocks inventory and sends refund emails. | Add `requireRole("admin")` to both routes. In `authMiddleware`, reject tokens whose `type`/`role` isn't admin. |
| Email-verification token works as a login token | **Critical** | `server/controllers/authController.js:161-165`; `server/middleware/auth.js:4-31` | The OTP proof token `{email, purpose:"email-verification"}` is signed with the same `JWT_SECRET` as session tokens, and neither middleware checks `purpose`/`type`. Anyone who verifies an OTP for a **brand-new email (no account needed)** gets a token that passes `authMiddleware`, which combined with the row above exposes all orders. It also passes `userAuth` with `req.user.id === undefined`. | Use a separate secret or an `aud` claim per token type. Require `type === "user"` in `userAuth` and `type === "admin"` in `authMiddleware`. |
| No token revocation; role baked into a 7-day JWT | High | `server/controllers/authController.js:258-262`; `server/controllers/adminController.js:201-219` | Demoting an admin (`updateUserRole`), deleting a user, or resetting a password doesn't invalidate existing tokens. A demoted admin keeps admin access for up to 24h (admin token) or **7 days** (a `User`-role admin logging in through `/auth/login`). | Look up the current role in the DB inside `requireRole`, or add a `tokenVersion` to the user and check it. Shorten token lifetimes and add refresh tokens. |
| Password change doesn't require the current password | Medium | `server/controllers/authController.js:293-298` | `PUT /api/auth/profile` with `{password}` changes it outright. A stolen or XSS-exfiltrated token (tokens sit in `localStorage`) becomes a permanent account takeover. | Require `currentPassword` for password changes. |
| Account enumeration | Medium | `server/controllers/authController.js:97-106` (`checkEmail`), `:337-340`, `:123-126` | `check-email` returns `{exists, name}` with no auth, which also leaks the account holder's name. Forgot-password returns 404 for unknown emails. | Return a generic response, and drop `name` from `check-email`. |
| `/api/auth/profile` shares the 20-per-15-min login limiter | Medium | `server/server.js:50-54, 68` | `authLimiter` wraps the whole `/api/auth` router, including `GET/PUT /profile`, which `Cart.jsx:118` and the Profile page call routinely. Normal browsing can lock users out of logging in, and several users behind one NAT share the budget. | Apply the limiter only to `login`, `admin-login`, `send-otp`, `verify-otp` and the forgot-password routes. |
| OTP store is in-process memory; OTP uses `Math.random` | Medium | `server/utils/otpStore.js:6, 13` | OTPs vanish on restart and don't work with more than one instance or on serverless. `Math.random` isn't a CSPRNG. Expiry (10 min), 5 attempts and a 60 s resend cooldown **are** enforced (`otpStore.js:8-10, 20-22, 48-52`). | Move OTPs to Redis or Mongo with a TTL index, and use `crypto.randomInt(100000, 1000000)`. |
| One verification token serves both signup and reset | Low | `server/controllers/authController.js:161-165, 374-378` | Both flows accept `purpose:"email-verification"`. It's not exploitable today (both prove email ownership), but it's fragile. | Use distinct purposes: `signup` and `password-reset`. |
| Google login skips `email_verified` | Low | `server/controllers/authController.js:22-40` | Google accounts are auto-linked by email without checking `payload.email_verified`. | Reject the login when `email_verified !== true`. |
| Duplicate accounts | OK | `server/models/User.js:7`; `authController.js:223-226` | Unique index on a lowercased email plus an existence check. A race produces an E11000 error that surfaces as a 500. | Map E11000 to a 409. |
| Admin routes protected server-side | OK (except orders) | `server/routes/adminRoutes.js:9-10` | `/api/admin/*` uses `authMiddleware` + `requireRole("admin")`. The client `ProtectedRoute` (`client/src/App.jsx:45-57`) is cosmetic only. The order routes are the gap. | See the first row. |

### Phase 2 — Product Catalog

**Model:** `Product` holds `sizes: [String]` and **one** `stock: Number`. There's no variant/SKU collection, colour or fit attribute. The size chart is a static page (`client/src/pages/SizeGuide.jsx`), not per-product data.

| Issue | Severity | File:Line | Description | Fix |
|---|---|---|---|---|
| No per-size inventory (no SKU model) | **High** | `server/models/Product.js:24-25`; `server/controllers/paymentController.js:103`, `:251-254` | Stock is one number per product, and every layer (cart, checkout, inventory) keys on `productId` plus a free-text `size`. A product with `stock: 10` and sizes S–XXL can sell 10 × XL when only 2 XL exist physically. Size availability is never tracked or shown. | Add a `variants: [{sku, size, color, stock}]` subdocument (or a `Variant` collection). Key cart and order lines by `sku`, and decrement per variant. |
| "Out of stock" isn't enforced at add-to-cart | Medium | `server/controllers/cartController.js:15-30` (`syncCart`), `:33-73` (`addToCart`) | The client only ever calls `/cart/sync` (`client/src/redux/cartSlice.js:13-32`), which stores whatever array it gets: no stock, size, price or quantity checks. `addToCart` says "just check availability" but never reads `product.stock`. Out-of-stock blocking happens only in the UI (`ProductCard.jsx:20`, `ProductDetail.jsx:103`) and at order creation, where only product-level stock is checked. | Validate each item in `syncCart` against the DB (product exists, size valid, `1 ≤ qty ≤ stock`), and re-price from the DB. |
| User-controlled regex in search | Medium | `server/controllers/productController.js:19-26` | `search` goes into `$regex` unescaped, which allows ReDoS patterns (e.g. `(a+)+$`) and full collection scans on 4 fields. GET requests are exempt from the global rate limiter (`server.js:43`). | Escape regex metacharacters and cap the length, or use the existing `name` text index with `$text`. |
| Unbounded list endpoints | Medium | `server/controllers/productController.js:46-65` | Without `page`, `GET /api/products` returns **all** products with every embedded review. `limit` has no upper bound (`?page=1&limit=1000000`). | Cap `limit` (e.g. ≤ 100), always paginate, and project out `reviews` in list views. |
| Discount % isn't derived from the prices | Low | `server/controllers/adminController.js:37-45`; `client/src/pages/AdminProducts.jsx:93-99` | `discount` is stored separately from `price`/`originalPrice`, and the server never checks `originalPrice ≥ price` or recomputes `discount`. The UI can show "30% OFF" that doesn't match the two prices. The charged price is always `price`, so there's no money impact. | Compute `discount` on the server, or validate it. |
| Filter logic | OK | `server/controllers/productController.js:10-13` | OR within a facet (`$in`), AND across facets. That's correct. | — |
| Size validation at order time | OK | `server/controllers/paymentController.js:110-122` | The size must be in `product.sizes`. | — |

### Phase 3 — Cart & Wishlist

| Issue | Severity | File:Line | Description | Fix |
|---|---|---|---|---|
| Guest cart silently dropped on login | High | `client/src/redux/cartSlice.js:89-106` (`fetchCart.fulfilled`); `client/src/hooks/useCartSync.js:15-20` | When a user logs in, `fetchCart` **replaces** `state.items` with the DB cart. There's no merge. Items added as a guest vanish, then the empty or old DB cart is synced back. The guest cart also isn't persisted (`redux/store.js` has no persistence), so a refresh empties it. | On login, merge guest items into the DB cart (sum quantities per `productId+size`, clamp to stock) before syncing. Persist the guest cart in `localStorage`. |
| Cart stores client-supplied price/name/shippingCost | Medium | `server/controllers/cartController.js:18-23`, `:35, 56, 63`; `server/models/Cart.js:5-12` | The DB cart trusts client values. Checkout re-prices from the DB (`paymentController.js:124-125`), so what's charged is correct, but the cart page's totals (`Cart.jsx:24-26`) use these snapshot prices and can differ from what Razorpay charges. | Store only `{productId, size, qty}` and populate the current price. Or re-price on `getCart`. |
| Price change while item sits in cart | Medium | `client/src/pages/Cart.jsx:24-26, 828` vs `server/controllers/paymentController.js:124` | The summary shows the stale cart price, while the server charges the current DB price. The Razorpay modal shows a different amount from the page, with no "price changed" notice. | Return server-computed totals from `createOrder` and show a price-change warning before opening Razorpay. |
| Stock re-validated at checkout, but not per size and not atomically | High | `server/controllers/paymentController.js:103` | Checked once when the Razorpay order is created (product level), and **not** re-checked at payment confirmation (see Phase 7). Two lines for the same product in different sizes are each checked against the full stock, so qty 5 (M) + qty 5 (L) passes with `stock: 5`. | Sum quantities per product (or per SKU) before checking, and reserve stock atomically. |
| Local stock decrement on product page can shrink cart quantity | Low | `client/src/pages/ProductDetail.jsx:102-119`; `client/src/redux/cartSlice.js:41-54` | After "Add", the page lowers `product.stock` locally. A second "Add" passes that lowered value as `stock`, and the reducer clamps `existing.quantity` to it. Example: stock 5, add 3, add 1 → cart shows 2. | Don't mutate the displayed stock. Clamp against real stock minus the quantity already in the cart. |
| Cart page fetches each product separately | Low | `client/src/pages/Cart.jsx:34-46` | N GET requests per cart load. `ProductDetail.jsx:80-99` also polls every 3 s per open tab. | Use a batch endpoint (`/products?ids=`) and poll less often. |
| Wishlist → cart | OK (UI-level) | `client/src/pages/Wishlist.jsx:15-60` | Sized items are kept in the wishlist until the user picks a size, and out-of-stock items are kept. Wishlist sync has the same trust-the-client pattern (`wishlistController.js:14-26`), with low impact. | — |

### Phase 4 — Pricing, Discounts & Promotions

**Coupon engine:** `validateCoupon` (preview) and the authoritative re-check in `createOrder` (`paymentController.js:139-168`). Only one `couponCode` field exists, so **stacking isn't possible**. **Flash sales: not implemented** (no model, route or countdown; grep for `flash|countdown|sale` finds nothing). **Tax/GST: not implemented.** The UI says "Inclusive of all taxes" (`ProductDetail.jsx:408`), but no tax is computed or shown on invoices.

| Issue | Severity | File:Line | Description | Fix |
|---|---|---|---|---|
| **Negative or fractional quantity lets a buyer set their own price** | **Critical** | `server/controllers/paymentController.js:94-136` (`item.quantity` never validated), `:124`, `:251-254` | `quantity` is used straight from the request. `[{A, qty: 10}, {B, qty: -9}]` passes the stock check (`stock < -9` is false), gives a subtotal of 1 × price, charges that, and then at verify runs `$inc: { stock: +9 }` on B. `qty: 0.01` buys one item for 1% of its price. The only guard is `totalAmount > 0` (`:173`). | Require `Number.isInteger(qty) && qty >= 1 && qty <= MAX` for every line, and reject duplicate lines. Add `min: 1` to `Order.items.quantity`. |
| Coupon usage limit and once-per-user aren't atomic | High | Check: `server/controllers/paymentController.js:150-154`; increment: `:264-273` | The limit is checked when the order is created and incremented at verify. N users can each create orders while `usedCount < usageLimit`, and all get the discount. The increment is unconditional, so `usedCount` can exceed `usageLimit`. | At verify, run `findOneAndUpdate({code, $expr:{$lt:["$usedCount","$usageLimit"]}, usedBy:{$ne:userId}}, {$inc, $addToSet})` and handle a null result. Better: reserve the use at order creation. |
| Once-per-user coupon bypass via client `userId` | High | `server/controllers/paymentController.js:82, 153, 189` | `userId` comes from `req.body`, not `req.user.id`. Sending no `userId` or a random one skips the `usedBy` check and records the order against someone else (or nobody). | Use `req.user.id` everywhere and ignore body `userId`/`userEmail`/`userName`. |
| No validation on coupon create/update | Medium | `server/controllers/couponController.js:7-25`, `:44-64` | `discountValue` can be negative (which **raises** the price), percentages can exceed 100, `code` can be missing (a `toUpperCase` crash gives a 500). `updateCoupon` passes `req.body` straight through (`:57`) with no `runValidators`, so an admin can set `usedCount`/`usedBy`. | Validate input and whitelist updatable fields. Use `runValidators: true`. |
| All active coupons are public | Low | `server/controllers/couponController.js:153-169` | `GET /api/coupons` lists every active, unexpired code (including exhausted ones), so private or influencer codes can't exist. `validate` is only covered by the global 200 POST / 15 min limiter. | Add an `isPublic` flag and filter out exhausted coupons. Rate-limit `validate`. |
| Rounding | OK (traced) | `server/controllers/paymentController.js:160-180` | Example: subtotal ₹1,999 with 15% off gives 299.85, rounded to ₹300. Payable = 1,699 + shipping, and Razorpay gets `Math.round(total*100)` paise. The client preview uses the same `Math.round` (`couponController.js` validate). There's no drift with integer prices. With non-integer `price` values, float sums could differ by a paisa between the invoice and Razorpay. | Store money as integer paise. |
| Expiry / min-order enforced server-side | OK | `server/controllers/paymentController.js:147-157` | Expiry, `isActive` and `minOrderValue` (against the DB-computed subtotal) are re-checked at order creation. | — |

### Phase 5 — Checkout & Order Placement

**Sequence traced:**
1. `Cart.jsx:246 handleCheckout` calls `POST /payment/razorpay/order`.
2. On the server, `paymentController.createOrder` re-prices from the DB, checks stock and coupon, calls `razorpay.orders.create`, and saves an `Order` with `status:"created"` (`:79-209`).
3. Razorpay Checkout opens in the browser. On success, `POST /payment/razorpay/verify` runs `verifyPayment`, which marks the order paid, decrements stock, clears the cart, counts the coupon use and sends the email (`:211-313`).

**Reconciliation (traced in code):**
- `Order.totalAmount = Σ(db.price × qty) − round(discount)`, and `Order.shipping = Σ(db.shippingCost × qty)`.
- Razorpay amount = `round((totalAmount + shipping) × 100)` paise.
- The invoice and email Grand Total = `totalAmount + shipping`, and the email Subtotal = `totalAmount + discountAmount`.
- **Server-side these all agree.** The page summary (`Cart.jsx:828`) uses cart-snapshot prices instead and can differ (Phase 3). There's no tax line.

| Issue | Severity | File:Line | Description | Fix |
|---|---|---|---|---|
| Stock not re-verified at payment confirmation | **Critical** | `server/controllers/paymentController.js:249-256` | `verifyPayment` decrements stock with an unconditional `$inc: {stock: -qty}` and never re-checks availability. The only check ran at Razorpay order creation (`:103`), possibly many minutes earlier. Every concurrent checkout of the last unit succeeds, and stock goes negative (oversell). | Reserve stock at order creation with a conditional atomic update `updateOne({_id, stock:{$gte:qty}}, {$inc:{stock:-qty}})`, release it on expiry or failure, or do the conditional decrement at verify and auto-refund if it fails. |
| Order identity taken from the request body | High | `server/controllers/paymentController.js:82, 189-191` | `userId`, `userEmail` and `userName` come from `req.body` rather than the JWT. A user can create and pay for an order that appears in another user's account (`getUserOrders` filters by `userId`). They can also have the confirmation email sent to any address, with HTML injected via `userName` (Phase 11). | Derive all three from `req.user` and the `User` document. |
| No DB transaction around order placement or payment | High | `server/controllers/paymentController.js:236-273` | Order update, N stock decrements, cart clear and coupon increment are separate writes. A crash midway leaves the order paid with partial stock changes. Combined with the queue's automatic retry (Phase 6), a retry re-applies the earlier writes. | Wrap the writes in `session.withTransaction()` (Atlas replica sets support it), and make each step idempotent. |
| Shipping address not validated on the server | Medium | `server/controllers/paymentController.js:195` | `shippingAddress: shippingAddress \|\| {}`. The phone and pincode regexes run only in the client (`Cart.jsx:277-284`) and on profile save. A direct API call can create a paid order with no address. There's no pincode serviceability check. | Validate the address in `createOrder` (the same rules as `User.addresses`), or accept an address ID and look it up server-side. |
| Checkout button has no in-flight lock; errors swallowed | Medium | `client/src/pages/Cart.jsx:286-321, 832-838` | The button is disabled only when there are stock issues. A double-click creates two Razorpay orders and two `created` rows. Failures (insufficient stock, invalid coupon, verify failure) are only `console.error`'d, so the user sees nothing. If `/verify` throws after a successful payment, the user gets no feedback at all. | Add a `submitting` state and show `err.response.data.message`. On a verify failure, send the user to a "payment received, confirming…" page. |
| axios auto-retries non-idempotent POSTs | Medium | `client/src/services/api.js:24-40` | On `Network Error` or 502, every request is replayed, including `POST /payment/razorpay/order` and `/verify`. Replaying `/verify` double-decrements stock (Phase 6). | Retry only GETs, or send an idempotency key. |
| Shipping charged per unit | Low (assumption) | `server/controllers/paymentController.js:125`; `client/src/pages/Cart.jsx:26` | `shippingCost × quantity`, so 3 shirts cost 3× shipping. There's no free-shipping threshold. The client and server agree. The code doesn't say whether this is intended. | Confirm the business rule. |

### Phase 6 — Payment Integration (Razorpay)

| Issue | Severity | File:Line | Description | Fix |
|---|---|---|---|---|
| No webhook: paid orders can be lost | **Critical** | Nothing found (no webhook route; `grep -i webhook` only matches `package-lock.json`) | Confirmation depends entirely on the browser calling `/verify` after `handler` fires (`client/src/services/razorpay.js:30`). If the tab closes, the network drops or the JS throws after payment, the customer is **charged** but the order stays `created`. `created` orders are **hidden** from both the customer list (`orderController.js:8`) and the admin list (`orderController.js:122`), stock isn't decremented, and no email goes out. | Add a `POST /api/payment/razorpay/webhook` handling `payment.captured`, `order.paid`, `payment.failed` and `refund.processed`. Verify `X-Razorpay-Signature` against the raw body with the webhook secret, and share one idempotent "mark paid" function with `/verify`. Add a reconciliation job for stale `created` orders. |
| `verifyPayment` not idempotent (replay drains stock) | **High** | `server/controllers/paymentController.js:236-273` | `findOneAndUpdate({razorpayOrderId})` has no `status:"created"` guard. Re-posting the same valid `{order_id, payment_id, signature}` (the customer has all three, and axios retries too) re-runs everything: **stock decremented again**, coupon `usedCount` incremented again, a **new invoice number** issued, and another email sent. | Filter on `{razorpayOrderId, status:"created"}`. If nothing matches, return the existing order as success and skip the side effects. Add a unique index on `razorpayOrderId`. |
| Order-queue retry corrupts concurrency and repeats side effects | High | `server/utils/requestQueue.js:27-44`; used at `paymentController.js:81, 213` | (a) Every failed task, **including 400s** like "Insufficient stock" or "Invalid coupon", is retried 3 times with a 1 s gap, so the user waits about 3 s for a validation error. `createOrder` may call `razorpay.orders.create` up to 3 times. (b) `finally` decrements `processing` on each attempt, even while a retry is still scheduled, so `processing` goes negative and the "one at a time" guarantee quietly breaks after the first failure. (c) The queue lives in one process, so it gives no protection with more than one instance. | Retry only transient errors (network/5xx from Razorpay), never validation errors. Fix the counter by decrementing only when the task finally settles. Replace the queue with DB-level atomic operations and transactions. |
| Payment failure never recorded | Medium | `client/src/services/razorpay.js:31`; `client/src/pages/Cart.jsx:315-317` | Modal dismissal and `payment.failed` are only logged in the browser. `status:"failed"` is never set automatically. It exists only as a manual admin option (`orderController.js:172`), and `created` rows pile up forever. | Handle the `payment.failed` event and webhook. Set `failed`, and expire `created` orders after N minutes. |
| Missing or invalid signature causes a 500 and 3 retries | Low | `server/controllers/paymentController.js:222` | `Buffer.from(undefined, "hex")` throws a TypeError, giving a 500 after 3 queued retries. It correctly fails closed. | Validate that the three fields are present and are hex strings first, and return a 400. |
| Razorpay client silently falls back to fake keys | Low | `server/config/razorpay.js:4-5` | Missing env vars produce the credentials `"test_key_id"`/`"test_key_secret"` instead of a startup failure. | Fail fast at boot when the keys are missing. |
| Signature verification | OK | `server/controllers/paymentController.js:216-231` | HMAC-SHA256 of `order_id\|payment_id` with the key secret, compared with `timingSafeEqual`. It's enforced: a mismatch throws a 400 before any write. The amount is tied to the server-created Razorpay order. | — |
| Duplicate submission | Partially mitigated | See the Phase 5 checkout-button row | Duplicate *payment* for one Razorpay order isn't possible (Razorpay enforces that per order), but duplicate *orders* are. | — |
| Refunds | **Not implemented** | Nothing found (no `razorpay.payments.refund` or `refunds` call anywhere) | Cancellation and return emails promise a "full refund … to your original payment method" (`orderController.js:230, 238, 278`), but no code issues one, and there's no refund record, amount or status. Refunds are entirely manual in the Razorpay dashboard, with no link back to the order. | Call `razorpay.payments.refund(order.razorpayPaymentId, {amount})` on cancel or approved return. Store `refundId`, `refundAmount` and `refundStatus`, and sync them via the `refund.*` webhooks. |
| Card data | OK | `client/src/services/razorpay.js` | Card entry happens entirely in Razorpay Checkout. The server stores only `razorpayOrderId`/`razorpayPaymentId`. `console.error("Create order error:", error)` (`paymentController.js:206`) logs whole Razorpay error objects but never card data. | — |

### Phase 7 — Inventory Management

**When stock is deducted:** at **payment verification**, `server/controllers/paymentController.js:249-256`, using an unconditional `Product.findByIdAndUpdate(id, {$inc:{stock:-qty}})`. It's never reserved at order creation. It's restored by `restoreOrderStock` (`orderController.js:154-166`) on customer cancel (`:272`) and on an admin status change to `returned`/`cancelled` (`:198-200`).

**Race simulation, two buyers and one unit left (stock = 1):**
1. Buyer A runs `createOrder`: `1 < 1` is false, so it passes, and a `created` order is saved. Nothing is reserved.
2. Buyer B runs `createOrder` (the queue serialises it, but stock is still 1): it passes too.
3. Both pay. A's `verify` runs `$inc -1`, making stock 0. B's `verify` runs `$inc -1`, making stock **−1**.

Result: **the item is double-sold.** Each `$inc` is atomic, but there's no `stock >= qty` predicate, so the atomicity doesn't prevent the oversell.

| Issue | Severity | File:Line | Description | Fix |
|---|---|---|---|---|
| Check-then-act oversell; stock can go negative | **Critical** | `server/controllers/paymentController.js:103` (check) vs `:251-254` (decrement) | As simulated above. Also fed by the negative-quantity exploit (Phase 4), verify replay (Phase 6) and the missing per-size stock (Phase 2). | Use a conditional atomic decrement `updateOne({_id, stock:{$gte:qty}}, {$inc:{stock:-qty}})` and check `modifiedCount`, inside a transaction. Add `min: 0` to `Product.stock`. |
| Stock is per product, not per size or colour | High | `server/models/Product.js:25` | See Phase 2. | Model stock per SKU. |
| Stock restored for orders that never deducted it | High | `server/controllers/orderController.js:198-200` | An admin can move a **`created`** (unpaid, never-deducted) order to `cancelled`, and `restoreOrderStock` **adds** phantom stock. Combined with the Phase 1 authorization gap, any customer can do this to inflate stock. | Restore only when the order's stock was actually deducted (track `stockDeducted: true` on the order). |
| Double restore via status cycling | High | `server/controllers/orderController.js:198-202` | The guard only compares against the *immediately previous* status. `paid → cancelled` (restore) → `paid` (no re-deduct) → `cancelled` (restore again). Same with `returned`. Each cycle adds stock. | Enforce a state machine (Phase 8) and the `stockDeducted` flag. |
| Customer cancel isn't atomic | Medium | `server/controllers/orderController.js:260-272` | Read status, check `=== "paid"`, save, then restore. Two concurrent cancel requests both see `paid`, and both restore stock. | `findOneAndUpdate({_id, userId, status:"paid"}, {status:"cancelled"})`, and restore only if a document matched. |
| Admin stock edit overwrites concurrent sales | Medium | `server/controllers/adminController.js:153` | `updateProduct` writes an absolute `stock` from a form loaded earlier, silently undoing any sales since then. There's no `runValidators`, so `category`/enum and `min` constraints are skipped. | Send stock adjustments as deltas (`$inc`), or use optimistic concurrency (`__v`). Pass `runValidators: true`. |
| Catalog "in stock" vs inventory | OK (single source) | `client/src/components/ProductCard.jsx:109` | There's no separate `inStock` flag. The UI derives it from `stock`, so the two can't drift. Negative stock still renders as out of stock. | — |

### Phase 8 — Order Lifecycle

**Statuses** (`server/models/Order.js:37`): `created, paid, shipped, delivered, return-requested, exchange-requested, returned, exchanged, failed, cancelled`. There's no `processing`/`packed`/`refunded`.

| Issue | Severity | File:Line | Description | Fix |
|---|---|---|---|---|
| No state machine: any transition allowed | High | `server/controllers/orderController.js:171-202` | `updateOrderStatus` only checks that the target is in an allow-list. `delivered → paid`, `cancelled → shipped`, `returned → paid`, and even `created` (unpaid) `→ delivered` are all accepted. The only guard is the admin UI's `getNextActions` (`client/src/pages/AdminOrders.jsx:110-124`), which the server doesn't enforce. | Define `ALLOWED_TRANSITIONS = {paid:["shipped","cancelled"], shipped:["delivered"], delivered:["return-requested","exchange-requested"], ...}` and reject anything else with a 409. Apply it with a conditional `findOneAndUpdate` on the current status. |
| Status saved, then the request fails (500) | High | `server/controllers/orderController.js:245, 283` | `buildStatusEmailHtml` isn't defined anywhere (ESLint `no-undef`). With email configured, which is the current `.env` setup, every change to `shipped/delivered/returned/exchanged/cancelled`, and every customer cancel, **saves the change and then throws a ReferenceError, returning a 500**. Customers get no shipping, delivery or cancel emails. The admin UI shows an error for a change that actually went through. | Implement or import `buildStatusEmailHtml`, and move notifications after the response or into a try/catch so they can't fail the request. |
| Cancellation window | OK (status-based) | `server/controllers/orderController.js:263` | Customer cancel is allowed only in `paid` (before `shipped`). It's enforced server-side and tied to shipping status, not time. | — |
| Rejected return on an unshipped order becomes "delivered" | Low | `client/src/pages/AdminOrders.jsx:114-120` | A return can be requested while `paid` (Phase 9), and "Reject" sets `delivered` even though nothing shipped. | Reject back to the previous status. |
| Partial / split shipments | Not implemented | `server/models/Order.js:39-40` | One `trackingNumber`/`carrierName` per order, and no item-level status. | Add a `shipments[]` subdocument with item references if split shipping is needed. |
| Invoice number collisions | Medium | `server/controllers/paymentController.js:11-18` | `EXT-YYYYMMDD-` plus 4 random digits (9,000 values per day) with no unique index. Collisions become likely around 100 orders a day (birthday bound), and the number changes on every verify replay. There's no sequential numbering, which Indian GST invoices require. | Use an atomic counter collection (`findOneAndUpdate({_id:"invoice"}, {$inc:{seq:1}})`) with a unique index, assigned once. |
| Invoice has no tax breakdown | Medium (compliance, assumption) | `server/utils/pdfGenerator.js:168-190`; `client/src/utils/invoiceGenerator.js:152-183` | No GSTIN, HSN or CGST/SGST/IGST lines. Two separate invoice implementations (server `pdfGenerator.js` and client `invoiceGenerator.js`, both jsPDF) duplicate the totals logic and can drift. | Generate one server-side invoice with tax lines. The client should download it. |

### Phase 9 — Returns, Exchanges & Refunds

**Implemented:**
- **Returns and exchanges:** whole-order requests only (`orderController.js:46-115`).
- **Admin approval:** `returned` restores stock; `exchanged` does nothing.
- **Refunds:** none (see Phase 6).

| Issue | Severity | File:Line | Description | Fix |
|---|---|---|---|---|
| Return window measured from payment, not delivery | High | `server/controllers/orderController.js:56-58, 92-94` | `daysSinceOrder` uses `paidAt`. Policy text says "within 7 days of delivery" (`paymentController.js:72`, `orderController.js:226`). If shipping takes 7 days or more, the customer can never return. There's no `deliveredAt` field. | Record `deliveredAt` when the status becomes `delivered`, and measure the window from it. |
| Returns and exchanges allowed before shipment | Medium | `server/controllers/orderController.js:52, 88` | Allowed when the status is `paid` (not shipped yet), which overlaps with cancel. | Allow only from `delivered`. |
| Size exchange isn't modelled; inventory desyncs | High | `server/controllers/orderController.js:82-115`, `:198` | The request takes only a free-text `reason`, with no target size or variant. Approving (`exchanged`) neither restocks the returned item nor deducts the replacement. Every exchange leaves stock wrong by the exchanged quantity: the returned unit never comes back, and the replacement is shipped without being deducted. | Capture `{itemId, fromSize, toSize}`, and check and reserve the replacement's stock. On approval, `+1` the returned variant and `−1` the new variant in one transaction, and create a replacement shipment. |
| Refund amount and discount proration | Not implemented | `server/controllers/orderController.js:230, 238, 278` | Only whole-order refunds are *promised*, as `totalAmount + shipping` (already net of discount, so the amount is right for a full return). There's no item-level return, so nothing is prorated, and no refund is actually executed or tracked. | For item-level returns, refund `lineTotal − lineTotal/subtotal × discountAmount`, and decide whether shipping is refundable. |
| Refund status sync | Not implemented | Nothing found | No gateway polling or webhook. | See the Phase 6 refund row. |
| Return can be re-requested after rejection | Low | `server/controllers/orderController.js:52` | Rejected orders go back to `delivered`, which is eligible again inside the window. | Track `returnRejectedAt` and block repeats. |
| Returns notification sent to a hard-coded personal address | Low | `server/controllers/orderController.js:68, 104`; `server/controllers/contactController.js:21` | `to: "janassistai@gmail.com"` is hard-coded in three places. | Move it to `ADMIN_NOTIFY_EMAIL` in the env. |

### Phase 10 — Reviews & Ratings

Reviews are embedded in `Product.reviews`. The only endpoint is `POST /api/products/:id/reviews` (`productController.addReview`, `server/controllers/productController.js:81-116`). There's no edit endpoint (re-posting overwrites) and **no delete endpoint**.

| Issue | Severity | File:Line | Description | Fix |
|---|---|---|---|---|
| No verified-purchase check | Medium | `server/controllers/productController.js:81-111` | Any logged-in account can review any product. There's no lookup of a `delivered` order containing the product. (The UI doesn't claim "verified purchase", so this is a trust gap rather than a false claim.) | Require an order with `status: "delivered"` containing `productId` for `req.user.id`, and flag those reviews as verified. |
| 500 MB in-memory upload open to every user | **High** | `server/middleware/upload.js:5`; `server/routes/productRoutes.js:13` | `multer.memoryStorage()` with `fileSize: 500 MB` on the review-image route, which any logged-in user can reach. A few concurrent 500 MB uploads exhaust server RAM. `resource_type: "auto"` also accepts any file type into Cloudinary. | Limit review images to about 5 MB with an image MIME allow-list, and stream to Cloudinary instead of buffering. |
| New products show a fake 4.0 rating | Medium | `server/models/Product.js:27` | `ratings` defaults to `4.0` with `numOfReviews: 0`, so unreviewed products display 4 stars. That's misleading to consumers. | Default to `0` or `null` and hide stars when there are no reviews. |
| Invalid rating causes a 500 | Low | `server/controllers/productController.js:97, 104` | `Number("abc")` is NaN, which fails the cast and returns a 500. Out-of-range values are caught by schema `min`/`max`, but also as a 500. | Validate `1 ≤ int(rating) ≤ 5` and a comment length, and return a 400. |
| Aggregate recalculation | OK | `server/controllers/productController.js:107-109` | Recomputed from every review on each add or edit. It's correct because no delete exists. | Recompute on delete once one is added. |
| Spam / abuse | Partial | `server/controllers/productController.js:93-106` | One review per user per product (re-posting overwrites). No comment length cap, profanity filter or moderation queue. Rate limiting is only the global 200 POST / 15 min. | Add length limits, a moderation flag and a per-user rate limit. |

### Phase 11 — Notifications

| Event | Trigger point | Works? |
|---|---|---|
| Order placed / paid | `server/controllers/paymentController.js:276-299` (fire-and-forget, with PDF attached) | Yes. Re-sent on every verify replay. |
| Shipped / delivered / returned / exchanged / admin-cancelled | `server/controllers/orderController.js:213-248` | **No.** It throws a ReferenceError: `buildStatusEmailHtml` is undefined (`:245`). |
| Customer-cancelled | `server/controllers/orderController.js:275-285` | **No.** Same undefined function (`:283`), and the API returns a 500 after the cancel has already happened. |
| Return / exchange requested (to admin) | `server/controllers/orderController.js:66-73, 102-109` | Yes (plain text, hard-coded recipient). |
| Payment failed | Nothing found | Not implemented |
| OTP | `server/utils/emailSender.js:6-29` | Yes |

| Issue | Severity | File:Line | Description | Fix |
|---|---|---|---|---|
| Status notifications crash | High | `server/controllers/orderController.js:245, 283` | See Phase 8. | Define the template function. |
| HTML injection in customer emails | Medium | `server/controllers/paymentController.js:25, 44`; `server/controllers/orderController.js:217, 278` | `userName` (from the request body, Phase 5), `cancelReason` (from the request body) and product names are put into HTML emails unescaped. An attacker can inject links or markup into mail sent from the store's domain (phishing). | HTML-escape every interpolated value. |
| Template placeholders | Mostly guarded | `server/controllers/paymentController.js:44, 48, 50`; `server/utils/pdfGenerator.js:76, 100, 104, 121` | Most fields fall back (`\|\| "Customer"`, `\|\| "N/A"`). `order.invoiceNumber` is interpolated without a fallback in the status emails (`orderController.js:220-238`), but it always exists for paid orders. `order.shipping.toLocaleString` (`paymentController.js:68`) is safe thanks to the schema default. | — |
| Sending is in the request path | Low | `server/controllers/orderController.js:241-247` | Fire-and-forget is fine, but there's no retry or queue, so failures are only logged. | Use a job queue with retries (e.g. BullMQ). |

### Phase 12 — Admin Panel

| Issue | Severity | File:Line | Description | Fix |
|---|---|---|---|---|
| Order admin routes not role-protected | **Critical** | `server/routes/orderRoutes.js:9-10` | See Phase 1. | Add `requireRole("admin")`. |
| `updateProduct` mass-assignment without validators | Medium | `server/controllers/adminController.js:81, 153` | `{...req.body}` goes straight into `findByIdAndUpdate` without `runValidators`, so an invalid `category`, an empty `name`, or edits to `reviews`/`ratings`/`numOfReviews` are all accepted. Non-numeric `price` returns a 500. | Whitelist fields, set `runValidators: true`, and validate numbers with `Number.isFinite`. |
| Manual cancel side effects | Partially correct | `server/controllers/orderController.js:198-200` | A manual cancel **does** restore stock, but it also restores stock for unpaid `created` orders, can double-restore (Phase 7), issues no refund (Phase 6), and returns a 500 because of the email bug (Phase 8). | See the earlier phases. |
| Analytics disagree between screens | Medium | `client/src/pages/AdminDashboard.jsx:58-59` vs `client/src/pages/AdminOrders.jsx:130` | The dashboard excludes `failed/cancelled/returned/created`. The Orders page excludes only `failed/returned`, so it **counts cancelled orders and pending returns as revenue**. Both compute on the client from the full, unpaginated `/orders/admin` list, and both count shipping as revenue. | Use one server-side aggregation (`$match: {status: {$in: ["paid","shipped","delivered"]}}`) with a documented revenue definition. |
| Deleting a product leaves dangling references | Low | `server/controllers/adminController.js:180-188` | Carts and wishlists keep the `productId`. Order snapshots survive, but `restoreOrderStock` quietly no-ops. | Soft-delete (`isActive:false`), and prune carts. |
| Admin identity split across two collections | Low | `server/models/Admin.js`; `server/models/User.js:9`; `server/controllers/authController.js:59-93, 174-196` | Admins can be `Admin` documents or `User.role="admin"`. `deleteUser`'s self-check (`adminController.js:227`) only works for the latter. | Consolidate into one collection. |
| Admin CRUD create validation | OK | `server/controllers/adminController.js:33-70` | Create checks required fields, non-negative numbers, discount between 0 and 100, and unique non-empty sizes. | — |
| Server-side authorization for `/api/admin/*` | OK | `server/routes/adminRoutes.js:9-10` | — | — |

### Phase 13 — Security

| Issue | Severity | File:Line | Description | Fix |
|---|---|---|---|---|
| Broken access control on orders (PII of all customers) | **Critical** | `server/routes/orderRoutes.js:9-10`; `server/middleware/auth.js:4-16` | See Phase 1. Reachable with an OTP token for any new email, so no account is needed. | See Phase 1. |
| IDOR through the Razorpay order-ID fallback | High | `server/controllers/orderController.js:33-36` | For non-admins, `findOne({_id, userId})` with a non-ObjectId `:id` throws a CastError. The `catch` then runs `findOne({razorpayOrderId: req.params.id})` **without the `userId` check**. `GET /api/orders/order_XXXXXXXX` returns any customer's order: address, phone, items, payment ID. Razorpay order IDs appear in browser traffic, receipts and support tickets. | Put the ownership check in the fallback as well: `findOne({razorpayOrderId, userId: req.user.id})`. |
| Write-side IDOR on order creation | High | `server/controllers/paymentController.js:82, 189-191` | See Phase 5. | Use `req.user`. |
| JWTs in `localStorage` | Medium | `client/src/redux/authSlice.js:50-54`; `client/src/services/api.js:11-13` | Any XSS exposes a 7-day token. (No cookies are used, so `httpOnly`/`secure` don't apply.) React escaping and the absence of `dangerouslySetInnerHTML` (grep finds none) lower the XSS risk. | Consider `httpOnly; Secure; SameSite` cookies with CSRF protection, plus short-lived access tokens. |
| Committed JWTs and default credentials | Medium | `server/test_tokens.json`; `server/seed.js:18, 26`; `server/create_test_accounts.js:20, 39` | See §0.6. | Delete the file and purge it from history, rotate `JWT_SECRET`, remove the hard-coded fallback passwords, and never log passwords. |
| Regex injection / ReDoS | Medium | `server/controllers/productController.js:19-26` | See Phase 2. | Escape the input. |
| Rate limiting | Partial | `server/server.js:40-54` | Login, OTP and reset: 20 per 15 min per IP (too broad, Phase 1). Coupon validate and contact: only the global 200 POST / 15 min. All GETs are unlimited. OTP resend has a 60 s per-email cooldown. | Add per-endpoint limiters (coupon validate about 10 / 15 min, contact about 5 / hour) and a looser GET limiter. |
| CORS allow-list includes personal ngrok tunnels | Low | `server/server.js:30` | Two `*.ngrok-free.dev` origins are hard-coded. If those tunnel names are ever claimed by someone else, they're trusted origins. Requests with no `Origin` header are allowed (normal for non-browser clients). | Take origins from the env only. |
| SQLi / NoSQLi | OK | `server/server.js:57` | No SQL. `express-mongo-sanitize` strips `$` and `.` keys from body, query and params. No `eval(`, `new Function`, or `$where` (grep found none). | — |
| Unused and extra packages | Low | `server/package.json` | `resend` and `pdfkit` are installed but not imported (grep). Extra attack surface. | Remove them. |

**IDOR check per sensitive endpoint:**

| Endpoint | Ownership check | Result |
|---|---|---|
| `GET /api/orders` | `userId: req.user.id` (`orderController.js:8`) | OK |
| `GET /api/orders/:id` | `userId` on the ObjectId path; **none on the fallback** (`:35`) | **Vulnerable** |
| `POST /api/orders/:id/cancel\|return\|exchange` | `userId: req.user.id` (`:49, 85, 260`) | OK |
| `GET /api/orders/admin`, `PUT /api/orders/:id/status` | **No role check** | **Vulnerable** |
| `GET/PUT /api/auth/profile` | `req.user.id` | OK |
| `/api/cart/*`, `/api/wishlist/*` | `req.user.id` | OK |
| `POST /api/payment/razorpay/order` | **Trusts body `userId`** | **Vulnerable (write)** |

### Phase 14 — Performance & Data Integrity

| Issue | Severity | File:Line | Description | Fix |
|---|---|---|---|---|
| All checkouts serialised through one in-process queue | High | `server/utils/requestQueue.js:48`; `server/controllers/paymentController.js:81, 213` | Concurrency 1 means every create and verify, for every shop user, waits in one line, each including a Razorpay API round-trip. Validation failures add about 3 s of retry (Phase 6). It doesn't scale across instances either. | Remove the queue and rely on atomic DB operations and transactions. |
| Payment confirmation not idempotent | **High** | `server/controllers/paymentController.js:236` | See Phase 6. No webhook exists to be idempotent in the first place. | Add a status guard and a unique index. |
| Unpaginated admin lists | Medium | `server/controllers/orderController.js:122-125` (all orders, with `populate`); `server/controllers/adminController.js:194` (all users); `server/controllers/couponController.js:36` | These grow without bound, and the dashboard downloads everything on each load. | Paginate on the server, and move stats to aggregations. |
| Product list returns embedded reviews | Medium | `server/controllers/productController.js:54, 62-64` | List responses include every review of every product. | Use `.select("-reviews")` for list views. |
| Serial per-item queries in checkout | Low | `server/controllers/paymentController.js:94-95, 250-255`; `server/controllers/orderController.js:156-161` | `findById` and `$inc` run in a loop, one per line item. Carts are small, so the impact is low. | Use `find({_id:{$in}})` and `bulkWrite`. |
| Client N+1 and 3 s polling | Low | `client/src/pages/Cart.jsx:34-46`; `client/src/pages/ProductDetail.jsx:80-99` | See Phase 3. | Batch requests and poll less often. |
| Missing indexes | Low | `server/models/Order.js:48-49` | `razorpayOrderId` is indexed but not `unique`. No index on `status` (the admin list filters by status), and no unique index on `invoiceNumber`. | Add them. |
| Pagination on the storefront | OK | `server/controllers/productController.js:50-58` | Paginated mode is supported when `page ≥ 1`. | Cap `limit`. |

### Phase 15 — API & Error Handling

| Issue | Severity | File:Line | Description | Fix |
|---|---|---|---|---|
| Internal error messages returned to clients | Medium | Every controller's `catch` (e.g. `server/controllers/authController.js:104, 169, 194`; `server/controllers/cartController.js:10`; `server/controllers/orderController.js:13`) | `res.status(500).json({ message: error.message })` exposes Mongoose, driver and runtime messages, for example `Cast to ObjectId failed for value … at path "_id" for model "Order"` or `buildStatusEmailHtml is not defined`. There are no stack traces: the global handler at `server.js:80-83` is safe, but controllers never reach it. | Log the details on the server, and return a generic message plus an error code. |
| Validation errors returned as 500 | Low | e.g. `server/controllers/cartController.js:70`, `server/controllers/productController.js:113` | CastErrors and ValidationErrors become 500s. There's no central mapping, and duplicate-key responses are inconsistent (400 vs 409). | Map `CastError`/`ValidationError` to 400 and E11000 to 409. |
| Inconsistent response shapes | Low | `server/controllers/productController.js:58` vs `:65`; `server/controllers/wishlistController.js` toggle vs remove | `/products` returns an array or `{products, total…}` depending on `page`. Toggle returns `{items, added}`, while remove returns a bare array. | Standardise on an `{data, meta}` envelope. |
| Minimal logging on money paths | Medium | `server/controllers/paymentController.js:206, 310`; `server/controllers/orderController.js` (none) | Only errors reach `console.error`. There's no structured log of order creation, payment verification, stock changes, admin status changes (who changed what), or restocks. You can't audit or reconcile. | Use a structured logger (pino) with `orderId`, `userId` and `actor`, plus an `OrderEvent` audit collection. |
| Global error handler | OK | `server/server.js:80-83` | Logs `err.message` and returns a generic 500 without the stack. | — |

---

## Executive Summary

### Overall health: **Not ready for production**

The storefront UI, catalog browsing, auth flows and admin CRUD are reasonably built. The basic hardening layer (helmet, mongo-sanitize, bcrypt, HMAC payment verification with `timingSafeEqual`, server-side re-pricing) is in place.

The **money and inventory core is unsafe**, for four reasons:
- Authorization on order management is effectively missing.
- The checkout trusts the client-supplied quantity and user identity.
- Stock is checked at one point and decremented at another, with no reservation, no per-size tracking and no idempotency.
- There's no webhook or refund integration, so paid orders can disappear and every refund is manual and untracked.

The notification path for status changes crashes on every call.

There are no automated tests. `test_cases_report.md` claims 100/100 passing, but several of its claims contradict the code, so don't rely on it.

### Top 5 Critical Issues

1. **Any logged-in user, or anyone holding a signup-OTP token, can read every customer's orders and change any order's status.**
   - Where: `server/routes/orderRoutes.js:9-10`, `server/middleware/auth.js:4-16`, `server/controllers/authController.js:161-165`.
   - Impact: a full PII leak (names, phones, addresses). Stock can be inflated through `cancelled`/`returned`, and false refund emails get sent.
2. **Buyers can set their own price with negative or fractional quantities.**
   - Where: `server/controllers/paymentController.js:94-136` (no quantity validation), and stock inflated at `:251-254`.
3. **Overselling: there's no stock reservation or conditional decrement, and stock is per product rather than per size.**
   - Where: `server/controllers/paymentController.js:103` vs `:249-256`, and `server/models/Product.js:25`.
   - Impact: two buyers can both buy the last unit, and stock goes negative.
4. **No Razorpay webhook, so a customer can be charged while the order stays invisible.**
   - Where: `client/src/services/razorpay.js:30` is the only confirmation path. `created` orders are hidden at `server/controllers/orderController.js:8, 122`.
5. **Payment confirmation isn't idempotent, and the retrying queue repeats side effects.**
   - Where: `server/controllers/paymentController.js:236-273`, `server/utils/requestQueue.js:27-44`, `client/src/services/api.js:24-40`.
   - Impact: replaying `/verify` decrements stock again, counts the coupon use again, and reissues the invoice number and email.

Just outside the top 5: the **IDOR through the Razorpay order-ID fallback** (`orderController.js:33-36`), the **status-email ReferenceError** (`orderController.js:245, 283`), and **refunds not being implemented**.

### Must fix before launch

| # | Item | Location |
|---|---|---|
| 1 | Add `requireRole("admin")` to the order admin routes. Enforce the token `type` in both middlewares, and use a separate audience for OTP tokens. | `server/routes/orderRoutes.js:9-10`, `server/middleware/auth.js` |
| 2 | Validate `quantity` as an integer ≥ 1, merge duplicate lines, and take the user identity from `req.user`. | `server/controllers/paymentController.js:82-136` |
| 3 | Atomic conditional stock decrement or reservation inside a transaction, and `min: 0` on stock. | `server/controllers/paymentController.js:103, 249-256` |
| 4 | Make `/verify` idempotent (`status:"created"` guard, unique `razorpayOrderId`). Fix or remove `RequestQueue`, and stop axios retrying POSTs. | `server/controllers/paymentController.js:236`, `server/utils/requestQueue.js`, `client/src/services/api.js:24-40` |
| 5 | Add a Razorpay webhook with signature verification and a reconciliation job for `created` orders. | new route |
| 6 | Put the ownership check in the `getOrderById` fallback. | `server/controllers/orderController.js:33-36` |
| 7 | Define `buildStatusEmailHtml`, and keep email failures from failing the request. | `server/controllers/orderController.js:245, 283` |
| 8 | An order state machine with a `stockDeducted` flag, so restores can't repeat or happen on unpaid orders. | `server/controllers/orderController.js:171-202` |
| 9 | Make coupon usage limit and once-per-user atomic. | `server/controllers/paymentController.js:150-154, 264-273` |
| 10 | Cap uploads (about 5 MB, images only) on the review route. | `server/middleware/upload.js:5` |
| 11 | Delete `test_tokens.json`, rotate `JWT_SECRET`, and remove the hard-coded admin passwords from the scripts. | `server/test_tokens.json`, `server/seed.js:18-26`, `server/create_test_accounts.js` |
| 12 | Measure the return window from `deliveredAt`. | `server/controllers/orderController.js:56, 92` |

### Fix soon

- **Per-size SKU inventory**, and exchange handling that moves stock between variants (Phases 2, 7, 9).
- **Refund integration:** `payments.refund` plus a stored refund record and status (Phases 6, 9).
- **Carts:** merge the guest cart on login and persist it; validate and re-price in `syncCart`; show a price-change notice at checkout (Phase 3).
- **Checkout button:** in-flight lock plus visible error messages (`client/src/pages/Cart.jsx:286-321`).
- **Order placement:** server-side address validation (`server/controllers/paymentController.js:195`).
- **Token lifecycle:** revocation or `tokenVersion`, current password required for password changes, narrower rate limiters (Phase 1).
- **Search:** escape the regex; cap list sizes and paginate admin lists (Phases 2, 14).
- **Invoices:** sequential, unique invoice numbers with a GST breakdown (Phase 8).
- **Emails:** HTML-escape everything interpolated into them (Phase 11).
- **Reporting:** one server-side revenue aggregation (Phase 12).
- **Error handling:** generic 500 messages, correct 400/409 mapping, structured audit logs on money paths (Phase 15).
- **Coupons:** validate admin input (`server/controllers/couponController.js:7-64`).

### Nice to have

- Verified-purchase reviews, a delete-review endpoint, and no fake 4.0 default rating (Phase 10).
- OTPs in Redis or Mongo using `crypto.randomInt` (Phase 1).
- Batch product fetch and less aggressive stock polling (Phase 3).
- Remove the ngrok CORS origins, the unused `resend`/`pdfkit` packages, and the hard-coded admin notification email.
- Consolidate the two admin identity stores, and use integer-paise money storage.
- Add an automated test suite (Jest/Vitest + Supertest + mongodb-memory-server). Start with the checkout and verify path, the authorization matrix, and the order state machine, then retire the unverified `test_cases_report.md`.

### Features the brief asked about that don't exist

| Feature | Status |
|---|---|
| Guest checkout | Not supported (login required) |
| Variants / SKU, colour, fit | Not supported |
| Per-product size charts | Static page only |
| Flash sales | Not implemented |
| Tax / GST calculation | Not implemented |
| Payment webhooks | Not implemented |
| Refund execution and status sync | Not implemented |
| Partial / split shipments | Not implemented |
| Item-level returns | Not implemented |
| Review moderation and deletion | Not implemented |

---

## Remediation Status (2026-09-27)

Fixes applied to the working tree (not committed). Verified by `server: npm test` (34 end-to-end scenarios against in-memory MongoDB with Razorpay mocked, all passing), `npm run lint` on server and client (clean), `vite build` (succeeds), `npm audit --omit=dev` (0 vulnerabilities on both), and a boot of `server.js` in production mode.

| Area | Status | Where |
|---|---|---|
| Order admin routes open to any JWT; OTP token usable as a session | Fixed: per-type JWT audiences, and role plus token version checked against the DB on every request | `server/middleware/auth.js`, `server/utils/tokens.js` |
| Negative or fractional quantity price manipulation | Fixed: integer 1–20 per line, duplicate lines merged | `server/controllers/paymentController.js` (`priceItems`) |
| Oversell / no per-size stock | Fixed: per-size `sizeStock` (backward compatible) and atomic conditional reservation at checkout, released on dismiss or expiry (30 min) | `server/utils/inventory.js`, `server/models/Product.js` |
| No webhook; non-idempotent verify; retrying queue | Fixed: signed webhook, one idempotent `markOrderPaid` that checks amount and order with Razorpay, queue removed | `server/services/orderService.js`, `server/app.js` |
| No refunds | Fixed: automatic full Razorpay refund on cancel or approved return, stored on the order, with admin retry and a webhook sync | `issueRefund`, `POST /api/orders/:id/refund` |
| Order IDOR (Razorpay ID fallback) and body `userId` | Fixed | `server/controllers/orderController.js`, `paymentController.js` |
| Status emails crashed (`buildStatusEmailHtml`) | Fixed: escaped templates, notifications can't fail a request | `server/utils/emailTemplates.js` |
| No order state machine; phantom or double restocks | Fixed: transition table, conditional updates, idempotent `stockReserved`/`couponReserved` flags | `orderController.js` |
| Return window from payment; returns before delivery; exchange didn't move stock | Fixed: `deliveredAt` window, returns and exchanges only when delivered, size exchange reserves the new size and restocks the old one | `orderController.js`, `client/src/pages/Orders.jsx` |
| Coupon limits not atomic; once-per-user bypass; no admin validation; private codes listed | Fixed | `couponController.js`, `reserveCouponUse` |
| Guest cart dropped on login; client prices trusted in cart | Fixed: guest cart persisted and merged, cart re-priced from the DB | `client/src/redux/cartSlice.js`, `server/controllers/cartController.js` |
| 500 MB uploads, regex injection, unbounded lists, leaked error messages, limiter scope, CORS ngrok origins | Fixed | `middleware/upload.js`, `productController.js`, `utils/httpError.js`, route files, `app.js` |
| Committed tokens and default admin passwords | Removed from the tree; seed scripts guarded | `server/seed.js` and others |
| Revenue mismatch between admin screens | Fixed: one server aggregation | `GET /api/orders/admin/stats` |
| Tests | Added | `server/tests/e2e.test.mjs` |

**Still open (need a business decision, or are larger design changes):**
- GST/tax invoices (needs GSTIN, HSN codes and rates).
- Item-level (partial) returns.
- Moving JWTs from `localStorage` to httpOnly cookies.
- Merging the two admin identity stores.
- `test_cases_report.md` is outdated.
