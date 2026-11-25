// Shared setup for the browser checks. Run the storefront (npm run dev) and the API first.
// CHROME_PATH: a local Chrome or Chromium. SHOP_URL: the storefront, default the Vite dev server.
import puppeteer from "puppeteer-core";

export const base = process.env.SHOP_URL || "http://localhost:5173";

export const launch = () =>
    puppeteer.launch({
        executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
        headless: true,
    });

// Any real product page, so the checks work against whatever catalogue the API serves
export const productPath = async () => {
    const res = await fetch(`${base}/api/products?limit=1`);
    const [first] = await res.json();
    return `/product/${first._id}`;
};
