# Extract Menswear: design system

The site is built from the shop itself: the signboard over the counter on NTR Road, the clothing rails, swing price tags, the printed bill, the rolling shutter, the tailor's tape. If you add a page, borrow one of these objects instead of inventing a new decoration.

Dial: ENERGY 3 / RHYTHM 3 / MOTION 2 (loud sign colours, sections that vary, motion only where something "hangs" or "rolls").

## Colour

| Token | Value | Use it for |
|---|---|---|
| `primary` / `--blue` | `#30318D` | The board: hero, navbar, footer, default buttons |
| `sign` / `--yellow` | `#FFF200` | Buying: price stickers, Buy / Pay buttons, the cart. Always with `ink` text |
| `hot` / `--red` | `#C9241C` | Discounts and destructive actions only |
| `--red-edge` | `#A8301A` | The offset edge on sign lettering (`.sign-type`, `.logo-word`) |
| `ink` | `#12123A` | Text, borders, hard shadows |
| `emerald` | per theme | Savings and success text |

`slate-*` and `rose-*` are remapped to blue-tinted values in `src/index.css`, so existing utilities stay on palette. `gold-*` is a legacy alias for the theme accent (blue in light, yellow in dark). Don't reach for Tailwind's stock `blue/amber/indigo/orange`. They are off palette.

Dark mode works through the `.dark` class. Check both themes. Paper objects (tags, the parcel label) stay light in dark mode on purpose, so give their text fixed colours (`text-ink`, `text-[#42436f]`), not `dark:` variants.

## Type

Archivo Variable (self-hosted, with the width axis). Headlines are wide and heavy like the sign lettering; body text is normal width.

- `.display`: poster headline. Use it once per screen as the focal point.
- `.sign-type`: yellow with the red edge. Use it on the blue board only.
- `.section-label`: yellow highlighter label above a section heading.
- `.price-tag`: the yellow price sticker. Every price a shopper scans uses it.
- `.stamp`: the red tilted discount stamp.

## Shop-floor motifs

| Object | React | CSS | Where |
|---|---|---|---|
| Logo / eagle | `brand/Logo.jsx` (`<Logo>`, `<Eagle>`) | `.logo-word`, `.logo-tag` | Navbar, footer, cards, sign |
| Swing tag | `brand/HangTag.jsx` | `.hang-tag-wrap`, `.hang-tag` | Price bands (home), order stages (shipping), 7-day tag (returns), shop tag (product), 404 |
| Clothing rail | `brand/Hanger.jsx` | `.rail-rod` | Home hero, empty bag, empty rack |
| Printed bill | `brand/Receipt.jsx` (`Receipt`, `ReceiptHead`, `ReceiptLine`, `ReceiptRule`) | `.receipt-wrap`, `.receipt` | Bag total, payment success, about, return slips, empty orders |
| Bolted sign | none | `.bolted` + `.board` | About sign, contact visiting card, wholesale card, 404 |
| Shutter | none | `.shutter` | 404 only |
| Tailor's tape | none | `.tape` | Size guide header |

Tag details: set `hole` to the colour behind the tag so the eyelet looks punched through. To hang one tag lower on the same rail, set a longer string with `style={{ "--string": "80px" }}`. The `HangTag` pattern in Home and Shipping does this with a `--drop` variable per breakpoint.

## Buttons

`.btn-buy` (yellow) is for buying. `.btn-primary` (blue, yellow in dark mode) is the default action. `.btn-outline` is secondary. All are 44px tall minimum and press in on `:active`.

## Data honesty

These rules exist because the old site showed claims the code did not back up.

- **Delivery:** each product has its own `shippingCost`. Never hard-code "free above X". Use `deliveryLine()` from `hooks/useShopStock.js`, which words the message from live stock.
- **Ratings:** shown only from reviews left on this site (`product.reviews`). The imported `ratings` / `numOfReviews` fields are not displayed.
- **Price bands:** `utils/priceBands.js` defines "Under ₹500", "₹500 to ₹999" and "₹1,000 and up" once. The home tags, the rack header and the filter panel all read it. Rack URLs take `?price=<band id>&fabric=A,B`.
- **Counts and discounts** on the home page are computed from the catalogue (`useShopStock`), never typed in.
- **Order totals:** `order.totalAmount` excludes shipping, so add `order.shipping` to get what the customer paid.

## Accessibility checklist for a new page

- One `<main id="main-content">` and one `h1`.
- Every control is a real `<button>` or `<a href>`, at least 44px, with a visible focus ring (global `:focus-visible`).
- Data views have loading, empty and error states.
- Hanging and rolling motion runs once and stops. `MotionConfig reducedMotion="user"` and the CSS reduced-motion block switch it off.
- Copy uses no em dashes and makes no claims without a source.
