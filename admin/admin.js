/* ============================================================
   MAISON NERA - Atelier Dashboard | Admin logic
   CRUD per e-book: loadProducts / addProduct / updateProduct /
   deleteProduct + toasts + confirmations + validation
   ============================================================ */
'use strict';

const API = '/api/products';
const ADMIN_PASSWORD = 'admin123';   // change this to your own secret
const SESSION_KEY = 'nera_admin_session';

/* ---------- Tiny DOM helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- Escape HTML (protect against names with < > & ") ---------- */
function esc(str) {
  return String(str ?? '' )
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------- Unsplash image helper ---------- */
const imgSrc = (id, w = 96) =>
  id ? `https://images.unsplash.com/photo-${esc(id)}?q=70&w=${w}&auto=format&fit=crop`
   : null;

/* ---------- Toast messages (e-book Step 7 ---------- */
function showToast(message, type = 'success') {
  // remove old toasts so they never stack
  $$('.toast').forEach((t) => t.remove());
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

/* ---------- Auth gate ---------- */
function showLogin() {
  $('#loginView').classList.remove('hidden');
  $('#appView').classList.add('hidden');
}
function showApp() {
  $('#loginView').classList.add('hidden');
  $('#appView').classList.remove('hidden');
  loadProducts();
}
function checkAuth() {
  if (sessionStorage.getItem(SESSION_KEY) === '1') showApp();
  else showLogin();
}

const loginForm = $('#loginForm');
const loginError = $('#loginError');
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const value = $('#loginPassword').value.trim();
  if (value === ADMIN_PASSWORD) {
    loginError.textContent = '';
    sessionStorage.setItem(SESSION_KEY, '1');
    document.body.classList.add('admin-authed');
    showApp();
  } else {
    loginError.textContent = 'Incorrect password. Please try again.';
    $('#loginPassword').value = '';
    $('#loginPassword').focus();
  }
});

$('#logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem(SESSION_KEY);
  location.reload();
});

/* ---------- State ---------- */
let ALL = [];
let editingId = null;

/* ---------- Stock helpers ---------- */
function stockMeta(stock) {
  const n = Number(stock) || 0;
  if (n <= 0) return { label: 'Out of stock', cls: 'badge-out' };
  if (n < 10) return { label: 'Low stock', cls: 'badge-low' };
  return { label: 'In stock', cls: 'badge-ok' };
}

/* ---------- Load + render (e-book Steps  5-6 ---------- */
async function loadProducts() {
  const tbody = $('#productBody');
  tbody.innerHTML = '<tr><td colspan="7" class="state-msg">Loading the collection&hellip;</td></tr>';
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error('API responded with ' + res.status);
    ALL = await res.json();
    renderProducts(getFiltered());
    renderStats();
  } catch (err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="7" class="state-msg state-empty">Could not reach the API &mdash; is the server running?</td></tr>';
    showToast('Error: ' + err.message, 'error');
  }
}

function getFiltered() {
  const q = $('#searchInput').value.trim().toLowerCase();
  const fam = $('#familyFilter').value;
  return ALL.filter((p) => {
    const matchFam = !fam || p.family === fam;
    const hay = (p.name + ' ' + p.code + ' ' + p.family + ' ' + p.gender + ' ' + p.desc + ' ' + p.top + ' ' + p.heart + ' ' + p.base).toLowerCase();
    const matchQ = !q || hay.includes(q);
    return matchFam && matchQ;
  });
}

function renderProducts(list) {
  const tbody = $('#productBody');
  if (!list || list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="state-msg state-empty">No fragrances found.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map((p) => {
    const s = stockMeta(p.stock);
    const img = imgSrc(p.img);
    const thumb = img
      ? `<img class="p-thumb" src="${img}" alt="" loading="lazy">`
      : '<div class="p-thumb p-thumb--blank">&#9670;</div>';
    return `
      <tr data-id="${esc(p.id)}">
        <td>
          <div class="p-cell">
            ${thumb}
            <div class="p-meta">
              <span class="p-name">${esc(p.name)}</span>
              <span class="p-code">${esc(p.code)}</span>
            </div>
          </div>
        </td>
        <td>${esc(p.family)}</td>
        <td>${esc(p.gender)}</td>
        <td class="td-num">$${Number(p.price).toLocaleString('en-US')}</td>
        <td class="td-num">${Number(p.stock)}</td>
        <td><span class="badge ${s.cls}">${s.label}</span></td>
        <td class="td-actions">
          <button class="btn-edit" data-edit="${esc(p.id)}">Edit</button>
          <button class="btn-del" data-del="${esc(p.id)}">Del</button>
        </td>
      </tr>`;
  }).join('');
}

function renderStats() {
  const total = ALL.length;
  const bottles = ALL.reduce((a, p) => a + (Number(p.stock) || 0), 0);
  const low = ALL.filter((p) => (Number(p.stock) || 0) < 10).length;
  const value = ALL.reduce((a, p) => a + (Number(p.price) || 0) * (Number(p.stock) || 0), 0);
  $('#statTotal').textContent = total;
  $('#statBottles').textContent = bottles.toLocaleString('en-US');
  $('#statLow').textContent = low;
  $('#statValue').textContent = '$' + Math.round(value).toLocaleString('en-US');
}

/* ---------- Modal (e-book Step 6 ---------- */
const modal = $('#modal');
const form = $('#productForm');

function openModal(product) {
  editingId = product ? product.id : null;
  $('#modalTitle').textContent = product
    ? 'Edit Fragrance - ' + product.code
    : 'Add Fragrance';
  $('#name').value = product ? product.name : '';
  $('#code').value = product ? product.code : '';
  $('#price').value = product ? product.price : '';
  $('#stock').value = product ? product.stock : '';
  $('#family').value = product ? product.family : 'Oriental';
  $('#gender').value = product ? product.gender : 'For Her';
  $('#img').value = product ? product.img : '';
  $('#desc').value = product ? product.desc : '';
  $('#top').value = product ? product.top : '';
  $('#heart').value = product ? product.heart : '';
  $('#base').value = product ? product.base : '';
  modal.classList.remove('hidden');
  $('#name').focus();
}

function closeModal() {
  modal.classList.add('hidden');
  form.reset();
  editingId = null;
}

$('#addBtn').addEventListener('click', () => openModal(null));
$('#cancelBtn').addEventListener('click', closeModal);
$('#cancelBtn2').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
});

/* ---------- CRUD via the API ---------- */
async function api(method, url, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    let msg = 'Request failed with ' + res.status;
    try { const data = await res.json(); if (data && data.message) msg = data.message; } catch (e) { /* ignore */ }
    throw new Error(msg);
  }
  return res.json();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();   // never let the page reload!
  const wasEdit = editingId !== null;
  const payload = {
    name: $('#name').value.trim(),
    code: $('#code').value.trim(),
    price: Number($('#price').value),
    stock: Number($('#stock').value),
    family: $('#family').value,
    gender: $('#gender').value,
    img: $('#img').value.trim(),
    desc: $('#desc').value.trim(),
    top: $('#top').value.trim(),
    heart: $('#heart').value.trim(),
    base: $('#base').value.trim()
  };
  if (!payload.name) return showToast('Name is required', 'error');
  if (!Number.isFinite(payload.price) || payload.price < 0) return showToast('Price must be a non-negative number', 'error');
  if (!Number.isFinite(payload.stock) || payload.stock < 0) return showToast('Stock must be a non-negative number', 'error');
  try {
    if (wasEdit) {
      await api('PUT', API + '/' + encodeURIComponent(editingId), payload);
      showToast('Fragrance updated successfully', 'success');
    } else {
      await api('POST', API, payload);
      showToast('Fragrance added to the collection', 'success');
    }
    closeModal();
    await loadProducts();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
});

/* ---------- Edit / Delete (event delegation ---------- */
document.addEventListener('click', async (e) => {
  const editBtn = e.target.closest('[data-edit]');
  if (editBtn) {
    const id = editBtn.dataset.edit;
    const p = ALL.find((x) => x.id === id);
    if (p) openModal(p);
    return;
  }
  const delBtn = e.target.closest('[data-del]');
  if (delBtn) {
    const id = delBtn.dataset.del;
    const p = ALL.find((x) => x.id === id);
    const ok = confirm(`Delete "${p ? p.name : 'this fragrance'}" permanently?`);
    if (!ok) return;
    try {
      await api('DELETE', API + '/' + encodeURIComponent(id));
      showToast('Fragrance deleted successfully', 'success');
      await loadProducts();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
    return;
  }
});

/* ---------- Search + filter (frontend only, per notes ---------- */
$('#searchInput').addEventListener('input', () => renderProducts(getFiltered()));
$('#familyFilter').addEventListener('change', () => renderProducts(getFiltered()));

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});