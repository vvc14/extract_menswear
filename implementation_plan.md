# Extract Menswear — Full-Stack E-Commerce Implementation Plan

Production-ready menswear e-commerce site built with React + Tailwind (frontend) and Express + MongoDB (backend), featuring Razorpay payments, Cloudinary image uploads, and JWT-protected admin dashboard.

## Proposed Changes

### Backend — `/server`

#### [NEW] [package.json](file:///d:/extract_menswear/server/package.json)
Node.js project with dependencies: `express`, `mongoose`, `cors`, `dotenv`, `bcryptjs`, `jsonwebtoken`, `razorpay`, `multer`, `cloudinary`, `express-validator`.

---

#### [NEW] [server.js](file:///d:/extract_menswear/server/server.js)
Express entry point — connects to MongoDB, mounts CORS, JSON body parser, routes, and starts the server on `process.env.PORT`.

---

#### [NEW] [config/db.js](file:///d:/extract_menswear/server/config/db.js)
Mongoose connection helper using `MONGO_URI` env var.

#### [NEW] [config/razorpay.js](file:///d:/extract_menswear/server/config/razorpay.js)
Razorpay instance initialized with `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.

#### [NEW] [config/cloudinary.js](file:///d:/extract_menswear/server/config/cloudinary.js)
Cloudinary SDK configured with `CLOUDINARY_CLOUD_NAME`, `API_KEY`, `API_SECRET`.

---

#### [NEW] Models — `models/`
| File | Fields |
|---|---|
| `Product.js` | name, category (shirt/trouser), fabric, style, price, imageUrl, stock, createdAt |
| `Admin.js` | username, password (bcrypt-hashed), role |
| `Order.js` | razorpayPaymentId, razorpayOrderId, items[], totalAmount, status, createdAt |
| `Contact.js` | name, email, message, createdAt |

---

#### [NEW] Middleware — `middleware/`
| File | Purpose |
|---|---|
| `auth.js` | Verifies JWT from `Authorization: Bearer <token>` header |
| `upload.js` | Multer memory storage → Cloudinary stream upload |

---

#### [NEW] Controllers — `controllers/`
| File | Endpoints Handled |
|---|---|
| `productController.js` | GET `/api/products` (w/ filters), GET `/api/products/:id` |
| `adminController.js` | POST/PUT/DELETE products (protected) |
| `authController.js` | POST `/api/auth/admin-login` → returns JWT |
| `paymentController.js` | POST `/api/payment/razorpay/order`, POST `/api/payment/razorpay/verify` |
| `contactController.js` | POST `/api/contact` |

---

#### [NEW] Routes — `routes/`
One route file per controller: `productRoutes.js`, `adminRoutes.js`, `authRoutes.js`, `paymentRoutes.js`, `contactRoutes.js`.

---

#### [NEW] [.env.example](file:///d:/extract_menswear/server/.env.example)
Template with all required env vars.

---

### Frontend — `/client`

#### [NEW] Vite + React + Tailwind project
Scaffolded via `npm create vite@latest` with React template, then install: `tailwindcss @tailwindcss/vite`, `react-router-dom`, `@reduxjs/toolkit react-redux`, `axios`, `react-icons`, `framer-motion`.

---

#### [NEW] Redux Store — `src/redux/`
| File | Purpose |
|---|---|
| `store.js` | configureStore with cart + auth slices |
| `cartSlice.js` | addToCart, removeFromCart, updateQty, clearCart; persisted to localStorage |
| `authSlice.js` | login/logout, stores JWT + admin info |

---

#### [NEW] API Layer — `src/services/`
| File | Purpose |
|---|---|
| `api.js` | Axios instance with baseURL, interceptors for JWT |
| `razorpay.js` | Helper to load Razorpay checkout script and initiate payment |

---

#### [NEW] Layout Components — `src/components/`
| Component | Purpose |
|---|---|
| `Navbar.jsx` | Sticky nav with logo, links, cart badge, mobile hamburger |
| `Footer.jsx` | Brand info, category links, social icons |
| `Layout.jsx` | Wraps Navbar + Outlet + Footer |
| `AdminLayout.jsx` | Sidebar + Outlet for admin routes |
| `ProductCard.jsx` | Reusable card with image, name, tags, price, add-to-cart |
| `FilterSidebar.jsx` | Fabric/Style/Type checkboxes + price range slider |
| `HeroSection.jsx` | Full-width hero with CTA |
| `CategoryCard.jsx` | Clickable category card |

---

#### [NEW] Pages — `src/pages/`
| Page | Route | Description |
|---|---|---|
| `Home.jsx` | `/` | Hero, category cards, fabric highlights |
| `Shirts.jsx` | `/shirts` | Product grid + FilterSidebar for shirts |
| `Trousers.jsx` | `/trousers` | Product grid + FilterSidebar for trousers |
| `ProductDetail.jsx` | `/product/:id` | Single product view |
| `Cart.jsx` | `/cart` | Cart items, qty adjust, subtotal, Razorpay checkout |
| `About.jsx` | `/about` | Brand story |
| `Contact.jsx` | `/contact` | Contact form → POST /api/contact |
| `PaymentSuccess.jsx` | `/payment-success` | Confirmation page |
| `AdminLogin.jsx` | `/admin/login` | Login form |
| `AdminDashboard.jsx` | `/admin/dashboard` | Stats overview |
| `AdminProducts.jsx` | `/admin/products` | Product list + add/edit/delete |

---

#### [NEW] Utilities — `src/utils/`
`filterLogic.js` — builds query params from filter state.

---

#### [NEW] [.env.example](file:///d:/extract_menswear/client/.env.example)
`VITE_API_URL`, `VITE_RAZORPAY_KEY_ID`.

---

### Deployment Instructions

#### [NEW] [DEPLOYMENT.md](file:///d:/extract_menswear/DEPLOYMENT.md)
Step-by-step guide:
- **Frontend → Vercel**: Connect repo, set env vars, deploy.
- **Backend → Render/Railway**: Set env vars, deploy as web service.
- Required `.env` variables documented for both.

---

## Verification Plan

### Automated (Build Checks)
1. **Backend**: `cd d:\extract_menswear\server && npm install && node -e "require('./server')"` — verify no import/syntax errors.
2. **Frontend**: `cd d:\extract_menswear\client && npm install && npm run build` — verify Vite production build succeeds with zero errors.

### Browser Verification
- Start backend (`npm run dev`) and frontend (`npm run dev`).
- Open the site in browser, visually verify:
  - Home page renders with hero, categories, and footer.
  - Shirts/Trousers pages render product grid with filters.
  - Cart page works (add/remove/qty).
  - Admin login page loads.
  - Responsive layout on mobile viewport.

### Manual Verification (User)
- Deploy to staging and test Razorpay checkout with test keys.
- Test admin login → add product → verify it appears on shop pages.
- Test contact form submission.
