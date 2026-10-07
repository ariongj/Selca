# SELCA COMPANY â€” e-commerce + CMS demo

A complete, clickable demo of a new website for **SELCA COMPANY d.o.o.** (Montenegro) â€”
*Prodaja & ugradnja Â· Shitje & montim Â· Sve za vaÅ¡ dom / Ã‡do gjÃ« pÃ«r shtÃ«pinÃ« tuaj*.

- **Storefront** â€” landing page, catalogue with filters, product pages with an mÂ² calculator and installation add-on,
  cart, checkout (cash on delivery / bank transfer / simulated card), order confirmation, services, projects, about,
  contact, blog ("Savjeti"), CMS pages, search, wishlist.
- **CMS** (`/admin`) â€” dashboard with revenue charts, orders (status workflow, notes, printable invoice), customers,
  leads & measurement bookings, products (full editor: 3 languages, gallery, variants, specs, SEO), categories,
  coupons, media library with uploads, **homepage builder with live preview**, pages, blog, projects, settings
  (contact data, shipping zones, payments, languages, brand colour, export/import/reset).
- **Three languages everywhere** â€” Montenegrin (default), Albanian, English â€” on the site and in the CMS.

Everything runs in the browser (no backend needed for the demo). Data is stored in `localStorage` and every open tab
stays in sync, so an order placed on the storefront pops up in the CMS instantly.

## Run it

Requirements: Node.js 20.19+ (tested with Node 24).

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173 â€” the CMS is at http://localhost:5173/admin

**CMS demo login** (pre-filled on the login screen): `admin@selca.me` / `selca2026`

Production build (static files in `dist/`):

```bash
npm run build
```

```bash
npm run preview
```

## Deploy a shareable link

It is a static single-page app:

- **Vercel** â€” import the folder/repo, framework "Vite"; `vercel.json` already rewrites all routes to `index.html`.
- **Netlify** â€” build command `npm run build`, publish directory `dist`; `public/_redirects` handles routing.

Each visitor's browser keeps its own copy of the demo data.

## Before the meeting (2 minutes)

1. Open **/admin â†’ Postavke** and replace the placeholder contact/legal data (marked "Primjer"): phone, address, city,
   PIB, PDV, bank account, working hours. This is also a nice live demonstration of the CMS.
2. **Postavke â†’ Demo podaci â†’ Resetuj demo** â€” regenerates the demo orders and leads relative to today, so the
   dashboard charts look fresh.
3. Optional: put the storefront and `/admin` side by side in two browser windows for the live-order moment.

See `DEMO_SCRIPT.md` for a suggested walkthrough.

## What is placeholder

- Product range, prices and texts â€” a realistic "prodaja & ugradnja" catalogue (doors, windows, flooring, tiles,
  bathroom, kitchens); SELCA's Instagram is private and selcacompany.com currently doesn't resolve, so their real
  range couldn't be imported. Everything is editable in the CMS.
- Photos â€” Unsplash (see `CREDITS.md`).
- Orders, customers and leads â€” generated demo data (names/e-mails are fictional, `@example.com`).
- Phone, address, PIB/PDV, bank account â€” samples to be replaced in Settings.
- Card payment â€” simulated; no card data is collected.

## Path to production

| Demo | Production |
| --- | --- |
| `localStorage` data | Hosted database + API (e.g. Supabase/Postgres, or a headless commerce/CMS backend) |
| Demo login | Real authentication with roles (owner, sales, editor) |
| Simulated card payment | Payment gateway used in Montenegro (bank e-commerce gateway) |
| Client-side rendering | Server-side rendering / prerendering for SEO (product pages indexed in 3 languages) |
| Unsplash photos | SELCA's own product & project photography |
| â€” | Domain `selcacompany.com` (currently not resolving), e-mail notifications, Google Analytics, Meta pixel |

## Tech

Vite Â· React 19 Â· TypeScript Â· Tailwind CSS v4 Â· React Router 7 Â· Zustand Â· Motion Â· Recharts Â· Lucide icons Â·
Fraunces + Manrope fonts (self-hosted).

```
src/
  App.tsx              routes (storefront + /admin, CMS is code-split)
  lib/                 types, pricing (VAT, mÂ² packs, shipping zones, coupons), formatting, search
  i18n/                typed ME/SQ/EN dictionaries
  data/                seed catalogue, homepage sections, pages, posts, projects, demo-order generator
  store/               zustand stores (db = CMS data, ui = cart/lang/session) + cross-tab sync
  components/          UI kit, logo, icons
  site/                storefront layout, sections, pages
  admin/               CMS layout, components, pages
public/images/         optimised WebP photos (+ -sm thumbnails)
```

