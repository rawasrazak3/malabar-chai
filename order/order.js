import { createGlass } from '../glass.js';
import { $, $$, esc, loadContent, waHref, paintStatus, shopStatus } from '../lib.js';

const FULL_GLASS_AT = 400; // cart total (₹) at which the glass reads full

const { menu, brand } = await loadContent('../');
const money = (n) => `${menu.currency}${n}`;

const tableParam = new URLSearchParams(location.search).get('table');
const table = /^\d{1,3}$/.test(tableParam ?? '') ? Number(tableParam) : null;
$('[data-table]').textContent = table ? `Table ${table}` : 'Order';
document.title = `${table ? `Table ${table}` : 'Order'} · Malabar Chai Co.`;

// Table orders cover what is on the counter today, so pre-order is left out.
const groups = menu.groups.filter((g) => g.sections.length);
const items = new Map(groups.flatMap((g) => g.sections.flatMap((s) => s.items)).map((it) => [it.id, it]));

/* ---------- cart, kept for this tab only ---------- */

const storeKey = `mcc-order-${table ?? 'none'}`;
let cart = new Map();
let note = '';
try {
  const saved = JSON.parse(sessionStorage.getItem(storeKey) || '{}');
  cart = new Map(Object.entries(saved.cart || {}).filter(([id, q]) => items.has(id) && q > 0));
  note = saved.note || '';
} catch { /* storage unavailable: start empty */ }

function save() {
  try { sessionStorage.setItem(storeKey, JSON.stringify({ cart: Object.fromEntries(cart), note })); } catch { /* ignore */ }
}

const count = () => [...cart.values()].reduce((a, b) => a + b, 0);
const total = () => [...cart].reduce((sum, [id, q]) => sum + items.get(id).price * q, 0);

function setQty(id, q) {
  if (q <= 0) cart.delete(id); else cart.set(id, Math.min(q, 99));
  save();
  paint(id);
}

/* ---------- render ---------- */

$('[data-tabs]').innerHTML = groups.map((g) => `
  <li><a class="tab" href="#o-${g.id}" data-tab="${g.id}">${esc(g.title.replace(' salkaaram', ''))}</a></li>`).join('');

const stepper = (it) => `<div class="o-step" data-step="${it.id}"></div>`;

$('[data-list]').innerHTML = groups.map((g) => `
  <section class="o-group" id="o-${g.id}" data-group="${g.id}" aria-labelledby="og-${g.id}">
    <h2 class="o-group-title" id="og-${g.id}">${esc(g.title)}</h2>
    ${g.sections.map((s) => `
      ${s.title ? `<h3 class="section-title">${esc(s.title)}${s.note ? `<small>${esc(s.note)}</small>` : ''}</h3>` : ''}
      <ul class="o-items">${s.items.map((it) => `
        <li class="o-item">
          <div class="o-item-text">
            <span class="item-name">${esc(it.name)}</span>
            ${it.ml ? `<span class="item-ml" lang="ml">${esc(it.ml)}</span>` : ''}
            <span class="o-price">${money(it.price)}</span>
          </div>
          ${stepper(it)}
        </li>`).join('')}
      </ul>`).join('')}
  </section>`).join('');

function stepHTML(id) {
  const q = cart.get(id) || 0;
  const name = esc(items.get(id).name);
  if (!q) return `<button class="o-add" type="button" data-add="${id}" aria-label="Add ${name}">Add</button>`;
  return `
    <button class="o-btn" type="button" data-dec="${id}" aria-label="One less ${name}"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-minus"/></svg></button>
    <span class="o-qty" aria-label="${q} ${name}">${q}</span>
    <button class="o-btn" type="button" data-inc="${id}" aria-label="One more ${name}"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-plus"/></svg></button>`;
}

const glass = createGlass({ label: 'Your order' });
$('[data-glass="bar"]').append(glass.el);

function orderText() {
  const lines = [...cart].map(([id, q]) => {
    const it = items.get(id);
    return `${q} x ${it.name} — ${money(it.price * q)}`;
  });
  return [
    `New order${table ? ` · Table ${table}` : ''}`,
    '',
    ...lines,
    '',
    `Total: ${money(total())}`,
    note.trim() ? `Note: ${note.trim()}` : null,
  ].filter((l) => l !== null).join('\n');
}

function paintCart() {
  $('[data-cart]').innerHTML = [...cart].map(([id, q]) => {
    const it = items.get(id);
    return `
      <li class="o-cart-row">
        <span class="o-cart-name">${esc(it.name)}<small>${money(it.price)} each</small></span>
        <div class="o-step">${stepHTML(id)}</div>
        <span class="o-cart-sum">${money(it.price * q)}</span>
      </li>`;
  }).join('') || '<li class="o-empty">Nothing yet. Close this and tap Add.</li>';
  $('[data-total]').textContent = money(total());
  const send = $('[data-send]');
  send.href = waHref(brand, orderText());
  send.toggleAttribute('aria-disabled', cart.size === 0);
  send.classList.toggle('is-disabled', cart.size === 0);
}

function paint(changedId) {
  const ids = changedId ? [changedId] : [...items.keys()];
  ids.forEach((id) => {
    const el = $(`[data-step="${id}"]`);
    if (el) el.innerHTML = stepHTML(id);
  });
  const n = count();
  $('[data-bar-sum]').innerHTML = n
    ? `<strong>${n} ${n === 1 ? 'item' : 'items'}</strong> · ${money(total())}`
    : 'Your glass is empty';
  $('[data-review]').disabled = n === 0;
  glass.setLevel(total() / FULL_GLASS_AT);
  paintCart();
}

/* ---------- events ---------- */

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-add],[data-inc],[data-dec]');
  if (!t) return;
  const id = t.dataset.add || t.dataset.inc || t.dataset.dec;
  const q = cart.get(id) || 0;
  setQty(id, t.dataset.dec ? q - 1 : q + 1);
  // keep focus on the stepper that replaced the button
  const again = $(`[data-step="${id}"] [data-inc], [data-step="${id}"] [data-add]`);
  if (again && !t.closest('dialog')) again.focus({ preventScroll: true });
});

const sheet = $('#cart');
$('[data-review]').addEventListener('click', () => {
  const s = shopStatus(brand);
  const closed = $('[data-closed]');
  closed.hidden = s.open;
  closed.textContent = s.open ? '' : `We are closed right now (${s.text.replace('Closed · ', '')}). You can still send this and we will reply when we open.`;
  sheet.showModal();
  document.documentElement.style.overflow = 'hidden';
});
sheet.addEventListener('close', () => { document.documentElement.style.overflow = ''; });
sheet.addEventListener('click', (e) => { if (e.target === sheet || e.target.closest('[data-close]')) sheet.close(); });
$('[data-send]').addEventListener('click', (e) => { if (!cart.size) e.preventDefault(); });

const noteField = $('[data-note]');
noteField.value = note;
noteField.addEventListener('input', () => { note = noteField.value; save(); $('[data-send]').href = waHref(brand, orderText()); });

/* active tab while scrolling */
const tabsBar = $('[data-tabs]');
const groupObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const id = e.target.dataset.group;
    $$('[data-tab]').forEach((t) => t.setAttribute('aria-current', String(t.dataset.tab === id)));
    const tab = $(`[data-tab="${id}"]`).parentElement;
    tabsBar.scrollTo({ left: tab.offsetLeft - 16, behavior: 'smooth' });
  });
}, { rootMargin: '-30% 0px -69% 0px' });
$$('[data-group]').forEach((g) => groupObserver.observe(g));

paintStatus(brand);
setInterval(() => paintStatus(brand), 60_000);
paint();
