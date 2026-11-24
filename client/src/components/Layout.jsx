import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import BackToTop from "./BackToTop";

export default function Layout() {
    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-night transition-colors duration-300">
            <Navbar />
            {/* pages render their own <main id="main-content"> landmark */}
            <div className="flex-1">
                <Outlet />
            </div>
            <Footer />
            <BackToTop />
        </div>
    );
}
