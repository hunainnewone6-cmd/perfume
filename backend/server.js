/* ============================================================
   MAISON NÉRA — Backend API + Static Server
   Node.js + Express + JSON file storage (no database)
   CRUD: GET / POST / PUT / DELETE  (per e-book approach)
   ============================================================ */
'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------- Data file (JSON acts as our "database") ---------- */
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'products.json');

// Make sure the data folder + file exist
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}
ensureDataFile();

/* ---------- Helpers ---------- */
function readProducts() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    console.error('Could not read products.json:', err.message);
    return [];
  }
}

function writeProducts(products) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), 'utf8');
}

// Turn "Rose d'Ivoire" -> "rose-divoire" (clean URL ids)
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Auto next code, e.g. "N° 09"
function nextCode(products) {
  const n = products.length + 1;
  return 'N° ' + String(n).padStart(2, '0');
}

// Simple validation — price/stock must be non-negative numbers
function validate(body, partial) {
  const errors = [];
  if (!partial || body.name !== undefined) {
    if (!body.name || !String(body.name).trim()) errors.push('name is required');
  }
  ['price', 'stock'].forEach((key) => {
    if (!partial || body[key] !== undefined) {
      const v = Number(body[key]);
      if (!Number.isFinite(v) || v < 0) errors.push(key + ' must be a non-negative number');
    }
  });
  return errors;
}

/* ---------- Middleware ---------- */
app.use(cors());           // allow the dashboard / Live Server to call the API
app.use(express.json());   // JSON body parser

/* ============================================================
   API — routes
   ============================================================ */

// API info card
app.get('/api', (req, res) => {
  res.json({
    name: 'Maison Néra — API',
    status: 'ok',
    endpoints: [
      { method: 'GET',    path: '/api/products',        desc: 'List all fragrances' },
      { method: 'GET',    path: '/api/products/:id',    desc: 'Get one fragrance by id' },
      { method: 'POST',   path: '/api/products',        desc: 'Add a fragrance', body: '{ name, price, stock, family, gender, ... }' },
      { method: 'PUT',   path: '/api/products/:id',    desc: 'Update a fragrance' },
      { method: 'DELETE', path: '/api/products/:id',    desc: 'Delete a fragrance' }
    ]
  });
});

/* ===CHUNK2=== */

// READ — all products
app.get('/api/products', (req, res) => {
  res.json(readProducts());
});

// READ — single product by id
app.get('/api/products/:id', (req, res) => {
  const products = readProducts();
  const product = products.find((p) => String(p.id) === String(req.params.id));
  if (!product) return res.status(404).json({ message: 'Fragrance not found' });
  res.json(product);
});

// CREATE — add product
app.post('/api/products', (req, res) => {
  const products = readProducts();
  const errors = validate(req.body, false);
  if (errors.length) return res.status(400).json({ message: errors.join('; '), errors });

  const name = String(req.body.name || '').trim();
  let id = slugify(req.body.id || name) || ('product-' + Date.now());
  // keep ids unique
  const base = id;
  let i = 2;
  while (products.some((p) => p.id === id)) id = base + '-' + i++;

  const product = {
    id,
    code: String(req.body.code || '').trim() || nextCode(products),
    name,
    family: String(req.body.family || '').trim() || 'Oriental',
    gender: String(req.body.gender || '').trim() || 'Unisex',
    price: Number(req.body.price),
    stock: Number(req.body.stock || 0),
    img: String(req.body.img || '').trim(),
    desc: String(req.body.desc || '').trim(),
    top: String(req.body.top || '').trim(),
    heart: String(req.body.heart || '').trim(),
    base: String(req.body.base || '').trim()
  };
  products.push(product);
  writeProducts(products);
  res.status(201).json(product);
});

// UPDATE — edit product
app.put('/api/products/:id', (req, res) => {
  const products = readProducts();
  const index = products.findIndex((p) => String(p.id) === String(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Fragrance not found' });

  const errors = validate(req.body, true);
  if (errors.length) return res.status(400).json({ message: errors.join('; '), errors });

  const updated = { ...products[index], ...req.body, id: products[index].id };
  if (req.body.name !== undefined) updated.name = String(req.body.name).trim();
  if (req.body.price !== undefined) updated.price = Number(req.body.price);
  if (req.body.stock !== undefined) updated.stock = Number(req.body.stock);
  if (req.body.code !== undefined) updated.code = String(req.body.code).trim() || updated.code;

  products[index] = updated;
  writeProducts(products);
  res.json(updated);
});

// DELETE — remove product
app.delete('/api/products/:id', (req, res) => {
  const products = readProducts();
  const filtered = products.filter((p) => String(p.id) !== String(req.params.id));
  if (filtered.length === products.length) {
    return res.status(404).json({ message: 'Fragrance not found' });
  }
  writeProducts(filtered);
  res.json({ message: 'Fragrance deleted successfully' });
});

/* ===CHUNK3=== */

/* ============================================================
   STATIC — the storefront + admin dashboard
   ============================================================ */

// Do not expose the backend internals over static
app.use(['/backend', '/node_modules'], (req, res) => res.status(404).json({ message: 'Not found' }));

const ROOT = path.join(__dirname, '..');

app.get('/admin', (req, res) => res.sendFile(path.join(ROOT, 'admin', 'index.html')));
app.use(express.static(ROOT));   // serves index.html, shop.html, css/, js/, admin/

/* ---------- Boot ---------- */
app.listen(PORT, () => {
  console.log('┌─────────────────────────────────────────────────────');
  console.log('  Maison Néra — server chal raha hai (server running)');
  console.log(`  Storefront : http://localhost:${PORT}`);
  console.log(`  Admin Dash : http://localhost:${PORT}/admin`);
  console.log(`  API         : http://localhost:${PORT}/api/products`);
  console.log('└─────────────────────────────────────────────────────');
});