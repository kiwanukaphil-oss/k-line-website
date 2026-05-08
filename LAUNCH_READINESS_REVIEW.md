# K-LINE MEN — Launch-Readiness Review

> **Date:** 2026-05-07
> **Scope:** Full codebase + UX + brand audit ahead of public launch.
> **Status:** Reference document — update as items are closed out.

This is the working brief for everything that needs to happen between now and a credible "premium menswear retailer" launch. Every recommendation is tied to a specific file or line so future contributors (or future-you) can act without re-reading the whole site.

> ✅ **Call line resolved (2026-05-07):** Correct call line is `+256 704 667 111`. Code updated in [products.js:276-277](assets/js/products.js#L276-L277) — the previous value `0704 677 111` was a digit transposition.

---

## A. Executive summary

**Verdict: not launch-ready as a "premium" storefront — but very close to a credible "soft-launch / Kampala beta" if the performance, content, and trust issues below are fixed.**

The bones are excellent. The information architecture is right (image-first home, clean shop with URL-driven filters, PDP with WhatsApp deep-link, localStorage cart, IG strip, Look of the Week). The typography pairing (Cormorant Garamond + Manrope), the bronze-on-ink palette, and the editorial hierarchy genuinely do feel comfortably premium — closer to Mr Porter / Charles Tyrwhitt than the typical Kampala IG-shop site. The vanilla-JS, no-build architecture is the right call for the team and budget.

But three things make the site feel *unfinished* rather than premium:

1. **Performance is brutal.** 311 MB of unoptimised PNGs across 189 files (averaging ~1.5–2 MB each). The `optimize-images.mjs` script exists but has never been run, no `.webp` files exist, and the HTML wouldn't use them anyway because every `<img src>` points to `.png`. The homepage alone will pull ~30 MB on first load — unusable on Ugandan mobile data, and a hard "no" for any premium shopper. **This is the #1 launch blocker.**
2. **The product story has thin spots.** Every product has one image and one paragraph, no fit/fabric/care, no size guide, no reviews, no real "About the brand" story behind the K-LINE Signature line. A man spending UGX 750 k on a suit needs more reassurance than that.
3. **Trust signals are inconsistent.** The favicon is `Logo.png` (755 KB!) at full resolution, the email `hello@k-line-men.com` looks placeholder, the call number conflicts with what's on file, the contact form pretends to "send" but only opens WhatsApp, and there's no privacy policy, terms, or returns page proper — only an FAQ section. For a premium retailer asking for upfront Mobile Money payment, that's underweight.

Fix those three and you have a launch. Without them, expect bounce rates above 70% on mobile and abandoned baskets at the WhatsApp handoff.

---

## B. What's working well

1. **Editorial homepage structure.** [index.html](index.html) reads top-to-bottom like a magazine: hero → categories → outfit edits → new → bestsellers → Look of the Week → signature → IG strip → trust → story. That's the right premium-retail rhythm.
2. **Type system.** Cormorant Garamond display + Manrope body is a strong, distinctive pairing — feels closer to a Savile Row site than to a generic Bootstrap template.
3. **Single source of truth for products.** [products.js:33](assets/js/products.js#L33) cleanly drives every page — good engineering for a one-person shop.
4. **WhatsApp checkout flow.** [site.js:136-167](assets/js/site.js#L136-L167) builds a clean prefilled order summary with an in-app browser fallback. That's a thoughtful detail most local shops miss.
5. **URL-driven filter state on shop.** [shop.html:228-235](shop.html#L228-L235) — sharing a filtered view actually works, and `?cat=blazers&badge=new` survives refresh. Genuinely well done.
6. **Real focus styles.** [styles.css:268-293](assets/css/styles.css#L268-L293) — `:focus-visible` rings on every interactive element, only on keyboard. Most local sites skip this entirely.
7. **Mobile drawer is accessible.** [site.js:312-343](assets/js/site.js#L312-L343) tracks `aria-expanded`, `aria-hidden`, focus return, and Escape. Better than 90% of shops at this scale.
8. **Brand voice is right.** Copy like *"Don't shop pieces. Shop outfits."* and *"What real men keep buying"* lands as confident, masculine, Kampala-aware without being macho. Good editorial restraint.
9. **Category coverage is realistic.** 17 categories with stub cards for empty ones ([index.html:294-296](index.html#L294-L296)) is the right pragmatic move — keeps the rail visible while photography catches up.
10. **Trust strip + Story section.** Concrete promises (Kampala same-day, 7-day exchange, real human on WhatsApp, Mobile Money) are the four things that actually convert in this market.

---

## C. Major issues to fix before launch

### C1. Image performance — site-killing
- ~~**No optimised images shipped.**~~ ✅ **Resolved 2026-05-07** — `npm run optimize:images` now emits 567 WebP variants (3 per PNG: 400w/800w/1200w). 310 MB → 17.6 MB (94 % saving).
- ~~**Build pipeline isn't wired into HTML.**~~ ✅ **Resolved 2026-05-07** — added `SITE.pictureHTML(src, alt, opts)` helper in [site.js:33-65](assets/js/site.js#L33-L65). Used everywhere images render: product cards, hero showcase, category grid, IG strip, Look of the Week, PDP main, cart line, about page. Each emits `<picture><source type="image/webp" srcset="-400/-800/full"> <img src="…png" loading="lazy"></picture>`. Above-the-fold images (hero, PDP main) get `loading="eager" fetchpriority="high"`.
- ~~**Logo as favicon.**~~ ✅ **Resolved 2026-05-07** — full favicon set generated by [scripts/generate-favicons.mjs](scripts/generate-favicons.mjs) (`favicon-16.png`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`) plus a [site.webmanifest](site.webmanifest). Combined favicon weight is now ~120 KB across all variants vs. the single 755 KB `Logo.png`; the per-tab favicon load is 0.6 KB.
- ~~**Footer logo too.**~~ ✅ **Resolved 2026-05-07** — replaced with `Logo-footer.webp` (12.2 KB, 98% saving). The generator projects the source luminance into the alpha channel, producing a transparent-background white mark that drops cleanly onto the dark footer. The CSS `mix-blend-mode: screen` hack is gone.

> **Note for next sprint:** PNGs are kept as the `<picture>` fallback for one release cycle. After verifying WebP renders correctly across iOS Safari / Android Chrome / desktop browsers in production, delete `assets/images/**/*.png` to drop deployed image weight from ~330 MB to ~17 MB.

### C2. Conflicting / placeholder contact details
- ~~**Call number disagreement.**~~ ✅ **Resolved 2026-05-07** — correct call line is `+256 704 667 111`; transposition fixed in [products.js:276-277](assets/js/products.js#L276-L277).
- ~~**Email looks placeholder.**~~ ✅ **Resolved 2026-05-08** — set to `klinedesignltd@gmail.com` on the `KLINE.EMAIL` constant in [products.js](assets/js/products.js); contact page reads it dynamically, privacy + terms hardcoded copies updated. (`klinedesignstudio@gmail.com` was an earlier wrong assumption — that's a separate sister business; K-LINE MEN's actual operating email is the `ltd` address.)
- **README references wrong domain.** [README.md:107](README.md#L107) — `K-LINE MEN.com` (with space) repeated several times. Won't break anything, but signals "unfinished".

### C3. Contact form is a pretend form
✅ **Resolved 2026-05-08** — form POSTs to Formspree (form ID `xykodlge`, free-tier account on `kiwanukaphil@gmail.com`; submissions land there and are forwarded as needed). Endpoint config lives in [products.js](assets/js/products.js#L289) as `KLINE.FORMSPREE_ENDPOINT`. Inputs got `name=` attributes; honeypot field added; `_subject` set to "K-LINE MEN — message from contact form". On success: form resets and a toast confirms ("Thanks — we will reply within one business day."). On any failure (network, non-2xx, unconfigured placeholder): falls back to opening WhatsApp prefilled with the same message so the customer's input is never lost.

### C4. PDP under-delivers on premium
- **One image per product.** [product.html:14-16](product.html#L14-L16) hides the thumb column when there's only one image. For a UGX 750 k tuxedo this is unacceptable; you need at least 3 shots (full, detail, model/back).
- **No size guide.** The "Need help?" link in [product.html:111](product.html#L111) is rendered with class `size-link` but has no click handler — pressing it does nothing. Launch-blocker.
- **No fabric / care / fit description block.** PDP has only the one-line `description` from the catalog. For tailoring/suits/shoes, missing fabric composition, country of origin, fit notes, and care instructions cuts trust hard.
- **No stock indicator.** Site implies infinite stock; first time someone orders a sold-out item the WhatsApp reply will be "actually we don't have that". Either add a `stock` field to products.js, or add a copy line ("availability confirmed on WhatsApp") so expectations are set.
- **No related-product fallback when category is small.** [product.html:196](product.html#L196) — coats has 1 product, so the "More from this category" rail will be empty.

### C5. Trust gaps
- ~~**No privacy policy or terms.**~~ ✅ **Resolved 2026-05-07** — [privacy.html](privacy.html) and [terms.html](terms.html) drafted to UDPPA 2019 standards. Privacy covers data categories, lawful basis, third-party processors (Meta/WhatsApp, Formspree, hosting, couriers), cross-border transfers, retention (24 months), and full UDPPA rights including right to lodge with the Personal Data Protection Office of Uganda. Terms cover ordering via WhatsApp, UGX pricing, payment methods, delivery, returns/exchanges, IP, liability cap, governing law (Uganda). Footer Help column links both. ⚠️ **Owner should review before launch** — no legal-entity registration number is included; if K-LINE MEN trades under a registered business name, add it to the "Who we are" section of both docs.
- **No physical proof.** "Fraine Building, Ntinda" is fine, but a single map embed on the contact page would be worth a lot.
- **No review/social proof.** "What real men keep buying" implies bestsellers, but no count, no testimonial, no IG embed, no "as worn by". The IG strip uses fallback catalog photos — same images that already appear elsewhere — which actually undermines trust ("we don't have a real Instagram?"). Drop 6 real screenshots into `assets/images/instagram/`.

### C6. Cart & checkout edge cases
- **No min-order, no delivery fee preview.** Cart shows "Quoted on WhatsApp" — fine, but a sub-UGX 50 k order shouldn't be encouraged through the same flow as a UGX 1.2 m suit. Consider a delivery-zone selector on cart, or a "Free delivery within Kampala over UGX 300,000" line.
- **Cart is per-browser.** [site.js:35](assets/js/site.js#L35) — `localStorage` only. If a customer adds on phone and switches to laptop, cart vanishes. Acceptable for v1, but call it out in the cart footer ("Your bag is saved on this device only").
- **No "back to top" / sticky checkout button on mobile cart.** Long carts on mobile force a scroll to the bottom to checkout.

### C7. SEO is half-built
- ~~**No JSON-LD / schema.org.**~~ ✅ **Resolved 2026-05-07** — Organization/ClothingStore JSON-LD auto-injected on every page via `injectOrganizationJSONLD()` in [site.js](assets/js/site.js) (called from `mount()`); Product + Offer + BreadcrumbList injected on PDP both as static markup at build time (in pre-rendered files) and as a JS fallback on the dynamic `/product.html?id=X` URL. Product LD includes `sku`, `brand`, `category`, `color`, `priceCurrency`, `price`, `availability`, and a seller `Organization`.
- ~~**Sitemap dates are baked-in.**~~ ✅ **Resolved 2026-05-07** — replaced PowerShell snippet with [scripts/build-sitemap.mjs](scripts/build-sitemap.mjs). Run `npm run build:sitemap` to rebuild — emits 213 URLs (7 static + 17 category + 189 product) with today's `<lastmod>` and per-URL priority. Now part of `npm run build:all`.
- ~~**Most product pages share a generic title until JS runs.**~~ ✅ **Resolved 2026-05-07** — [scripts/prerender-products.mjs](scripts/prerender-products.mjs) emits one HTML file per product at `/product/{id}.html` with pre-baked `<title>`, `<meta description>`, `<link rel="canonical">`, Open Graph, Twitter card, and JSON-LD. The dynamic `/product.html?id=X` URL still works (canonical points at the clean URL). Internal product links across the site now point at the clean URL form. `<base href="../">` in pre-rendered files keeps relative paths resolving correctly.
- ~~**No canonical tags on shop / category pages.**~~ ✅ **Resolved 2026-05-07** — every static root-level page now ships `<link rel="canonical">` in its head. Shop canonical points at the unfiltered URL (Google indexes one shop page, not every `?cat=…` permutation). Cart and wishlist additionally ship `<meta name="robots" content="noindex">` and are excluded from the sitemap because they're per-device shopping state.
- ~~**OG image is a single suit photo.**~~ ✅ **Resolved 2026-05-07** — [scripts/generate-og-card.mjs](scripts/generate-og-card.mjs) composites the navy-suit hero with a left-side dark gradient panel and SVG-rendered brand text/tagline at 1200×630. Output `og-card.jpg` is 44.9 KB. Run `npm run generate:og` (also part of `build:all`). [index.html:14](index.html#L14) now points at the absolute URL `https://k-line-men.com/og-card.jpg` plus `og:image:width/height` and `og:url`. PDPs keep the product photo as `og:image` (set at prerender time) so social previews show the actual product, not the brand card.

---

## D. Design and UX recommendations

### D1. Header
- **Search icon is a link, not a search.** [site.js:204](assets/js/site.js#L204) — clicking the magnifier just goes to `shop.html`. Either remove it (the shop has a clear search bar) or wire it to focus the search field. Right now it's UX debt.
- **Brand mark on mobile.** At <640 px the header uses 22 px text — fine — but the brand and the WhatsApp icon both compete for thumb space. Consider dropping the "Real Men Real Style" subtitle on mobile.
- **Announcement bar fatigue.** [styles.css:67](assets/css/styles.css#L67) — three pieces of copy ("New styles weekly · IG · WhatsApp") in a 12 px uppercase row. On 360 px wide it becomes 3 lines and feels noisy. Trim to one rotating line, or hide on mobile.

### D2. Hero
- **Hero showcase has no `loading="eager"` / no priority hint.** [index.html:48](index.html#L48) — the three hero images are above-the-fold but inherit lazy behaviour. Add `fetchpriority="high"` to the tall hero photo and `loading="eager"` to all three.
- **Hero copy uses "Real Men. Real Style." both in the eyebrow area and in the H1.** Right hook, but reads slightly tautological. Suggested rework:
  > Eyebrow: *Modern menswear · Kampala*
  > H1: *Real Men. Real Style.*
  > Sub: *Smart pieces for work, weekends, and the rooms that remember you.*

### D3. Cards & grids
- **Product card "sizes" line is misleading.** [site.js:260-262](assets/js/site.js#L260-L262) shows `S–XXL` for tops. That's a *range*, not stock — implying every size is available when nothing's actually inventoried. Replace with the colour count or "5 sizes" or just drop the line.
- **Category card `aspect-ratio: 4/5`** produces tall thumbs. On 4-up grid that's beautiful; on 2-up mobile grid those tiles get visually overwhelming. Consider 3/4 on mobile.
- **Stub category card** ([styles.css:494-502](assets/css/styles.css#L494-L502)) — looks great but says "New category — coming soon". For sandals/caps/sunglasses/gym you actually *have* products. Verify the category-image mappings ([index.html:271-273](index.html#L271-L273)) line up with the committed images — git status shows many of these are untracked (see E9).

### D4. Look of the Week
✅ **Resolved 2026-05-08** — hero image decoupled from the product chip list. Now uses `assets/images/looks/look-002.png` (a styled flatlay: white polo + soft tan chino + tan suede penny loafer + tortoise wayfarer). `LOOK_OF_WEEK_IMAGE` is a separate constant from `LOOK_OF_WEEK_IDS`, so swapping the visual is a one-line edit. Copy and product chips updated to match what's actually in the photo.

### D5. IG strip
✅ **Resolved 2026-05-08** — IG strip now uses 6 styled flatlays from `assets/images/looks/` (see Section J resolution below). Each tile is a complete outfit instead of a catalog repeat. Captions match the look ("Saturday navy", "Hopsack blazer fit", "Gingham + grey", etc.). Will be swapped for real `@k_linemen` screenshots when available; the wiring is unchanged so the swap is a path-level edit.

### D6. Footer
- **Hours line is hardcoded.** [site.js:244](assets/js/site.js#L244) "Open Mon–Sat · 9am–7pm" — make sure Google Business Profile matches.
- **No newsletter capture.** For premium menswear, even a low-friction "Get the weekly outfit drop in your WhatsApp" opt-in (Mailchimp/Brevo + WhatsApp Business broadcast) would compound. Not launch-blocking.
- **Logo `mix-blend-mode: screen` trick** ([styles.css:1067-1074](assets/css/styles.css#L1067-L1074)) — clever but fragile. Better: ship a transparent-PNG (or SVG) version of the logo and remove the blend hack.

### D7. PDP
- ~~**"Need help?" size-link does nothing.**~~ ✅ **Resolved 2026-05-07** — converted from `<a>` to `<button>`, wired to open a WhatsApp message prefilled with the product name, price, and prompts for the customer's usual size + chest/waist measurements. Focus ring added via `.size-link:focus-visible` in styles.css.
- **`pdp-summary` and the Details accordion repeat the same description.** [product.html:99](product.html#L99) and [:135-137](product.html#L135-L137). Consolidate so the summary teases (one sentence) and the accordion expands (fabric, fit, care).
- **No "share" beyond WhatsApp.** [product.html:148](product.html#L148) — add Web Share API or X/IG link.

### D8. Cart
- **Quantity input on mobile** uses `inputmode="numeric"` (good) but sits visually next to "Remove" with no spacing on the smallest grid. [styles.css:1514-1515](assets/css/styles.css#L1514-L1515) collapses ci-actions to row at 640 px — verify on a real 360 px Android.
- **`Subtotal (excl. delivery)` repeats the items subtotal verbatim.** [cart.html:79-81](cart.html#L79-L81) — UX-confusing. Either show only one line ("Subtotal — delivery quoted on WhatsApp") or don't show the same number twice.

### D9. Buttons & states
- **Hover `transform: translateY(-2px)`** ([styles.css:253](assets/css/styles.css#L253)) on every `.btn` cascades with card-lift hovers and feels jittery. Reduce to `-1px` or remove on cards.
- **Toast position** ([styles.css:1305-1326](assets/css/styles.css#L1305-L1326)) sits over the floating WhatsApp on mobile. Nudge it up by 80 px on small screens or anchor to top.

---

## E. Codebase recommendations

### E1. Inline `<script>` blocks per page should move to modules
[index.html:251-348](index.html#L251-L348), [shop.html:86-238](shop.html#L86-L238), [product.html:58-198](product.html#L58-L198), [cart.html:35-131](cart.html#L35-L131). All contain page-specific logic in inline scripts. That works, but:
- Can't be cached separately.
- Can't be linted/typed.
- Causes duplicated arrays (`LOOK_OF_WEEK_IDS`, `IG_TILES`, `categoryImages`) to live in HTML, far from products.js.

**Better structure:**
```
assets/js/
  products.js       # data only
  site.js           # shared (header/footer/cart/wishlist)
  pages/
    home.js         # categoryImages, LOOK_OF_WEEK_IDS, IG_TILES, render fns
    shop.js         # filter state machine
    product.js      # PDP wiring
    cart.js         # render + checkout
```

Each page loads exactly two scripts: `site.js` + the page's `pages/*.js`. Same vanilla, no build, but separation of concerns and one place to grep.

### E2. Move config out of products.js
[products.js:264-282](assets/js/products.js#L264-L282) — `WHATSAPP_*`, `CALL_*`, `INSTAGRAM_*`, `formatUGX`, `whatsappUrl` are *site config*, not product data. Split:

```
assets/js/config.js   # SITE_CONFIG: phone, IG, address, currency, hours, email
assets/js/products.js # array only
assets/js/utils.js    # formatUGX, whatsappUrl, byId, byCategory, byBadge
```

Makes `products.js` pure data, suitable for being generated by a CMS/spreadsheet later.

### E3. HTML strings via concatenation are XSS-shaped
Every product render uses `'<h3>' + product.name + '</h3>'`. If a product name ever contains an apostrophe / quote / `<`, the HTML breaks. *Today* this is fine because you control the catalog. Two cheap mitigations:
- An `escapeHTML` helper used everywhere strings are dropped into innerHTML.
- A `tag` template-literal helper that auto-escapes.

E.g. [site.js:269-287](assets/js/site.js#L269-L287) — `aria-label="' + product.name + '"` will break if a name contains `"`. The product *"K-LINE Men's Store"* with the apostrophe would already fail in [products.js:186](assets/js/products.js#L186) — only safe because it's data, not HTML attribute.

### E4. Long inline strings vs `<template>`
`productCardHTML` ([site.js:258-291](assets/js/site.js#L258-L291)) is fine but hard to scan. Either move to a `<template id="product-card">` block in a tiny `partials.html` you fetch once, or split into smaller helpers (`_badgeHTML`, `_priceHTML`, `_metaHTML`). Right now any whitespace/typo in the string concat fails silently.

### E5. Inline page styles
[shop.html:62](shop.html#L62), [contact.html:27](contact.html#L27), [about.html:27](about.html#L27), and most pages have inline `style="..."` blocks for layout grids. Move to utility classes in `styles.css` (`.two-col`, `.three-col`, `.gap-48`). The inline styles bypass `prefers-color-scheme` / responsive media queries.

### E6. Magic numbers in CSS
- `--header-h: 78px` ([styles.css:38](assets/css/styles.css#L38)) but mobile drops it to 64 px ([styles.css:1496](assets/css/styles.css#L1496)) without updating the variable, so sticky-top calculations on mobile (filter panel, cart summary) misalign by 14 px. Use `clamp(64px, 8vw, 78px)` or override the variable inside the media query.
- Story padding `64px` ([styles.css:1001](assets/css/styles.css#L1001)) and 32px on mobile is fine, but `border-radius: 32px` on the card with `border-radius: 24px` on mobile creates inconsistency. Use a shared `--radius-lg`.

### E7. `optimize-images.mjs` UX
~~[scripts/optimize-images.mjs:16](scripts/optimize-images.mjs#L16) — the path resolution `path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ''))` is a Windows hack.~~ ✅ **Resolved 2026-05-07** — replaced with `fileURLToPath(import.meta.url)` ([scripts/optimize-images.mjs:11-17](scripts/optimize-images.mjs#L11-L17)). Cross-platform; handles URL-encoded spaces in `OneDrive` paths that broke the original resolver.

### E8. Dead / orphan files
- [preview (2).html](preview%20(2).html) — 45 KB at the root. Not linked. Delete or move to `/scratch/`.
- [WEBSITE_REVIEW.md](WEBSITE_REVIEW.md) — a previous review. Decide if it's a working doc or old; if old, delete to reduce confusion.
- [Product images/](Product%20images/) — README says "safe to delete after deploy." Delete from the repo and `.gitignore` the folder. Right now it's bloating OneDrive sync.
- [Instagram/](Instagram/) folder is untracked — either commit (and use it as the IG strip source) or `.gitignore`.

### E9. Untracked product images
`git status` shows ~16 new images added since the last commit (caps/, gym/, sandals/, sunglasses/, watches-003 through 012, accessories-004 through 012). They're referenced in [products.js](assets/js/products.js) but not committed — if anyone clones the repo right now the IDs `caps-001`, `sandals-001`, etc. all 404. **Commit before deploy.**

### E10. Reduce duplication of `<head>`
Every page repeats 6 lines of font preconnect + Cormorant/Manrope link + favicon + stylesheet. Seven places to update if you change a font weight. Either:
- Move to a tiny `<script>` that injects the head links (works since you already inject header/footer), or
- Accept the duplication (acceptable at 7 pages) but commit to a single `<!-- ${HEAD_INCLUDES} -->` comment marker so a script can sync them.

---

## F. Performance recommendations

### F1. Ship the WebP pipeline (highest impact, do this first)
✅ **Done 2026-05-07.** Implementation:
- [scripts/optimize-images.mjs](scripts/optimize-images.mjs) path-resolution bug (E7) fixed; `npm run optimize:images` now produces 567 WebP variants from 189 PNGs.
- `SITE.pictureHTML(src, alt, opts)` helper added at [site.js:33-65](assets/js/site.js#L33-L65). Used by `productCardHTML` (homepage, shop, related, wishlist), hero showcase, category cards, IG strip, Look of the Week, PDP main, cart line, about page hero.
- PNG kept as fallback `<img>` inside each `<picture>` — modern browsers serve WebP via `<source>`, ancient browsers fall through to PNG.
- Above-the-fold images (hero showcase, PDP main) pass `eager: true` to the helper, which emits `loading="eager" fetchpriority="high" decoding="async"`. All others get `loading="lazy" decoding="async"`.
- Global CSS rule `picture { display: block; max-width: 100%; }` added at [styles.css:55](assets/css/styles.css#L55) so existing per-context selectors like `.product-media img { width:100%; height:100%; object-fit:cover }` continue to size images correctly.

Expected weight delta: homepage first-paint drops from ~30 MB to ~600 KB.

**To verify before deleting PNG fallbacks:** test on iOS Safari, Android Chrome, desktop Chrome/Firefox/Safari. Confirm WebP `<source>` is selected (DevTools Network tab — `.webp` should be served, not `.png`). After verification, delete `assets/images/**/*.png` to bring deployed image weight to ~17 MB.

### F2. Favicon set
✅ **Done 2026-05-07.** [scripts/generate-favicons.mjs](scripts/generate-favicons.mjs) produces the full set from a single `Logo.png` source:
- `favicon-16.png` (0.3 KB), `favicon-32.png` (0.6 KB)
- `apple-touch-icon.png` (180×180, 13.3 KB)
- `icon-192.png` (5.2 KB), `icon-512.png` (102 KB) — referenced by [site.webmanifest](site.webmanifest)

All 8 HTML pages updated to reference the new set with size hints. `<meta name="theme-color" content="#111827">` added to every page for consistency. Run `npm run generate:favicons` to rebuild after Logo source changes.

### F3. Footer logo
✅ **Done 2026-05-07.** Now uses `Logo-footer.webp` (12.2 KB) generated by [scripts/generate-favicons.mjs](scripts/generate-favicons.mjs). The script reads `Logo.png` (white-on-black RGB), projects the per-pixel luminance into the alpha channel, and forces visible RGB to white — the result is a transparent-background white mark that composites cleanly onto the dark footer. CSS `mix-blend-mode: screen` hack is removed at [styles.css:1066-1075](assets/css/styles.css#L1066-L1075).

### F4. Defer Google Fonts
Currently render-blocking. Either self-host (Manrope + Cormorant Garamond → Google Fonts → download → drop in `/assets/fonts/`) and serve woff2 with `font-display: swap`, or add `media="print" onload="this.media='all'"` to the `<link>` to defer it. Self-hosting also removes the cross-origin DNS lookup.

### F5. JS size and split
[site.js](assets/js/site.js) is 22 KB and inlined everywhere; [products.js](assets/js/products.js) is 76 KB (mostly data). Acceptable for now, but `products.js` will balloon as you add stock per size. Long-term, split product data into per-category JSON files lazy-loaded by the shop page.

### F6. Cache headers
✅ **Resolved 2026-05-07** — [_headers](_headers) at repo root configures Netlify with:
- 30-day cache for `/assets/images/*`, favicons, footer logo
- 1-day cache for CSS/JS (`must-revalidate` so deploys roll out within a day)
- 1-day cache for `og-card.jpg`, `site.webmanifest`
- 1-hour cache for HTML and pre-rendered `/product/*.html`
- Security headers on every path: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Doesn't use `immutable` because filenames aren't content-hashed. Companion [_redirects](_redirects) maps old `/product.html?id=X` URLs → `/product/X.html` with 301 for clean SEO migration.

### F7. Service worker (post-launch)
A minimal SW that pre-caches the homepage, shop, and the product images for the front-page grid would make a returning visit feel instant. Don't ship before launch — flag for v1.1.

---

## G. SEO recommendations

### G1. Add JSON-LD on every page
✅ **Done 2026-05-07** — three schemas now ship:
- **Organization / ClothingStore** — auto-injected by `injectOrganizationJSONLD()` in [site.js](assets/js/site.js) (called from `mount()`). Includes name, description, url, logo, telephone (WhatsApp), email, priceRange (UGX 35,000 – 950,000), full address, opening hours (Mon–Sat 09:00–19:00), and Instagram via `sameAs`. Uses ClothingStore type so search-engine local-business panels render correctly.
- **Product + Offer** — emitted as static `<script type="application/ld+json">` at the top of every pre-rendered `/product/{id}.html`, and injected via JS on the dynamic `/product.html?id=X` URL (helper in `SITE.injectProductJSONLD`). Includes `name`, `description`, `sku`, `image`, `url`, `brand`, `category`, `color`, and an `Offer` with `priceCurrency: UGX`, `price`, `availability: InStock`, `seller`.
- **BreadcrumbList** — Home → Shop → Category → Product, also dual-path (static on pre-rendered pages, JS-injected on dynamic).

### G2. Pre-render `<title>` + `<meta description>` per product
✅ **Done 2026-05-07** — see [scripts/prerender-products.mjs](scripts/prerender-products.mjs). Run via `npm run prerender:products` (or `npm run build:all` to do everything). Output: 189 files at `/product/{id}.html`, each with pre-baked `<title>`, `<meta description>`, `<link rel="canonical">`, Open Graph + Twitter card meta, Product + Breadcrumb JSON-LD, and a `window.PRODUCT_ID` constant injected before `products.js` loads. Page body and scripts unchanged from `product.html` — `<base href="../">` keeps existing relative paths working. Internal product links across the site updated to the clean URL form.

### G3. Canonical tags
- `<link rel="canonical" href="https://k-line-men.com/shop.html">` on shop (regardless of `?cat=`).
- Per-product canonical pointing at the clean URL.

### G4. Update `<meta description>` per category
Shop currently has a generic description. After someone deep-links to `?cat=blazers` we still serve the homepage description. Patch in JS at minimum (same pattern as PDP): if `?cat=` is set, override the meta description.

### G5. Image alt text
Mostly populated, but make sure every product gets a *descriptive* alt — for SEO, `"Royal Navy 2-Piece Slim-Fit Wool Suit — K-LINE MEN Kampala"` outperforms `"Royal Navy 2-Piece Suit"`. Generate via products.js (concatenate name + category + "Kampala").

### G6. Internal linking
Footer "Shop bestsellers / new arrivals / signature" already cross-links well — extend with text links from the about page ("Shop our most-loved navy suit") and from the homepage story section.

### G7. Local SEO
- Submit the sitemap in Google Search Console + Bing Webmaster.
- Create / claim Google Business Profile for "K-LINE MEN, Fraine Building, Ntinda."
- File for Bing Places.
- Get listed on Jumia Uganda's directory (or whatever the local equivalent is for menswear).

### G8. Sitemap regeneration
✅ **Done 2026-05-07** — [scripts/build-sitemap.mjs](scripts/build-sitemap.mjs) replaces the PowerShell snippet. Run `npm run build:sitemap`. Cross-platform; reads the catalog from `products.js`, emits 213 URLs (7 static + 17 category + 189 product) with today's `<lastmod>` and per-URL priority. Bundled into `npm run build:all` so a single command rebuilds images + favicons + PDPs + sitemap before deploy.

### G9. URLs
The current `?id=shirts-001` URLs are functional but not pretty for SEO. After pre-rendering, you can serve `/p/sky-blue-cutaway-slim-shirt`. Compounds organic traffic significantly.

---

## H. Accessibility recommendations

### H1. Headings & landmarks
- Each page has an `<h1>` — good. Make sure no page gains a duplicate after pre-render.
- `<main>` is correctly used. Good.
- `<nav aria-label="Main navigation">` good ([site.js:202](assets/js/site.js#L202)) — also add `aria-label="Footer"` on the footer nav and `aria-label="Breadcrumbs"` on PDP breadcrumb.

### H2. Color contrast
- `--muted: #6b7280` on white = 5.7:1 (passes AA for body, fails AAA). Acceptable for body copy.
- `--muted-2: #9ca3af` on white = 3.4:1 — **fails AA for normal text.** Don't use for any copy under 18 px. Either remove or document its single allowed use.
- Bronze `#a67845` on white = 3.8:1 — **fails AA for normal text.** Used for the eyebrow (very small bold uppercase, treated as "large" UI text — passes 3:1). Fine.
- Bronze-dark `#7f5730` on white = 5.4:1 — passes AA. Good.

### H3. Form labels
[contact.html](contact.html) — all three fields have proper `<label for>` pairs. Good.

### H4. Buttons that look like links
[product.html:111](product.html#L111) — `class="size-link"` on an `<a>` with no `href`. Should be `<button type="button">` if it triggers an action; if it's purely decorative, drop the `<a>`.

### H5. Live regions
The toast ([site.js:121-132](assets/js/site.js#L121-L132)) sets `role="status"` once. Good. Make sure it also sets `aria-live="polite"` (`status` implies it but be explicit for some screen readers).

### H6. Mobile drawer keyboard trap
[site.js:340-342](assets/js/site.js#L340-L342) handles Escape, but doesn't implement a focus trap inside the drawer. Tab from inside the drawer escapes to the (visible-but-disabled) page behind. Add a focus-trap (~15-line helper).

### H7. Skip link
✅ **Resolved 2026-05-07** — `injectSkipLink()` in [site.js](assets/js/site.js) inserts the first focusable element on every page (`<a class="skip-link" href="#main">Skip to content</a>`). `ensureMainLandmarkId()` in the same file adds `id="main"` to every page's `<main>` so the link target always resolves. Hidden visually until focused; `:focus` slides it onto the canvas with the standard bronze focus ring.

### H8. Reduced motion
✅ **Resolved 2026-05-07** — `prefers-reduced-motion: reduce` rule added at [styles.css:88-97](assets/css/styles.css#L88-L97) — strips animation/transition durations and scroll-behavior across the whole document for users who request reduced motion at OS level.

### H9. Image alts on decorative images
[about.html:35](about.html#L35) — `<img src="...suits-001.png" alt="">` is correct (decorative). Keep that.

### H10. Focus indicator on cards
~~Product cards are wrapped in `<a class="product-link">` — focus is currently handled, but the wishlist heart inside the card is a `<button>` *inside* the link.~~ ✅ **Resolved 2026-05-07** — `productCardHTML` in [site.js](assets/js/site.js) now emits `.product-actions` as a sibling of `.product-link`, both children of the `.product-card` `<article>`. Wishlist toggle no longer fires the navigate-to-PDP click; valid HTML; keyboard tabbing clean.

---

## I. Priority action plan

### Must fix before launch (≤2 weeks of work)

1. ~~**Run image pipeline + ship `<picture>` markup.**~~ ✅ **Done 2026-05-07** — see F1 for full implementation notes. 310 MB of PNGs collapses to 17.6 MB of WebP variants; helper `SITE.pictureHTML` used everywhere.
2. ~~**Generate proper favicon set.**~~ ✅ **Done 2026-05-07** — see F2.
3. ~~**Replace footer logo with SVG.**~~ ✅ **Done 2026-05-07** — went with a programmatically-generated transparent WebP instead of SVG (see F3); same outcome (12.2 KB vs. 755 KB) and the `mix-blend-mode` hack is gone.
4. ~~**Confirm and fix call number**~~ ✅ **Done 2026-05-07** — `+256 704 667 111` in [products.js:276-277](assets/js/products.js#L276-L277).
5. ~~**Provision real `hello@k-line-men.com` inbox**~~ ✅ **Done 2026-05-08** — `KLINE.EMAIL` set to `klinedesignltd@gmail.com` in [products.js](assets/js/products.js); contact page reads it dynamically.
6. **Commit untracked product images** (caps, sandals, gym, sunglasses, watches-003+, accessories-004+). [E9] — site is currently broken for those categories on a clean clone.
7. ~~**Wire the contact form to real email**~~ ✅ **Done 2026-05-08** — Formspree wired in [contact.html](contact.html) with WhatsApp fallback on any failure; live form ID `xykodlge` in [products.js:289](assets/js/products.js#L289).
8. ~~**Wire the "Need help?" size link**~~ ✅ **Done 2026-05-07** — opens WhatsApp prefilled with product context + sizing prompts; focus ring added.
9. ~~**Add JSON-LD: Organization + LocalBusiness on home/footer; Product + Offer on PDP.**~~ ✅ **Done 2026-05-07** — see C7. Includes Breadcrumb on PDP. Auto-injected via SITE.mount() on every page; pre-rendered PDP files also ship static JSON-LD for crawlers that don't run JS.
10. ~~**Pre-render PDP `<title>` and `<meta description>`**~~ ✅ **Done 2026-05-07** — [scripts/prerender-products.mjs](scripts/prerender-products.mjs) generates 189 product pages. See C7. Note the canonical-URL switch from `/product.html?id=X` to `/product/{id}.html` — old URLs still work but redirect intent is captured via `<link rel="canonical">`. Optional: add a Netlify `_redirects` line `/product.html  /product/:id  301  id=:id` to push old links onto the canonical form.
11. ~~**Add Privacy Policy + Terms pages.**~~ ✅ **Done 2026-05-07** — [privacy.html](privacy.html) + [terms.html](terms.html). See C5. ⚠️ Owner review recommended for legal-entity / registration details.
12. **Replace IG strip fallback** with real screenshots from the existing [Instagram/](Instagram/) folder, or hide the section. [D5]
13. **Real second image + fabric/care content for the top 10 products** (the ones in hero, signature, and bestsellers). [C4] — the rest can roll out post-launch.
14. ~~**Fix nested `<button>` inside `<a>` on product cards.**~~ ✅ **Done 2026-05-07** — `.product-actions` is now a sibling of `.product-link` inside the `.product-card` article.
15. ~~**Update OG image**~~ ✅ **Done 2026-05-07** — `og-card.jpg` at 44.9 KB (target was <300 KB). See C7.
16. ~~**Set proper Cache-Control headers** at the CDN.~~ ✅ **Done 2026-05-07** — Netlify [_headers](_headers) + [_redirects](_redirects) at repo root.

### Should fix soon after launch (weeks 3–6)

17. Move inline page scripts to `assets/js/pages/*.js` and split config from products. [E1, E2]
18. Add `<picture>` everywhere, including for category cards. [F1 extended]
19. Self-host fonts. [F4]
20. Fix sitemap-build script (PowerShell → Node). [E7, G8]
21. Add review/testimonial section + a real Look of the Week styled photo. [D4]
22. Add `BreadcrumbList` JSON-LD on PDP. [G1]
23. Add canonical tags everywhere. [G3]
24. Wire stock per size into products.js so the WhatsApp handoff doesn't expose surprises. [C4]
25. Implement focus-trap in mobile drawer. ~~+ skip link~~ ✅ skip link done 2026-05-07; focus-trap still open. [H6, H7]
26. ~~`prefers-reduced-motion` support.~~ ✅ Done 2026-05-07. [H8]
27. Remove [preview (2).html](preview%20(2).html), [WEBSITE_REVIEW.md](WEBSITE_REVIEW.md), and the [Product images/](Product%20images/) folder. [E8]
28. ~~Cart: "saved on this device" copy.~~ ✅ Done 2026-05-07 — line added beneath the WhatsApp checkout block. Also collapsed the duplicate "Items subtotal" / "Subtotal (excl. delivery)" rows into a single "Total + delivery" line. [C6]
29. Cart: minimum-order or delivery-fee preview. [C6]
30. Header: ~~drop "Real Men Real Style" subtitle on mobile~~ ✅ done 2026-05-07; remove the dead search icon link or wire it to focus the search field — *still open, needs design pick*. [D1]
31. Submit sitemap to Google Search Console + claim Google Business Profile + Bing Places. [G7]

### Nice to have later (months 2–3)

32. Pretty product URLs (`/p/sky-blue-cutaway-slim-shirt`). [G9]
33. Service worker + offline support. [F7]
34. WhatsApp newsletter opt-in. [D6]
35. Per-category JSON files lazy-loaded for shop. [F5]
36. Map embed on contact. [C5]
37. AB-test the announcement bar copy. [D1]
38. Add styled outfit photography ("Look of the week" + "as worn by") to lift premium feel. [D4]
39. Move from localStorage cart to a session-bound cart (with phone number) so customers can switch device. [C6]
40. Add a Web Share button on PDP. [D7]

---

## J. Strategic note — the brand register problem

The biggest decision in front of you isn't on this list. There are two registers fighting: **editorial-magazine site** vs. **daily-imperative IG**. The site does the editorial register beautifully — but if a customer arrives from `@k_linemen` they expect *the same energy*, and the homepage Look-of-the-Week + IG strip are the bridge.

✅ **Bridge built 2026-05-08** — 10 styled flatlays added to `assets/images/looks/`. Look of the Week now leads with a real outfit (white polo + tan chino + tan suede penny + tortoise wayfarer), not a single polo on a white background. IG strip shows 6 different complete outfits with their own captions, so a returning customer doesn't see the same `suits-001` and `polos-001` they already saw earlier on the page. The two lanes finally feel connected.

**Next compounding move** — keep the cadence going. The site is now able to absorb a steady flow of new outfit shots: drop a new `look-NNN.png` into `assets/images/looks/`, run `npm run optimize:images`, and update `LOOK_OF_WEEK_IMAGE` (one line) to rotate. Three new flatlays per month would keep the bridge alive without a content overhaul.

---

*Document maintained at the repo root. Update inline as items are closed; date the sections you change.*
