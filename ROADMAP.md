# K-LINE MEN — Site Roadmap

> **Date:** 2026-05-09
> **Companion to:** [LAUNCH_READINESS_REVIEW.md](LAUNCH_READINESS_REVIEW.md) (exhaustive launch audit) and [README.md](README.md) (build commands).
> **Purpose:** A higher-level view of where the site has been, where it is now, and where it's going. The launch review is granular and tied to specific lines; this document is the strategic narrative.

---

## 1. The arc at a glance

| Phase | Label | Status | Rough timing |
|---|---|---|---|
| **0** | Static editorial site (HTML/CSS/JS, WhatsApp checkout) | **Launch-ready — punch-list only** | Now |
| **1** | Custom admin dashboard (Cloudflare-native, role-based) | **Approved 2026-05-09 — building** | ~6 weeks of focused build |
| **2** | Auto-rotation, real Instagram feed, testimonials | Planned | Months 2–3 |
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
| 4 | ~~Owner-review of [privacy.html](privacy.html) + [terms.html](terms.html) for legal-entity registration details~~ ✅ **Done 2026-05-08** — both pages identify the operating entity as "K-LINE Design Ltd, trading as K-LINE MEN" in their "Who we are" sections | — | — |
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

## 3. Phase 1 — Custom admin dashboard (approved 2026-05-09)

### 3.1 Why this is the next phase

The site is editorially strong but every content change today requires a developer. A Look of the Week swap is a one-line edit to `LOOK_OF_WEEK_IMAGE` in code; a price update requires editing [products.js](assets/js/products.js); a contact-detail change is a hunt across HTML files. That doesn't scale to a shop with non-technical staff. Phase 1 introduces a **custom admin dashboard** so staff can edit content without touching code, while the design tokens, layout, templates, and build pipeline stay developer-controlled.

A previous draft of this phase used Sanity (a hosted headless CMS). After review, we're building our own — same data shape, same publishing flow, but on infrastructure we own end-to-end. Trade-offs: more upfront build effort (~6 weeks vs. ~1 day to wire up Sanity), but no third-party lock-in, no per-user cost ceiling, and a UX we can tune to the K-LINE MEN brand instead of inheriting Sanity Studio's chrome.

### 3.2 Approach

**Cloudflare-native, single-vendor stack:**

| Layer | Choice | Why |
|---|---|---|
| Public site | Cloudflare Pages, static HTML/CSS/JS (unchanged) | Phase 0 work preserved |
| Admin app | Preact SPA at `admin.klinemen.ug`, Cloudflare Pages | Reactive UI for forms-heavy workflows; ~3 KB runtime |
| API | Cloudflare Worker (`klinemen-api`) | Single Worker handles all `/api/*` routes |
| Database | Cloudflare D1 (SQLite) | 5 GB free, far in excess of 189 products + revisions |
| Image storage | Cloudflare R2 + Cloudflare Images | Edge-cached WebP variants for premium UX feel |
| Auth | Cloudflare Access (Google login, allow-list) | No password store to secure; free up to 50 users |
| Roles | Manager (publish + approve) and Editor (drafts only) | Cloudflare Access groups carry the role; Worker enforces on every write |

**Data flow:**

```
Editor edits in admin → Worker writes a draft to D1
   → entity status = 'pending_review' → Manager queue
Manager approves → Worker promotes draft to 'published'
   → triggers Cloudflare Pages deploy hook
   → scripts/build-from-d1.mjs regenerates assets/js/products.js,
     /product/*.html, sitemap.xml from D1
   → Pages deploys → live in <90s
```

`assets/js/products.js` keeps existing in the repo as a **generated artefact** — schema unchanged, anything that imports `window.KLINE_PRODUCTS` keeps working. The fallback story: if the build pipeline ever breaks, the last-good `products.js` is one revert away and the site renders identically.

### 3.3 Scope at v1

**In:** Products + categories · Homepage + Looks + Promotions · Site copy (FAQs, settings, delivery & returns) · Image upload pipeline (drag-drop, auto WebP via Cloudflare Images) · Stock-per-size with WhatsApp template integration · WhatsApp inquiry log + Reports tab · Approval workflow + 30-day revision history with one-click undo.

**Out (deferred to Phase 2 or later):** Real Instagram embed · Reviews / testimonials · Auto-scheduled weekly Look rotation (manual scheduling is in v1; the cron that auto-promotes the next look without staff intervention is Phase 2).

**Premium UX commitments** — these aren't free, they account for ~1 week of the timeline:

- Live preview pane next to every editor — see the product card / homepage hero render in real time as you type.
- Autosave with status indicator (`Saved · 2s ago`).
- 30-day revision history + one-click undo on every entity.
- Drag-drop image upload with instant thumbnail, drag-to-reorder, click-to-crop.
- Mobile-responsive admin — Look of the Week update from the showroom floor.
- Plain-language labels everywhere ("Show on homepage", not `featured: true`).
- Brand-matched chrome (Cormorant + Manrope + K-LINE palette).
- Inline help on every field; "Preview as live site" staging URL before publish.
- Thoughtful empty states.

### 3.4 Build phases

Each phase ends with a demo for owner sign-off before the next starts.

| # | Phase | Effort | Demo at the end |
|---|---|---|---|
| 1a | Cloudflare bootstrap (Pages, Worker, D1, R2, Access with 2 user groups) | ½ day | `admin.klinemen.ug/healthz` returns 200, only for allow-listed Google logins |
| 1b | D1 schema + seed migration (port 17 cats + 189 products from `products.js`) + revisions + audit log tables | 1 day | `SELECT count(*) FROM products` returns 189 |
| 1c | Image pipeline (Cloudflare Images, signed-URL upload, drag-drop component) | 1 day | Upload a PNG, get back 4 WebP variants instantly |
| 1d | Catalog admin UI (products + categories CRUD, live preview, autosave, undo) | 5 days | Owner edits a real product end-to-end with full UX polish |
| 1e | Build pipeline (`scripts/build-from-d1.mjs`, deploy hook on publish only) | 2 days | Save in admin → live site updated in <90s |
| 1f | Homepage + Looks + Promotions admin UI | 3 days | Look of the Week swap published without touching code |
| 1g | Site copy admin UI (FAQs, settings, delivery & returns) | 1 day | Contact details / WhatsApp template / FAQ editable |
| 1h | Stock-per-size + WhatsApp template surfaces in-stock sizes only | 1 day | Out-of-stock sizes drop from the WhatsApp message |
| 1i | Inquiry log + Reports tab | 1 day | First inquiry shows up in the dashboard within a minute |
| 1j | Approval workflow (pending queue, diff view, comments, role enforcement) | 2 days | Editor drafts → Manager approves → Editor sees the result |
| 1k | Brand-matched chrome + inline help + empty states + mobile pass | 2 days | Admin feels like K-LINE MEN's own software, not generic admin |
| 1l | Cutover (freeze `products.js` snapshot, switch live build to D1 source, observe 2 weeks) | 2 days + 2-week observation | Snapshot rollback never used → snapshot deleted |

**Total focused effort: ~6 weeks.**

### 3.5 What stays the same after Phase 1

- The live storefront is still static HTML/CSS/JS. No SSR, no React, no framework.
- Build commands (`npm run build:all`) keep working — they gain one step (`build-from-d1`) that runs before existing scripts.
- WhatsApp checkout is unchanged.
- All the SEO, performance, and accessibility work from Phase 0 is preserved.
- `assets/js/products.js` is now a generated artefact, not authored. Anything that reads `window.KLINE_PRODUCTS` keeps working unchanged.

### 3.6 Decisions made (2026-05-09)

| Decision | Outcome | Reasoning |
|---|---|---|
| CMS approach | Custom dashboard, not Sanity / not Decap | Premium UX bar + non-technical staff target audience required tunable chrome and brand-matched experience that off-the-shelf Studios don't deliver |
| Hosting | Cloudflare (Pages + Worker + D1 + R2 + Access + Images) | Single vendor, fastest in East Africa, free tier covers ≥12 months |
| Auth model | Cloudflare Access, Manager + Editor roles | No password store; Google login; Access groups → JWT claims → Worker enforces |
| Admin UI framework | Preact + Vite | Forms-heavy + live preview + autosave demands reactivity; ~3 KB runtime |
| Image pipeline | Cloudflare Images ($5/mo) | Edge-cached variants on first fetch; thumbnails appear instantly for premium feel |
| Subdomain | `admin.klinemen.ug` (separate from public) | Clean separation: "the shop" vs "the office" |
| Site copy in v1 | Included (FAQs, settings, delivery & returns) | Removing every developer dependency for non-technical staff was the brief |
| Best sellers | Manual list (deferred from old plan, still right) | Owner-curated; auto-from-badge can land later if needed |

### 3.7 Phase 1 done when

- 189 products and 17 categories live in D1; `assets/js/products.js` regenerates from D1 cleanly on every push.
- Both Manager and at least one Editor have published a real change end-to-end (Editor drafts → Manager approves → live in <90s) without developer involvement.
- Two consecutive weeks of clean publishes with no manual fallback to the `products.js` snapshot.
- WhatsApp inquiry log is producing weekly inquiry-volume numbers — these become the input to §5.2 to decide which Phase 3 path applies.
- The frozen `products.js` snapshot has been deleted from the repo.

---

## 4. Phase 2 — Auto-rotation, real Instagram, testimonials (months 2–3)

Phase 1 already covers stock-per-size, manual scheduling for Looks and Promotions, the WhatsApp inquiry log, and the approval workflow. Phase 2 adds the cron automation, the live Instagram feed, and customer-facing social proof.

### 4.1 Planned

| Feature | What changes |
|---|---|
| **Weekly Look auto-rotation** | Look of the Week scheduling already exists in Phase 1; Phase 2 adds a Cron Trigger Worker that auto-promotes the next scheduled look on its `active_from` date without staff intervention. |
| **Scheduled promotion auto-trigger** | Promotions already carry start/end dates from Phase 1; Phase 2 adds the cron that fires a rebuild on each transition so banners auto-show and auto-hide on schedule. |
| **Real Instagram embed** | Replace the IG strip's fallback flatlays with a real `@k_linemen` feed via a server-side proxy (Cloudflare Worker) using whatever IG-feed mechanism is current at the time. ⚠️ Meta has been actively reducing third-party access to Instagram APIs — Basic Display was deprecated for new apps in late 2024. If no live API is workable when Phase 2 lands, fall back to a dashboard-managed manual `igPost` array updated weekly by staff. Less automatic, still on-brand. |
| **Reviews / testimonials** | New `testimonial` entity in the dashboard. Curated, owner-approved. Surfaces on PDPs and the homepage trust strip. |

### 4.2 What this gives the business

A non-technical staff member can run the editorial calendar — weekly looks, monthly promotions, seasonal collections — without ever touching code or asking the developer. The site stops being a developer dependency.

### 4.3 Phase 2 done when

- The Look of the Week has been **auto-rotated** (scheduled in advance, no Monday-morning intervention) for 4 consecutive weeks.
- A scheduled promotion has run end-to-end (auto-show on start date, auto-hide on end date) without staff intervention.
- At least one customer testimonial is live on a PDP and the homepage trust strip.
- The IG strip is showing real `@k_linemen` content (live API or manual fallback — whichever is workable) instead of the launch-time flatlays.

---

## 5. Phase 3 — Real online checkout (months 6–12)

When monthly WhatsApp order volume justifies it, real card / Mobile Money checkout becomes worth the integration cost.

### 5.1 Two paths, decision deferred

**Path A — Stay on the current architecture, add Snipcart or Stripe Checkout.**
- Pros: No migration. Site stays static. CMS unchanged. Lowest-risk path.
- Cons: Snipcart is ~2% per transaction. Mobile Money support requires integrating Flutterwave or DPO Pay alongside.
- Estimated effort: 1–2 weeks.

**Path B — Migrate the storefront to Shopify, keep the K-LINE admin dashboard as the editorial CMS via Shopify's Storefront API.**
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
| 1 | Replace IG strip fallback with real screenshots, or hide the section | Phase 0 close-out | Awaiting screenshots | Before public launch |
| 2 | Snipcart vs Shopify migration for real checkout | Phase 3 | Defer until Phase 2 data is in | Trigger fires per §5.2 |

---

## 9. Cost & risk rollup

### 9.1 Costs

Steady-state monthly run-rate per phase. Numbers are current at time of writing — vendor pricing drifts; verify before committing.

| Phase | Hosting | CMS | Form / payments | Other | Monthly total |
|---|---|---|---|---|---|
| **Phase 0** | Free (Cloudflare Pages) | — | Free (Formspree, 50 submissions/mo) | Domain ~$1/mo | **~$1/mo** |
| **Phase 1** | Free (Cloudflare Pages + Worker + D1 + R2 + Access free tiers) | — | — | Cloudflare Images ~$5/mo + domain ~$1/mo | **~$6/mo** |
| **Phase 2** | Free | — | — | Cloudflare Cron Triggers free; Phase 1 stack continues | **~$6/mo** |
| **Phase 3 — Path A** | Free | — | Snipcart ~$10/mo + ~2% per transaction; Flutterwave/DPO Pay fees on Mobile Money | Phase 1 stack continues | **~$16/mo + transaction %** |
| **Phase 3 — Path B** | Shopify Basic ~$30/mo | K-LINE admin stays for editorial | Shopify Payments + Flutterwave plugin | One-off Shopify theme rebuild ~$1,500; Phase 1 stack continues | **~$36/mo + theme one-off** |

Phase 0 is essentially free. Phase 1 introduces the first material monthly cost (~$5 for Cloudflare Images). Phase 2 doesn't change the run rate. Phase 3 is where the per-transaction meter starts.

### 9.2 Risks per phase

Top risks and mitigations. Not exhaustive — these are the ones I'd actively monitor.

| Phase | Top risk | Mitigation |
|---|---|---|
| **Phase 0** | Browser caches stale HTML during deploys; users see old shop layout | Already mitigated — `_headers` sets HTML pages to `no-cache, must-revalidate`. Verified working. |
| **Phase 1** | Build pipeline (`build-from-d1`) fails on a publish; site goes stale or breaks | Frozen `products.js` snapshot kept for 4 weeks post-cutover (Phase 1l); rollback is a one-line revert. |
| **Phase 1** | Cloudflare Access lockout (Google account access lost) | Configure email OTP as a backup method at setup. Owner also keeps a recovery code stored offline. |
| **Phase 1** | D1 free-tier read budget bursts during a marketing push | Build script caches D1 reads to a local JSON during the build; production traffic hits the static site, not D1. Only the build step ever reads D1. |
| **Phase 1** | Cloudflare changes free-tier terms or pricing | D1 + R2 + Pages are export-portable: SQLite file + S3-compatible objects + static files. 1–2 day migration to any other host (Fly.io, Hetzner, Supabase). No proprietary schema. |
| **Phase 2** | Meta deprecates Instagram Basic Display API (or whatever its successor is); the IG strip stops updating | Manual `igPost` fallback (§4.1) — staff drops in 6 screenshots weekly via the admin. Less automatic, still on-brand. |
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
│   ├── js/products.js              — Phase 0: single source of truth; Phase 1: generated artefact from D1
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
│   ├── build-from-d1.mjs           — Phase 1: regenerates products.js from D1 before other build steps
│   └── fetch-fonts.mjs             — self-hosted font sync
├── admin-app/                      — Phase 1: Preact admin SPA + Pages Functions (admin.klinemen.ug)
│   ├── src/                        — Preact app
│   ├── functions/                  — Pages Functions (the API, same-origin with the SPA)
│   ├── migrations/                 — D1 SQL migrations (Phase 1b+)
│   ├── wrangler.toml               — Cloudflare bindings (D1, R2)
│   └── vite.config.ts
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

*Maintained at the repo root. Last updated 2026-05-09.*
