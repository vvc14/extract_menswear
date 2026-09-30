# Deployment Guide

How to put Extract Menswear online for free, and move to AWS later. Setup:

| Part | Free host | Config in this repo |
|---|---|---|
| Storefront (`client/`, React + Vite) | Vercel | `client/vercel.json` |
| API (`server/`, Express) | Render (free web service) | `render.yaml` |
| Database | MongoDB Atlas M0 | — |
| Images | Cloudinary (uploads) + `client/public/images` (bundled catalog images) | — |
| Email | Brevo HTTPS API | `BREVO_API_KEY` |
| Payments | Razorpay | webhook at `/api/payment/razorpay/webhook` |

> Free tiers change. Check each provider's current pricing page. The limits below were checked on 2026-09-30.

---

## 0. Before you start

- [ ] **Back up the database.** On first boot the API runs automatic data fixes (`server/utils/startupMigrations.js`). They're safe to repeat, but back up first.
- [ ] **Rotate `JWT_SECRET`.** An old token file is in git history, so the production secret must be new. Render generates one for you (step 2).
- [ ] **Get a domain (recommended).** Point `www.yourstore.com` at Vercel and `api.yourstore.com` at Render. A later move to AWS is then just a DNS change: your Razorpay webhook URL, Google sign-in origins and CORS settings stay the same. You also need the domain for email that doesn't go to spam (step 5).

---

## 1. MongoDB Atlas

1. **Create a cluster.** Use an M0 (free) cluster. Pick an **AWS / Mumbai (ap-south-1)** region, close to your customers and to a future AWS setup.
2. **Create a database user.** Give it a long random password.
3. **Allow network access.** Render's free tier has no fixed outbound IP, so add `0.0.0.0/0`. The database user's strong password is then your main protection. On paid hosting, or on AWS later, replace this with the host's static IPs or VPC peering.
4. **Copy the connection string.** Put it in `MONGO_URI`.

## 2. API on Render

1. Render Dashboard → **New → Blueprint** → select this GitHub repo. Render reads `render.yaml`:
   - Root directory `server`, runtime Node 22, region Singapore.
   - Build command `npm ci --omit=dev`, start command `npm start`.
   - Health check path `/api/health`. It returns 503 until MongoDB is connected, so new deploys only get traffic when ready.
   - `JWT_SECRET` is generated automatically.
2. Fill in the variables marked `sync: false` (see the table in step 7).
3. After the first deploy, open `https://<service>.onrender.com/api/health`. It should return `{"status":"ok","db":"connected"}`.

Render free-tier facts ([docs](https://render.com/docs/free)):
- **The service spins down after 15 minutes without traffic.** The next request waits about a minute.
  - Razorpay webhooks get delivered once it's awake.
  - Stock held by abandoned checkouts is released by the expiry job when it wakes.
- **Outbound SMTP ports 25, 465 and 587 are blocked.** Gmail/SMTP email won't work there, so use `BREVO_API_KEY`.
- **750 free instance hours a month, one instance, no persistent disk.** The API keeps nothing on disk: uploads go to Cloudinary, data to Atlas.
- **On every deploy or restart Render sends SIGTERM and force-kills about 30 seconds later** ([docs](https://render.com/docs/deploys)). The server shuts down gracefully: it finishes in-flight requests and closes the DB.

## 3. Storefront on Vercel

1. Vercel → **Add New Project** → import the repo. Set **Root Directory = `client`**. The framework is detected as Vite: build `npm run build`, output `dist`.
2. Add environment variables. They're baked in at build time, so redeploy after changing them:

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://api.yourstore.com/api` (or `https://<service>.onrender.com/api`) |
   | `VITE_RAZORPAY_KEY_ID` | Razorpay key id (the public one, `rzp_live_…`) |
   | `VITE_GOOGLE_CLIENT_ID` | Google OAuth client id |
   | `VITE_ADMIN_PATH` | Your secret admin URL segment |

3. `client/vercel.json` rewrites every route to `index.html`, so refreshing `/orders` or `/product/…` works (as [recommended by Vercel for Vite SPAs](https://vercel.com/docs/frameworks/frontend/vite)). It also adds long-term caching for hashed assets and basic security headers.
4. Put the final storefront URL (e.g. `https://www.yourstore.com`) into Render's `CLIENT_URL`. That's the only origin allowed by CORS. Add any extra origins to `CORS_ORIGINS`, comma-separated.

## 4. Razorpay

1. Complete KYC, then switch the Dashboard to **Live mode** and generate live keys:
   - Put `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Render.
   - Put the key id in `VITE_RAZORPAY_KEY_ID` on Vercel.
2. **Payment capture:** enable **automatic capture** (Settings → Payment Capture). Razorpay auto-refunds payments that are never captured. The server also captures any "authorized" payment itself when confirming it.
3. **Webhooks** (Settings → Webhooks → Add):
   - **URL:** `https://api.yourstore.com/api/payment/razorpay/webhook`. Razorpay only allows ports 80/443, and Render uses 443.
   - **Secret:** generate one and put the same value in `RAZORPAY_WEBHOOK_SECRET`.
   - **Events:** `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`, `refund.failed`.
   - **What the server does with them:** it checks `X-Razorpay-Signature` against the raw body, ignores repeat deliveries using `X-Razorpay-Event-Id`, and handles events arriving out of order ([Razorpay docs](https://razorpay.com/docs/webhooks/validate-test/)).
4. **Test in test mode first:** place an order, then cancel it and confirm the refund appears under the payment in the Dashboard.

## 5. Email (so it doesn't go to spam)

1. **Brevo:** create an account, then **Senders, Domains & Dedicated IPs → Domains** → add your domain. Add the **DKIM**, **SPF** and **DMARC** DNS records Brevo shows. Wait until all three show as verified.
2. **Render variables:**
   - `BREVO_API_KEY`
   - `EMAIL_FROM=orders@yourstore.com`
   - `EMAIL_REPLY_TO=support@yourstore.com` (a real inbox)
   - `ADMIN_NOTIFY_EMAIL` (where return/exchange requests and contact messages go)
3. **Never** use a `@gmail.com` address as `EMAIL_FROM` with Brevo. It fails DMARC and goes to spam. The server logs a warning if you do.
4. **Check deliverability:**
   1. Open https://www.mail-tester.com and copy the address it shows.
   2. Locally, with the production email variables in `server/.env`, run `cd server && npm run email:test -- <that address>`. Aim for a score of 9/10 or higher.
   3. In Gmail → **Show original**, SPF, DKIM and DMARC should all say PASS.

## 6. Google Sign-In

Google Cloud Console → APIs & Services → Credentials → your OAuth client. Add your storefront URL(s) to **Authorized JavaScript origins** (e.g. `https://www.yourstore.com`), and use the same client id for `GOOGLE_CLIENT_ID` (Render) and `VITE_GOOGLE_CLIENT_ID` (Vercel).

## 7. API environment variables (Render)

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | yes | `production` (set by `render.yaml`) |
| `MONGO_URI` | yes | Atlas connection string |
| `JWT_SECRET` | yes | ≥ 32 chars, generated by Render. **New** value, not the old one. |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | yes | Live keys |
| `RAZORPAY_WEBHOOK_SECRET` | yes | Same secret as the Razorpay webhook |
| `CLIENT_URL` | yes | Storefront URL, `https://…` |
| `CORS_ORIGINS` | no | Extra allowed origins, comma-separated |
| `GOOGLE_CLIENT_ID` | for Google login | |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | for admin image uploads | |
| `BREVO_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, `EMAIL_REPLY_TO` | for email | See step 5 |
| `ADMIN_NOTIFY_EMAIL` | no | Defaults to `EMAIL_REPLY_TO` |
| `TRUST_PROXY_HOPS` | no | `1` on Render (correct client IPs for rate limiting) |

## 8. After the first deploy — smoke test

- [ ] `GET /api/health` → `{"status":"ok","db":"connected"}`.
- [ ] Storefront loads, including the logo and product images. Refreshing a deep link like `/shirts` works.
- [ ] Sign up with email OTP. The code arrives in the inbox, not spam.
- [ ] Add to cart as a guest, then log in. The cart is kept.
- [ ] **Test-mode payment:**
  - Order confirmation email arrives with the invoice.
  - Stock for that size drops by the quantity bought.
  - The order shows under My Orders.
- [ ] **Close the Razorpay window without paying:** the stock comes back within a few seconds.
- [ ] **Admin:**
  1. Log in at `/<VITE_ADMIN_PATH>/login`.
  2. Ship → deliver an order. The customer gets both emails.
  3. Cancel another order. The refund shows in the Razorpay Dashboard.
- [ ] Razorpay Dashboard → Webhooks shows successful (2xx) deliveries.

## 9. Moving to AWS later

| Now | AWS |
|---|---|
| Vercel | **Amplify Hosting** (simplest), or S3 + CloudFront with a 403/404 → `/index.html` rule for SPA routing |
| Render | **App Runner** or **Lightsail containers** (simplest); ECS Fargate for more control. Health check: `/api/health`. |
| Atlas | Keep Atlas (it runs on AWS Mumbai). Use VPC peering / PrivateLink instead of `0.0.0.0/0`. |
| Brevo | **Amazon SES** via its SMTP interface (`SMTP_HOST`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASS`) once out of the SES sandbox. SMTP isn't blocked on AWS compute. |

**No code changes are needed to run more than one API instance.** One-time codes, stock reservations and processed-webhook records all live in MongoDB. The rate-limit counters are the exception: they're per instance, so add a shared store (e.g. Redis) when you scale out. With a custom domain, the switch is a DNS change.
