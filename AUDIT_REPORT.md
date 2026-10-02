# Extract Menswear — Production-Readiness Audit (Re-audit)

- **Re-audit date:** 2026-09-28, plus a deployment-readiness pass on 2026-09-30 (§3A)
- **Branch audited:** `production-readiness`, after the fixes from the first audit (2026-09-27, commit `2708e7c` on `main`)
- **Method:** every server file re-read from scratch and the checkout, payment and order flows traced end to end, with key client pages checked against the server. Findings from the first audit were re-verified against the current code rather than assumed fixed. Business rules are exercised by an automated end-to-end suite (in-memory MongoDB, Razorpay mocked).
- **Line numbers** point to the files on this branch.

---

## 0. System Map

### 0.1 Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 7, Redux Toolkit, React Router 7, Tailwind 4, axios |
| Backend | Node.js 20+ (ESM), Express 4. `server/app.js` holds the app and `server/server.js` handles config checks and startup. |
| Database | MongoDB via Mongoose 8. Data fixes run automatically at startup (`server/utils/startupMigrations.js`). |
| Payments | Razorpay Orders + Checkout. Signed browser callback **and** a signed webhook both go through one idempotent path. Automatic refunds. |
| Auth | JWT (HS256), a separate audience per token type, and role/token-version checked against the DB on every request. Email OTP (hashed, TTL) and Google Sign-In. |
| Email | Nodemailer (any SMTP / Gmail) or the Brevo HTTPS API (`server/utils/emailTransporter.js`) |
| Media | Cloudinary, uploads capped and type-checked (`server/middleware/upload.js`) |

### 0.2 Key flows (where to look)

| Flow | Entry point |
|---|---|
| Checkout: validate, price from DB, reserve stock and coupon | `server/controllers/paymentController.js:121` (`createOrder`), pricing at `:43` |
| Payment confirmation (browser) | `paymentController.js:212` (`verifyPayment`) → `server/services/orderService.js:276` (`markOrderPaid`) |
| Payment confirmation (server-to-server) | `server/app.js:46` → `paymentController.js:263` (`razorpayWebhook`) |
| Stock reservation / release | `server/utils/inventory.js:30` (`reserveLine`), `:85` (`reserveItems`) |
| Unpaid-order expiry (30 min) | `orderService.js:380` (`expireStaleOrders`), scheduled at `server/server.js:36` |
| Order lifecycle (admin) | `server/controllers/orderController.js:21` (`ADMIN_TRANSITIONS`) |
| Refunds | `orderService.js` (`issueRefund`), checks for existing refunds at `:119` |
| Auth | `server/middleware/auth.js:14` (`resolvePrincipal`), `:43` (admin guard) |

### 0.3 Tests and tool runs

| Command | Result |
|---|---|
| `cd server && npm test` | **41 passed, 0 failed** (end-to-end scenarios, listed in §1, §2 and §3A) |
| `cd server && npm run lint` | Clean |
| `cd client && npx eslint .` | Clean |
| `cd client && npx vite build` | Succeeds |
| `npm audit --omit=dev` (server and client) | 0 vulnerabilities |
| Production-mode boot of `server.js` against a throwaway DB | Starts, runs migrations, `/api/health` OK, unknown CORS origins refused |

### 0.4 Secrets

- `.env` files are git-ignored and never appear in history.
- `server/test_tokens.json` was deleted, but it **still exists in git history**. Signed JWTs made with the real secret sit in history, so **`JWT_SECRET` must be rotated before launch**.
- Seed scripts no longer contain default passwords, and they refuse to run against `NODE_ENV=production` without `--force`.

---

## 1. Status of the First Audit's Findings

All Critical and High findings from the first audit were re-checked in the current code. Each one is fixed and covered by a test:

| First-audit finding | Now | Test that proves it |
|---|---|---|
| Any customer/OTP token could use admin order routes | Fixed | "customer token cannot list or change all orders", "OTP proof token is not a session" |
| Negative / fractional quantity set the price | Fixed | "negative, fractional and oversized quantities are rejected" |
| Oversell (check-then-decrement, no per-size stock) | Fixed | "10 concurrent buyers of the last unit: exactly one wins", "per-size stock is reserved…" |
| No webhook; payment lost if the tab closes | Fixed | "webhook confirms payment when the browser never returns" |
| `/verify` replay repeated stock, coupon and invoice changes | Fixed | "verify marks paid once; replay changes nothing" |
| Order lookup IDOR via Razorpay id | Fixed | "another customer cannot read an order by id or Razorpay id" |
| Status emails crashed (undefined function) | Fixed | Template smoke test; e-mails now built in `server/utils/emailTemplates.js` |
| No order state machine / phantom and double restocks | Fixed | "admin state machine blocks illegal transitions", "unpaid order cannot be admin-cancelled into phantom stock" |
| No refunds | Fixed (automatic Razorpay refunds) | "customer cancel restores stock once and refunds in full", "failed refund can be retried by admin" |
| Return window from payment date; exchanges didn't move stock | Fixed | "return window counts from delivery date", "size exchange moves stock between variants" |
| Coupon limits not atomic | Fixed | "usage limit holds under concurrency…" |

---

## 2. New Findings in This Re-audit (all fixed on this branch)

| Issue | Severity | File:Line | Description | Fix applied |
|---|---|---|---|---|
| Payment could lose a race with order expiry | **High** | `server/services/orderService.js:276-340` | If the 30-minute expiry job (or a closed checkout) failed an order at the same moment its payment was being confirmed, the confirmation's conditional update missed. The customer was charged but the order stayed `failed` until a webhook retry, and `/verify` still answered "verified". | When the update misses and the order is now `created`/`failed`, it's processed again as a late payment: stock is re-reserved, or the customer is refunded if it's gone. Test: "order expiring at the same moment it is paid still ends up paid". I confirmed the test fails without the fix. |
| Refund retry after a gateway timeout | Medium | `orderService.js:115-142` | If Razorpay created a refund but the API call timed out, the order showed "refund failed", and a retry would be rejected by Razorpay as an over-refund. | Before retrying, the existing refunds on the payment are fetched and reconciled. Test: "retrying a refund that timed out but succeeded does not refund twice". |
| No path for parcels returned to origin (RTO) | Medium | `server/controllers/orderController.js:25` | A shipped order could only become `delivered`, so an undelivered parcel couldn't be restocked or refunded. | Added `shipped → returned` (restock and refund), plus an admin button "Returned to Origin & Refund". Test: "parcel returned to origin restocks and refunds". |
| Emails going to spam | **High** (business impact) | `server/utils/emailTransporter.js` (previous version: custom headers and `List-Unsubscribe` pointing at `http://localhost:5173/profile`) | See §3. | Headers cleaned up. Configurable From/Reply-To. Any SMTP relay or the Brevo HTTPS API. Plain-text part on every email. Invoice PDF cut from ~1.2 MB to ~140 KB. Startup warnings for spam-prone setups. `npm run email:test`. |

---

## 3. Email Deliverability (why mail lands in spam, and the fix)

### 3.1 What was wrong in the code (fixed)

| Signal | Why spam filters dislike it |
|---|---|
| `List-Unsubscribe: <http://localhost:5173/profile>` with `List-Unsubscribe-Post: One-Click` | This advertised one-click unsubscribe support at a localhost URL that doesn't unsubscribe anyone. Gmail and Yahoo check this for bulk senders. Transactional mail doesn't need the header at all. |
| Custom `Message-ID`, made-up `Feedback-ID`, `X-Priority` | Non-standard or forged-looking headers add spam score. The mail library now generates proper ones. |
| ~1.2 MB PDF attachment | The logo was embedded uncompressed. Large attachments from a new sender are penalised. It's now ~140 KB. |
| Dark, image-like OTP email with no clear sender context | Now a short, light, text-first message with the code in the subject line, the standard pattern for verification codes. |
| Missing text alternatives on some emails | Every email now carries a real plain-text part. |

### 3.2 What the code can't fix: sender reputation and domain authentication

The store currently sends as a personal **@gmail.com** address. Gmail signs it, so SPF and DKIM pass, but mailbox providers treat **store mail from a free mailbox** as low-trust. Newer Gmail/Yahoo sender rules expect a sending domain with SPF, DKIM and DMARC. The reliable fix is:

1. **Get a domain** (e.g. `extractmenswear.in`). You need one for deployment anyway.
2. **Use a transactional email provider** that signs with your domain:
   - **Brevo**: free, 300 emails a day, HTTPS API. It works even on hosts that block SMTP.
   - **Amazon SES**: when you move to AWS.
3. **Add the DNS records** the provider gives you:
   - **SPF**: a `TXT @` record, e.g. `v=spf1 include:spf.brevo.com ~all`. Keep one SPF record per domain.
   - **DKIM**: the `TXT`/`CNAME` record(s) the provider shows.
   - **DMARC**: `TXT _dmarc` = `v=DMARC1; p=none; rua=mailto:you@yourdomain`. Move to `p=quarantine` once reports look clean.
4. **Set** `BREVO_API_KEY`, `EMAIL_FROM=orders@yourdomain`, `EMAIL_FROM_NAME`, and `EMAIL_REPLY_TO=support@yourdomain` (a mailbox someone reads).
5. **Never** send as `@gmail.com` through Brevo or SES. That fails DMARC alignment and goes straight to spam. The server now warns about this at startup.

### 3.3 How to verify (the technique)

1. Open **https://www.mail-tester.com** and copy the one-off address it shows.
2. Run `cd server && npm run email:test -- <that address>`. This sends the real OTP email and a real order confirmation with the invoice attached.
3. Click "check your score". It lists SPF, DKIM, DMARC, blacklists and content issues. Aim for 9/10 or higher.
4. In Gmail, open a received email → ⋮ → **Show original**. SPF, DKIM and DMARC should all say **PASS**.
5. For ongoing monitoring, register the domain in **Google Postmaster Tools** to see spam rate and reputation.
6. Warm up gently: a new domain's first days should be mostly real, expected mail (OTPs, orders), not bulk promotions.

---

## 3A. Deployment-Readiness Pass (2026-09-30)

Checked against the official documentation for each platform, then fixed and tested. Sources:
- Razorpay: [webhook validation](https://razorpay.com/docs/webhooks/validate-test/), [Node integration](https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/), [refunds API](https://razorpay.com/docs/api/refunds/create-normal/), [Standard Checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration/).
- Render: [free tier](https://render.com/docs/free), [web services](https://render.com/docs/web-services), [deploys](https://render.com/docs/deploys), [blueprint spec](https://render.com/docs/blueprint-spec).
- Vercel: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).
- Express: [security](https://expressjs.com/en/advanced/best-practice-security.html) and [performance](https://expressjs.com/en/advanced/best-practice-performance.html) best practices.
- Brevo: [send transactional email](https://developers.brevo.com/reference/sendtransacemail).
- Nodemailer: [changelog](https://github.com/nodemailer/nodemailer/blob/master/CHANGELOG.md).

| Issue | Severity | File:Line | What the docs say / what was wrong | Fix |
|---|---|---|---|---|
| Catalog images and logo never deployed | **Critical** (deploy) | `client/.gitignore` (removed `public/images`) | Products are stored with paths like `/images/shirts/…jpg`, and the logo is `/images/logo.png`. The folder was git-ignored, so a host building from GitHub would serve a store with no product photos or logo. | Folder un-ignored and committed (245 files, 24 MB, none over 1 MB). The build output now contains them. |
| Gmail SMTP can't send from Render free | **High** (deploy) | `server/utils/emailTransporter.js` | Render's free tier blocks outbound ports 25/465/587. | The Brevo HTTPS API is already supported. `render.yaml` and DEPLOYMENT.md configure it. |
| Vulnerable `nodemailer` (4 new advisories, high) | **High** | `server/package.json` | `npm audit`: versions ≤ 10.0.8 are affected (DoS / header parsing). | Upgraded to `^10.0.13`. The only breaking change is Node ≥ 20, which is already required. 0 production vulnerabilities. |
| No graceful shutdown | Medium | `server/server.js` | Render sends SIGTERM on every deploy and SIGKILLs after 30 s. Express recommends graceful shutdown. | The server stops accepting connections, finishes in-flight requests, closes MongoDB and exits in about 1 s. It also binds `0.0.0.0` as Render requires. Verified locally. |
| Health check always "ok" | Medium | `server/app.js` (`/api/health`) | The host uses the health check to decide when a new deploy can take traffic. | Returns 503 until MongoDB is connected. Test added. |
| Webhook duplicates not tracked by event id | Medium | `server/controllers/paymentController.js` (`razorpayWebhook`) | Razorpay: use `x-razorpay-event-id` to detect duplicate deliveries. | Processed event ids are stored (30-day TTL). Repeats return 200 without reprocessing, and a failed attempt is forgotten so Razorpay's retry works. Test added. |
| Out-of-order refund events | Medium | `paymentController.js` (refund webhook) | Razorpay: don't assume event order. A late `refund.failed` could overwrite `processed`. | A processed refund is never downgraded. Test added. |
| No refund idempotency key | Low | `server/services/orderService.js` (`issueRefund`) | Razorpay's `receipt` field identifies a refund request. | Sends `receipt: rf_<orderId>`. |
| Login brute force limited only per IP | Medium | `server/routes/authRoutes.js` | Express: limit failed attempts per username as well as per IP. | 10 failed attempts per account per 15 min, whatever the IP. Successful logins don't count. Test added. |
| DB connect: one 5-second try, then exit | Low | `server/config/db.js` | Cold starts on free tiers can make the first attempt time out. | 5 attempts with backoff and a 10 s selection timeout. Disconnects are logged. |
| Unhandled rejections swallowed | Low | `server/server.js` | Express: don't keep running in an unknown state; let the process manager restart. | Logged, then graceful shutdown with exit code 1 (the host restarts it). |
| Stale product-list responses | Medium (UX) | `client/src/pages/Shirts.jsx`, `Trousers.jsx` (`fetchPage`) | Changing filters quickly could show products for an older filter. | Only the latest request updates the list. |
| Navbar search unencoded and unbounded | Medium | `client/src/components/Navbar.jsx` | `?search=${query}` broke on `&`/`#`, downloaded every match to show 5, and had the same stale-response race. | Query sent via axios params, `limit: 5`, stale responses ignored. |
| Admin role errors hidden | Low | `client/src/pages/AdminUsers.jsx` | A failed role change only logged to the console. | Shows an alert with the server message. |
| Missing `VITE_API_URL` fails silently | Low | `client/src/services/api.js` | In production the API is on another host. | Logs a clear error in production builds. `.env.example` explains it. |
| Web Checkout `retry.max_count` | Info | `client/src/services/razorpay.js` | Razorpay: `max_count` is mobile-SDK only. | Removed. |
| Personal ngrok hosts in Vite config | Info | `client/vite.config.js` | — | Removed. |

**Deployment files added:**
- `render.yaml`: API blueprint, with health check, Node 22, a generated `JWT_SECRET`, and secrets marked `sync: false`.
- `client/vercel.json`: SPA rewrite as recommended by Vercel, immutable asset caching, security headers.
- `DEPLOYMENT.md`: step-by-step guide plus a post-deploy smoke test.
- `README.md`: how to run and check the project locally.

**Verified locally in production mode** (throwaway database):
- Health check returns 200 once the DB is connected.
- The allowed origin gets CORS headers; an unknown origin is refused.
- HSTS is present and `x-powered-by` is absent.
- SIGTERM shuts down cleanly with exit code 0.
- `npm ci --omit=dev` installs from the lockfile without dev tools.
- The client build embeds `VITE_API_URL` and includes the images.

## 3B. Mobile Layout Pass (2026-09-30)

**Method:**
- The real production build ran against the real API (seeded in-memory database) in headless Chromium.
- Every storefront and admin page was checked at 320, 360, 390, 430 and 768 px wide, which is 130 page/width combinations, including logged-in states.
- Each check measured anything wider than the screen and captured screenshots, which were reviewed by eye.
- The menu, search, coupon list and admin product form were also checked in their opened states.

**Result:** 0 layout problems and 0 JavaScript errors after the fixes below.

| Issue | Where | Fix |
|---|---|---|
| Admin Orders, Products, Coupons and Users tables on phones showed only the first column; status, totals and action buttons were off-screen | `AdminOrders.jsx`, `AdminProducts.jsx`, `AdminCoupons.jsx`, `AdminUsers.jsx` | Phone layout puts status, price/stock and action buttons under each row's title; desktop table unchanged |
| Admin orders filter tabs made the page ~300 px wider than the screen | `AdminOrders.jsx` | Tabs scroll inside their own box; search stacks above them |
| Google sign-in button wider than its card (logo cut off) | `Login.jsx`, `AdminLogin.jsx`, `hooks/useElementWidth.js` | Button width follows its container (200–380 px, Google's allowed range) |
| Navbar icons overlapped the logo at 320 px | `Navbar.jsx` | Smaller logo and tighter icon spacing below 360 px |
| Long names ran under the address card's edit/delete icons | `Cart.jsx` | Space reserved on the name row; larger tap targets |
| Product card style tag collided with the discount badge | `ProductCard.jsx` | Style/fabric tags shown from `sm` up |
| Product breadcrumb, listing toolbar, coupon field, admin toolbars and the size-add row overflowed at 320–360 px | `ProductDetail.jsx`, `Shirts.jsx`, `Trousers.jsx`, `Cart.jsx`, `AdminProducts.jsx` | Truncation, wrapping, and shrinkable inputs |
| Size chart needed sideways scrolling; tips ran one word per line | `SizeGuide.jsx` | Compact cells on phones; one tip per row below 480 px |
| Fixed two-column layouts that couldn't adapt | `Contact.jsx`, `PaymentSuccess.jsx`, `AdminProducts.jsx` (options panel) | Responsive grid/stack |
| Slide-in animations made the About page wobble sideways | `About.jsx`, `index.css` | Fade-up instead of slide-in, plus `overflow-x: clip` on the page as a safety net (keeps sticky headers working) |
| iOS Safari zooms in when tapping fields with text under 16 px | `index.css` | Fields use 16 px on phone-sized touch screens |

## 3C. Live-Testing Issues (2026-10-02)

Issues reported from testing on an iPhone through ngrok, each reproduced, root-caused, fixed and re-verified in a phone-sized browser against a production build:

| Report | Root cause | Fix |
|---|---|---|
| Backend "Too many requests", including the coupon error | **Cart save loop**: after each save the app replaced every cart line's size list with a new array, which counted as a change and triggered another save. That was 43 saves in 10 s on the cart page, exhausting the server's 300 writes / 15 min limit within about a minute. | Only changed fields are updated, and the cart and wishlist save only when product/size/quantity actually change (`redux/cartSlice.js`, `hooks/useCartSync.js`, `hooks/useWishlistSync.js`). Verified: 0 saves when idle. Coupon limit is now per signed-in account; development gets roomier limits. |
| iPhone screen shaking / refreshing | (1) The save loop re-rendered the page twice a second. (2) A double tap on the logo or menu links ran a full page reload (`onDoubleClick` → `window.location.href`). (3) The dev server's live-reload connection can't reach port 5173 through ngrok, so the phone kept reconnecting and reloading. (4) `overflow-x` on both `html` and `body` makes iOS scroll the body element. (5) The product page re-rendered every 15 s even without changes. | Loop fixed; double-tap reloads removed; `npm run dev:tunnel` (live reload via port 443) plus a preview workflow documented; overflow guard moved to `#root`; product refresh updates only when stock or price changed. |
| "Server is starting up" on first open | The API began listening only after MongoDB connected and startup migrations finished, so the dev proxy got "connection refused" in that window (for example after every `node --watch` restart). | The server listens immediately and holds API requests until the DB is ready (up to 20 s); the health check reports "starting". The client retries reads on 502/503. Verified: a request at the first instant waited ~0.3 s and returned 200. Test added. |
| MongoDB disconnecting/reconnecting | Atlas was stable: 150 s with no drops, ~40 ms pings. The messages came from server restarts (`node --watch` restarts on every server file change); the shutdown handler logged a deliberate close as "disconnected". | Shutdown now logs "Closing MongoDB connection". In development an unhandled rejection is logged instead of stopping the server (under `--watch` it would stay down until a file changed). |
| Fabric with no products showed an empty list | No handling for a fabric link with zero results. | Shows "Fabric not available: We don't have any Linen shirts right now. Showing all shirts instead." and switches to all shirts (`Shirts.jsx`, `Trousers.jsx`). |
| Menu/footer links didn't go to the top when tapped from the bottom of the page | Scroll-to-top only ran when the path changed, so a link to the page you're on did nothing, and the menu stayed open. | Scroll-to-top runs on every navigation (`location.key`) and jumps instantly; menu links close the menu. Verified: scroll position 3451 → 0 from both the footer and the menu. |

## 4. Remaining Findings (open)

These need a business decision, an external setup step, or a larger design change. None of them is a known way to lose money or stock.

| Issue | Severity | File:Line | Description | Recommendation |
|---|---|---|---|---|
| `JWT_SECRET` exposed via git history | **High until rotated** | history of `server/test_tokens.json` | Old signed tokens are recoverable from history. | Rotate the secret on deploy. All users re-login once anyway because the token format changed. |
| Webhook must be configured | **High until done** | `server/app.js:46`, `paymentController.js` (`razorpayWebhook`) | Without `RAZORPAY_WEBHOOK_SECRET` and the dashboard webhook, a payment whose browser never returns is only recorded if the customer comes back. | Configure the webhook for `payment.captured`, `order.paid`, `payment.failed`, `refund.processed` and `refund.failed`. |
| Store email from a free Gmail address | **High** (deliverability) | `server/utils/emailTransporter.js:20` | See §3.2. | Domain + Brevo/SES + SPF/DKIM/DMARC. |
| No GST tax invoice | Medium (compliance) | `server/utils/pdfGenerator.js:166-172` | Invoices have no GSTIN, HSN codes or CGST/SGST/IGST lines. Prices are shown as tax-inclusive. | Needs your GSTIN, HSN codes and rates. Then add tax lines to the invoice. |
| Sessions stored in `localStorage` | Medium | `client/src/redux/authSlice.js:51` | Any XSS in the storefront could read the token. React escaping and server-side revocation reduce the impact. | Later: httpOnly cookies + CSRF protection, and a Content-Security-Policy on the frontend host. |
| Account enumeration | Low | `server/controllers/authController.js:103` | `check-email` tells whether an email is registered. This is inherent to the one-box login design, and it's rate-limited. | Accept, or switch to a combined login/signup form. |
| Minimum password length 6 | Low | `authController.js:14` | Short for an account holding addresses and orders. | Raise to 8 and update the client messages together. |
| Rate limits kept in process memory | Low | `server/app.js:49,58`, `server/routes/*.js` | With several instances, each has its own counters. | On AWS, use a shared store (Redis) for `express-rate-limit`. |
| Whole-order returns only | Low (feature) | `orderController.js:106` | Customers can't return one item from a multi-item order. | Add item-level returns with prorated discount refunds. |
| Two admin identity stores | Low | `server/middleware/auth.js:23` | Admins can be `Admin` documents or `User.role="admin"`. | Consolidate into one. |
| No self-service account deletion | Low (privacy) | Nothing found | India's DPDP Act gives users erasure rights. | Add "delete my account", keeping order records anonymised. |
| Admin lists capped, not paginated | Low | `server/controllers/adminController.js:252`, `orderController.js` (`getAllOrders`, 2000 cap) | Fine for current volume. | Paginate in the admin UI when volume grows (the API already supports `?page=`). |
| `test_cases_report.md` outdated | Info | repo root | Its claims predate these fixes and aren't backed by tests. | Replace with `npm test` output, or delete. |

---

## 5. Executive Summary

**Overall:** the business-critical core is now sound and tested. That covers checkout pricing, per-size stock, payment confirmation, refunds, coupons and the order lifecycle, with 41 end-to-end scenarios including concurrency and replay attacks. The re-audit found one more High-severity payment race and two Medium gaps, all fixed and tested on this branch.

**Must do before launch (setup, not code):**
1. Rotate `JWT_SECRET`.
2. Configure the Razorpay webhook and `RAZORPAY_WEBHOOK_SECRET`.
3. Set up a domain for email (SPF/DKIM/DMARC plus Brevo or SES), then verify with `npm run email:test` and mail-tester.
4. Back up the database before the first boot (startup migrations update existing orders and products).

**Fix soon:** GST invoices (need your tax details), httpOnly-cookie sessions, a password minimum of 8.

**Nice to have:** item-level returns, single admin store, account deletion, a shared rate-limit store when scaling out.
