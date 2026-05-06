# K-LINE MEN

A deployment-ready static menswear storefront for **K-LINE MEN**, Kampala. 111 products, full shop / product / cart flows, WhatsApp checkout — no backend required.

## What's here

```
KLINE website/
├── index.html          # Homepage
├── shop.html           # Catalog with filters, search, sort, URL-driven state
├── product.html        # Product detail (?id=shirts-001)
├── cart.html           # Bag — localStorage-persisted, WhatsApp checkout
├── wishlist.html       # Saved items
├── about.html
├── contact.html        # Form that opens WhatsApp prefilled
├── faq.html
├── robots.txt
├── sitemap.xml         # 131 URLs (re-generate after adding products — see below)
├── assets/
│   ├── css/styles.css      # All site styles, mobile-first responsive
│   ├── js/
│   │   ├── products.js     # Single source of truth for all 111 products
│   │   └── site.js         # Header/footer rendering, cart, wishlist, toast
│   └── images/
│       ├── shirts/, polos/, trousers/, khakis/, jeans/, sweaters/,
│       │   blazers/, suits/, coats/, jackets/, shoes/, watches/, accessories/
│       └── ... (111 product images, lowercase, deployment-friendly names)
└── Product images/         # Originals — safe to delete after deploy
    └── (untouched copies of your input)
```

## How to deploy

The site is **pure HTML, CSS, and vanilla JS** — no build step, no dependencies. It works on any static host.

### Option 1 — Netlify (recommended for free custom domain + SSL)

1. Drag the project folder onto <https://app.netlify.com/drop>.
2. Once it deploys, go to **Site settings → Domain management** and either:
   - Use the free `*.netlify.app` URL Netlify gives you, or
   - Connect a custom domain (e.g. `K-LINE MEN.com`).
3. SSL is automatic.

### Option 2 — Vercel

1. Run `npx vercel` from the project root, or drag-drop on <https://vercel.com/new>.
2. No framework preset needed — choose "Other".

### Option 3 — GitHub Pages

1. Push the project folder to a GitHub repo.
2. **Settings → Pages → Source: main branch → / (root)**.
3. Site appears at `https://<user>.github.io/<repo>/`.

### Option 4 — Any static host (cPanel, Bluehost, S3, etc.)

Upload the contents of this folder to your `public_html` (or equivalent) — preserve the directory structure.

## Local preview

The site has no build step. Just open `index.html` in a browser, or run a tiny local server for clean URLs:

```powershell
# Python (any version)
python -m http.server 8080
# then visit http://localhost:8080/

# OR Node
npx serve .
```

## Editing products

Open [`assets/js/products.js`](assets/js/products.js). Each product is a single object — change `name`, `price`, `description`, `sizes`, `color`, `image`, or `badges`. Every page that loads this file (homepage, shop, product, cart) reflects the change automatically.

```js
{ id: 'shirts-001', name: 'Sky Blue Cutaway Slim Shirt', category: 'shirts',
  price: 145000, image: 'assets/images/shirts/shirts-001.png',
  color: { name: 'Sky Blue', hex: '#bdd5ec' }, sizes: ['S','M','L','XL','XXL'],
  occasion: ['work','smart-casual'], badges: ['new'],
  description: 'A clean sky blue dress shirt …' }
```

To **add a product**:
1. Drop the image into `assets/images/<category>/`.
2. Add an entry to `KLINE_PRODUCTS` in `products.js`.
3. (Optional) Re-generate the sitemap — see below.

To **mark something as a bestseller** or **new arrival**, add it to the `badges` array (`'new'`, `'bestseller'`, `'signature'`). It will surface on the homepage and on the shop page when filtered.

## Editing the WhatsApp number

Bottom of [`assets/js/products.js`](assets/js/products.js):

```js
WHATSAPP_DISPLAY: '+256 777 466 979',
WHATSAPP_RAW:     '256777466979'
```

`whatsappUrl()` builds `https://wa.me/<RAW>?text=<encoded message>` — change both fields if the number changes.

## Re-generating sitemap.xml

After adding or removing products, regenerate the sitemap:

```powershell
$site = "https://K-LINE MEN.com"   # change to your domain
$today = Get-Date -Format "yyyy-MM-dd"
$static = @("","shop.html","about.html","contact.html","faq.html","cart.html","wishlist.html")
$cats = @("shirts","polos","trousers","khakis","jeans","sweaters","blazers","suits","coats","jackets","shoes","watches","accessories")
$sb = [System.Text.StringBuilder]::new()
$null = $sb.AppendLine('<?xml version="1.0" encoding="UTF-8"?>')
$null = $sb.AppendLine('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
foreach ($p in $static) { $null = $sb.AppendLine("  <url><loc>$site/$p</loc><lastmod>$today</lastmod></url>") }
foreach ($c in $cats)   { $null = $sb.AppendLine("  <url><loc>$site/shop.html?cat=$c</loc><lastmod>$today</lastmod></url>") }
$js = Get-Content .\assets\js\products.js -Raw
[regex]::Matches($js, "id:\s*'([^']+)'") | ForEach-Object {
  $null = $sb.AppendLine("  <url><loc>$site/product.html?id=$($_.Groups[1].Value)</loc><lastmod>$today</lastmod></url>")
}
$null = $sb.AppendLine('</urlset>')
$sb.ToString() | Set-Content -Path .\sitemap.xml -Encoding utf8
```

## What you may want to revisit before going live

- **Domain.** Update `https://K-LINE MEN.com` references in `robots.txt` and `sitemap.xml` to your real domain.
- **Email address.** [`contact.html`](contact.html) uses a placeholder `hello@K-LINE MEN.com` — change to a real inbox or remove the email button.
- **Pricing.** Per-category placeholder UGX values are in `products.js` — replace with real prices when finalised.
- **Social links / handles.** None are hard-coded yet. Add Instagram/TikTok/Facebook to the footer in [`assets/js/site.js`](assets/js/site.js) (`renderFooter`).
- **Favicon.** Currently uses the wallet image. Replace with a dedicated `favicon.ico` or branded PNG.
- **Multiple product photos.** Each product has one image. The PDP gallery is wired for thumbs — drop additional images and update the product entry's `image` to an `images: [...]` array if you want to add detail shots.

## Architecture notes

- **No backend.** Cart and wishlist persist via `localStorage`. Checkout is a `wa.me` deep link with the order summary prefilled.
- **One catalog.** Every page reads the same `KLINE_PRODUCTS` array — change a price once, every page reflects.
- **Header/footer rendering.** Pages have `<div id="site-header"></div>` and `<div id="site-footer"></div>` placeholders that `SITE.mount(activePage)` fills. Avoids HTML duplication across 7 pages.
- **URL-driven shop state.** `shop.html?cat=blazers&badge=new` is shareable; filters update the URL as users click.
- **No frameworks, no build step.** Vanilla JS, ~14 KB of JS gzipped. Loads in under a second on a 3G connection.

## License & ownership

Photography and brand identity belong to K-LINE MEN. Code is yours to modify freely.
