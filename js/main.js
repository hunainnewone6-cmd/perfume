/* ============================================================
   MAISON NÉRA — Interactions
   ============================================================ */
'use strict';

/* ---------- Product catalogue ---------- */
const PRODUCTS = [
  {
    id: 'nuit-doree', code: 'N° 01', name: 'Nuit Dorée', family: 'Oriental', gender: 'For Her',
    price: 235, img: '1541643600914-78b084683601',
    desc: 'A golden dusk held in crystal. Saffron ignites over dark amber, while smoked vanilla and cashmere woods settle into a long, warm trail.',
    top: 'Saffron · Calabrian Bergamot', heart: 'Dark Amber · Orris Butter', base: 'Smoked Vanilla · Cashmere Woods'
  },
  {
    id: 'bois-marine', code: 'N° 02', name: 'Bois Marine', family: 'Fresh', gender: 'For Him',
    price: 195, img: '1523293182086-7651a899d37f',
    desc: 'Cool salt air over sun-warmed driftwood. A marine accord and sharp bergamot give way to a dry, mineral core of cedar and vetiver.',
    top: 'Marine Accord · Bergamot', heart: 'Sea Salt · Juniper Berry', base: 'Cedar · Vetiver'
  },
  {
    id: 'fleur-minuit', code: 'N° 03', name: 'Fleur de Minuit', family: 'Floral', gender: 'For Her',
    price: 210, img: '1615634260167-c8cdede054de',
    desc: 'Night-blooming jasmine and ivory iris over creamy tuberose, grounded in sandalwood and a breath of white musk.',
    top: 'Night Jasmine · Pear', heart: 'Tuberose · Orris', base: 'Sandalwood · White Musk'
  },
  {
    id: 'ambre-souffle', code: 'N° 04', name: 'Ambre Soufflé', family: 'Woody', gender: 'For Him',
    price: 225, img: '1587017539504-67cfbddac569',
    desc: 'Molten amber and toasted tonka over supple leather and smoked labdanum. Rich, magnetic, entirely quietly commanding.',
    top: 'Labdanum · Pink Pepper', heart: 'Tobacco Leaf · Leather', base: 'Amber · Toasted Tonka'
  }
];
const PRODUCTS_REST = [
  {
    id: 'santal-reserve', code: 'N° 05', name: 'Santal Réservé', family: 'Woody', gender: 'For Her',
    price: 240, img: '1588405748880-12d1d2a59f75',
    desc: 'A private sillage of cream sandalwood and cashmere musk, lifted by the spark of pink pepper and softened by Madagascar vanilla.',
    top: 'Pink Pepper · Cardamom', heart: 'Cream Sandalwood', base: 'Cashmere Musk · Vanilla'
  },
  {
    id: 'rose-ivoire', code: 'N° 06', name: 'Rose d’Ivoire', family: 'Floral', gender: 'For Her',
    price: 205, img: '1547887538-e3a2f32cb1cc',
    desc: 'An ivory rose turned rare. Velvet petals, cool bergamot and a backbone of white musk and warm honeyed vanilla.',
    top: 'Bulgarian Rose · Bergamot', heart: 'Magnolia · Peony', base: 'White Musk · Honeyed Vanilla'
  },
  {
    id: 'vetiver-abysse', code: 'N° 07', name: 'Vétiver Abysse', family: 'Fresh', gender: 'For Him',
    price: 185, img: '1595425970377-c9703cf48b6d',
    desc: 'Green vetiver plunged into deep water. Crisp grapefruit and violet leaf over an aquatic, mineral base that never fades.',
    top: 'Grapefruit · Violet Leaf', heart: 'Green Vetiver · Mint', base: 'Mineral Accord · Oakmoss'
  },
  {
    id: 'oud-imperial', code: 'N° 08', name: 'Oud Impérial', family: 'Woody', gender: 'For Him',
    price: 265, img: '1592945403244-b3fbafd7f539',
    desc: 'Rare agarwood wrapped in smoked incense and darkened honey. Opulent, ancient, utterly unforgettable.',
    top: 'Saffron · Smoked Incense', heart: 'Agarwood · Rose Absolute', base: 'Darkened Honey · Amber'
  }
];
let ALL_PRODUCTS = PRODUCTS.concat(PRODUCTS_REST); // offline fallback (loaded live from /api/products below)

const FEATURED_IDS = ['nuit-doree', 'bois-marine', 'ambre-souffle', 'rose-ivoire'];
const CART_KEY = 'nera_cart_v1';
const FREE_SHIP = 150;
const SIZE_OPTIONS = [
  { label: '30 ml', mult: 0.7 },
  { label: '50 ml', mult: 1 },
  { label: '100 ml', mult: 1.5 }
];

const byId = (id) => ALL_PRODUCTS.find((p) => p.id === id);
const imgSrc = (id, w = 900) => `https://images.unsplash.com/photo-${id}?q=80&w=${w}&auto=format&fit=crop`;
const fmt = (n) => '$' + Math.round(n).toLocaleString('en-US');

/* ---------- Cart state (persisted) ---------- */
let cart = [];
try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { cart = []; }
const saveCart = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* private mode */ } };
const cartCount = () => cart.reduce((a, i) => a + i.qty, 0);
const cartTotal = () => cart.reduce((a, i) => a + (byId(i.id)?.price || 0) * i.qty * i.mult, 0);

/* ---------- Tiny DOM helpers ---------- */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

/* ---------- Product card rendering ---------- */
function cardHTML(p, opts = {}) {
  const tag = p.gender + ' · ' + p.family;
  const actions = opts.shop
    ? `<div class="card-actions">
         <button class="btn btn--small" data-quick="${p.id}">Quick View</button>
         <button class="btn btn--small btn--gold" data-quick="${p.id}">Discover</button>
       </div>`
    : `<div class="card-bottom">
         <span class="card-price">${fmt(p.price)}</span>
         <button class="link-line" data-quick="${p.id}">Discover <span class="arrow">&#8594;</span></button>
       </div>`;
  return `
  <article class="card reveal" data-id="${p.id}">
    <div class="card-media" role="button" tabindex="0" aria-label="Open quick view for ${p.name}">
      <img src="${imgSrc(p.img)}" alt="${p.name} eau de parfum, Maison Néra" loading="lazy">
      <button class="card-quick" data-quick="${p.id}">Quick View</button>
    </div>
    <div class="card-body">
      <span class="card-family">${tag}</span>
      <h3 class="card-name">${p.code} · ${p.name}</h3>
      <p class="card-desc">${p.desc}</p>
      ${actions}
    </div>
  </article>`;
}

function renderGrid(container, list, opts) {
  if (!container) return;
  container.innerHTML = list.map((p) => cardHTML(p, opts)).join('');
  observeReveals(container);
}

/* ---------- Reveal on scroll ---------- */
const io = ('IntersectionObserver' in window)
  ? new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
  : null;

function observeReveals(scope) {
  const els = $$('.reveal:not(.is-in)', scope);
  els.forEach((el) => { if (io) io.observe(el); else el.classList.add('is-in'); });
}

/* ---------- Fixed header + parallax ---------- */
const siteTop = $('#siteTop');
const header = $('.header');
const quoteImg = $('.quote-media img');
const heroImg = $('.hero-media img');
let ticking = false;

function parallax() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    if (quoteImg) {
      const r = quoteImg.parentElement.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) {
        const pct = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        quoteImg.style.transform = `translateY(${pct * -46}px) scale(1.1)`;
      }
    }
    if (heroImg && window.scrollY < innerHeight) {
      heroImg.parentElement.style.transform = `translateY(${window.scrollY * 0.16}px)`;
    }
    ticking = false;
  });
}

function onScroll() {
  const y = window.scrollY;
  siteTop.classList.toggle('scrolled', y > 40);
  header.classList.toggle('is-solid', y > 90 || document.body.classList.contains('shop-page'));
  parallax();
}
window.addEventListener('scroll', onScroll, { passive: true });

/* ============================================================
   MOBILE MENU
   ============================================================ */
const burger = $('.burger');
const mobileMenu = $('#mobileMenu');
function setMenu(open) {
  if (open) { mobileMenu.classList.add('open'); burger.setAttribute('aria-expanded', 'true'); }
  else { mobileMenu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  document.body.classList.toggle('no-scroll', open);
}
burger.addEventListener('click', () => {
  setMenu(!mobileMenu.classList.contains('open'));
});
$$('.mobile-menu a.menu-link').forEach((a) => a.addEventListener('click', () => setMenu(false)));

/* ============================================================
   OVERLAY HELPERS
   ============================================================ */
const backdrop = $('#backdrop');
const body = document.body;
const search = $('#search');
const searchInput = $('#searchInput');

function openOverlay(el) {
  el.classList.add('open');
  body.classList.add('no-scroll');
  backdrop.classList.add('open');
  if (el === search) setTimeout(() => searchInput.focus(), 400);
}
function closeOverlay(el) {
  el.classList.remove('open');
  if (!$('.modal.open') && !$('.cart-drawer.open') && !$('.search.open')) {
    body.classList.remove('no-scroll');
    backdrop.classList.remove('open');
  }
}
backdrop.addEventListener('click', () => {
  $$('.modal.open, .cart-drawer.open, .search.open').forEach(closeOverlay);
});

/* ============================================================
   QUICK VIEW MODAL
   ============================================================ */
const modal = $('#quickView');
const modalWindow = $('#quickViewWindow');
let activeSize = 1; /* default 50 ml */

function openQuickView(id) {
  const p = byId(id);
  if (!p) return;
  activeSize = 1;
  modalWindow.innerHTML = `
    <button class="modal-close" data-close aria-label="Close quick view">&times;</button>
    <div class="modal-media"><img src="${imgSrc(p.img, 1100)}" alt="${p.name} eau de parfum"></div>
    <div class="modal-body">
      <span class="card-family">${p.gender} · ${p.family}</span>
      <h2>${p.code} — ${p.name}</h2>
      <div class="modal-price">${fmt(p.price)}</div>
      <p class="modal-desc">${p.desc}</p>
      <div class="modal-notes">
        <div class="note"><h3>Top Notes</h3><p>${p.top}</p></div>
        <div class="note"><h3>Heart Notes</h3><p>${p.heart}</p></div>
        <div class="note"><h3>Base Notes</h3><p>${p.base}</p></div>
      </div>
      <span class="modal-size-label">Select Size</span>
      <div class="sizes">
        ${SIZE_OPTIONS.map((s, i) =>
          `<button class="size ${i === activeSize ? 'is-active' : ''}" data-size="${i}">${s.label}</button>`).join('')}
      </div>
      <div class="modal-actions">
        <button class="btn" data-add="${p.id}">Add to Bag — <span class="add-price">${fmt(p.price)}</span></button>
      </div>
    </div>`;
  openOverlay(modal);
}

modal.addEventListener('click', (e) => {
  if (e.target === modal) { closeOverlay(modal); return; }
  const sizeBtn = e.target.closest('[data-size]');
  if (sizeBtn) {
    const p = byId(modalWindow.querySelector('[data-add]')?.dataset.add);
    activeSize = Number(sizeBtn.dataset.size);
    $$('.size', modalWindow).forEach((b) => b.classList.toggle('is-active', b === sizeBtn));
    const price = fmt(p.price * SIZE_OPTIONS[activeSize].mult);
    $('.modal-price', modalWindow).textContent = price;
    $('.add-price', modalWindow).textContent = price;
  }
  const add = e.target.closest('[data-add]');
  if (add) {
    addToCart(add.dataset.add, activeSize);
    closeOverlay(modal);
  }
});

/* ============================================================
   CART DRAWER
   ============================================================ */
const cartDrawer = $('#cartDrawer');

function addToCart(id, sizeIdx = 1, qty = 1) {
  const p = byId(id);
  if (!p) return;
  const line = cart.find((i) => i.id === id && i.size === sizeIdx);
  if (line) line.qty += qty;
  else cart.push({ id, size: sizeIdx, mult: SIZE_OPTIONS[sizeIdx].mult, qty });
  saveCart();
  renderCart();
  bumpCount();
  openOverlay(cartDrawer);
}

function bumpCount() {
  const el = $('.cart-count');
  if (!el) return;
  el.textContent = cartCount();
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
}

function renderCart() {
  const empty = $('#cartEmpty');
  const list = $('#cartList');
  const totalEl = $('#cartTotal');
  const freeEl = $('#cartFree');
  const countLabel = $('#cartCountLabel');

  if (cart.length === 0) {
    empty.style.display = 'grid';
    list.innerHTML = '';
    if (totalEl) totalEl.textContent = fmt(0);
    if (freeEl) freeEl.textContent = '';
    if (countLabel) countLabel.textContent = '0 ITEMS';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = cart.map((line) => {
    const p = byId(line.id);
    if (!p) return '';
    const lineTotal = fmt(p.price * line.mult * line.qty);
    return `
    <div class="cart-item" data-key="${line.id}-${line.size}">
      <img src="${imgSrc(p.img, 240)}" alt="${p.name}">
      <div>
        <div class="cart-item-name">${p.code} · ${p.name}</div>
        <div class="cart-item-price">${fmt(p.price * line.mult)} ${SIZE_OPTIONS[line.size]?.label || ''} — ${lineTotal}</div>
        <div class="cart-item-qty">
          <button data-dec="${line.id}-${line.size}" aria-label="Decrease quantity">&#8722;</button>
          <span>${line.qty}</span>
          <button data-inc="${line.id}-${line.size}" aria-label="Increase quantity">&#43;</button>
        </div>
      </div>
      <button class="cart-item-remove" data-remove="${line.id}-${line.size}" aria-label="Remove ${p.name}">&#10005;</button>
    </div>`;
  }).join('');

  const total = cartTotal();
  totalEl.textContent = fmt(total);
  const remaining = FREE_SHIP - total;
  freeEl.textContent = remaining > 0
    ? `You are ${fmt(remaining)} away from complimentary shipping`
    : 'Complimentary shipping unlocked';
  if (countLabel) countLabel.textContent = cartCount() + ' ITEM' + (cartCount() === 1 ? '' : 'S');
}

cartDrawer.addEventListener('click', (e) => {
  const inc = e.target.closest('[data-inc]');
  const dec = e.target.closest('[data-dec]');
  const rem = e.target.closest('[data-remove]');
  if (inc || dec) {
    const key = (inc?.dataset.inc || dec?.dataset.dec).split('-');
    const id = key.slice(0, key.length - 1).join('-');
    const size = Number(key[key.length - 1]);
    const line = cart.find((l) => l.id === id && l.size === size);
    if (!line) return;
    if (dec) line.qty = Math.max(1, line.qty - 1);
    else line.qty += 1;
    saveCart(); renderCart(); bumpCount();
  }
  if (rem) {
    const key = rem.dataset.remove.split('-');
    const id = key.slice(0, key.length - 1).join('-');
    const size = Number(key[key.length - 1]);
    cart = cart.filter((l) => !(l.id === id && l.size === size));
    saveCart(); renderCart(); bumpCount();
  }
});

/* ============================================================
   SEARCH OVERLAY
   ============================================================ */
function renderSearch(q) {
  const wrap = $('#searchResults');
  const t = q.trim().toLowerCase();
  const matches = !t ? [] : ALL_PRODUCTS.filter((p) =>
    (p.name + ' ' + p.family + ' ' + p.gender + ' ' + p.desc + ' ' + p.top + ' ' + p.heart + ' ' + p.base)
      .toLowerCase().includes(t));
  wrap.innerHTML = !t
    ? ''
    : matches.length === 0
      ? '<div class="search-empty">No creations match your search.</div>'
      : matches.map((p) => `
          <button class="search-result" data-quick="${p.id}">
            <img src="${imgSrc(p.img, 240)}" alt="">
            <span>
              <span class="search-result-name">${p.code} · ${p.name}</span>
              <span class="search-result-family">${p.gender} · ${p.family}</span>
            </span>
            <span class="search-result-price">${fmt(p.price)}</span>
          </button>`).join('');
}
searchInput.addEventListener('input', () => renderSearch(searchInput.value));

/* ============================================================
   GLOBAL EVENT DELEGATION
   ============================================================ */
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-search]')) {
    searchInput.value = ''; renderSearch(''); openOverlay(search); return;
  }
  if (e.target.closest('[data-cart]')) { renderCart(); openOverlay(cartDrawer); return; }
  const quick = e.target.closest('[data-quick]');
  if (quick) { openQuickView(quick.dataset.quick); return; }
  const closeBtn = e.target.closest('[data-close], .modal-close');
  if (closeBtn) {
    const panel = closeBtn.closest('.modal, .cart-drawer, .search');
    if (panel) closeOverlay(panel);
    else setMenu(false);
    return;
  }
  const media = e.target.closest('.card-media');
  if (media && !e.target.closest('button')) openQuickView(media.closest('.card').dataset.id);
});

/* ============================================================
   NEWSLETTER
   ============================================================ */
const newsletterForm = $('#newsletterForm');
newsletterForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#newsletterEmail');
  const email = input.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { input.focus(); return; }
  newsletterForm.style.display = 'none';
  const ok = $('#newsletterSuccess');
  ok.textContent = 'Welcome to the house. Your invitation is on its way.';
  ok.classList.add('show');
});

/* ============================================================
   SHOP PAGE — filters
   ============================================================ */
const shopGrid = $('#shopGrid');
const shopCount = $('#shopCount');
const filters = $$('.filter[data-filter]');

function applyFilter(name) {
  if (!shopGrid) return;
  let list = ALL_PRODUCTS;
  if (name && name !== 'All') {
    list = ALL_PRODUCTS.filter((p) => p.family === name || p.gender === name);
  }
  if (list.length === 0) {
    shopGrid.innerHTML = '<p class="search-empty">No creations in this family yet.</p>';
  } else {
    renderGrid(shopGrid, list, { shop: true });
  }
  shopCount.textContent = `${list.length} Fragrance${list.length === 1 ? '' : 's'} — Haute Collection`;
}
filters.forEach((f) => f.addEventListener('click', () => {
  filters.forEach((x) => x.classList.remove('is-active'));
  f.classList.add('is-active');
  applyFilter(f.dataset.filter);
}));

/* ============================================================
   ESC KEY
   ============================================================ */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  $$('.modal.open, .cart-drawer.open, .search.open').forEach(closeOverlay);
  setMenu(false);
});

/* ============================================================
   LIVE DATA — backend API
   When served by the Express server, the catalogue comes from
   /api/products, so admin-dashboard edits appear here instantly.
   If the server is unavailable, the built-in list above is used.
   ============================================================ */
async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('API responded with ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Invalid server response');
    ALL_PRODUCTS = data;   // live inventory from backend
    const active = document.querySelector('.filter.is-active');
    applyFilter(active ? active.dataset.filter : 'All');
    renderGrid($('#featuredGrid'), ALL_PRODUCTS.filter((p) => FEATURED_IDS.includes(p.id)));
    renderCart();
  } catch (err) {
    console.warn('Offline mode — using built-in catalogue fallback: ' + err.message);
  }
}

/* ============================================================
   INIT
   ============================================================ */
renderGrid($('#featuredGrid'), ALL_PRODUCTS.filter((p) => FEATURED_IDS.includes(p.id)));
applyFilter('All');
renderCart();
bumpCount();
observeReveals(document);
window.addEventListener('load', onScroll);
onScroll();
fetchProducts(); // refresh with live inventory from the backend (admin edits appear here)
/* ============================================================
   INTRO — opening logo reveal
   A short, luxurious brand opener: the house logo fades and
   scales in, then the overlay lifts away to reveal the page.
   Honours prefers-reduced-motion and never traps the visitor.
   ============================================================ */
(function () {
  const opener = document.getElementById('opener');
  if (!opener) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let revealed = false;

  document.body.classList.add('opener-lock'); // hold scroll during the brief reveal

  function reveal() {
    if (revealed) return;
    revealed = true;
    document.body.classList.remove('opener-lock');
    opener.classList.add('is-done');
    window.setTimeout(() => opener.remove(), 900);
  }

  if (reduceMotion.matches) { reveal(); return; }

  const startedAt = performance.now();
  const MIN_SHOW_MS = 1750; // 1.75s — logo reads, then gently fades away

  function finish() {
    window.setTimeout(reveal, Math.max(0, MIN_SHOW_MS - (performance.now() - startedAt)));
  }

  window.addEventListener('load', finish, { once: true }); // wait for images/assets
  window.setTimeout(finish, 3600);                         // hard cap — never traps the user
  window.addEventListener('pageshow', (e) => { if (e.persisted) finish(); });

  // Esc always lets the visitor in immediately
  document.addEventListener('keydown', function onKey(e) {
    if (e.key !== 'Escape') return;
    document.removeEventListener('keydown', onKey);
    finish();
  });
})();