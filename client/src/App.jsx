import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { Provider, useSelector } from "react-redux";
import { GoogleOAuthProvider } from "@react-oauth/google";
import store from "./redux/store";
import useCartSync from "./hooks/useCartSync";
import useWishlistSync from "./hooks/useWishlistSync";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import Home from "./pages/Home";
import Shirts from "./pages/Shirts";
import Trousers from "./pages/Trousers";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PaymentSuccess from "./pages/PaymentSuccess";
import Login from "./pages/Login";
import Register from "./pages/Register";

import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import AdminUsers from "./pages/AdminUsers";
import Wishlist from "./pages/Wishlist";
import SizeGuide from "./pages/SizeGuide";
import Orders from "./pages/Orders";
import ShippingInfo from "./pages/ShippingInfo";
import ReturnsExchange from "./pages/ReturnsExchange";
import FAQ from "./pages/FAQ";
import { ThemeProvider } from "./context/ThemeContext";
import { preloadRazorpay } from "./services/razorpay";

function ProtectedRoute({ children }) {
  const token = useSelector((s) => s.auth.token);
  const admin = useSelector((s) => s.auth.admin);
  const user = useSelector((s) => s.auth.user);
  return token && (admin || user?.role === "admin") ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  useCartSync();
  useWishlistSync();
  useEffect(() => { preloadRazorpay(); }, []);
  return (
    <>
    <ScrollToTop />
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
        <Route path="shipping" element={<ShippingInfo />} />
        <Route path="returns" element={<ReturnsExchange />} />
        <Route path="faq" element={<FAQ />} />
      </Route>



      <Route
        path="admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>
    </Routes>
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
