# Extract Menswear: design system

The site is built from the shop itself: the signboard over the counter on NTR Road, the clothing rails, swing price tags, the printed bill, the rolling shutter, the tailor's tape. If you add a page, borrow one of these objects instead of inventing a new decoration.

Dial: ENERGY 3 / RHYTHM 3 / MOTION 2 (loud black-and-white sign, sections that vary, motion only where something "hangs" or "rolls").

Design read: a menswear shop's own storefront for local and online shoppers, in a printed-signboard language rendered in black and white, dial ENERGY 3 / RHYTHM 3 / MOTION 2.

## Colour

Black, white and neutral greys, plus one colour: sale red. Red marks a deal (discount stamps, "You save", the Biggest cuts section), so it is the first thing the eye finds. The one other use is the "Cancelled" order stamp, a destructive state.

| Token | Value | Use it for |
|---|---|---|
| `primary` / `--blue` | `#111111` | The board: hero, navbar, footer, default buttons |
| `sign` / `--yellow` | `#ffffff` | The white plate for buying: price stickers, Buy / Pay buttons, the cart. Always ink text and an ink border |
| `hot` / `--red` | `#b3362c` | Discounts only (plus the Cancelled stamp). On dark pages use `dark:text-rose-400` for text |
| `--red-edge` | `#5a5a5a` | The grey offset edge on sign lettering (`.sign-type`, `.logo-word`) |
| `ink` | `#111111` | Text, borders, hard shadows |
| `emerald` | ink / white | Success text. Monochrome on purpose: colour is kept for sales |

Token names come from the colour edition (`redesign/signboard-ui`), so going back is a palette change, not a rewrite.

`slate-*` and `rose-*` are remapped to neutral greys and the sale red in `src/index.css`. Don't reach for Tailwind's stock `blue/amber/indigo/orange`. They are off palette. The admin pages still use stock slate and emerald.

The two themes differ from the first screen: in light mode the board (navbar, heroes, footer, sign cards) is a white sign with black lettering; in dark mode it is a black sign with white lettering. `index.css` does this by swapping `--color-white`, `--color-ink`, `--color-sign`, `--yellow` and `--ink` inside `.board` in light mode, so write board content with the normal white utilities (`text-white`, `bg-sign`) and it flips on its own. Avoid fixed hex whites inside a board.

Dark mode works through the `.dark` class. Check both themes. Paper objects (tags, the parcel label, the bill) stay light in dark mode on purpose, so give their text fixed colours (`text-ink`, `text-hot`), not `dark:` variants.

On a black board, a white hard shadow shows; on a light page use an ink or `#9e9e9e` shadow. A white shadow on a light page is invisible.

Big display headings are capped by their column with container units (`text-[min(110px,13cqi)]` on a parent with `@container`), so a long word like "Trousers" never runs past its box. Size the cap from the longest word: its width in em times the cqi value should stay under 95.

## Type

Archivo Variable (self-hosted, with the width axis). Headlines are wide and heavy like the sign lettering; body text is normal width.

- `.display`: poster headline. Use it once per screen as the focal point.
- `.sign-type`: white with the grey edge. Use it on the black board only.
- `.section-label`: an inverted strip above a section heading (ink on light pages, white on dark).
- `.price-tag`: the white price sticker with an ink border. Every price a shopper scans uses it.
- `.stamp`: the red tilted discount stamp.

## Shop-floor motifs

| Object | React | CSS | Where |
|---|---|---|---|
| Logo / eagle | `brand/Logo.jsx` (`<Logo>`, `<Eagle>`) | `.logo-word`, `.logo-tag` | Navbar, footer, cards, sign |
| Swing tag | `brand/HangTag.jsx` | `.hang-tag-wrap`, `.hang-tag` | Price bands (home), order stages (shipping), 7-day tag (returns), shop tag (product), 404 |
| Clothing rail | `brand/Hanger.jsx` | `.hang-rail`, `.rail-rod`, `.hanger`, `.hung` | Home hero, empty bag (with rail); empty rack (hangers only) |
| Printed bill | `brand/Receipt.jsx` (`Receipt`, `ReceiptHead`, `ReceiptLine`, `ReceiptRule`) | `.receipt-wrap`, `.receipt` | Bag total, payment success, about, return slips, empty orders |
| Bolted sign | none | `.bolted` + `.board` | About sign, contact visiting card, wholesale card, 404 |
| Shutter | none | `.shutter` | 404 only |
| Tailor's tape | none | `.tape` | Size guide header |

Rail details: put the rod and three hangers inside `.hang-rail`. It sizes each hanger to 80% of its column and places the rod through the hook's curl, and anything with `.hung` (a photo, a placeholder) hangs from the shoulders, covering the hanger's bottom bar the way a shirt does.

Tag details: set `hole` to the colour behind the tag so the eyelet looks punched through. To hang one tag lower on the same rail, set a longer string with `style={{ "--string": "80px" }}`. The `HangTag` pattern in Home and Shipping does this with a `--drop` variable per breakpoint.

## Buttons

`.btn-buy` (white plate) is for buying. `.btn-primary` (black, white in dark mode) is the default action. `.btn-outline` is secondary. All are 44px tall minimum and press in on `:active`.

## Data honesty

These rules exist because the old site showed claims the code did not back up.

- **Delivery:** each product has its own `shippingCost`. Never hard-code "free above X". Use `deliveryLine()` from `hooks/useShopStock.js`, which words the message from live stock.
- **Ratings:** shown only from reviews left on this site (`product.reviews`). The imported `ratings` / `numOfReviews` fields are not displayed.
- **Price bands:** `utils/priceBands.js` defines "Under ₹500", "₹500 to ₹999" and "₹1,000 and up" once. The home tags, the rack header and the filter panel all read it.
- **Filters:** options and counts come from `GET /products/facets` (live stock), never from a hand-kept list. Rack URLs carry every filter: `?size=M,L&color=Navy&fabric=Cotton&style=Casual&price=under-500&sale=1&stock=1&sort=discount&q=linen`. Colour swatches come from `utils/colors.js`; an unknown colour name still filters, with a plain swatch.
- **Loading:** `components/LoadingBar.jsx` shows a top bar whenever an API request or a page takes longer than 150 ms. Don't add page-level spinners for the same wait.
- **Counts and discounts** on the home page are computed from the catalogue (`useShopStock`), never typed in.
- **Order totals:** `order.totalAmount` excludes shipping, so add `order.shipping` to get what the customer paid.

## Accessibility checklist for a new page

- One `<main id="main-content">` and one `h1`.
- Every control is a real `<button>` or `<a href>`, at least 44px, with a visible focus ring (global `:focus-visible`).
- Data views have loading, empty and error states.
- Hanging and rolling motion runs once and stops. `MotionConfig reducedMotion="user"` and the CSS reduced-motion block switch it off.
- Copy uses no em dashes and makes no claims without a source.
- With the API and `npm run dev` running, `npm run test:ui` (in `client/`) clicks through the shop and checks filters, text contrast in both themes, text spilling out of its box, and sideways overflow on phones. Set `CHROME_PATH` if Chrome is not in the default Windows location.
