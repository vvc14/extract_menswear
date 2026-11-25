// Rack filters, colour swatches, the loading bar and the mobile filter panel.
// Expected numbers come from the live API, so the checks hold for any catalogue.
import { base, launch } from "./browser.mjs";

const browser = await launch();
let fail = 0, pass = 0;
const check = (name, ok, info = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${info ? `  (${info})` : ""}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const api = (q) => fetch(`${base}/api/products?${q}`).then((r) => r.json());
const shownTotal = (page) => page.$eval('[aria-live="polite"] span', (e) => Number(e.textContent));
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const rank = (s) => (SIZE_ORDER.includes(s) ? SIZE_ORDER.indexOf(s) : 100 + (parseFloat(s) || 0));

try {
    const p = await browser.newPage();
    await p.setViewport({ width: 1440, height: 900 });

    // 1. options come from stock, sizes in wearing order
    await p.goto(`${base}/shirts`, { waitUntil: "networkidle0" });
    await sleep(500);
    const sizes = await p.$$eval('aside button[aria-label^="Size "]', (b) => b.map((x) => x.textContent.trim()));
    check("size options come from stock, in wearing order", sizes.length > 0 && sizes.every((s, i) => !i || rank(sizes[i - 1]) <= rank(s)), sizes.join(","));
    const total0 = await shownTotal(p);
    check("rack total matches the API", total0 === (await api("category=shirt&page=1")).total, String(total0));

    // 2. size + price band: URL, total and chips agree with the API
    const size = sizes[sizes.length - 1];
    await p.click(`aside button[aria-label^="Size ${size},"]`);
    await sleep(1200);
    check("size goes into the URL", p.url().includes(`size=${size}`), p.url());
    await p.evaluate(() => [...document.querySelectorAll("aside button[aria-pressed]")].find((b) => b.textContent.startsWith("Under"))?.click());
    await sleep(1200);
    const expected = (await api(`category=shirt&size=${size}&maxPrice=499&page=1`)).total;
    check("filtered total matches the API", (await shownTotal(p)) === expected, `expected ${expected}`);
    const chips = await p.$$eval('button[aria-label^="Remove filter"]', (b) => b.map((x) => x.textContent.trim()));
    check("chips list active filters", chips.includes(`Size ${size}`) && chips.some((c) => c.startsWith("Under")), chips.join(", "));

    // 3. back undoes the last filter
    await p.goBack();
    await sleep(1200);
    check("back undoes the price filter", p.url().includes(`size=${size}`) && !p.url().includes("price="), p.url());

    // 4. rack search: a word from a real product name
    await p.goto(`${base}/shirts`, { waitUntil: "networkidle0" });
    const word = (await api("category=shirt&limit=1"))[0].name.split(/\s+/)[0].toLowerCase();
    await p.type('input[type="search"]', word);
    await sleep(1500);
    const searched = (await api(`category=shirt&search=${encodeURIComponent(word)}&page=1`)).total;
    check("search narrows the rack and lands in the URL", p.url().includes(`q=${word}`) && (await shownTotal(p)) === searched, `"${word}": ${searched}`);

    // 5. a shared link restores toggles and sort
    await p.goto(`${base}/shirts?sale=1&sort=discount`, { waitUntil: "networkidle0" });
    await sleep(500);
    const saleChecked = await p.$eval('input[role="switch"]', (e) => e.checked);
    const sortVal = await p.$eval("main select", (e) => e.value);
    check("shared link restores On sale + sort", saleChecked && sortVal === "discount", `${saleChecked} ${sortVal}`);

    // 6. no results: empty rack with Clear filters
    await p.goto(`${base}/shirts?q=zzzznotathing`, { waitUntil: "networkidle0" });
    await sleep(500);
    check("no results shows the empty rack", await p.evaluate(() => document.body.innerText.toLowerCase().includes("empty hangers")));
    await p.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent === "Clear filters")?.click());
    await sleep(1200);
    check("Clear filters resets the URL", p.url().endsWith("/shirts"), p.url());
    await p.close();

    // 7. colour swatches: the facet answer gets sample colours in this tab only, no data is changed
    const c = await browser.newPage();
    await c.setViewport({ width: 1440, height: 900 });
    await c.setRequestInterception(true);
    c.on("request", async (r) => {
        if (!r.url().includes("/api/products/facets")) return r.continue();
        const real = await fetch(r.url()).then((x) => x.json());
        real.color = [{ value: "Navy", count: 4 }, { value: "White", count: 2 }, { value: "Mauve Haze", count: 1 }];
        r.respond({ status: 200, contentType: "application/json", body: JSON.stringify(real) });
    });
    await c.goto(`${base}/shirts`, { waitUntil: "networkidle0" });
    await sleep(500);
    const colourBtns = await c.$$eval("aside button", (b) => b.filter((x) => /Navy|White|Mauve/.test(x.textContent)).length);
    check("colour section lists swatches with counts", colourBtns === 3, String(colourBtns));
    await c.evaluate(() => [...document.querySelectorAll("aside button")].find((b) => b.textContent.includes("Navy")).click());
    await sleep(800);
    check("colour goes into the URL", c.url().includes("color=Navy"), c.url());
    await c.close();

    // 8. loading bar on a slow request, gone when done
    const s = await browser.newPage();
    await s.setViewport({ width: 390, height: 844 });
    await s.setRequestInterception(true);
    s.on("request", async (r) => {
        if (r.url().includes("/api/products?")) await sleep(1500);
        r.continue();
    });
    await s.goto(`${base}/trousers`, { waitUntil: "domcontentloaded" });
    let seen = false;
    for (let i = 0; i < 30 && !seen; i++) { seen = !!(await s.$(".loading-bar")); await sleep(100); }
    check("loading bar shows while waiting on the server", seen);
    await s.waitForNetworkIdle();
    await sleep(400);
    check("loading bar hides when done", !(await s.$(".loading-bar")));

    // 9. mobile filter panel
    await s.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Filters")?.click());
    await sleep(300);
    const showBtn = await s.evaluate(() => [...document.querySelectorAll("button")].map((b) => b.textContent.trim()).find((t) => /^Show \d+/.test(t)));
    check("mobile filter panel offers Show N", !!showBtn, showBtn);
    check("no sideways scroll at 390px", (await s.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0);
} catch (err) {
    fail++;
    console.log(`ERROR  ${err.message}`);
}

await browser.close();
console.log(`\nfilters: ${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
