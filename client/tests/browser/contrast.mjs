// WCAG contrast of every visible text element against the nearest solid background behind it.
import { base, launch, productPath } from "./browser.mjs";
const paths = ["/", "/shirts", await productPath(), "/cart", "/about", "/contact", "/shipping", "/returns", "/faq", "/size-guide", "/nope", "/login", "/wishlist", "/orders"];
const browser = await launch();
let fails = 0;
for (const theme of ["light", "dark"]) {
    for (const path of paths) {
        const p = await browser.newPage();
        await p.setViewport({ width: 1440, height: 900 });
        await p.evaluateOnNewDocument((t) => localStorage.setItem("extract-theme", t), theme);
        await p.goto(base + path, { waitUntil: "networkidle0", timeout: 60000 });
        await new Promise((r) => setTimeout(r, 2500)); // let entrance animations finish
        const bad = await p.evaluate(() => {
            // let the browser convert any colour syntax (rgb, oklab, color-mix) to RGBA pixels
            const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
            ctx.canvas.width = ctx.canvas.height = 1;
            const parse = (c) => {
                ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = "#000"; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1);
                const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
                return { r, g, b, a: a / 255 };
            };
            const lum = ({ r, g, b }) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
            const blend = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
            const bgOf = (el) => {
                for (let n = el; n; n = n.parentElement) {
                    const cs = getComputedStyle(n);
                    if (cs.backgroundImage !== "none" && n !== el) return null; // photo or gradient: skip
                    const c = parse(cs.backgroundColor);
                    if (c && c.a >= 0.85) return c;
                }
                return { r: 255, g: 255, b: 255, a: 1 };
            };
            const out = [];
            for (const el of document.querySelectorAll("body *")) {
                if (![...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) continue;
                const r = el.getBoundingClientRect();
                const cs = getComputedStyle(el);
                if (!r.width || !r.height || cs.visibility === "hidden" || +cs.opacity === 0 || r.width < 2) continue;
                if (el.closest("[aria-hidden=true]") || el.closest(".sr-only") || el.closest(".marquee-track") === null && false) continue;
                const bg = bgOf(el); if (!bg) continue;
                const fg = blend(parse(cs.color), bg);
                let op = 1; for (let n = el; n; n = n.parentElement) op *= +getComputedStyle(n).opacity;
                if (op < 0.99) continue; // faded/animating or disabled
                const L1 = lum(fg), L2 = lum(bg);
                const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
                const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
                const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
                if (ratio < need) out.push(`${ratio.toFixed(2)} (needs ${need}) "${el.textContent.trim().slice(0, 40)}"`);
            }
            return [...new Set(out)].slice(0, 8);
        });
        if (bad.length) { fails += bad.length; console.log(`${theme} ${path}\n  ` + bad.join("\n  ")); }
        await p.close();
    }
}
await browser.close();
console.log(fails ? `contrast: ${fails} low-contrast texts` : "contrast: all text passes AA");
process.exitCode = fails ? 1 : 0;
