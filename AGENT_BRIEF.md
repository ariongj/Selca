# SELCA demo — shared brief for parallel agents

Project root: `C:\Users\A\Documents\SELCA MNE OPUS` (Windows; Bash is Git Bash, PowerShell also available).
A bilingual (Montenegrin + Albanian, plus English) e-commerce + CMS **sales demo** for SELCA COMPANY d.o.o. — a home-improvement
company in Montenegro ("Prodaja & ugradnja / Shitje & montim — Sve za vaš dom / Çdo gjë për shtëpinë tuaj"): doors, windows,
flooring, tiles, bathroom, made-to-measure kitchens, with measurement + installation services. It will be presented to the
client in a meeting, so it must look **polished and premium**. Everything runs client-side (data persisted to localStorage).

## Stack
Vite 8, React 19, TypeScript (strict, `noUnusedLocals`), Tailwind CSS v4 (CSS-first config in `src/index.css`; important
modifier goes at the END: `opacity-0!`), react-router 7 (`import { Link, useNavigate, useParams, useSearchParams } from 'react-router'`),
zustand 5, motion 12 (`import { motion, AnimatePresence } from 'motion/react'`), lucide-react 0.577 icons, recharts 3, sonner (`toast`).
Path alias `@/` → `src/`. Page components use **default export**.

## Design tokens (src/index.css)
Colours: `brand-50…900` (SELCA roof red, 600 = #9a2e2e, overridable at runtime), `ink` (#1c1a17 text), `ink-soft`, `muted`,
`paper` (#f7f3ee page bg), `sand`, `sand-2`, `line` (borders), `oak`, `sage`, `canvas` (admin bg).
Fonts: `font-sans` = Manrope (UI), `font-display` = Fraunces serif — use the `.display` class for big serif headings.
Utilities/classes: `container-x`, `eyebrow`, `card`, `link-u`, `prose-cms`, `no-scrollbar`, `bg-grain`, `skeleton`,
animations `animate-fade-up`, `animate-fade-in`, `animate-pop`.
Storefront style: warm paper/sand backgrounds, ink text, brand-red accents, generous whitespace, rounded-2xl/3xl images, serif
display headings with *italic accent* words. Admin style: `bg-canvas`, white `Card`s, compact tables, `shape="rounded"` buttons.

## Reusable components (read the source before use)
- `@/components/ui/Button`: `Button`, `ButtonLink` (props: variant primary|dark|light|outline|outlineLight|ghost|danger|soft, size xs|sm|md|lg|icon|iconSm, shape pill|rounded, icon, iconRight, loading), `buttonClass()`.
- `@/components/ui/Field`: `Input` (label, hint, error, leading, trailing), `Textarea`, `Select`, `Checkbox`, `Switch`, `RadioCard`, `Label`, `Hint`.
- `@/components/ui/Overlay`: `Drawer` (side, title, footer, width), `Modal` (title, description, footer, size sm|md|lg|xl|full).
- `@/components/ui/misc`: `Badge` (tones brand|dark|light|sand|green|amber|blue|violet|red|gray|outline, dot), `Img` (fade-in; `small` uses the 640px `-sm.webp` variant), `Reveal` (scroll fade-up, `delay`), `QtyStepper`, `Accordion`, `Tabs`, `EmptyState`, `Accent` (renders `*word*` as italic brand serif), `plain()`, `useCountdown()`.
- `@/components/ui/Markdown`: `<Markdown source=... />` (## headings, lists, > quotes, **bold**, [links](/x)).
- `@/components/brand/Logo` (`Logo`, `LogoMark`, tone dark|light), `@/components/brand/Social` (Instagram/Facebook/WhatsApp/Viber icons), `@/components/LangSwitcher`.
- Storefront: `@/site/components/ProductCard` (`ProductCard`, `ProductBadges`), `@/site/components/Price` (`Price`, `hasPriceRange`), `@/site/components/SectionHeading` (`SectionHeading`, `Breadcrumbs`, `PageHero`), `@/site/components/MeasureForm` (`MeasureForm` type measurement|quote|contact → creates an inquiry in the CMS), `usePageTitle(title)` from `@/site/layout/SiteLayout`.
- Admin kit `@/admin/components/kit`: `PageHeader` (title, description, actions, back, badge), `Card` (title, description, actions, padded, bodyClassName), `Table`/`Th`/`Td`/`Tr`, `SearchInput`, `FilterPills`, `OrderStatusBadge`, `PaymentStatusBadge`, `InquiryStatusBadge`, `ORDER_STATUS_TONE`, `SaveBar` (dirty, onSave, onDiscard), `confirmDialog({title,text,confirmLabel,danger})` → Promise<boolean>, `KV`, `Thumb`.
- `@/admin/components/L10nInput`: `L10nInput` (label, value: L10n, onChange, multiline, rows, hint) — one field with ME/SQ/EN tabs.
- `@/admin/components/media`: `ImageField` (single image: media library + upload), `GalleryField` (multi, drag reorder, first = cover), `MediaPicker`, `Dropzone`, `useUploader()`, `compressImage()`.

## Data
- Types: `src/lib/types.ts` (Product, Category, Order, Inquiry, Coupon, CmsPage, Post, Project, MediaItem, HomeSection union, Settings, L10n, Lang…).
- Store `useDb` (`src/store/db.ts`) — data + actions: updateSettings, upsertProduct, deleteProduct, duplicateProduct, upsertCategory, deleteCategory, moveCategory, placeOrder, updateOrder, setOrderStatus(id,status,note?), addOrderNote, markOrderSeen, markAllOrdersSeen, deleteOrder, addInquiry, updateInquiry, deleteInquiry, upsertCoupon, deleteCoupon, upsertPage, deletePage, upsertPost, deletePost, upsertProject, deleteProject, addMedia, updateMedia, deleteMedia, updateHomeSection, setHome, resetDemo, importDb.
- Store `useUi` (`src/store/ui.ts`): lang, adminLang, cart, wishlist, coupon, recentlyViewed, adminAuthed + actions.
- Hooks `src/store/hooks.ts`: useSettings, useCategories (sorted), useActiveProducts, useProduct(idOrSlug), useCategory, useCart, useAdminBadges.
- **zustand v5 rule:** a selector must return a stable reference. NEVER `useDb(s => s.orders.filter(...))` or `useDb(s => ({...}))` — that causes an infinite render loop. Select raw slices (`useDb(s => s.orders)`) and derive with `useMemo`, or use `useShallow` from `zustand/react/shallow`.
- Helpers: `src/lib/format.ts` (money(v, lang), moneyCompact, num, date, dateTime, timeAgo, unitLabel, perUnit), `src/lib/pricing.ts` (basePrice, isOnSale, discountPct, unitPrice, priceCart, packsForArea, allCities, zoneForCity, validateCoupon…), `src/lib/utils.ts` (cn, uid, slugify, thumb, download, initials, round2), `src/lib/search.ts` (fold, searchProducts).
- Order numbers look like `SC-1042`; units: `kom` (piece), `m2` (sold in packs of `packSize` m²), `m`, `set`. Prices are EUR incl. 21% VAT.

## i18n (mandatory)
Every visible string in ME / SQ / EN. Montenegrin = Latin, **ijekavian** ("mjerenje", "cijena", "bijela", "vrijeme", "lijepo").
- Local dictionary at the top of each page: `const T = defineDict({ me: {...}, sq: {...}, en: {...} })` from `@/i18n`, then `const t = useDict(T, 'admin')` (admin pages) or `useDict(T)` (storefront). TypeScript enforces identical keys.
- Localized data values (`L10n`): `const l = useL('admin')` / `useL()` → `l(product.name)`. Current language: `useLang('admin')` / `useLang()`.
- Shared dicts you may use: `common` (`@/i18n/common`: status_*, pay_*, paystatus_*, delivery_*, inq_*, inqstatus_*, badge_*, subtotal, total…), `adm` (`@/admin/i18n`: admin chrome — save, cancel, delete, edit, add, status, date, published, draft, active…), `site` (`@/i18n/site`).

## Rules
0. **Shell note:** the Bash tool's PATH is missing Git's coreutils (cat, grep, ls, head…). Start EVERY Bash command with
   `export PATH="/usr/bin:$PATH";` — e.g. `export PATH="/usr/bin:$PATH"; cd "…/imgtools" && MSYS_NO_PATHCONV=1 node run.mjs node shot.mjs / x --pre "$(cat auth.js)"`.
   (Or use the Read/Grep/Glob tools, which don't need the shell.)
1. Only create/edit the files listed in YOUR task (plus new files inside your own sub-folder). Do not modify shared files
   (App.tsx, src/store/*, src/lib/*, src/i18n/*, src/components/*, src/admin/components/{kit,L10nInput,media}.tsx, src/admin/layout/*,
   src/site/layout/*, existing src/site/components/*). If you need something shared that is missing, write a local helper in your
   own files and mention it in your final report.
2. Routes are already wired in `src/App.tsx` — read it to see paths.
3. Type-check — through the shared semaphore (many agents run in parallel and RAM is tight, so NEVER run `tsc` / `npx tsc` directly):

       cd "C:/Users/A/Documents/SELCA MNE OPUS" && MSYS_NO_PATHCONV=1 node "C:/Users/A/AppData/Local/Temp/claude/C--Users-A-Documents-SELCA-MNE-OPUS/751072c8-a392-4846-ab64-a603cca41d33/scratchpad/imgtools/run.mjs" node node_modules/typescript/bin/tsc --noEmit

   It must show no errors in YOUR files (others work in parallel — ignore theirs unless they block you).
4. Visual QA (required). The dev server already runs at http://localhost:5173 — do NOT start another one and do NOT run `vite build`.
   Screenshot tool (also through the semaphore; always keep `MSYS_NO_PATHCONV=1` so Git Bash doesn't rewrite `/paths`):

       cd "C:/Users/A/AppData/Local/Temp/claude/C--Users-A-Documents-SELCA-MNE-OPUS/751072c8-a392-4846-ab64-a603cca41d33/scratchpad/imgtools" && MSYS_NO_PATHCONV=1 node run.mjs node shot.mjs <path> <name> [width=1440] [height=900] [viewport|segments|full] [nSegments] [--pre "<js>"] [--post "<js>"] [--wait ms]

   → writes `../shots/<name>.png` (segments mode: `<name>-1.png`, `<name>-2.png`, …). Open it with the Read tool and fix what looks off.
   `--pre` runs JS on a blank page load BEFORE navigating (use it to seed localStorage); `--post` runs JS after load (click a button, open a drawer…).
   Ready-made presets in that folder, passed as `--pre "$(cat auth.js)"`:
   - `auth.js` — admin logged in, everything Montenegrin
   - `auth-sq.js` — admin logged in, admin + storefront in Albanian
   - `cart.js` — logged in + 3 cart lines (12 packs laminate with installation, 3 doors, 1 tap) + wishlist + recently viewed (ME)
   - `cart-sq.js` — similar, Albanian
   The ui store key is `selca-ui`, shape `{state:{lang,adminLang,cart,wishlist,coupon,codes,recentlyViewed,adminAuthed,adminRole},version:2}`
   (a version-1 value is migrated and its adminLang reset to 'sq'); the data store
   key is `selca-db` (seeded automatically on first load). Seeded ids you can use: order `o_1001`, product `p-vrata-linea`, page `pg-dostava`,
   post `post-laminat`, category `cat-podovi`.
   Prefix screenshot names with your item id. Check desktop 1440×900 AND mobile 390×844, and at least one screen in Albanian.
5. Quality bar: real-client sales demo. Use real data from the store, no lorem ipsum, consistent spacing, hover/empty states,
   responsive down to 390px. Keep components readable; match the surrounding code style.
6. Final report (≤ 300 words): files created, notable decisions, any shared-code issue you found, anything incomplete.

---

# CMS v2 — apply the client's CMS proposal (READ THIS)

The CMS (`/admin`) is being rebuilt to follow the agency's own proposal document
**`C:\Users\A\Downloads\CMS_Projektpropozim.pdf`** (51 pages, Albanian; read it with the Read tool and the `pages` parameter —
only the pages relevant to your task). It describes a reusable, Shopify-like CMS: neutral design, modules for catalogue,
inventory, orders, customers, discounts, offers, slideshow/banners, content, markets, analytics, contacts and appointments,
roles & permissions and a separate settings space. The storefront (public site) keeps its warm SELCA brand design.

## PDF page map
- 04–07 platform organisation, navigation structure, design tokens · 08 overview mock-up
- 09–13 products (list lifecycle, product form, variants, list & form mock-ups) · 14 collections · 15 inventory · 16 supplies/transfers
- 17–18 orders (order vs draft, payment vs fulfilment vs return, order mock-up) · 19 customers & segments
- 20–27 discounts (5 mechanisms, form, per-type details, combination order, thresholds/cents/refunds, edge cases, numeric test examples p.26, form mock-up p.27)
- 28–30 offers centre · 31–35 slideshow, banners, announcement bar, section editor, slide editor mock-ups
- 36 pages/blog/menus/content models · 37 channels & markets · 38 analytics reports
- 39–41 settings (payments, checkout, shipping, identity, notifications, privacy, settings mock-up) · 42 roles & permissions
- 43–44 contacts inbox & B2B quotes · 45–46 appointments & calendar · 47 other modules · 48 architecture · 49 phases · 50 acceptance criteria · 51 decisions

## CMS v2 design rules (from the PDF, p.07) — the admin is NEUTRAL: black, grey, white
- Top bar `#1A1A1A` with "CMS", global search ("Kërko produkte, porosi ose klientë…") and the store/account on the right.
- Sidebar light grey `#EBEBEB`; active item = white pill. Work background `#F1F1F1`; white cards, radius 10–12 px (`rounded-xl`),
  thin grey border, very light shadow. On narrow screens the sidebar opens as a drawer.
- Primary button BLACK with white text; secondary buttons white with a border. **No decorative blue, and no SELCA red inside the
  admin** (the shell remaps the `brand-*` colours to neutral greys/black under /admin, so `Button variant="primary"` renders black).
- Base text 13–14 px, screen titles 22–28 px, compact tables, tabs, filters, status badges, action menus, dialogs.
- Forms in small labelled groups; an unsaved-changes bar with "Ruaj / Hidh poshtë" (Save / Discard) — use `SaveBar`.
- Empty, loading, error and success states. **Statuses use text + a symbol (dot/icon), never colour alone.**
- Screen layout: breadcrumb (e.g. "Produktet / Të gjitha"), title + actions on the right, then cards/tables.
- The CMS is presented to an Albanian-speaking client: the admin defaults to **Albanian (sq)**; keep ME and EN complete too.
  Use the PDF's Albanian terminology (Përmbledhje, Porositë, Produktet, Koleksionet, Inventari, Klientët, Rritja, Ofertat, Zbritjet,
  Përmbajtja, Tregjet, Analitika, Kontaktet, Terminet, Online Store, Integrime, Konfigurimet, Çmimi referues, Kosto / copë, …).

## Raw URLs and the GitHub Pages build
The app is also deployed under a sub-path (`https://<user>.github.io/Selca/`). Never hard-code absolute URLs in raw `<a href>`,
`<iframe src>`, `window.open()` or `location.href` — use `href('/admin/…')` from `@/lib/paths` (react-router `<Link>`/`navigate`
already handle the base). Image paths like `/images/...` inside data are rewritten automatically at build time; in JSX use them as-is.

---

# CMS v2 API (foundation — data, store, discount engine)

**Types** (`src/lib/types.ts`, all additive): `Product` + `status 'active'|'draft'|'archived'`, `cost`, `vendor`, `tags`, `barcode`,
`incoming`, `unavailable`, `template 'standard'|'quote'`, `channels ('online'|'pos')[]` (all optional except status).
`Order` + `discounts: AppliedDiscount[]` {id,title,kind,code?,amount}, `shippingBeforeDiscount`, `refunds`, `fulfillment`
{shippedAt,deliveredAt,carrier,tracking,partial}, `tags`, `draftId`; `payment.refunded|authorized|failed`; `OrderLine.discount` +
`allocations` + `custom`. `Inquiry` + `assignee` (staff id), `source`, `tags`, `company`, `followUpAt`.
New: `Collection`, `Discount`, `Offer`, `Placement`, `Staff`/`RoleId`, `Service`, `Booking`, `Segment`, `InventoryMovement`,
`PurchaseOrder`, `DraftOrder`, `ReturnRequest`, `Quote`, `Menu`/`MenuItem`, `ContentModel`, `AuditEntry`, `HomeVersion`.
`Settings` + `timezone`, `orderPrefix`, `locations`, `notifications`, `integrations`, `markets`, `checkout`, `privacy`.
`Db` + `collections discounts offers placements staff services bookings segments movements purchaseOrders drafts returns quotes
menus contentModels audit homeDraft homeHistory` (`coupons` kept for the old Coupons screen; pricing uses `discounts`).

**Store `useDb`** (`src/store/db.ts`, DB_VERSION 5 → every browser re-seeds):
- Generic: `upsert(key, item)` / `remove(key, id)` for every list above (`CollectionKey`), audited for business objects.
  Upserting a discount normalises its code; the active automatic shipping rule keeps `settings.freeShippingThreshold` in sync (both ways).
- Orders: `placeOrder({customer, items, delivery, payment, codes?, couponCode?, lang})` (stores applied discounts + line allocations,
  increments `uses` and the linked offer's metrics, writes `sale` movements), `setOrderStatus` (cancel of an open order releases stock),
  `fulfillOrder(id, {carrier?, tracking?, partial?})`, `refundOrder(id, amount, lineIds?, note?)`.
- `convertDraft(id) → Order` (same path as placeOrder, custom lines appended, status confirmed), `createReturn({orderId, lines, reason,
  restock?})` (refund = net paid amount of the lines), `setReturnStatus(id, status)` (`received` restocks once; `refunded` calls refundOrder).
- Inventory: `adjustStock(productId, delta, reason, note?, ref?)`, `receivePurchaseOrder(id, [{productId, received, rejected?}])` —
  quantities are CUMULATIVE totals, so the same receipt twice adds nothing.
- Home: `saveHomeDraft(sections)`, `publishHome()` (old live → `homeHistory`, max 10), `discardHomeDraft()`, `restoreHomeVersion(i)` (into the draft).
  `setHome`/`updateHomeSection` still write the live home directly.
- Contacts/calendar: `assignInquiry(id, staffId)`, `addBooking(input) → {ok, booking} | {ok:false, reason}` (`staffBusy|capacity|staff|service|invalid`),
  `rescheduleBooking(id, start, staffId?)`, `setBookingStatus(id, status)`. `logAudit({action, object, objectId, detail?})`.
- `DATA_KEYS` is exported (use it for export/backup — the Settings "Demo data" export still lists only the v1 keys).

**Store `useUi`** (v2, migrates v1 keeping cart/wishlist): `codes` + `addCode/removeCode/clearCodes` (`coupon`/`setCoupon` = alias of
`codes[0]`), `adminRole: RoleId` (default `'owner'`) + `setAdminRole`, `adminLang` default `'sq'`. Presets in imgtools now write version 2.

**Hooks** (`src/store/hooks.ts`): `useCart()` (auto discounts + `ui.codes`), `usePlacements(position)`, `useCollection(idOrSlug)`,
`useCan()` → `(module, action?) => boolean`, `useCurrentStaff()`, `useAdminBadges()` (+ openReturns, pendingBookings, openDrafts).

**Helpers**
- `lib/discounts.ts` — `applyDiscounts({lines, discounts, codes, shipping, shippingZoneId, customer, now})` → `{lines (with allocations),
  subtotal, productDiscount, orderDiscount, shippingDiscount, discountTotal, shipping, total, applied, rejected[{code,id,reason,missing?,
  conflictsWith?,auto}]}`; `discountState(d, now)` (active|draft|paused|scheduled|expired), `canCombine`, `discountClass`,
  `normalizeCode`, `isDuplicateCode`, `allocateCents`, `discountValueLabel`. Reasons: notfound inactive scheduled expired minimum
  notCombinable notEligible usageLimit audience. Check: `node --experimental-strip-types src/lib/__tests__/discounts.check.ts`.
- `lib/pricing.ts` — `priceCart(cart, products, settings, {lang, codes, discounts, collections, delivery, city, now?, customer?})`.
  `Totals` adds `applied, rejected, codes, productDiscount, orderDiscount, shippingDiscount, shippingBeforeDiscount,
  freeShippingThreshold (null = no live rule), couponMinimum`; `PricedLine` adds `discount, allocations`; `activeShippingRule()`.
- `lib/orders.ts` — `fulfillmentOf(o)`, `paymentOf(o)`, `refundedOf`, `orderLineNet`, `refundForLines`, `isOpenOrder`.
- `lib/permissions.ts` — `can(role, module, action)`, `modulesFor(role)`, `actionsFor`, `MODULES`, `ACTIONS`, `ROLES`, `ROLE_META` (ME/SQ/EN names).
  Marketing can prepare offers/discounts but not `publish`; reception sees overview/customers/contacts/quotes/appointments.
- `lib/collections.ts` — `collectionProducts(c, products, {publicOnly})`, `inCollection`, `matchesRule`, `collectionIdsFor`, `membershipIndex`.
- `lib/offers.ts` — `offerState`, `placementState(p, now, offer)` (inherits the offer's window / pause), `activePlacements(list, position, offers)`, `offerRates`.
- `lib/inventory.ts` — `stockLevels(p, committedByProduct(orders))` → onHand/committed/unavailable/available/incoming, `incomingByProduct`, `purchaseOrderTotals`.
- `lib/bookings.ts` — `checkBooking`, `overlaps`, `bookingEnd`, `bookingsOnDay`. `lib/crm.ts` — `inquiryKind`, `segmentSubjects(orders)`, `matchesSegment`, `segmentMembers`, `segmentIdsFor`.

**Seeded ids** — staff `st-gent` (owner), `st-arta` (manager), `st-drita` (marketing), `st-milica` (reception), `st-blerim`
(orders/installer), `st-ana` (editor). Services `sv-mjerenje`, `sv-konsultacija`, `sv-montaza`; bookings `bk-101…116` (this + next week).
Collections `col-podovi-akcija` & `col-premium-kupatilo` (smart), `col-jesenja-akcija`, `col-bestseleri`, `col-novi-stan` (manual, unpublished).
Discounts `d-selca10` (SELCA10, order −10% ≥ €100), `d-podovi15` (auto −15% on col-podovi-akcija), `d-vrata-kvaka` (auto BXGY 3 doors →
handle free), `d-dostava300` (auto free shipping ≥ €300), `d-jesen25` (JESEN25), `d-bf-vrata` (scheduled), `d-ljeto15` (expired LJETO15),
`d-vip50` (draft, segment). Offers `of-jesen`, `of-dobrodoslica` (active), `of-kupatilo` (draft), `of-blackfriday` (scheduled).
Placements `pl-s1…s3` (live hero), `pl-s4` (scheduled), `pl-s5` (draft), `pl-b1`, `pl-b2` (catalog), `pl-a1…a4` (bar).
Segments `seg-vip`, `seg-povratni`, `seg-primorje`, `seg-shqip`. POs `po-014` (partial), `po-015` (sent). Drafts `dr-1001`, `dr-1002`.
Returns `rt-1001` (refunded), `rt-1002` (requested). Quotes `q-031` (sent, from inquiry `inq_120`), `q-032` (draft). Menus `menu-main`,
`menu-footer`. Content models `cm-projekti`, `cm-faq`, `cm-usluge`, `cm-lokacije`. Locations `loc-pg`, `loc-tz`. Archived product `p-statuario`.
