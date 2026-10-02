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

## Testing on your phone (ngrok)

Best: test the **production build**. It's what customers get: no live-reload, one small bundle, and React's development checks switched off.

```bash
cd client
npm run build
npx vite preview --port 5173      # serves dist/ on port 5173 and proxies /api to the API
```

For quick iterations with live reload, use the tunnel mode of the dev server instead of `npm run dev`. It makes the live-reload connection work through HTTPS tunnels; without it, phones keep reconnecting and reloading the page:

```bash
cd client
npm run dev:tunnel
```

Then start ngrok against port 5173:

- **ngrok installed on Windows:** `ngrok http 5173 --url https://<your-domain>.ngrok-free.dev`
- **ngrok in Docker:** `docker run -it -e NGROK_AUTHTOKEN=<token> ngrok/ngrok:latest http host.docker.internal:5173 --url https://<your-domain>.ngrok-free.dev`. Use `host.docker.internal`, not `--net=host`: on Docker Desktop the container's localhost isn't your PC.

Google sign-in only works on the ngrok address after it's added to the OAuth client's **Authorized JavaScript origins**.

In development, React's StrictMode intentionally runs page effects twice, so each page's requests appear twice in the Network tab. Production builds don't do this.

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
