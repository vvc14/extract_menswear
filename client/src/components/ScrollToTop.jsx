import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Scroll to the top on every navigation — including tapping a link to the page you're
// already on (e.g. "Shirts" in the footer while on /shirts), which changes only location.key.
export default function ScrollToTop() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
        return;
      }
    }
    // Jump instantly: the page-wide smooth scrolling would animate from the footer and can be
    // interrupted on iOS while the new page renders.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash, key]);

  return null;
}
