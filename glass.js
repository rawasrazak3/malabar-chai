// The chai glass: a tapered, ribbed tea-shop glass drawn in SVG with a
// settable tea level (0 = empty, 1 = full). Stands in for the photographic
// glass-*.png states until step 5 of the plan produces them.

let uid = 0;

// Inner cavity the tea can fill, in viewBox units.
const CAVITY = 'M17 16 L183 16 L160 240 L40 240 Z';
const OUTER = 'M10 10 L190 10 L163 262 Q162 268 156 268 L44 268 Q38 268 37 262 Z';
const BASE = 'M40 240 L160 240 L163 262 Q162 268 156 268 L44 268 Q38 268 37 262 Z';
const TRAVEL = 222; // how far the tea drops between full and empty

function ribs(count) {
  let light = '';
  let dark = '';
  for (let i = 1; i < count; i++) {
    const t = i / count;
    const x1 = 10 + 180 * t;
    const x2 = 38 + 124 * t;
    light += `M${x1.toFixed(1)} 14 L${x2.toFixed(1)} 262 `;
    dark += `M${(x1 + 3.2).toFixed(1)} 14 L${(x2 + 2.2).toFixed(1)} 262 `;
  }
  return { light, dark };
}

// wordmark: { ink, light } image paths. Ink shows where tea is behind it, light over empty glass.
export function createGlass({ wordmark = null, steam = false, label = 'Glass of chai' } = {}) {
  const id = `g${++uid}`;
  const r = ribs(12);
  const top = steam ? -78 : 0;
  const wrap = document.createElement('div');
  wrap.className = 'glass';
  wrap.innerHTML = `
<svg viewBox="0 ${top} 200 ${282 - top}" role="img" aria-label="${label}">
  <defs>
    <clipPath id="${id}-cav"><path d="${CAVITY}"/></clipPath>
    <clipPath id="${id}-wet"><rect class="glass-clip" x="0" y="20" width="200" height="260"/></clipPath>
    <clipPath id="${id}-dry"><rect class="glass-clip" x="0" y="-240" width="200" height="260"/></clipPath>
    <linearGradient id="${id}-tea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#C79766"/>
      <stop offset=".45" stop-color="#A9764A"/>
      <stop offset="1" stop-color="#855634"/>
    </linearGradient>
    <linearGradient id="${id}-froth" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F3E8D4"/>
      <stop offset="1" stop-color="#D8BC93"/>
    </linearGradient>
    <linearGradient id="${id}-round" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".22"/>
      <stop offset=".3" stop-color="#fff" stop-opacity=".10"/>
      <stop offset=".55" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".24"/>
    </linearGradient>
    <radialGradient id="${id}-glow" cx=".72" cy=".55" r=".5">
      <stop offset="0" stop-color="#FFC27A" stop-opacity=".38"/>
      <stop offset="1" stop-color="#FFC27A" stop-opacity="0"/>
    </radialGradient>
    <filter id="${id}-blur" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <ellipse class="glass-shadow" cx="100" cy="271" rx="74" ry="5" filter="url(#${id}-blur)"/>
  <path class="glass-body" d="${OUTER}"/>
  <g clip-path="url(#${id}-cav)">
    <g class="glass-tea">
      <rect x="0" y="30" width="200" height="240" fill="url(#${id}-tea)"/>
      <rect x="0" y="30" width="200" height="240" fill="url(#${id}-glow)"/>
      <rect x="0" y="20" width="200" height="14" fill="url(#${id}-froth)"/>
      <rect x="0" y="33" width="200" height="2" fill="#B98A5C" opacity=".6"/>
      <g fill="#FBF4E6" opacity=".75">
        <circle cx="46" cy="25" r="1.6"/><circle cx="71" cy="23" r="1.1"/><circle cx="118" cy="26" r="1.4"/>
        <circle cx="150" cy="24" r="1.8"/><circle cx="166" cy="27" r="1"/><circle cx="92" cy="28" r="1"/>
      </g>
      <rect x="0" y="20" width="200" height="250" fill="url(#${id}-round)"/>
    </g>
  </g>
  <path class="glass-base" d="${BASE}"/>
  <path class="glass-rib-dark" d="${r.dark}"/>
  <path class="glass-rib" d="${r.light}"/>
  ${wordmark ? `<image class="glass-mark glass-mark--light" href="${wordmark.light}" x="46" y="98" width="108" height="30" clip-path="url(#${id}-dry)"/>
  <image class="glass-mark" href="${wordmark.ink}" x="46" y="98" width="108" height="30" clip-path="url(#${id}-wet)"/>` : ''}
  <path class="glass-shine" d="M22 22 L44 232 L50 232 L29 22 Z"/>
  <path class="glass-shine glass-shine--thin" d="M170 24 L152 228 L154.5 228 L173 24 Z"/>
  <path class="glass-edge" d="${OUTER}"/>
  <ellipse class="glass-rim" cx="100" cy="10" rx="90" ry="3.5"/>
  ${steam ? `<g class="glass-steam" aria-hidden="true">
    <path d="M78 2 C66 -18 90 -30 78 -52 C72 -62 80 -70 76 -76"/>
    <path d="M102 -2 C92 -22 114 -34 102 -56 C96 -66 104 -72 100 -78"/>
    <path d="M126 2 C116 -16 136 -28 126 -48 C121 -58 128 -64 124 -70"/>
  </g>` : ''}
</svg>`;

  // SVG transform attributes (not CSS) so the clip rects inside <clipPath> move too.
  const movers = [wrap.querySelector('.glass-tea'), ...wrap.querySelectorAll('.glass-clip')];
  let current = -1;

  function setLevel(level) {
    const v = Math.min(1, Math.max(0, level));
    if (Math.abs(v - current) < 0.001) return;
    current = v;
    const t = `translate(0 ${((1 - v) * TRAVEL).toFixed(2)})`;
    movers.forEach((m) => m.setAttribute('transform', t));
    wrap.style.setProperty('--level', v.toFixed(3));
  }

  setLevel(1);
  return { el: wrap, setLevel };
}
