# Malabar Chai Co. — site v1

Built from `MALABAR-CHAI-PLAN.md`. Plain HTML/CSS/JS, no build step.

## Run it

```
python3 -m http.server 8080
```

Open http://localhost:8080 and http://localhost:8080/order/?table=4 (it has to be served over http, because the pages fetch `content/*.json`).

## Files

| Path | What |
|---|---|
| `index.html`, `styles.css`, `main.js` | The site: hero, the pull, menu, salkaaram, origin of dishes, visit |
| `glass.js` | The chai glass (SVG) with a settable tea level. Used by both pages |
| `lib.js` | Shared helpers: content loading, WhatsApp links, open-now from the hours |
| `order/` | Table scan-and-order page. `?table=N` sets the table number |
| `content/menu.json` | 73 items with prices, read from the live menu PDF on 2026-09-29 |
| `content/brand.json` | Address, phone, WhatsApp, hours, the pull steps, the three dish stories |
| `assets/snacks/` | 19 snack photos, cropped to 4:5 (printed label removed), graded as one set |
| `assets/brand/` | Wordmarks (ink, white, froth, sage) and badge, made from the site's sharp logo file |
| `assets/source/` | Originals downloaded from malabarchaico.com |

To change a price or add an item, edit `content/menu.json`. Both pages update from it.

## Where this is against the plan

| Step | Status |
|---|---|
| 1 Set up | Node 20, Python 3.12, ffmpeg OK. **Higgsfield connector not connected** |
| 2 Install repos | **Not installed.** The Taste, Playwright CLI and Impeccable installs were blocked as third-party code. Run them yourself if you want them |
| 3 Real content | Done (menu, photos, logo, brand.json) |
| 4 Build v1 | Done. Glass is an SVG stand-in, not `ref-chai-glass.jpg` (its street background clashes with sage) |
| 5a/5b Glass images | Waiting on Higgsfield. When `glass-*.png` exist, swap them into `glass.js` |
| 5c Snack photos | Done, with the caveat below |
| 6 Pull clip | Waiting on Higgsfield. The pull section already scrubs: the glass fills with a pour stream as you scroll |
| 7 Check + /order | Done. Screenshots checked at 393px (iPhone 15), 900px and 1440px, light and dark, reduced motion |
| 8 Deploy, QR codes | Not done. QR codes need the final URL from Cloudflare Pages |

## Photos too small

14 of the 19 snack photos are only 500px on the live site (about 345×432 after cropping off the printed name), so they are upscaled to 600px and have no 1200px version. Ask the owner for originals of: bread pocket, carrot pola, chatti pathal, chicken roll, cutlet, irani pola, kai pola, kozhi ada, mutta mala, mutta pathal, patti pathal, pazham nirachathu, puffs, unnakaya. The dish-story photos for samosa and banana fry are 370px wide and look soft in the story sheet.

Items with no photo at all: elanchi, sammosa, irachi pathal, mutta porichath, egg bomb, elayada spicy, kalmas, kilikkoodu, aleesa, bun nirachath, chatti pathal (sweet), and every drink.

## Needs the owner before launch

- Every price (read from the PDF). Items marked `"confirm"` in `menu.json` have open questions (sweet or savoury, spelling, description)
- Cutlet: the website says vegetable, the menu PDF says chicken
- Which snacks are pre-order only, minimum quantity, notice needed
- Malayalam names, checked by someone who reads Malayalam
- The three dish stories and the three pull steps are **drafts written for this redesign**; the live site's story pages are Lorem Ipsum
- Real email (none is shown; the old site had `info@example.com`), Instagram link
- Their yes to use the name, logo and photos
