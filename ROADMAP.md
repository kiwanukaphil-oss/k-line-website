# K-LINE MEN — Site Roadmap

> **Date:** 2026-05-08
> **Companion to:** [LAUNCH_READINESS_REVIEW.md](LAUNCH_READINESS_REVIEW.md) (exhaustive launch audit) and [README.md](README.md) (build commands).
> **Purpose:** A higher-level view of where the site has been, where it is now, and where it's going. The launch review is granular and tied to specific lines; this document is the strategic narrative.

---

## 1. The arc at a glance

| Phase | Label | Status | Rough timing |
|---|---|---|---|
| **0** | Static editorial site (HTML/CSS/JS, WhatsApp checkout) | **Launch-ready — punch-list only** | Now |
| **1** | Headless CMS for staff content management | **Drafted, awaiting install approval** | Next 4 weeks (slips if approval doesn't land in week 1) |
| **2** | CMS-powered editorial features (rotating Looks, scheduled promos, content workflow) | Planned | Months 2–3 |
| **3** | Real online checkout (Snipcart / Shopify decision) | Planned | Months 6–12 |
| **4** | Growth — loyalty, broadcast, content compounding | Planned | Year 2 |

The shape: **build the editorial site → make it editable → make it transactional → make it grow.** Each phase is committed only after the previous one is stable.

---

## 2. Where the site is today (Phase 0 — launch-ready, punch-list only)

### 2.1 Foundation that's shipped

The static site is feature-complete and live. From the launch review:

**Architecture & content**
- Vanilla HTML/CSS/JS, no build framework. [products.js](assets/js/products.js) is the single source of truth for 189 products across 17 categories.
- WhatsApp-as-checkout flow with prefilled order summary and in-app browser fallback ([site.js:136-167](assets/js/site.js#L136-L167)).
- localStorage cart + wishlist, per-device.
- Editorial homepage rhythm: hero → categories → outfit edits → new → bestsellers → Look of the Week → signature → IG strip → trust → story.

**Performance**
- 310 MB of PNG images → 17.6 MB of WebP variants via `npm run optimize:images` (94% reduction). [scripts/optimize-images.mjs](scripts/optimize-images.mjs)
- `<picture>` markup site-wide via `SITE.pictureHTML()` helper.
- Full favicon set (5 sizes + manifest) generated from a single Logo source.
- Self-hosted fonts (Cormorant Garamond + Manrope), latin subset only, 268 KB total. Two DNS lookups eliminated.
- Cache-Control + security headers via [_headers](_headers).

**SEO**
- Pre-rendered PDPs at `/product/{id}.html` with baked `<title>`, meta description, canonical, OG, Twitter card, and Product/Breadcrumb JSON-LD. [scripts/prerender-products.mjs](scripts/prerender-products.mjs)
- Organization/ClothingStore JSON-LD auto-injected on every page.
- Sitemap generation: 213 URLs, today's `<lastmod>` per URL, cross-platform Node script. [scripts/build-sitemap.mjs](scripts/build-sitemap.mjs)
- 1200×630 OG card composited from the navy-suit hero. [scripts/generate-og-card.mjs](scripts/generate-og-card.mjs)

**Trust & legal**
- Privacy + Terms pages drafted to UDPPA 2019. [privacy.html](privacy.html), [terms.html](terms.html)
- Real contact form via Formspree with WhatsApp fallback on any failure. [contact.html](contact.html)
- Verified contact details: WhatsApp `+256 777 466 979`, call `+256 704 667 111`, email `klinedesignltd@gmail.com`, storefront at Fraine Building, Ntinda, Kampala.

**Accessibility**
- `:focus-visible` rings, skip link, mobile drawer focus trap with Escape-to-close, `prefers-reduced-motion` honoured, AA contrast for body copy.
- Wishlist toggle as a sibling of `.product-link` so the nested-`<button>`-in-`<a>` issue is gone.

**Editorial bridge between site and IG**
- 10 styled flatlays in `assets/images/looks/`. Look of the Week leads with a complete outfit, not a catalog repeat. IG strip shows 6 different outfits with bespoke captions.

### 2.2 Still open before public launch

These are the only items blocking a clean public launch (from [LAUNCH_READINESS_REVIEW.md §I](LAUNCH_READINESS_REVIEW.md#i-priority-action-plan)):

| # | Item | Why it matters | Effort |
|---|---|---|---|
| 1 | ~~Commit the untracked product images~~ ✅ **Done** — landed in commit `bee74fc`; 189 PNGs + 567 WebPs are in HEAD | — | — |
| 2 | Replace IG strip fallback with real `@k_linemen` screenshots, or hide the section | All seven `look-*` shots share the same studio/lighting/style — to a careful customer they read as catalog rather than as "real Instagram" | 1 hr |
| 3 | Add a real second image + fabric/care content for the top 10 products | UGX 750 k tuxedo with one photo and one paragraph won't convert | 2–3 days (allow more if photography needs to be commissioned) |
| 4 | Owner-review of [privacy.html](privacy.html) + [terms.html](terms.html) for legal-entity registration details | Trading-name field intentionally left for owner | 30 min |
| 5 | ~~Decide on "search icon → focus search field" vs "remove search icon" in header~~ ✅ **Done 2026-05-08** — removed (header was sending three disagreeing signals; shop page still has the real search input one click away) | — | — |

**Once those are closed, Phase 0 is done and the site is launch-ready as a Kampala soft-launch.** Everything else moves into the post-launch backlog tracked in the launch review.

### 2.3 What Phase 0 deliberately defers

Phase 0 is a *credible Kampala soft-launch*, not full e-commerce. A new contributor or a non-technical owner reading this should not assume the site is feature-complete in the way Shopify or Net-a-Porter are. The following are **intentionally not built yet** — they're either Phase 1+ deliverables or backlog:

- **Cart and wishlist are per-device.** Stored in `localStorage`. Customers who want a bag that follows them across devices need to message it through to WhatsApp.
- **No live stock visibility.** A product never shows "out of stock" on the rail — availability is confirmed in the WhatsApp reply. *(Phase 2 closes this with size-level stock counts.)*
- **No card / Mobile Money payment online.** Payment is settled on WhatsApp via MTN/Airtel Mobile Money, bank transfer, card via local partner, or cash on delivery. *(Phase 3 closes this if order volume justifies the integration cost.)*
- **No customer accounts or order history.** Customers don't sign up; the WhatsApp thread is the order history.
- **No automated tax or shipping calculation.** UGX prices are tax-inclusive; delivery is quoted per location on WhatsApp.
- **No reviews or testimonials surface.** *(Phase 2 adds an owner-curated `testimonial` schema.)*
- **No abandoned-cart recovery, no email capture, no remarketing pixels.** *(Phase 4 considers these.)*

These deferrals are deliberate: they keep Phase 0 shippable in days, not months, and they keep the operational model a single WhatsApp thread per customer — which is actually what Kampala buyers prefer at this price point. **Don't accidentally close them earlier than the data warrants.**

---

## 3. Phase 1 — Headless CMS (drafted, awaiting approval)

### 3.1 Why this is the next phase

The site is editorially strong but every content change today requires a developer. A Look of the Week swap is a one-line edit to `LOOK_OF_WEEK_IMAGE` in code; a price update requires editing [products.js](assets/js/products.js). That doesn't scale to a shop with non-technical staff. Phase 1 introduces a CMS layer so staff can edit content without touching code, while keeping the design tokens, layout, and templates developer-controlled.

### 3.2 What's been drafted (this session, untracked)

Sitting in [sanity/](sanity/) for review — **nothing is installed or wired to the live site**:

| File | Purpose |
|---|---|
| [sanity/README.md](sanity/README.md) | Phase 1 install steps when approved |
| [sanity/sanity.config.js](sanity/sanity.config.js) | Studio config + custom sidebar layout |
| [sanity/schemas/product.js](sanity/schemas/product.js) | Product schema with full validation |
| [sanity/schemas/category.js](sanity/schemas/category.js) | Categories with intro copy + hero image |
| [sanity/schemas/look.js](sanity/schemas/look.js) | Look of the Week + Shop the Look (one type, two roles) |
| [sanity/schemas/promotion.js](sanity/schemas/promotion.js) | Banner with auto-expiring start/end dates |
| [sanity/schemas/faq.js](sanity/schemas/faq.js) | Repeating Q+A items |
| [sanity/schemas/homepage.js](sanity/schemas/homepage.js) | Singleton: hero, best sellers, featured collection |
| [sanity/schemas/settings.js](sanity/schemas/settings.js) | Singleton: contact, social, WhatsApp message template |
| [sanity/schemas/deliveryReturns.js](sanity/schemas/deliveryReturns.js) | Singleton: short policy text |
| [sanity/scripts/migrate-products.mjs](sanity/scripts/migrate-products.mjs) | One-time migration: products.js → Sanity NDJSON |

**Verified:** the migration script produces 17 categories + 189 products = 206 NDJSON lines from the live [products.js](assets/js/products.js) without modifying it.

### 3.3 Phase 1 plan (when approved)

| Step | Action | Effort | Risk |
|---|---|---|---|
| 1.1 | `cd sanity && npm install` | 10 min | None — isolated folder |
| 1.2 | `npx sanity init` to create the project on sanity.io free tier | 15 min | None |
| 1.3 | Run `migrate-products.mjs` and import the NDJSON into the dataset | 15 min | Low — re-runnable |
| 1.4 | Asset-upload script: push the 189 product images into Sanity's CDN, link them to product documents | 1–2 hr | Low — separate script, re-runnable |
| 1.5 | Manually populate Homepage, Settings, Delivery & Returns singletons in Studio | 30 min | None |
| 1.6 | Replace `assets/js/products.js` with a build-time fetch from Sanity that emits the same `window.KLINE_PRODUCTS` global | 2–3 hr | **Medium — verify all pages still render before deploying.** Keep `products.js` checked in as a frozen snapshot for 2 weeks after Sanity goes live; if the build-time fetch breaks, swap one `<script>` tag back to the snapshot and the site renders identically. Delete the snapshot once 2 weeks of clean publishes pass. |
| 1.7 | Wire publish webhook → Cloudflare Pages / Netlify rebuild | 30 min | Low |
| 1.8 | Train one staff member as Manager (publish rights), one as Editor (draft-only) | 1 hr | None |

**Total focused effort: roughly one day.**

### 3.4 What stays the same after Phase 1

- The live storefront is still static HTML/CSS/JS. No SSR, no React, no framework.
- Build commands (`npm run build:all`) keep working — they just pull data from Sanity instead of reading the local JS file.
- WhatsApp checkout is unchanged.
- All the SEO, performance, and accessibility work from Phase 0 is preserved.

### 3.5 Decisions to confirm before Phase 1 starts

1. **Sanity vs Decap CMS.** Drafted Sanity. Decap is the free Git-based alternative. See [sanity/README.md](sanity/README.md) for the comparison.
2. **Best sellers: manual curation vs auto-from-badge.** Drafted manual. Easy to flip.
3. **Hosting: Cloudflare Pages vs Netlify.** Both free at this scale. Cloudflare is faster in East Africa; Netlify has the simplest webhook story.

### 3.6 Phase 1 done when

- One non-developer staff member has published a Look of the Week swap and a price update without developer involvement.
- 2 consecutive weeks of clean Sanity publishes with no manual fallback to the `products.js` snapshot.
- Webhook → CDN rebuild completes in under 90 seconds (target — current static build is sub-15s, so margin is comfortable).
- The frozen `products.js` snapshot has been deleted from the repo.

---

## 4. Phase 2 — CMS-powered editorial features (months 2–3)

Once staff are comfortable with the CMS, the site can absorb richer editorial workflows that aren't worth building until the CMS is live.

### 4.1 Planned

| Feature | What changes |
|---|---|
| **Weekly Look rotation** | Look of the Week becomes a scheduled document. Staff stage next week's look in advance; it goes live automatically Monday morning. |
| **Scheduled promotions** | Black Friday, Eid, year-end sales banner — stage it weeks in advance with start/end dates. Auto-shows, auto-hides. |
| **Stock per size** | Every product variant carries its own stock count. WhatsApp message template includes only in-stock sizes. Closes the trust gap from §C4 of the launch review. |
| **Real Instagram embed** | Replace the IG strip's fallback flatlays with a real `@k_linemen` feed via a server-side proxy (Cloudflare Worker, Netlify Function, or equivalent) using whatever IG-feed mechanism is current at the time. ⚠️ Meta has been actively reducing third-party access to Instagram APIs — Basic Display was deprecated for new apps in late 2024. If no live API is workable when Phase 2 lands, fall back to a Sanity-managed manual `igPost` array updated weekly by staff. Less automatic, still on-brand. |
| **Reviews / testimonials** | New `testimonial` schema. Curated, owner-approved. Surfaces on PDPs and the homepage trust strip. |
| **WhatsApp inquiry log** | Cloudflare Worker captures every "Order on WhatsApp" click, writes to a Sanity `inquiry` document. Admin dashboard "Reports" tab surfaces volume + which products convert. |

### 4.2 What this gives the business

A non-technical staff member can run the editorial calendar — weekly looks, monthly promotions, seasonal collections — without ever touching code or asking the developer. The site stops being a developer dependency.

### 4.3 Phase 2 done when

- Stock counts have prevented at least one *"we don't actually have that"* exchange on WhatsApp.
- The Look of the Week has been **scheduled** (not manually published) for 4 consecutive weeks.
- The WhatsApp inquiry log is producing monthly inquiry-volume numbers — these become the input to §5.2 to decide which Phase 3 path applies.
- A scheduled promotion has run end-to-end (auto-show on start date, auto-hide on end date) without staff intervention.

---

## 5. Phase 3 — Real online checkout (months 6–12)

When monthly WhatsApp order volume justifies it, real card / Mobile Money checkout becomes worth the integration cost.

### 5.1 Two paths, decision deferred

**Path A — Stay on the current architecture, add Snipcart or Stripe Checkout.**
- Pros: No migration. Site stays static. CMS unchanged. Lowest-risk path.
- Cons: Snipcart is ~2% per transaction. Mobile Money support requires integrating Flutterwave or DPO Pay alongside.
- Estimated effort: 1–2 weeks.

**Path B — Migrate the storefront to Shopify, keep Sanity as the editorial CMS via Shopify's Storefront API.**
- Pros: Best-in-class checkout. Mobile Money via Flutterwave plugin is mature. Order management, customer accounts, abandoned cart, gift cards — all included.
- Cons: ~$30/mo + theme development. The custom editorial design needs a faithful Shopify theme rebuild (~2 weeks). Lock-in to Shopify's templating.
- Estimated effort: 4–6 weeks.

### 5.2 Trigger for the decision

Track these in Phase 2's WhatsApp inquiry log:
- **>50 orders/month** → Path A is enough. Snipcart pays for itself.
- **>200 orders/month or staff overwhelmed by manual order entry** → Path B is worth the migration.

Don't pick the path now. The data from Phase 2 makes the call obvious.

### 5.3 Phase 3 done when

- The first **30 orders** have gone through online checkout without WhatsApp-level intervention from staff.
- Mobile Money is functional in production (Flutterwave or DPO Pay confirmed live with successful test transactions).
- Order management — refunds, exchanges, fulfilment — is something staff run without developer help.
- WhatsApp remains available as a parallel channel (premium menswear in Kampala still benefits from a human conversation pre-purchase). Phase 3 *adds* checkout; it doesn't *replace* WhatsApp.

---

## 6. Phase 4 — Growth (year 2+)

These are bets, not commitments. Listed so a future you knows what was considered.

| Bet | Hypothesis |
|---|---|
| **WhatsApp newsletter / broadcast** | "Get the weekly outfit drop" opt-in via Mailchimp / Brevo + WhatsApp Business broadcast. Compounds returning visits. |
| **Loyalty / referrals** | "Bring a friend, get UGX 50,000 off" — works exceptionally well in Kampala social shopping. |
| **Pretty product URLs** | `/p/sky-blue-cutaway-slim-shirt`. Compounds organic SEO. |
| **Service worker + offline** | Returning Kampala-mobile customers see instant repeat loads even on patchy data. |
| **Pop-up at Fraine Building scheduled drops** | "This Saturday only — tailoring consultations + 10% off suits." Site as the funnel, store as the close. |
| **Wholesale / corporate uniforms** | Side revenue line. Different funnel, possibly a separate microsite. |

---

## 7. Ongoing operational rhythm

Three behaviours have to keep happening regardless of which phase the project is in. They're not phase deliverables — they're cadences. The single biggest compounding move post-launch is the first one.

| Rhythm | Cadence | Why it matters |
|---|---|---|
| **Three new outfit flatlays per month** | Monthly | Powers Look of the Week + IG strip + OG card rotation. The site stops feeling editorial the moment new outfits stop arriving. Without this, six months in the Look of the Week is still `look-002` from launch and the IG strip is the same six tiles. This is the single biggest brand-equity compounder, identified in the launch review's Section J. |
| **Audit the catalog quarterly** | Quarterly | Discontinued lines, price drift, sold-out variants, new arrivals. Every product on the rail should be sellable in the showroom; every product in the showroom worth keeping should be on the rail. |
| **Re-skim WhatsApp inquiries for tagging gaps** | Quarterly | If customers ask *"do you have this in cream?"* three times in a quarter and we don't have it tagged, the catalog needs that variant added or excluded. The inbox is free user research. Phase 2's WhatsApp inquiry log makes this a 30-minute task instead of a half-day. |

These don't appear in the phase plan but they show up here so a future you who's been heads-down on Phase 2 doesn't forget that the site needs feeding. **A phase finishes; a rhythm doesn't.**

---

## 8. Decisions still open

A consolidated list of everything that's waiting on an explicit call. None of these block any current phase from starting; they shape the next one.

| # | Decision | Where it surfaces | Drafted default | By when |
|---|---|---|---|---|
| 1 | Sanity vs Decap CMS | Phase 1 | Sanity | Before Phase 1 step 1.1 |
| 2 | Best sellers: manual list vs auto from `bestseller` badge | Phase 1 | Manual | Phase 1 step 1.5 |
| 3 | Hosting: Cloudflare Pages vs Netlify | Phase 1 | Cloudflare (East Africa latency) | Before first deploy |
| 4 | Replace IG strip fallback with real screenshots, or hide the section | Phase 0 close-out | Awaiting screenshots | Before public launch |
| 5 | Header search icon: wire to focus search, or remove | Phase 0 close-out | Awaiting design pick | Before public launch |
| 6 | Snipcart vs Shopify migration for real checkout | Phase 3 | Defer until Phase 2 data is in | Trigger fires per §5.2 |

---

## 9. Cost & risk rollup

### 9.1 Costs

Steady-state monthly run-rate per phase. Numbers are current at time of writing — vendor pricing drifts; verify before committing.

| Phase | Hosting | CMS | Form / payments | Other | Monthly total |
|---|---|---|---|---|---|
| **Phase 0** | Free (Netlify or Cloudflare Pages) | — | Free (Formspree, 50 submissions/mo) | Domain ~$1/mo | **~$1/mo** |
| **Phase 1** | Free | Free (Sanity free tier) | — | — | **~$1/mo** |
| **Phase 2** | Free | Free | — | Cloudflare Workers ~$5/mo for IG proxy + inquiry log; Sanity free tier still adequate | **~$6/mo** |
| **Phase 3 — Path A** | Free | Free | Snipcart ~$10/mo + ~2% per transaction; Flutterwave/DPO Pay fees on Mobile Money | — | **~$10/mo + transaction %** |
| **Phase 3 — Path B** | Shopify Basic ~$30/mo | Sanity stays for editorial | Shopify Payments + Flutterwave plugin | One-off Shopify theme rebuild ~$1,500 | **~$30/mo + theme one-off** |

Phase 0 is essentially free. Phase 1 doesn't change the run rate. Phase 2 introduces the first material monthly cost ($5–10). Phase 3 is where the meter starts.

### 9.2 Risks per phase

Top risks and mitigations. Not exhaustive — these are the ones I'd actively monitor.

| Phase | Top risk | Mitigation |
|---|---|---|
| **Phase 0** | Browser caches stale HTML during deploys; users see old shop layout | Already mitigated — `_headers` sets HTML pages to `no-cache, must-revalidate`. Verified working. |
| **Phase 1** | Sanity changes free-tier limits or pricing | Decap CMS is the back-up — Git-based, no vendor lock-in. Migration would take 1–2 weeks; staff retraining minimal. |
| **Phase 1** | Build-time fetch from Sanity breaks; site goes down at the worst moment | The `products.js` snapshot rollback (§3.3 step 1.6) means recovery is one-line revert. |
| **Phase 2** | Meta deprecates Instagram Basic Display API (or whatever its successor is); the IG strip stops updating | Manual `igPost` fallback (§4.1) — staff drops in 6 screenshots weekly. Less automatic, still on-brand. |
| **Phase 2** | Sanity inquiry-log volume exceeds free tier (10k docs / 500k API requests) | Not realistic for an inquiry log at K-LINE MEN's expected volume; if it ever happens, archive monthly to a smaller summary doc. |
| **Phase 3** | Mobile Money provider approval times in Uganda are slow (Flutterwave/DPO Pay take 4–12 weeks) | Apply 8–12 weeks before the Phase 3 trigger fires per §5.2. Don't block on the application — finish front-end integration in parallel. |
| **Phase 3** | Path B (Shopify) theme migration drifts from the existing custom design | Lock down the theme to mirror the current homepage rhythm before migrating. Treat it as a Shopify theme port, not a redesign. |
| **Phase 4** | WhatsApp Business broadcast policy tightens (Meta has changed broadcast rules ~yearly) | Build email opt-in alongside as a redundant channel. WhatsApp is the primary; email is the safety net. |

---

## 10. File map for new contributors

For someone joining the project a year from now and trying to understand what's where:

```
KLINE website/
├── README.md                       — build commands + architecture overview
├── ROADMAP.md                      — this document
├── LAUNCH_READINESS_REVIEW.md      — exhaustive launch audit, line-level detail
│
├── *.html                          — page templates (index, shop, product, cart, ...)
├── assets/
│   ├── css/styles.css              — all styles, design tokens at top
│   ├── js/products.js              — single source of truth for catalog (Phase 0)
│   ├── js/site.js                  — shared header/footer/cart/wishlist, JSON-LD injection
│   ├── images/                     — WebP-optimised product photos
│   └── fonts/                      — self-hosted Cormorant + Manrope
├── product/                        — pre-rendered PDPs (one HTML file per product)
├── scripts/
│   ├── optimize-images.mjs         — PNG → WebP pipeline
│   ├── generate-favicons.mjs       — favicon set + footer logo
│   ├── generate-og-card.mjs        — 1200×630 social card
│   ├── prerender-products.mjs      — emits /product/{id}.html
│   ├── build-sitemap.mjs           — sitemap.xml regenerator
│   └── fetch-fonts.mjs             — self-hosted font sync
├── sanity/                         — CMS draft, NOT installed (Phase 1)
│   ├── README.md
│   ├── sanity.config.js
│   ├── schemas/
│   └── scripts/migrate-products.mjs
├── _headers                        — Cache-Control + security headers
├── _redirects                      — old PDP URL → clean URL 301
├── sitemap.xml                     — generated, 213 URLs
└── og-card.jpg                     — generated 1200×630 social card
```

---

## 11. How this document evolves

- Date sections as you change them.
- When a phase completes, **strike through** the planned items and link to the commit / PR that delivered them.
- Don't delete completed phases — the history is useful for new contributors.
- Companion to [LAUNCH_READINESS_REVIEW.md](LAUNCH_READINESS_REVIEW.md), not a replacement. This file stays high-level; line-level detail goes in the launch review.

*Maintained at the repo root. Last updated 2026-05-08.*
