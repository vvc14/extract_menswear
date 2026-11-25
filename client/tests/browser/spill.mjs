// Finds text that is wider than its own box (spills or gets cut off), ignoring intentional
// truncation (ellipsis / line-clamp) and scroll containers.
import { base, launch, productPath } from "./browser.mjs";
const paths = ["/", "/shirts", "/trousers", await productPath(), "/cart", "/about", "/contact", "/shipping", "/returns", "/faq", "/size-guide", "/nope", "/login", "/wishlist", "/orders"];
const widths = [320, 360, 390, 768, 1024, 1440];
const browser = await launch();
let found = 0;
for (const w of widths) {
    for (const path of paths) {
        const p = await browser.newPage();
        await p.setViewport({ width: w, height: 900 });
        await p.goto(base + path, { waitUntil: "networkidle0", timeout: 60000 });
        await new Promise((r) => setTimeout(r, 900));
        const bad = await p.evaluate(() => {
            const out = [];
            const intentional = (el) => {
                for (let n = el; n && n !== document.body; n = n.parentElement) {
                    const cs = getComputedStyle(n);
                    if (cs.textOverflow === "ellipsis" || cs.webkitLineClamp !== "none" || ["auto", "scroll"].includes(cs.overflowX) || n.classList.contains("marquee-track")) return true;
                }
                return false;
            };
            for (const el of document.querySelectorAll("main *, header *, footer *, nav *")) {
                const hasText = [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
                if (!hasText) continue;
                const r = el.getBoundingClientRect();
                if (!r.width || !r.height || getComputedStyle(el).visibility === "hidden") continue;
                // text wider than the element's own box
                if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 1 && !intentional(el)) {
                    out.push(`${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 40)}" text ${el.scrollWidth}px in ${el.clientWidth}px`);
                }
            }
            return out.slice(0, 6);
        });
        if (bad.length) { found += bad.length; console.log(`${w} ${path}\n  ` + bad.join("\n  ")); }
        await p.close();
    }
}
await browser.close();
console.log(found ? `spill: ${found} spills` : "spill: no spilled text");
process.exitCode = found ? 1 : 0;
