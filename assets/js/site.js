/* ============================================================================
   K-LINE MEN — Shared site behaviour
   Loaded on every page after products.js. Owns:
   - Header + footer rendering (so HTML files don't repeat themselves)
   - Cart + wishlist state, persisted to localStorage
   - Mobile drawer, toast, WhatsApp checkout deep link
   - Product card markup (used by homepage, shop, related lists)
   ============================================================================ */

(function () {
  'use strict';

  /* ─────────── Inline SVG icons ─────────── */
  // Single source for icons used in nav, product cards, and the floating button.
  // Returning strings so we can drop them straight into innerHTML.
  const ICONS = {
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    heart:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>',
    heartFill: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>',
    bag:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    menu:   '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>',
    close:  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    whatsapp: '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163A11.867 11.867 0 0 1 .14 11.892C.14 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.358 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.45L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg>',
    chevron:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    truck:  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>',
    refresh:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
    chat:   '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    card:   '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
    phone:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    instagram: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>'
  };

  /* ─────────── Picture markup helper ─────────── */
  // Emits a <picture> with three WebP variants (400w/800w/1200w) and a PNG
  // fallback in <img>. Source PNGs are converted by scripts/optimize-images.mjs;
  // every .png in the catalog has matching <name>-400.webp / -800.webp / .webp
  // siblings. Anything that isn't a .png (e.g. ig-1.jpg in the IG strip) falls
  // back to a plain <img> tag because no WebP variants were generated for it.
  //
  //   opts.sizes   — `sizes` attribute, defaults to a 4-up product grid
  //   opts.eager   — true for above-the-fold images (hero, PDP main)
  //   opts.onerror — inline error handler, used by the IG strip fallback
  function pictureHTML(src, alt, opts) {
    opts = opts || {};
    alt = (alt || '').replace(/"/g, '&quot;');
    const sizes = opts.sizes || '(max-width:640px) 50vw, (max-width:1080px) 33vw, 25vw';
    const loadAttrs = opts.eager
      ? ' loading="eager" fetchpriority="high" decoding="async"'
      : ' loading="lazy" decoding="async"';
    const onErrorAttr = opts.onerror ? ' onerror="' + opts.onerror + '"' : '';
    const isPng = /\.png$/i.test(src);
    if (!isPng) {
      // No WebP siblings — render a plain <img>.
      return '<img src="' + src + '" alt="' + alt + '"' + loadAttrs + onErrorAttr + '>';
    }
    const base = src.replace(/\.png$/i, '');
    return ''
      + '<picture>'
      +   '<source type="image/webp" srcset="' + base + '-400.webp 400w, ' + base + '-800.webp 800w, ' + base + '.webp 1200w" sizes="' + sizes + '">'
      +   '<img src="' + src + '" alt="' + alt + '"' + loadAttrs + onErrorAttr + '>'
      + '</picture>';
  }

  /* ─────────── Storage helpers ─────────── */
  // localStorage is the only persistence — no backend.
  const LS_CART = 'kline_cart_v1';
  const LS_WISH = 'kline_wishlist_v1';

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) { return fallback; }
  }
  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  /* ─────────── Cart state ─────────── */
  // Cart line-key = `${productId}|${size}` so the same product in two sizes
  // counts as two distinct lines.
  function getCart() { return readJSON(LS_CART, []); }
  function saveCart(cart) {
    writeJSON(LS_CART, cart);
    refreshHeaderCounts();
    document.dispatchEvent(new CustomEvent('kline:cartchange'));
  }

  function lineKey(id, size) { return id + '|' + (size || ''); }

  function addToCart(productId, size, qty) {
    const product = window.KLINE.byId(productId);
    if (!product) return;
    qty = Math.max(1, qty || 1);
    const cart = getCart();
    const key = lineKey(productId, size);
    const existing = cart.find(i => i.key === key);
    if (existing) existing.qty += qty;
    else cart.push({ key, id: productId, size: size || '', qty });
    saveCart(cart);
    showToast(qty > 1
      ? qty + ' × ' + product.name + ' added to bag'
      : product.name + ' added to bag');
  }

  function updateQty(key, qty) {
    let cart = getCart();
    if (qty <= 0) { cart = cart.filter(i => i.key !== key); }
    else { const it = cart.find(i => i.key === key); if (it) it.qty = qty; }
    saveCart(cart);
  }

  function removeFromCart(key) {
    saveCart(getCart().filter(i => i.key !== key));
  }

  function cartTotal() {
    return getCart().reduce((sum, item) => {
      const p = window.KLINE.byId(item.id);
      return sum + (p ? p.price * item.qty : 0);
    }, 0);
  }
  function cartCount() {
    return getCart().reduce((n, item) => n + item.qty, 0);
  }

  /* ─────────── Wishlist ─────────── */
  function getWishlist() { return readJSON(LS_WISH, []); }
  function saveWishlist(list) {
    writeJSON(LS_WISH, list);
    refreshHeaderCounts();
    document.dispatchEvent(new CustomEvent('kline:wishchange'));
  }
  function inWishlist(id) { return getWishlist().includes(id); }
  function toggleWishlist(id) {
    const list = getWishlist();
    const product = window.KLINE.byId(id);
    if (list.includes(id)) {
      saveWishlist(list.filter(x => x !== id));
      showToast((product ? product.name : 'Item') + ' removed from wishlist');
    } else {
      list.push(id);
      saveWishlist(list);
      showToast((product ? product.name : 'Item') + ' added to wishlist');
    }
  }

  /* ─────────── Toast ─────────── */
  let toastTimer = null;
  function showToast(message) {
    let el = document.getElementById('kline-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'kline-toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  /* ─────────── WhatsApp checkout ─────────── */
  // Builds a prefilled order summary and opens wa.me in a new tab.
  function buildCheckoutMessage() {
    const cart = getCart();
    if (!cart.length) return null;
    const lines = cart.map(item => {
      const p = window.KLINE.byId(item.id);
      if (!p) return null;
      const sub = p.price * item.qty;
      return '• ' + item.qty + ' × ' + p.name +
             (item.size ? ' (size ' + item.size + ')' : '') +
             ' — ' + window.KLINE.formatUGX(sub);
    }).filter(Boolean).join('\n');
    const total = window.KLINE.formatUGX(cartTotal());
    return 'Hello K-LINE MEN, I\'d like to place an order:\n\n' +
           lines + '\n\n' +
           'Total: ' + total + '\n\n' +
           'My name: \nDelivery location: \n' +
           '(Sent from K-LINE MEN.com)';
  }
  // Open a wa.me link with a graceful fallback for in-app browsers (Instagram,
  // Facebook) where window.open may be blocked or silently no-op. If the popup
  // can't be created we navigate the current tab instead — better to leave the
  // site than to swallow the conversion.
  function openWhatsApp(url) {
    const win = window.open(url, '_blank', 'noopener');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      window.location.href = url;
    }
  }
  function checkoutOnWhatsApp() {
    const msg = buildCheckoutMessage();
    if (!msg) { showToast('Your bag is empty'); return; }
    openWhatsApp(window.KLINE.whatsappUrl(msg));
  }
  function askAboutProduct(product, size) {
    const msg = 'Hello K-LINE MEN, I\'m interested in:\n\n' +
                product.name + (size ? ' (size ' + size + ')' : '') + '\n' +
                window.KLINE.formatUGX(product.price) + '\n\n' +
                'Could you confirm availability and delivery to me?';
    openWhatsApp(window.KLINE.whatsappUrl(msg));
  }

  /* ─────────── Header / footer rendering ─────────── */
  // Pages include a <div id="site-header"></div> + <div id="site-footer"></div>
  // and we fill them. Keeps every page's HTML small and consistent.
  function renderHeader(activePage) {
    const links = [
      { href: 'shop.html',     label: 'Shop',          key: 'shop' },
      { href: 'shop.html#categories', label: 'Categories', key: 'categories' },
      { href: 'shop.html?badge=new',  label: 'New Arrivals', key: 'new' },
      { href: 'about.html',    label: 'About',         key: 'about' },
      { href: 'contact.html',  label: 'Contact',       key: 'contact' }
    ];
    const navHTML = links.map(l =>
      '<a href="' + l.href + '"' + (activePage === l.key ? ' class="is-active"' : '') + '>' + l.label + '</a>'
    ).join('');

    const cartCountValue = cartCount();
    const wishCountValue = getWishlist().length;
    const cartHidden = cartCountValue ? '' : ' hidden';
    const wishHidden = wishCountValue ? '' : ' hidden';

    return ''
      + '<div class="announcement">New styles weekly · See outfits on Instagram <a href="' + window.KLINE.INSTAGRAM_URL + '" target="_blank" rel="noopener" style="color:inherit; border-bottom:1px solid currentColor;">' + window.KLINE.INSTAGRAM_HANDLE + '</a> · Order on WhatsApp ' + window.KLINE.WHATSAPP_DISPLAY + '</div>'
      + '<header class="site-header">'
      +   '<div class="container nav">'
      +     '<a class="brand" href="index.html"><strong>K-LINE MEN</strong><span>Real Men Real Style</span></a>'
      +     '<nav class="nav-links" aria-label="Main navigation">' + navHTML + '</nav>'
      +     '<div class="nav-actions">'
      +       '<a class="icon-btn" href="shop.html" aria-label="Shop">' + ICONS.search + '</a>'
      +       '<a class="icon-btn" href="wishlist.html" aria-label="Wishlist" id="hdr-wish">' + ICONS.heart + '<span class="badge-count" id="hdr-wish-count"' + wishHidden + '>' + wishCountValue + '</span></a>'
      +       '<a class="icon-btn" href="cart.html" aria-label="Bag" id="hdr-cart">' + ICONS.bag + '<span class="badge-count" id="hdr-cart-count"' + cartHidden + '>' + cartCountValue + '</span></a>'
      +       '<a class="whatsapp-small" href="' + window.KLINE.whatsappUrl('Hello K-LINE MEN, I have a question.') + '" target="_blank" rel="noopener"><span class="whatsapp-dot"></span> WhatsApp</a>'
      +       '<button class="icon-btn menu-btn" id="hdr-menu" aria-label="Open menu" aria-controls="mobile-drawer" aria-expanded="false">' + ICONS.menu + '</button>'
      +     '</div>'
      +   '</div>'
      + '</header>'
      + '<div class="mobile-drawer" id="mobile-drawer" aria-hidden="true" role="dialog" aria-label="Site navigation">'
      +   '<div class="panel">'
      +     '<button class="icon-btn close" id="hdr-menu-close" aria-label="Close menu">' + ICONS.close + '</button>'
      +     navHTML.replace(/class="is-active"/g, '')
      +     '<a href="cart.html">Bag</a>'
      +     '<a href="wishlist.html">Wishlist</a>'
      +     '<a class="whatsapp-small" href="' + window.KLINE.whatsappUrl('Hello K-LINE MEN, I have a question.') + '" target="_blank" rel="noopener"><span class="whatsapp-dot"></span> ' + window.KLINE.WHATSAPP_DISPLAY + '</a>'
      +   '</div>'
      + '</div>';
  }

  function renderFooter() {
    const cats = window.KLINE_CATEGORIES.slice(0, 6).map(c =>
      '<a href="shop.html?cat=' + c.slug + '">' + c.label + '</a>'
    ).join('');
    return ''
      + '<footer class="site-footer">'
      +   '<div class="container">'
      +     '<div class="footer-grid">'
      +       '<div class="footer-brand">'
      +         '<img src="Logo-footer.webp" alt="K-LINE MEN" class="footer-logo" loading="lazy" decoding="async">'
      +         '<p>Real Men Real Style. Modern menswear for work, weekends, and special occasions — based in Kampala, delivered across Uganda.</p>'
      +         '<a class="footer-ig" href="' + window.KLINE.INSTAGRAM_URL + '" target="_blank" rel="noopener" aria-label="K-LINE MEN on Instagram">'
      +           ICONS.instagram + '<span>' + window.KLINE.INSTAGRAM_HANDLE + ' — outfit ideas daily</span>'
      +         '</a>'
      +       '</div>'
      +       '<div class="footer-col"><h3>Shop</h3>' + cats + '<a href="shop.html">All products</a></div>'
      +       '<div class="footer-col"><h3>Help</h3><a href="faq.html">FAQs</a><a href="contact.html">Contact</a><a href="about.html">About</a><a href="faq.html#delivery">Delivery & returns</a><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a></div>'
      +       '<div class="footer-col"><h3>Visit</h3>'
      +         '<p>WhatsApp: <a href="' + window.KLINE.whatsappUrl('Hello K-LINE MEN!') + '" target="_blank" rel="noopener">' + window.KLINE.WHATSAPP_DISPLAY + '</a></p>'
      +         '<p>Call: <a href="tel:+' + window.KLINE.CALL_RAW + '">' + window.KLINE.CALL_DISPLAY + '</a></p>'
      +         '<p>Fraine Building<br>Ntinda, Kampala<br>Uganda</p>'
      +         '<p>Open Mon–Sat · 9am–7pm</p>'
      +       '</div>'
      +     '</div>'
      +     '<div class="footer-bottom">'
      +       '<span>© ' + new Date().getFullYear() + ' K-LINE MEN. All rights reserved.</span>'
      +       '<span>Premium menswear · Designed in Kampala</span>'
      +     '</div>'
      +   '</div>'
      + '</footer>'
      + '<a href="' + window.KLINE.whatsappUrl('Hello K-LINE MEN, I have a question.') + '" target="_blank" rel="noopener" class="floating-whatsapp" aria-label="Chat on WhatsApp">' + ICONS.whatsapp + '</a>';
  }

  /* ─────────── Product card ─────────── */
  // Single source of card markup — used everywhere (homepage, shop, related).
  function productCardHTML(product, opts) {
    opts = opts || {};
    const sizesText = product.sizes && product.sizes.length > 1
      ? product.sizes[0] + '–' + product.sizes[product.sizes.length - 1]
      : (product.sizes && product.sizes[0]) || '';
    const badge = (product.badges || []).includes('signature') ? { label: 'Signature', cls: 'sig' }
                : (product.badges || []).includes('new')        ? { label: 'New' }
                : (product.badges || []).includes('bestseller') ? { label: 'Bestseller' }
                : null;
    const wishActive = inWishlist(product.id) ? ' is-active' : '';
    const wishIcon = inWishlist(product.id) ? ICONS.heartFill : ICONS.heart;
    // Wishlist button lives as a sibling of the link, not a child — nesting an
    // interactive <button> inside the <a> is invalid HTML and breaks keyboard
    // tabbing (Enter on the heart fires both the wishlist toggle and the link).
    return ''
      + '<article class="product-card">'
      +   '<div class="product-actions">'
      +     '<button type="button" class="wish-btn' + wishActive + '" data-id="' + product.id + '" aria-label="Toggle wishlist" title="Save to wishlist">' + wishIcon + '</button>'
      +   '</div>'
      +   '<a class="product-link" href="product/' + product.id + '.html" aria-label="' + product.name + '">'
      +     '<div class="product-media">'
      +       (badge ? '<span class="product-badge ' + (badge.cls || '') + '">' + badge.label + '</span>' : '')
      +       pictureHTML(product.image, product.name)
      +     '</div>'
      +     '<h3>' + product.name + '</h3>'
      +     '<div class="product-meta">' + (product.color ? product.color.name + ' · ' : '') + categoryLabel(product.category) + '</div>'
      +     '<div class="product-bottom">'
      +       '<span class="price">' + window.KLINE.formatUGX(product.price) + '</span>'
      +       '<span class="sizes">' + sizesText + '</span>'
      +     '</div>'
      +   '</a>'
      + '</article>';
  }
  function categoryLabel(slug) {
    const c = window.KLINE_CATEGORIES.find(c => c.slug === slug);
    return c ? c.label : slug;
  }

  /* ─────────── Wire-up ─────────── */
  // Click delegation for wishlist hearts that appear in any rendered list.
  function wireGlobalDelegates() {
    document.addEventListener('click', function (e) {
      const wishBtn = e.target.closest('.wish-btn');
      if (wishBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = wishBtn.getAttribute('data-id');
        toggleWishlist(id);
        // Refresh heart icon for any matching buttons in DOM.
        document.querySelectorAll('.wish-btn[data-id="' + id + '"]').forEach(btn => {
          const active = inWishlist(id);
          btn.classList.toggle('is-active', active);
          btn.innerHTML = active ? ICONS.heartFill : ICONS.heart;
        });
      }
    });
  }
  function wireMobileDrawer() {
    // The drawer is a small dialog: aria-expanded on the toggle, aria-hidden
    // on the drawer, focus returns to the toggle on close, Escape closes, and
    // (added 2026-05-08) Tab / Shift+Tab cycles within the drawer instead of
    // escaping into the page behind. The drawer's focusable set is static so
    // we cache it once at wire time.
    const drawer = document.getElementById('mobile-drawer');
    const openBtn = document.getElementById('hdr-menu');
    const closeBtn = document.getElementById('hdr-menu-close');
    if (!drawer || !openBtn) return;

    const focusables = drawer.querySelectorAll('a[href], button');

    function trapTab(e) {
      if (e.key !== 'Tab' || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    function open() {
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      openBtn.setAttribute('aria-expanded', 'true');
      drawer.addEventListener('keydown', trapTab);
      // Defer focus until the panel has actually transitioned in.
      setTimeout(() => { if (closeBtn) closeBtn.focus(); }, 50);
    }
    function close() {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      openBtn.setAttribute('aria-expanded', 'false');
      drawer.removeEventListener('keydown', trapTab);
      openBtn.focus();
    }

    openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    drawer.addEventListener('click', e => { if (e.target === drawer) close(); });
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) close();
    });
  }
  function refreshHeaderCounts() {
    const cartCountEl = document.getElementById('hdr-cart-count');
    const wishCountEl = document.getElementById('hdr-wish-count');
    if (cartCountEl) {
      const n = cartCount();
      cartCountEl.textContent = n;
      cartCountEl.toggleAttribute('hidden', n === 0);
    }
    if (wishCountEl) {
      const n = getWishlist().length;
      wishCountEl.textContent = n;
      wishCountEl.toggleAttribute('hidden', n === 0);
    }
  }

  function mount(activePage) {
    injectSkipLink();
    const headerSlot = document.getElementById('site-header');
    const footerSlot = document.getElementById('site-footer');
    if (headerSlot) headerSlot.outerHTML = renderHeader(activePage);
    if (footerSlot) footerSlot.outerHTML = renderFooter();
    wireMobileDrawer();
    wireGlobalDelegates();
    injectOrganizationJSONLD();
    ensureMainLandmarkId();
  }

  // Skip-to-content link is the first focusable element on the page so
  // keyboard / screen-reader users can jump past the header into <main>.
  // Hidden visually until focused (.skip-link in styles.css).
  function injectSkipLink() {
    if (document.querySelector('.skip-link')) return;
    const link = document.createElement('a');
    link.className = 'skip-link';
    link.href = '#main';
    link.textContent = 'Skip to content';
    document.body.insertBefore(link, document.body.firstChild);
  }

  // Targets the skip-link anchor. If a page didn't manually mark its <main>
  // with id="main", we attach it here so every page is reachable.
  function ensureMainLandmarkId() {
    const main = document.querySelector('main');
    if (main && !main.id) main.id = 'main';
  }

  /* ─────────── Organization / LocalBusiness JSON-LD ───────────
     Injected once per page from mount(). Drives the Knowledge Panel and rich
     local-business search results (address, hours, phone, social). Pre-rendered
     PDP pages also include Product + Offer + Breadcrumb JSON-LD (added at
     build time by scripts/prerender-products.mjs); search engines merge the
     two by URL. Skip injection if a static script with the same id already
     exists (so prerendered files don't double up). */
  function injectOrganizationJSONLD() {
    if (document.getElementById('jsonld-organization')) return;
    const data = {
      '@context': 'https://schema.org',
      '@type': 'ClothingStore',
      'name': 'K-LINE MEN',
      'description': 'Premium menswear in Kampala — shirts, suits, blazers, shoes, watches and accessories. Order on WhatsApp, delivered across Uganda.',
      'url': 'https://k-line-men.com/',
      'logo': 'https://k-line-men.com/icon-512.png',
      'image': 'https://k-line-men.com/apple-touch-icon.png',
      'telephone': '+' + window.KLINE.WHATSAPP_RAW,
      'email': window.KLINE.EMAIL,
      'priceRange': 'UGX 35,000 – UGX 950,000',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': 'Fraine Building',
        'addressLocality': 'Ntinda',
        'addressRegion': 'Kampala',
        'addressCountry': 'UG'
      },
      'openingHoursSpecification': [{
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        'opens': '09:00',
        'closes': '19:00'
      }],
      'sameAs': [window.KLINE.INSTAGRAM_URL]
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'jsonld-organization';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /* ─────────── PDP Product + Breadcrumb JSON-LD ───────────
     Called from product.html once the product is resolved. Pre-rendered files
     under /product/{id}.html emit a static version of this same payload at
     build time (same script id), and the JS path skips re-injection when the
     static one is present — dynamic /product.html?id=X URLs fall back to JS
     injection so they're still indexable. */
  function injectProductJSONLD(product) {
    if (!product || document.getElementById('jsonld-product')) return;
    const productUrl = 'https://k-line-men.com/product/' + product.id + '.html';
    const imageUrl = 'https://k-line-men.com/' + product.image;
    const productData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': product.name,
      'description': product.description || '',
      'sku': product.id.toUpperCase(),
      'image': imageUrl,
      'url': productUrl,
      'brand': { '@type': 'Brand', 'name': 'K-LINE MEN' },
      'category': categoryLabel(product.category),
      'offers': {
        '@type': 'Offer',
        'priceCurrency': 'UGX',
        'price': product.price,
        'availability': 'https://schema.org/InStock',
        'url': productUrl,
        'seller': { '@type': 'Organization', 'name': 'K-LINE MEN' }
      }
    };
    if (product.color && product.color.name) productData.color = product.color.name;
    const productScript = document.createElement('script');
    productScript.type = 'application/ld+json';
    productScript.id = 'jsonld-product';
    productScript.textContent = JSON.stringify(productData);
    document.head.appendChild(productScript);

    // Breadcrumb: Home > Shop > {Category} > {Product Name}
    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://k-line-men.com/' },
        { '@type': 'ListItem', 'position': 2, 'name': 'Shop', 'item': 'https://k-line-men.com/shop.html' },
        { '@type': 'ListItem', 'position': 3, 'name': categoryLabel(product.category), 'item': 'https://k-line-men.com/shop.html?cat=' + product.category },
        { '@type': 'ListItem', 'position': 4, 'name': product.name, 'item': productUrl }
      ]
    };
    const breadcrumbScript = document.createElement('script');
    breadcrumbScript.type = 'application/ld+json';
    breadcrumbScript.id = 'jsonld-breadcrumb';
    breadcrumbScript.textContent = JSON.stringify(breadcrumb);
    document.head.appendChild(breadcrumbScript);
  }

  /* ─────────── Public surface ─────────── */
  window.SITE = {
    icons: ICONS,
    mount,
    getCart, addToCart, updateQty, removeFromCart, cartTotal, cartCount,
    getWishlist, toggleWishlist, inWishlist,
    showToast, productCardHTML, categoryLabel, pictureHTML,
    checkoutOnWhatsApp, askAboutProduct,
    injectProductJSONLD,
    refreshHeaderCounts
  };
})();
