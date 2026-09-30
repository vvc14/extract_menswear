# Extract Menswear

E-commerce store for men's shirts and trousers: React storefront + admin panel, Express/MongoDB API, Razorpay payments.

```
client/   React 19 + Vite storefront and admin panel (deployed to Vercel)
server/   Express 4 + Mongoose API (deployed to Render; render.yaml at repo root)
```

## Run locally

Prerequisites: Node.js 20+ and a MongoDB database (local or Atlas).

```bash
# API
cd server
cp .env.example .env        # fill in MONGO_URI, JWT_SECRET, Razorpay test keys, ...
npm install
npm run dev                 # http://localhost:5000

# Storefront (new terminal)
cd client
cp .env.example .env        # VITE_RAZORPAY_KEY_ID, VITE_GOOGLE_CLIENT_ID, VITE_ADMIN_PATH
npm install
npm run dev                 # http://localhost:5173 (proxies /api to the API)
```

## Checks

```bash
cd server && npm test        # end-to-end business-logic tests (in-memory MongoDB, Razorpay mocked)
cd server && npm run lint
cd client && npm run lint && npm run build
cd server && npm run email:test -- you@example.com   # send sample emails with your email settings
```

## Docs

- [DEPLOYMENT.md](DEPLOYMENT.md) — step-by-step deployment (Atlas, Render, Vercel, Razorpay, email, AWS later)
- [AUDIT_REPORT.md](AUDIT_REPORT.md) — audit findings and their status
