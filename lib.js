// Helpers shared by the main site (main.js) and the table order page (order/order.js).

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function loadContent(base = '') {
  const [menu, brand] = await Promise.all([
    fetch(`${base}content/menu.json`).then((r) => r.json()),
    fetch(`${base}content/brand.json`).then((r) => r.json()),
  ]);
  return { menu, brand };
}

export const waHref = (brand, text) => `https://wa.me/${brand.whatsapp.number}?text=${encodeURIComponent(text)}`;

/* ---------- opening hours ---------- */

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const toMins = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

export function fmtTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'am' : 'pm'}`;
}

function shopNow(timezone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: timezone, weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).map((p) => [p.type, p.value]),
  );
  return { day: parts.weekday, mins: Number(parts.hour) * 60 + Number(parts.minute) };
}

// { open, text, day } for the shop's own timezone, whatever the visitor's clock says.
export function shopStatus(brand) {
  const { day, mins } = shopNow(brand.timezone);
  const today = brand.hours.find((h) => h.day === day);
  if (today && mins >= toMins(today.open) && mins < toMins(today.close)) {
    return { open: true, text: `Open now · until ${fmtTime(today.close)}`, day };
  }
  if (today && mins < toMins(today.open)) {
    return { open: false, text: `Closed · opens today at ${fmtTime(today.open)}`, day };
  }
  const next = brand.hours.find((h) => h.day === DAYS[(DAYS.indexOf(day) + 1) % 7]);
  return { open: false, text: `Closed · opens tomorrow at ${fmtTime(next.open)}`, day };
}

export function paintStatus(brand) {
  const s = shopStatus(brand);
  $$('[data-status]').forEach((el) => {
    el.classList.toggle('is-open', s.open);
    $('.status-text', el).textContent = s.text;
  });
  return s;
}
