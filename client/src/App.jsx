import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { Provider, useSelector } from "react-redux";
import { GoogleOAuthProvider } from "@react-oauth/google";
import store from "./redux/store";
import { ADMIN_PATH } from "./config/adminPath";
import useCartSync from "./hooks/useCartSync";
import useWishlistSync from "./hooks/useWishlistSync";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";

// Lazy-loaded pages for code splitting
const Home = lazy(() => import("./pages/Home"));
const Shirts = lazy(() => import("./pages/Shirts"));
const Trousers = lazy(() => import("./pages/Trousers"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Profile = lazy(() => import("./pages/Profile"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const SizeGuide = lazy(() => import("./pages/SizeGuide"));
const Orders = lazy(() => import("./pages/Orders"));
const ShippingInfo = lazy(() => import("./pages/ShippingInfo"));
const ReturnsExchange = lazy(() => import("./pages/ReturnsExchange"));
const FAQ = lazy(() => import("./pages/FAQ"));
const NotFound = lazy(() => import("./pages/NotFound"));

const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/AdminProducts"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
import { ThemeProvider } from "./context/ThemeContext";
import { preloadRazorpay } from "./services/razorpay";

function ProtectedRoute({ children }) {
  const token = useSelector((s) => s.auth.token);
  const admin = useSelector((s) => s.auth.admin);
  const user = useSelector((s) => s.auth.user);

  if (!token) {
    return <Navigate to={`/${ADMIN_PATH}/login`} replace />;
  }
  if (!admin && user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppRoutes() {
  useCartSync();
  useWishlistSync();
  useEffect(() => { preloadRazorpay(); }, []);
  return (
    <>
    <ScrollToTop />
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh] bg-transparent">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="shirts" element={<Shirts />} />
        <Route path="trousers" element={<Trousers />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="payment-success" element={<PaymentSuccess />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="size-guide" element={<SizeGuide />} />
        <Route path="orders" element={<Orders />} />
        <Route path="profile" element={<Profile />} />
        <Route path="shipping" element={<ShippingInfo />} />
        <Route path="returns" element={<ReturnsExchange />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin login — public, secret path */}
      <Route path={`${ADMIN_PATH}/login`} element={<AdminLogin />} />

      {/* Admin panel — protected, secret path */}
      <Route
        path={ADMIN_PATH}
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Top-level catch-all for non-Layout routes */}
      <Route path="*" element={<Layout />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </Suspense>
    </>
  );
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Provider store={store}>
        <ThemeProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ThemeProvider>
      </Provider>
    </GoogleOAuthProvider>
  );
}
