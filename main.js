import { createGlass } from './glass.js';
import { $, $$, esc, loadContent, waHref as wa, fmtTime, paintStatus } from './lib.js';

const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Snack photos that also exist at 1200px (the rest are 600px only; see README).
const HI_RES = new Set(['chemmen-unda', 'elayada', 'kallummakkaya', 'kunji-pathal', 'meen-pathal']);

const { menu, brand } = await loadContent();

const money = (n) => `${menu.currency}${n}`;
const waHref = (text) => wa(brand, text);

/* ---------- plain text bindings and links ---------- */

$$('[data-bind]').forEach((el) => { el.textContent = get(brand, el.dataset.bind) ?? ''; });
$$('[data-wa]').forEach((a) => { a.href = waHref(`${brand.whatsapp.greeting}\n`); a.target = '_blank'; a.rel = 'noopener'; });
$$('[data-call]').forEach((a) => { a.href = `tel:${brand.phone.tel}`; });
$$('[data-call-text]').forEach((el) => { el.textContent = `Call ${brand.phone.display}`; });
$$('[data-directions]').forEach((a) => { a.href = brand.address.directions; });
$$('[data-instagram]').forEach((a) => { a.href = brand.instagram.url; a.textContent = `Instagram ${brand.instagram.handle}`; });
$$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
$('[data-address]').innerHTML = brand.address.lines.map(esc).join('<br>');
$('[data-salk-body]').innerHTML = brand.salkaaram.body.map((p) => `<p>${esc(p)}</p>`).join('');
$('[data-steps]').innerHTML = brand.pull.steps
  .map((s) => `<li><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('');

/* ---------- open now, from the hours ---------- */

function paintHours() {
  const s = paintStatus(brand);
  $('[data-hours]').innerHTML = brand.hours.map((h) => `
    <tr class="${h.day === s.day ? 'is-today' : ''}"><th scope="row">${h.day}</th><td>${fmtTime(h.open)} – ${fmtTime(h.close)}</td></tr>`).join('');
}
paintHours();
setInterval(paintHours, 60_000);

/* ---------- menu ---------- */

const groups = menu.groups;
const countItems = (g) => g.sections.reduce((n, s) => n + s.items.length, 0);
const total = groups.reduce((n, g) => n + countItems(g), 0);
$('[data-menu-note]').textContent = `${total} things we pour and fry, with prices in rupees.`;

$('[data-tabs]').innerHTML = groups.map((g) => `
  <li><a class="tab" href="#m-${g.id}" data-tab="${g.id}">${esc(g.title.replace(' salkaaram', ''))}${countItems(g) ? `<small>${countItems(g)}</small>` : ''}</a></li>`).join('');

const preorderText = 'Hi Malabar Chai Co., I would like to pre-order salkaaram.\nDate:\nHow many people:\nItems:';

function itemHTML(it) {
  return `
    <li class="item" id="i-${it.id}">
      <div>
        <span class="item-name">${esc(it.name)}</span>${it.signature ? '<span class="item-tag">House chai</span>' : ''}${it.ml ? `<span class="item-ml" lang="ml">${esc(it.ml)}</span>` : ''}
      </div>
      <span class="item-price">${money(it.price)}</span>
      ${it.desc ? `<p class="item-desc">${esc(it.desc)}</p>` : ''}
    </li>`;
}

$('[data-menu-list]').innerHTML = groups.map((g) => `
  <section class="group" id="m-${g.id}" data-group="${g.id}" aria-labelledby="mt-${g.id}">
    <header class="group-head">
      <h3 class="group-title" id="mt-${g.id}">${esc(g.title)}</h3>
      ${g.id !== 'preorder' ? `<p class="group-blurb">${esc(g.blurb)}</p>` : ''}
    </header>
    ${g.id === 'preorder' ? `
      <div class="preorder">
        <p>${esc(g.blurb)}</p>
        <a class="btn btn-primary" href="${waHref(preorderText)}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-wa"/></svg>Ask about a pre-order
        </a>
      </div>` : g.sections.map((s) => `
      ${s.title ? `<h4 class="section-title">${esc(s.title)}${s.note ? `<small>${esc(s.note)}</small>` : ''}</h4>` : ''}
      <ul class="items">${s.items.map(itemHTML).join('')}</ul>`).join('')}
  </section>`).join('');

/* phone bottom sheet: the whole menu, compact */
$('[data-sheet-chips]').innerHTML = groups.map((g) => `<button type="button" data-chip="${g.id}">${esc(g.title.replace(' salkaaram', ''))}</button>`).join('');
$('[data-sheet-list]').innerHTML = groups.map((g) => `
  <section class="sheet-group" id="s-${g.id}">
    <h3>${esc(g.title)}</h3>
    ${g.id === 'preorder'
      ? `<p class="sheet-note">${esc(g.blurb)}</p>`
      : g.sections.flatMap((s) => s.items).map((it) => `<div class="sheet-row"><span>${esc(it.name)}</span><span>${money(it.price)}</span></div>`).join('')}
  </section>`).join('');

/* ---------- salkaaram strip ---------- */

const snacks = groups.filter((g) => g.id === 'sweet' || g.id === 'savoury')
  .flatMap((g) => g.sections.flatMap((s) => s.items)).filter((it) => it.photo);
$('[data-strip]').innerHTML = snacks.map((it) => {
  const base = `assets/snacks/${it.photo}`;
  const srcset = HI_RES.has(it.photo) ? ` srcset="${base}-600.webp 600w, ${base}-1200.webp 1200w" sizes="250px"` : '';
  return `
    <li><figure style="margin:0">
      <img src="${base}-600.webp"${srcset} alt="${esc(it.name)}" loading="lazy" decoding="async" width="600" height="750">
      <figcaption>${esc(it.name)}<span class="strip-price">${money(it.price)}</span>${it.ml ? `<span class="strip-ml" lang="ml">${esc(it.ml)}</span>` : ''}</figcaption>
    </figure></li>`;
}).join('');

/* ---------- stories ---------- */

const stories = brand.stories.items;
$('[data-stories]').innerHTML = stories.map((s) => `
  <li>
    <button class="story-card" type="button" data-story="${s.id}" aria-haspopup="dialog">
      <img src="${s.image}" alt="" loading="lazy" decoding="async">
      <span class="story-card-text">
        <span class="story-card-title">${esc(s.title)}</span>
        <span class="story-card-teaser">${esc(s.teaser)}</span>
        <span class="read">Read the story</span>
      </span>
    </button>
  </li>`).join('');

/* ---------- sheets ---------- */

const menuSheet = $('#menu-sheet');
const storySheet = $('#story-sheet');

function openSheet(dlg) {
  dlg.showModal();
  document.documentElement.style.overflow = 'hidden';
}
[menuSheet, storySheet].forEach((dlg) => {
  dlg.addEventListener('close', () => { document.documentElement.style.overflow = ''; });
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
});

$('[data-sheet-chips]').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-chip]');
  if (!chip) return;
  const body = $('[data-sheet-list]');
  const target = $(`#s-${chip.dataset.chip}`);
  body.scrollTo({ top: body.scrollTop + target.getBoundingClientRect().top - body.getBoundingClientRect().top, behavior: 'smooth' });
  $$('[data-chip]').forEach((c) => c.setAttribute('aria-current', String(c === chip)));
});

$('[data-stories]').addEventListener('click', (e) => {
  const card = e.target.closest('[data-story]');
  if (!card) return;
  const s = stories.find((x) => x.id === card.dataset.story);
  $('[data-story-body]').innerHTML = `
    <img src="${s.image}" alt="">
    <h2 id="story-title">${esc(s.title)}</h2>
    ${s.body.map((p) => `<p>${esc(p)}</p>`).join('')}`;
  openSheet(storySheet);
});

/* ---------- glasses ---------- */

const mark = { ink: 'assets/brand/wordmark-ink.png', light: 'assets/brand/wordmark-white.png' };
const glass = {
  hero: createGlass({ wordmark: mark, steam: true, label: 'A full glass of Malabar Chai Co. chai, steaming' }),
  pull: createGlass({ wordmark: mark, label: 'The glass filling with pulled chai' }),
  menu: createGlass({ wordmark: mark, label: 'Tea level showing how much of the menu is left' }),
  rail: createGlass({ wordmark: mark }),
  fab: createGlass(),
};
Object.entries(glass).forEach(([k, g]) => $(`[data-glass="${k}"]`).append(g.el));

const fab = $('[data-fab]');
$$('[data-open-menu]').forEach((b) => b.addEventListener('click', () => {
  const current = $('.tab[aria-current="true"]')?.dataset.tab ?? groups[0].id;
  openSheet(menuSheet);
  $$('[data-chip]').forEach((c) => c.setAttribute('aria-current', String(c.dataset.chip === current)));
  const body = $('[data-sheet-list]');
  const target = $(`#s-${current}`);
  body.scrollTop += target.getBoundingClientRect().top - body.getBoundingClientRect().top;
}));

/* active category: tabs, the label under the glass */
const label = $('[data-glass-label]');
function setActive(id) {
  $$('[data-tab]').forEach((t) => t.setAttribute('aria-current', String(t.dataset.tab === id)));
  const g = groups.find((x) => x.id === id);
  label.innerHTML = `${esc(g.title)}<small>The tea drains as you read.</small>`;
  const tab = $(`[data-tab="${id}"]`);
  const bar = tab.closest('.tabs');
  if (bar.scrollWidth > bar.clientWidth) {
    bar.scrollTo({ left: tab.parentElement.offsetLeft - 16, behavior: 'smooth' });
  }
}
setActive(groups[0].id);
const groupObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.dataset.group); });
}, { rootMargin: '-40% 0px -59% 0px' });
$$('[data-group]').forEach((g) => groupObserver.observe(g));

/* The floating glass (phones) shows between sections only: not over the hero,
   not in the menu (where it docks into the tab bar), not over Visit's own buttons. */
const inView = new Map();
const fabIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => inView.set(e.target, e.isIntersecting));
  fab.classList.toggle('is-shown', ![...inView.values()].some(Boolean));
}, { rootMargin: '0px 0px -80px 0px' });
['.hero', '#menu', '#visit', '.foot'].forEach((sel) => fabIO.observe($(sel)));

/* ---------- scroll motion ---------- */

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const { gsap, ScrollTrigger } = window;

function menuLevel(p) {
  const v = 1 - p;
  glass.menu.setLevel(v);
  glass.rail.setLevel(v);
  glass.fab.setLevel(v);
}

if (!reduceMotion.matches && gsap && ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('motion');

  // The pull: the glass fills while the three steps light up.
  const stream = $('.stream');
  const steps = $$('[data-steps] li');
  const pull = { p: 0 };
  const paintPull = () => {
    const p = pull.p;
    glass.pull.setLevel((p - 0.1) / 0.7);
    const pouring = p > 0.04 && p < 0.84;
    const s = clamp01((p - 0.04) / 0.08);
    stream.style.opacity = pouring ? 1 : 0;
    stream.style.transform = `scaleY(${s.toFixed(3)})`;
    const at = p < 0.3 ? 0 : p < 0.6 ? 1 : 2;
    steps.forEach((li, i) => li.classList.toggle('is-on', i <= at));
  };
  paintPull();
  gsap.to(pull, {
    p: 1, ease: 'none', onUpdate: paintPull,
    scrollTrigger: { trigger: '#pull', start: 'top top', end: 'bottom bottom', scrub: 0.6 },
  });

  // The menu: the glass drains as you move through it.
  const drain = { p: 0 };
  gsap.to(drain, {
    p: 1, ease: 'none', onUpdate: () => menuLevel(drain.p),
    scrollTrigger: { trigger: '[data-menu-list]', start: 'top 55%', end: 'bottom 55%', scrub: 0.5 },
  });

  // Salkaaram: the photo strip drifts sideways on larger screens.
  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    const strip = $('.strip');
    const track = $('.strip-track');
    strip.classList.add('is-driven');
    const distance = () => {
      const cs = getComputedStyle(strip);
      const inner = strip.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      return -Math.max(0, track.scrollWidth - inner);
    };
    gsap.fromTo(track, { x: 0 }, {
      x: distance, ease: 'none',
      scrollTrigger: { trigger: strip, start: 'top 90%', end: 'bottom 10%', scrub: 0.6, invalidateOnRefresh: true },
    });
    return () => strip.classList.remove('is-driven');
  });

  const refresh = () => ScrollTrigger.refresh();
  document.fonts?.ready.then(refresh);
  addEventListener('load', refresh);
} else {
  // Reduced motion or no GSAP: every glass stays full and still.
  glass.pull.setLevel(1);
  menuLevel(0);
}
