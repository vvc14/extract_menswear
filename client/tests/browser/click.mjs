// Click-through of the redesigned storefront. Read-only against the API: no orders, sign-ups or messages are sent.
import { base, launch, productPath } from "./browser.mjs";

const browser = await launch();
const results = [];
const errors = [];
const ok = (name, pass, note = "") => results.push(`${pass ? "PASS" : "FAIL"}  ${name}${note ? "  (" + note + ")" : ""}`);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function newPage(w = 1440, h = 900) {
    const p = await browser.newPage();
    p.on("console", (m) => m.type() === "error" && !m.text().includes("GSI_LOGGER") && errors.push(m.text()));
    p.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
    await p.setViewport({ width: w, height: h });
    return p;
}

try {
    // ── Desktop home ──
    let p = await newPage();
    await p.goto(base + "/", { waitUntil: "networkidle0" });

    await p.click('button[aria-label="Pause announcements"]');
    ok("Ticker pause button stops the strip", await p.$eval('button[aria-label="Play announcements"]', (b) => b.getAttribute("aria-pressed") === "true"));

    await p.click('button[aria-label="Search products"]');
    await p.waitForSelector("#site-search");
    await p.type("#site-search", "cotton");
    await wait(1500);
    const hits = await p.$$eval('[role="dialog"] a[href^="/product/"]', (a) => a.length);
    ok("Search overlay opens and returns products for 'cotton'", hits > 0, `${hits} results`);
    await p.keyboard.press("Escape");
    await wait(300);
    ok("Escape closes search", !(await p.$("#site-search")));

    const darkBefore = await p.evaluate(() => document.documentElement.classList.contains("dark"));
    await p.click("button.theme-toggle");
    const darkAfter = await p.evaluate(() => document.documentElement.classList.contains("dark"));
    ok("Theme toggle switches light/dark", darkBefore !== darkAfter);
    await p.click("button.theme-toggle");

    const scrollBefore = await p.$eval('ul[aria-label="New arrivals"]', (u) => u.scrollLeft);
    await p.click('button[aria-label="Scroll new arrivals right"]');
    await wait(800);
    const scrollAfter = await p.$eval('ul[aria-label="New arrivals"]', (u) => u.scrollLeft);
    ok("New arrivals arrow scrolls the rail", scrollAfter > scrollBefore, `${scrollBefore} -> ${scrollAfter}`);

    const telLinks = await p.$$eval('a[href^="tel:"]', (a) => a.map((x) => x.getAttribute("href")));
    ok("Phone numbers are tap-to-call links", telLinks.includes("tel:+918184836764") && telLinks.includes("tel:+917337526629"));

    // ── Shirts rack ──
    await p.goto(base + "/shirts", { waitUntil: "networkidle0" });
    await p.select("#sort-shirt", "price-low");
    await wait(1500);
    const prices = await p.$$eval("article .price-tag", (els) => els.slice(0, 4).map((e) => +e.textContent.replace(/[^0-9]/g, "")));
    ok("Sort by price low to high reorders the rack", prices.every((v, i) => !i || prices[i - 1] <= v), prices.join(", "));

    const sizeBtn = await p.$('aside[aria-label="Product filters"] button[aria-pressed]');
    if (sizeBtn) {
        await sizeBtn.click();
        await wait(1200);
        ok("Size filter chip toggles on", await p.evaluate((b) => b.getAttribute("aria-pressed") === "true", sizeBtn));
        await sizeBtn.click();
        await wait(800);
    }

    const firstCard = await p.$("article button[aria-label^='Choose a size'], article button[aria-label^='Add']");
    await firstCard.click();
    await wait(1500);
    ok("Card buy button opens the product page", p.url().includes("/product/"), p.url().replace(base, ""));

    // ── Product page: add to bag ──
    const sizes = await p.$$("main button[aria-pressed]:not([aria-label])");
    let picked = false;
    for (const s of sizes) {
        const disabled = await p.evaluate((b) => b.className.includes("line-through"), s);
        if (!disabled) { await s.click(); picked = true; break; }
    }
    await wait(300);
    const countBefore = await p.$eval('a[aria-label^="Cart,"]', (a) => +a.textContent.trim());
    await p.click('button[aria-label^="Add "]');
    await wait(800);
    const countAfter = await p.$eval('a[aria-label^="Cart,"]', (a) => +a.textContent.trim());
    ok("Pick a size + Add to bag increases cart count", picked && countAfter > countBefore, `${countBefore} -> ${countAfter}`);

    await p.goto(base + "/cart", { waitUntil: "networkidle0" });
    await wait(800);
    ok("Cart page shows the added item", (await p.$$eval("img", (i) => i.filter((x) => x.src.includes("/images/") || x.src.includes("cloudinary")).length)) > 0);

    // ── Contact form validation (no submit to the API) ──
    await p.goto(base + "/contact", { waitUntil: "networkidle0" });
    const valid = await p.$eval("form", (f) => f.checkValidity());
    ok("Empty contact form is blocked by required-field validation", valid === false);

    // ── 404 ──
    await p.goto(base + "/no-such-page", { waitUntil: "networkidle0" });
    ok("Unknown URL shows the 404 sign", (await p.$eval("h1", (h) => h.textContent)).includes("Shutter"));
    await p.click('main a[href="/"]');
    await wait(800);
    ok("404 'Back to the shop' works", p.url() === base + "/");
    await p.close();

    // ── Mobile: menu ──
    p = await newPage(390, 844);
    await p.goto(base + "/", { waitUntil: "networkidle0" });
    await p.click('button[aria-controls="mobile-menu"]');
    await p.waitForSelector("#mobile-menu");
    ok("Mobile menu opens", true);
    await p.keyboard.press("Escape");
    await wait(400);
    ok("Escape closes the mobile menu", !(await p.$("#mobile-menu")));
    await p.click('button[aria-controls="mobile-menu"]');
    await p.waitForSelector("#mobile-menu");
    await p.click('#mobile-menu a[href="/trousers"]');
    await wait(1200);
    ok("Mobile menu link navigates", p.url().endsWith("/trousers"));
    await p.click('button[aria-controls="filters-trouser"]');
    ok("Mobile Filters button reveals the filter panel", await p.$eval("#filters-trouser", (d) => getComputedStyle(d).display !== "none"));

    // keyboard: first Tab reaches skip link with a visible focus
    await p.goto(base + "/", { waitUntil: "networkidle0" });
    await p.keyboard.press("Tab");
    const focused = await p.evaluate(() => document.activeElement?.className || "");
    ok("First Tab lands on the skip link", focused.includes("skip-link"));
    await p.close();

    // ── v2: shop-floor pieces ──
    p = await newPage();
    await p.goto(base + '/', { waitUntil: 'networkidle0' });
    await wait(1200);
    const railLinks = await p.$$eval('ul[aria-label="Picked from the rack today"] a[href^="/product/"]', (a) => a.length);
    ok('Hero rail hangs 3 real products that link to their pages', railLinks === 3, railLinks + ' links');
    const bandTags = await p.$$eval('ul[aria-label="Price bands"] > li', (l) => l.length);
    ok('Price-band tags render from live stock', bandTags > 0, bandTags + ' tags');
    const tagLink = await p.$('ul[aria-label="Price bands"] a[href*="price="]');
    const tagHref = await p.evaluate((a) => a.getAttribute('href'), tagLink);
    await tagLink.click(); await wait(1800);
    const chip = await p.$('button[aria-label^="Remove filter"]');
    ok('Price tag opens the rack filtered by that band, with a removable chip', p.url().includes('price=') && !!chip, tagHref);
    const allInBand = await p.$$eval('article .price-tag', (els) => els.map((e) => +e.textContent.replace(/[^0-9]/g, '')));
    const band = tagHref.split('price=')[1];
    const lim = { 'under-500': [0, 499], '500-999': [500, 999], '1000-up': [1000, 1e9] }[band];
    ok('Every product shown sits inside the band', allInBand.length > 0 && allInBand.every((v) => v >= lim[0] && v <= lim[1]), allInBand.join(','));
    await chip.click(); await wait(1500);
    ok('Removing the chip clears the price filter from the URL', !p.url().includes('price='));
    await p.click('section.board button[aria-pressed="false"]'); await wait(1500);
    ok('Header price button filters the rack', p.url().includes('price='));
    const cutLinks = await p.goto(base + '/', { waitUntil: 'networkidle0' }).then(() => p.$$eval('#cuts a[href^="/product/"]', (a) => a.length));
    ok('Biggest cuts section links to real products', cutLinks >= 1, cutLinks + ' links');

    await p.goto(base + '/faq', { waitUntil: 'networkidle0' });
    await p.click('details summary'); await wait(300);
    ok('FAQ question opens', await p.$eval('details', (d) => d.open));
    await p.focus('details:nth-of-type(2) summary'); await p.keyboard.press('Enter'); await wait(200);
    ok('FAQ question opens with the keyboard', await p.$eval('details:nth-of-type(2)', (d) => d.open));
    await p.click('nav[aria-label="FAQ topics"] a[href="#payment"]'); await wait(600);
    ok('FAQ topic link jumps to its section', p.url().endsWith('#payment'));

    await p.goto(base + '/size-guide', { waitUntil: 'networkidle0' });
    await p.click('main button[aria-pressed="false"]'); await wait(300);
    ok('Size guide switches to the trousers chart', (await p.$eval('#chart-heading', (h) => h.textContent)).includes('Trousers'));

    await p.goto(base + '/shipping', { waitUntil: 'networkidle0' }); await wait(800);
    ok('Shipping page states the live delivery charge', (await p.$eval('#label-heading', (h) => h.textContent)).length > 5, await p.$eval('#label-heading', (h) => h.textContent));

    await p.goto(base + (await productPath()), { waitUntil: 'networkidle0' });
    const thumbs = await p.$$('button[aria-label^="Show photo"]');
    if (thumbs.length > 1) { await thumbs[1].click(); await wait(300); ok('Product thumbnail switches the photo', await p.evaluate((b) => b.getAttribute('aria-pressed') === 'true', thumbs[1])); }
    await p.focus('[aria-label="Open the full-size photo"]'); await p.keyboard.press('Enter'); await wait(500);
    const lb = await p.evaluate(() => !!document.querySelector('.fixed.inset-0 img'));
    ok('Main photo opens the lightbox from the keyboard', lb);
    await p.keyboard.press('Escape');
    const shopTag = await p.$eval('.hang-tag', (t) => t.textContent);
    ok('Product shop tag shows the delivery charge for this piece', /Free on this piece|per piece/.test(shopTag));

    // bag still has the item from earlier in this browser? new page has fresh storage, so add one
    const sz = await p.$$('main button[aria-pressed]:not([aria-label])');
    for (const s of sz) { if (!(await p.evaluate((b) => b.className.includes('line-through'), s))) { await s.click(); break; } }
    await p.click('button[aria-label^="Add "]'); await wait(600);
    await p.goto(base + '/cart', { waitUntil: 'networkidle0' }); await wait(800);
    const q0 = await p.$eval('[role=group][aria-label^="Quantity of"] span', (s) => +s.textContent);
    await p.click('button[aria-label="Increase quantity"]'); await wait(300);
    const q1 = await p.$eval('[role=group][aria-label^="Quantity of"] span', (s) => +s.textContent);
    ok('Bag quantity + works', q1 === q0 + 1, q0 + ' -> ' + q1);
    const payTxt = await p.$eval('aside button.btn-buy', (b) => b.textContent);
    ok('Pay button shows the bill total', /Pay ₹/.test(payTxt), payTxt);
    await p.type('#coupon-code', 'NOTREAL123'); await p.click('aside button.btn-primary'); await wait(1200);
    const cErr = await p.$('aside [role=alert]');
    ok('Unknown coupon shows an error on the bill', !!cErr, cErr ? await p.evaluate((e) => e.textContent, cErr) : '');
    await p.close();
} catch (e) {
    results.push("ERROR " + e.message);
}
await browser.close();
console.log(results.join("\n"));
// the made-up coupon above is meant to get a 404 from the API
const unexpected = errors.filter((e) => !e.includes("status of 404"));
console.log(unexpected.length ? "\nConsole errors:\n" + unexpected.join("\n") : "\nNo unexpected console errors.");
const failed = results.filter((r) => !r.startsWith("PASS")).length + unexpected.length;
console.log(`\nclick-through: ${results.length - failed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
