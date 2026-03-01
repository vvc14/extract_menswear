# Extract Menswear — Deployment Guide

## Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Razorpay account (test/live keys)
- Cloudinary account

---

## MongoDB Atlas Setup (Step-by-Step)

### 1. Create an Account
- Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
- Click **"Try Free"** and sign up with Google or email

### 2. Create a Cluster
- After login, click **"Build a Database"**
- Select **M0 FREE** tier (shared cluster)
- Choose a cloud provider (AWS recommended) and region closest to you
- Name your cluster (e.g., `extract-menswear`) → Click **"Create Deployment"**

### 3. Create a Database User
- You'll be prompted to create a database user
- Set a **username** (e.g., `extractadmin`) and a **strong password**
- ⚠️ **Save this password** — you'll need it for the connection string
- Click **"Create Database User"**

### 4. Set Up Network Access
- Under **Network Access** in the sidebar, click **"Add IP Address"**
- For local dev: click **"Add My Current IP Address"**
- For production (Render/Railway): click **"Allow Access from Anywhere"** (`0.0.0.0/0`)
- Click **"Confirm"**

### 5. Get Your Connection String
- Go to **Database** in the sidebar → Click **"Connect"** on your cluster
- Select **"Drivers"** (Node.js)
- Copy the connection string — it looks like:
  ```
  mongodb+srv://extractadmin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
  ```
- **Replace** `<password>` with the password you created in step 3
- **Add your database name** before the `?`:
  ```
  mongodb+srv://extractadmin:yourpassword@cluster0.xxxxx.mongodb.net/extract-menswear?retryWrites=true&w=majority
  ```

### 6. Add to Your `.env`
Open `server/.env` and set:
```
MONGO_URI=mongodb+srv://extractadmin:yourpassword@cluster0.xxxxx.mongodb.net/extract-menswear?retryWrites=true&w=majority
```

### 7. Seed the Admin User
Once the `MONGO_URI` is set, run:
```bash
cd server
node seed.js
```
This creates the default admin: **username** `admin` / **password** `admin123`

> ⚠️ Change the admin password in production by updating it directly in MongoDB Atlas or by modifying `seed.js`.

---

## Environment Variables

### Backend (`/server/.env`)
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/extract-menswear
JWT_SECRET=<random-64-char-string>
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=<your-razorpay-secret>
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
CLIENT_URL=https://your-frontend-domain.vercel.app
```

### Frontend (`/client/.env`)
```
VITE_API_URL=https://your-backend-domain.onrender.com/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

---

## Backend → Render / Railway

1. Push `/server` to a Git repository (or a monorepo).
2. Create a **Web Service** on Render or Railway.
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `node server.js`
5. Add all environment variables from above.
6. Deploy.

### Seed Admin User
After deploying, run `node seed.js` to create the default admin:
- **Username**: `admin`
- **Password**: `admin123`

> Change the password immediately in production.

---

## Frontend → Vercel

1. Push `/client` to a Git repository.
2. Import the project on Vercel.
3. Set **Framework Preset**: Vite.
4. Add environment variables (`VITE_API_URL`, `VITE_RAZORPAY_KEY_ID`).
5. Deploy.

---

## Local Development

```bash
# Terminal 1 — Backend
cd server
cp .env.example .env   # fill in real values
npm install
node seed.js            # create admin user (requires MongoDB)
npm run dev

# Terminal 2 — Frontend
cd client
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173 — the Vite proxy routes `/api` requests to `localhost:5000`.
