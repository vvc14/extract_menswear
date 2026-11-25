// Finds elements that stick out past the viewport at phone width (ignores intentional scrollers).
import { base, launch, productPath } from "./browser.mjs";
const paths = ["/shirts?price=under-500", "/orders", "/wishlist", "/payment-success", "/", "/shirts", await productPath(), "/cart", "/about", "/contact", "/faq", "/shipping", "/returns", "/size-guide", "/login", "/nope"];
const browser = await launch();
let overflowing = 0;
for (const w of [360, 390]) {
    for (const path of paths) {
        const p = await browser.newPage();
        await p.setViewport({ width: w, height: 800 });
        await p.goto(base + path, { waitUntil: "networkidle0" });
        await new Promise((r) => setTimeout(r, 600));
        const bad = await p.evaluate((vw) => {
            const out = [];
            const inScroller = (el) => {
                for (let n = el.parentElement; n; n = n.parentElement) {
                    const cs = getComputedStyle(n);
                    if (n.classList.contains("marquee-track")) return true;
                    if (["auto", "scroll", "hidden", "clip"].includes(cs.overflowX) && n.id !== "root" && n.tagName !== "HTML" && n.tagName !== "BODY") return true;
                }
                return false;
            };
            for (const el of document.querySelectorAll("body *")) {
                const r = el.getBoundingClientRect();
                if (!r.width || !r.height) continue;
                if (r.right > vw + 1 && !inScroller(el) && getComputedStyle(el).position !== "fixed") {
                    out.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)} right=${Math.round(r.right)}`);
                }
            }
            return out.slice(0, 4);
        }, w);
        if (bad.length) overflowing += bad.length, console.log(`${w} ${path}:\n  ` + bad.join("\n  "));
        await p.close();
    }
}
await browser.close();
console.log(overflowing ? `edges: ${overflowing} elements past the screen edge` : "edges: nothing past the screen edge");
process.exitCode = overflowing ? 1 : 0;
