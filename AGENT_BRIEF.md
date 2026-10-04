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
   The ui store key is `selca-ui`, shape `{state:{lang,adminLang,cart,wishlist,coupon,recentlyViewed,adminAuthed},version:1}`; the data store
   key is `selca-db` (seeded automatically on first load). Seeded ids you can use: order `o_1001`, product `p-vrata-linea`, page `pg-dostava`,
   post `post-laminat`, category `cat-podovi`.
   Prefix screenshot names with your item id. Check desktop 1440×900 AND mobile 390×844, and at least one screen in Albanian.
5. Quality bar: real-client sales demo. Use real data from the store, no lorem ipsum, consistent spacing, hover/empty states,
   responsive down to 390px. Keep components readable; match the surrounding code style.
6. Final report (≤ 300 words): files created, notable decisions, any shared-code issue you found, anything incomplete.
