import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Lock, Ruler, ShoppingBag, Trash2 } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Accent } from '@/components/ui/misc';
import { defineDict, useDict, useLang } from '@/i18n';
import { useUi } from '@/store/ui';
import { useActiveProducts, useCart, useSettings } from '@/store/hooks';
import { money } from '@/lib/format';
import type { Product } from '@/lib/types';
import { CartLine, FreeShippingBar } from '@/site/layout/CartDrawer';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { Breadcrumbs, SectionHeading } from '@/site/components/SectionHeading';
import { ProductCard } from '@/site/components/ProductCard';
import { CheckoutSteps, CouponBox, TotalsRows, TrustNotes, useItemsLabel, useTotalsView } from '@/site/components/checkout/parts';

const T = defineDict({
  me: {
    pageTitle: 'Korpa',
    title: 'Vaša *korpa*',
    summary: 'Pregled narudžbe',
    toCheckout: 'Nastavi na plaćanje',
    continue: 'Nastavi kupovinu',
    clear: 'Isprazni korpu',
    cleared: 'Korpa je ispražnjena',
    undo: 'Vrati',
    payMethods: 'Pouzeće · Uplata na račun · Kartica',
    measureTitle: 'Niste sigurni u mjere?',
    measureText: 'Naš tim dolazi besplatno, mjeri na licu mjesta i savjetuje vas prije kupovine.',
    measureCta: 'Zakaži mjerenje',
    emptyTitle: 'Vaša korpa je prazna',
    emptyText: 'Pogledajte ponudu vrata, podova, keramike i opreme za kupatilo — ili zakažite besplatno mjerenje pa vam pripremimo ponudu.',
    browse: 'Pogledaj proizvode',
    recoEyebrow: 'Preporuka',
    recoTitle: 'Možda vam se *dopadne*',
    recoTitleEmpty: 'Najprodavanije *ovog mjeseca*',
    viewAll: 'Svi proizvodi',
  },
  sq: {
    pageTitle: 'Shporta',
    title: 'Shporta *juaj*',
    summary: 'Përmbledhja e porosisë',
    toCheckout: 'Vazhdo te pagesa',
    continue: 'Vazhdo blerjen',
    clear: 'Zbraz shportën',
    cleared: 'Shporta u zbraz',
    undo: 'Kthe',
    payMethods: 'Në dorëzim · Transfertë bankare · Kartelë',
    measureTitle: 'Nuk jeni të sigurt për masat?',
    measureText: 'Ekipi ynë vjen falas, mat në vend dhe ju këshillon para blerjes.',
    measureCta: 'Cakto matjen',
    emptyTitle: 'Shporta juaj është bosh',
    emptyText: 'Shikoni ofertën e dyerve, dyshemeve, pllakave dhe pajisjeve të banjos — ose caktoni matje falas dhe ne ju përgatisim ofertën.',
    browse: 'Shiko produktet',
    recoEyebrow: 'Rekomandim',
    recoTitle: 'Mund t’ju *pëlqejnë*',
    recoTitleEmpty: 'Më të shiturat *këtë muaj*',
    viewAll: 'Të gjitha produktet',
  },
  en: {
    pageTitle: 'Cart',
    title: 'Your *cart*',
    summary: 'Order summary',
    toCheckout: 'Continue to payment',
    continue: 'Continue shopping',
    clear: 'Empty cart',
    cleared: 'Cart emptied',
    undo: 'Undo',
    payMethods: 'Cash on delivery · Bank transfer · Card',
    measureTitle: 'Not sure about the measurements?',
    measureText: 'Our team visits for free, measures on site and advises you before you buy.',
    measureCta: 'Book a visit',
    emptyTitle: 'Your cart is empty',
    emptyText: 'Browse doors, flooring, tiles and bathroom fittings — or book a free measurement and we’ll prepare a quote for you.',
    browse: 'Browse products',
    recoEyebrow: 'Recommended',
    recoTitle: 'You may also *like*',
    recoTitleEmpty: 'Bestsellers *this month*',
    viewAll: 'All products',
  },
});

/** One bestseller per category already in the cart, then overall bestsellers. */
function pickRecommendations(products: Product[], inCart: Set<string>, cats: string[], n = 4) {
  const pool = products.filter((p) => !inCart.has(p.id) && !p.quoteOnly).sort((a, b) => b.sold - a.sold);
  const out: Product[] = [];
  for (const c of cats) {
    const p = pool.find((x) => x.categoryId === c && !out.includes(x));
    if (p) out.push(p);
  }
  for (const p of pool) {
    if (out.length >= n) break;
    if (!out.includes(p)) out.push(p);
  }
  return out.slice(0, n);
}

export default function CartPage() {
  const t = useDict(T);
  const lang = useLang();
  const items = useItemsLabel();
  const navigate = useNavigate();
  const settings = useSettings();
  const totals = useCart();
  const view = useTotalsView(totals, { showEstimateHint: true });
  const cart = useUi((s) => s.cart);
  const codes = useUi((s) => s.codes);
  const clearCart = useUi((s) => s.clearCart);
  const products = useActiveProducts();
  usePageTitle(t('pageTitle'));

  const empty = totals.lines.length === 0;
  const recos = useMemo(() => {
    const inCart = new Set(cart.map((c) => c.productId));
    const cats = [...new Set(totals.lines.map((l) => l.product.categoryId))];
    return pickRecommendations(products, inCart, cats);
  }, [cart, products, totals.lines]);

  const onClear = () => {
    const snapshot = { cart, codes, coupon: codes[0] ?? null };
    clearCart();
    toast(t('cleared'), {
      action: { label: t('undo'), onClick: () => useUi.setState(snapshot) },
    });
  };

  return (
    <div className="pb-4">
      <div className="container-x pt-8 sm:pt-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Breadcrumbs items={[{ label: t('pageTitle') }]} />
          {!empty && <CheckoutSteps current={0} />}
        </div>

        {empty ? (
          <div className="mt-8 overflow-hidden rounded-3xl bg-white ring-1 ring-line">
            <div className="relative flex flex-col items-center px-6 py-16 text-center sm:py-24">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sand/60 to-transparent" />
              <span className="relative grid h-20 w-20 place-items-center rounded-full bg-sand text-ink-soft">
                <ShoppingBag className="h-8 w-8" strokeWidth={1.6} />
              </span>
              <h1 className="display relative mt-6 text-[34px] leading-tight text-ink sm:text-5xl">{t('emptyTitle')}</h1>
              <p className="relative mt-3 max-w-lg text-[15.5px] leading-relaxed text-muted">{t('emptyText')}</p>
              <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink to="/proizvodi" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                  {t('browse')}
                </ButtonLink>
                <ButtonLink to="/#mjerenje" size="lg" variant="outline" icon={<Ruler className="h-4 w-4" />}>
                  {t('measureCta')}
                </ButtonLink>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div>
                <h1 className="display text-[42px] leading-[1.02] text-ink sm:text-[56px]">
                  <Accent text={t('title')} />
                </h1>
                <p className="mt-3 text-[15px] text-muted">
                  {items(totals.count)} · <span className="font-semibold text-ink">{money(totals.total, lang)}</span>
                </p>
              </div>
              <Link to="/proizvodi" className="group hidden items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink sm:inline-flex">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                {t('continue')}
              </Link>
            </div>

            <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-14">
              {/* Lines */}
              <section className="min-w-0">
                <FreeShippingBar remaining={totals.freeShippingRemaining} threshold={totals.freeShippingThreshold ?? settings.freeShippingThreshold} reason={totals.freeShippingReason} />
                <div className="mt-4 rounded-3xl bg-white px-4 ring-1 ring-line sm:px-6">
                  <div className="divide-y divide-line">
                    {totals.lines.map((line) => (
                      <CartLine key={line.item.key} line={line} />
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 px-1 sm:justify-end">
                  <Link to="/proizvodi" className="group inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink sm:hidden">
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    {t('continue')}
                  </Link>
                  <button type="button" onClick={onClear} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-muted transition-colors hover:bg-ink/5 hover:text-ink">
                    <Trash2 className="h-3.5 w-3.5" />
                    {t('clear')}
                  </button>
                </div>

                {/* Measurement nudge */}
                <div className="relative mt-8 flex flex-col gap-4 overflow-hidden rounded-3xl bg-ink p-6 text-paper sm:flex-row sm:items-center sm:p-7">
                  <div className="bg-grain pointer-events-none absolute inset-0 opacity-50" />
                  <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-brand-200">
                    <Ruler className="h-5 w-5" />
                  </span>
                  <div className="relative min-w-0 flex-1">
                    <h2 className="font-display text-[22px] leading-tight text-white">{t('measureTitle')}</h2>
                    <p className="mt-1 text-[14px] leading-relaxed text-paper/65">{t('measureText')}</p>
                  </div>
                  <ButtonLink to="/#mjerenje" variant="light" className="relative self-start sm:self-center">
                    {t('measureCta')}
                  </ButtonLink>
                </div>
              </section>

              {/* Summary */}
              <aside className="lg:sticky lg:top-[100px]">
                <div className="rounded-3xl bg-white p-5 ring-1 ring-line sm:p-7">
                  <h2 className="text-lg font-bold text-ink">{t('summary')}</h2>
                  <CouponBox totals={totals} className="mt-5" />
                  <div className="my-5 h-px bg-line" />
                  <TotalsRows v={view} big />
                  <Button size="lg" className="mt-6 w-full" iconRight={<ArrowRight className="h-4 w-4" />} onClick={() => navigate('/placanje')}>
                    {t('toCheckout')}
                  </Button>
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-muted">
                    <Lock className="h-3.5 w-3.5" />
                    {t('payMethods')}
                  </p>
                </div>
                <TrustNotes className="mt-6 px-1" />
              </aside>
            </div>
          </>
        )}
      </div>

      {recos.length > 0 && (
        <section className="container-x mt-20 sm:mt-24">
          <SectionHeading
            eyebrow={t('recoEyebrow')}
            title={empty ? t('recoTitleEmpty') : t('recoTitle')}
            action={
              <Link to="/proizvodi" className="group inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-brand-700">
                {t('viewAll')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            }
          />
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {recos.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
