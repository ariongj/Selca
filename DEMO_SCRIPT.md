# Meeting walkthrough — SELCA COMPANY demo (≈ 20 minutes)

**Links:** storefront https://ariongj.github.io/Selca/ · CMS https://ariongj.github.io/Selca/admin (login pre-filled — click "Hyr").
Locally: `npm run dev` → http://localhost:5173 and http://localhost:5173/admin.

**Setup:** two windows side by side — left the storefront, right the CMS. Beforehand, in the CMS open
**Konfigurimet → Të dhënat demo → Rivendos** (fresh demo data dated today) and fill in SELCA's real phone/address under
**Konfigurimet → Të përgjithshme** (fields marked "Shembull"). Each browser keeps its own demo data.

## 1. The website (4 min) — storefront
- Hero slideshow ("Sve za vaš dom."), SELCA roof logo and red brand, three languages in the top bar — switch to **Shqip**.
- Scroll: trust bar → six categories → bestsellers → autumn promo with countdown and coupon → how we work → services →
  projects → FAQ → Instagram (@selca_doo) → free-measurement booking form.
- Header and footer menus, banners and announcement bar all come from the CMS.

## 2. Shopping like a customer (4 min)
- Products → **Podovi**: filters (price, colour, on sale, with installation); collections (/kolekcija/…) and offer pages (/oferta/…).
- A laminate: gallery, **m² calculator** (34 m² → packs incl. 10 % waste), "dodaj ugradnju", live total, delivery tab.
- A kitchen: made-to-measure → **"Zatraži ponudu"** instead of add-to-cart.
- Cart: automatic discounts appear by themselves; enter `SELCA10` plus an invalid code — the cart explains why a code
  was refused. Checkout (pouzećem / uplata na račun / kartica) → confirmation.

## 3. The "wow" moment (1 min)
- The order appears **instantly** in the CMS window: notification bell, toast, the overview numbers update.
- The measurement request from the form lands in **Kontaktet** (unassigned) and as a pending booking in **Terminet**.

## 4. The CMS — following our proposal (8 min)
Neutral black/grey/white design and the navigation from the proposal; Albanian by default (ME/EN in the top bar);
global search with **Ctrl+K**.
- **Përmbledhje** — net sales, new orders, low stock, new contacts, recent orders with *separate* payment and fulfilment
  status, and **"Kërkojnë vëmendje"** (what the team should do now).
- **Porositë** — open the new order → "Përgatit dërgesën", partial refund, print the invoice; **Draftet** (phone orders)
  and **Kthimet** (return → approve → receive & restock → refund).
- **Produktet** — tabs active/draft/archived; product form with *Çmimi*, *Çmimi referues*, *Kosto / copë* (margin),
  variants & inventory; **Koleksionet** manual and with rules; **Inventari** and **Furnizimet**.
- **Zbritjet** — the four types (products, order, buy X get Y, free shipping), by code or automatic, combinations and
  schedule; use **"Provo me shportë shembull"** to show the calculation step by step (proposal p.26 examples).
- **Rritja → Ofertat** — one offer ties together the discount, the collection, the slides/banners and the landing page.
- **Online Store** — theme, **Slideshow & bannerë** with schedules, and the **Editori**: change the homepage as a draft,
  preview it, publish, and restore an older version.
- **Kontaktet** (assign to staff, B2B quotes) and **Terminet** (week calendar, no double bookings).
- **Account menu → "Shiko si: Recepsion"** — the menu shrinks to what that role may do; forbidden screens are blocked.
  Switch back to Pronar.
- **Konfigurimet** — its own space: staff & roles, payments, checkout, shipping, locations, languages, notification
  templates, privacy, activity log.

## 5. The roadmap (3 min) — **Harta e moduleve** (/admin/moduli)
- Which modules are already in the demo, which come in phase 2, which on request.
- The acceptance criteria from the proposal and which ones the demo already proves.
- The open decisions for SELCA (pilot scope, promotion policy, payment/courier/fiscalisation integrations, appointments).

## 6. Close
- Everything shown is editable by SELCA's own staff, in Albanian or Montenegrin.
- Production version: their own domain, real product photos, a Montenegrin card-payment gateway and EFI fiscalisation,
  courier integration, e-mail notifications, Google indexing in three languages, real accounts with roles and audit.

Tip: if anything gets messy during the demo — **Konfigurimet → Të dhënat demo → Rivendos** restores everything.
