import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { ArrowRight, Heart, Menu, Phone, Search, ShoppingBag, Ruler } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Logo } from '@/components/brand/Logo';
import { LangSwitcher } from '@/components/LangSwitcher';
import { ButtonLink } from '@/components/ui/Button';
import { Img } from '@/components/ui/misc';
import { Drawer } from '@/components/ui/Overlay';
import { useDict, useL } from '@/i18n';
import { site } from '@/i18n/site';
import { useUi } from '@/store/ui';
import { useCategories, useSettings } from '@/store/hooks';
import { cn } from '@/lib/utils';

function AnnouncementBar() {
  const settings = useSettings();
  const l = useL();
  const [i, setI] = useState(0);
  const items = settings.announcements;
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % items.length), 4500);
    return () => clearInterval(t);
  }, [items.length]);
  if (!items.length) return null;
  return (
    <div className="relative z-50 bg-ink text-paper">
      <div className="container-x flex h-9 items-center justify-between gap-4 text-[12.5px]">
        <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="hidden items-center gap-1.5 text-paper/75 hover:text-white md:flex">
          <Phone className="h-3.5 w-3.5" /> {settings.phone}
        </a>
        <div className="relative h-full flex-1 overflow-hidden text-center md:max-w-[60%]">
          <AnimatePresence mode="wait">
            <motion.p
              key={i}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 flex items-center justify-center truncate font-medium"
            >
              {l(items[i % items.length])}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="hidden md:block">
          <LangSwitcher tone="light" compact />
        </div>
      </div>
    </div>
  );
}

function MegaMenu({ onClose }: { onClose: () => void }) {
  const cats = useCategories();
  const l = useL();
  const t = useDict(site);
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className="absolute inset-x-0 top-full border-t border-line bg-paper shadow-[0_30px_60px_-30px_rgba(28,26,23,0.35)]"
    >
      <div className="container-x grid grid-cols-12 gap-8 py-8">
        <div className="col-span-9 grid grid-cols-3 gap-3">
          {cats.map((c) => (
            <Link key={c.id} to={`/proizvodi/${c.slug}`} onClick={onClose} className="group flex items-center gap-4 rounded-2xl p-2.5 transition-colors hover:bg-white">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sand">
                <Img src={c.image} small alt={l(c.name)} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-ink">{l(c.name)}</div>
                <div className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted">{l(c.tagline)}</div>
              </div>
            </Link>
          ))}
        </div>
        <Link to="/proizvodi?akcija=1" onClick={onClose} className="group relative col-span-3 overflow-hidden rounded-2xl bg-ink">
          <Img src="/images/cat/podovi.webp" small alt="" className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
          <div className="relative flex h-full min-h-[180px] flex-col justify-end p-5 text-white">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-200">{t('sale')}</span>
            <span className="mt-1 font-display text-2xl leading-tight">−20%</span>
            <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold">
              {t('seeAll')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}

export function Header({ transparentTop = false }: { transparentTop?: boolean }) {
  const t = useDict(site);
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const cartCount = useUi((s) => s.cart.length);
  const wishCount = useUi((s) => s.wishlist.length);
  const setCartOpen = useUi((s) => s.setCartOpen);
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    setMega(false);
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  const solid = !transparentTop || scrolled || mega;
  const tone = solid ? 'dark' : 'light';

  const nav = [
    { to: '/usluge', label: t('nav_services') },
    { to: '/projekti', label: t('nav_projects') },
    { to: '/o-nama', label: t('nav_about') },
    { to: '/savjeti', label: t('nav_blog') },
    { to: '/kontakt', label: t('nav_contact') },
  ];

  const linkCls = (active: boolean) =>
    cn(
      'relative rounded-full px-3.5 py-2 text-[14.5px] font-semibold transition-colors',
      solid ? (active ? 'text-ink' : 'text-ink-soft hover:text-ink') : active ? 'text-white' : 'text-white/85 hover:text-white',
    );

  const iconBtn = cn('relative grid h-10 w-10 place-items-center rounded-full transition-colors', solid ? 'text-ink hover:bg-ink/[0.06]' : 'text-white hover:bg-white/10');

  return (
    <>
      <AnnouncementBar />
      <header
        className={cn(
          'sticky top-0 z-40 transition-[background,box-shadow,border-color] duration-300',
          solid ? 'border-b border-line/80 bg-paper/90 backdrop-blur-xl' : 'border-b border-transparent bg-transparent',
          transparentTop && '-mb-[76px]',
        )}
        onMouseLeave={() => setMega(false)}
      >
        <div className="container-x flex h-[76px] items-center gap-3">
          <button className={cn(iconBtn, 'lg:hidden -ml-2')} onClick={() => setMobileOpen(true)} aria-label={t('menu')}>
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="shrink-0" aria-label="SELCA COMPANY">
            <Logo tone={tone} className="h-[46px]" />
          </Link>

          <nav className="ml-6 hidden items-center gap-0.5 lg:flex">
            <button
              type="button"
              onMouseEnter={() => setMega(true)}
              onClick={() => setMega((m) => !m)}
              className={linkCls(location.pathname.startsWith('/proizvod') || mega)}
              aria-expanded={mega}
            >
              {t('nav_products')}
            </button>
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} onMouseEnter={() => setMega(false)} className={({ isActive }) => linkCls(isActive)}>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-0.5">
            <button className={iconBtn} onClick={() => setSearchOpen(true)} aria-label={t('searchPlaceholder')}>
              <Search className="h-[19px] w-[19px]" />
            </button>
            <Link to="/lista-zelja" className={cn(iconBtn, 'hidden sm:grid')} aria-label={t('wishlist')}>
              <Heart className="h-[19px] w-[19px]" />
              {wishCount > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">{wishCount}</span>}
            </Link>
            <button className={iconBtn} onClick={() => setCartOpen(true)} aria-label={t('cart')}>
              <ShoppingBag className="h-[19px] w-[19px]" />
              {cartCount > 0 && (
                <span key={cartCount} className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] animate-pop place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
            <ButtonLink to="/#mjerenje" variant={solid ? 'primary' : 'light'} size="sm" className="ml-2 hidden xl:inline-flex" icon={<Ruler className="h-4 w-4" />}>
              {t('freeMeasure')}
            </ButtonLink>
          </div>
        </div>
        <AnimatePresence>{mega && <MegaMenu onClose={() => setMega(false)} />}</AnimatePresence>
      </header>
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useDict(site);
  const l = useL();
  const cats = useCategories();
  const settings = useSettings();
  const links = [
    { to: '/', label: t('home') },
    { to: '/proizvodi', label: t('allProducts') },
    { to: '/usluge', label: t('nav_services') },
    { to: '/projekti', label: t('nav_projects') },
    { to: '/o-nama', label: t('nav_about') },
    { to: '/savjeti', label: t('nav_blog') },
    { to: '/kontakt', label: t('nav_contact') },
  ];
  return (
    <Drawer open={open} onClose={onClose} side="left" title={<Logo className="h-9" />} width="max-w-[380px]">
      <div className="px-5 py-5">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted">{t('categories')}</div>
        <div className="grid grid-cols-2 gap-2">
          {cats.map((c) => (
            <Link key={c.id} to={`/proizvodi/${c.slug}`} onClick={onClose} className="group relative h-24 overflow-hidden rounded-xl bg-ink">
              <Img src={c.image} small alt="" className="absolute inset-0 h-full w-full object-cover opacity-75" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
              <span className="absolute bottom-2 left-3 text-sm font-semibold text-white">{l(c.name)}</span>
            </Link>
          ))}
        </div>
        <nav className="mt-6 flex flex-col">
          {links.map((n) => (
            <NavLink key={n.to} to={n.to} end onClick={onClose} className={({ isActive }) => cn('border-b border-line py-3.5 text-[17px] font-semibold', isActive ? 'text-brand-700' : 'text-ink')}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 flex items-center justify-between">
          <LangSwitcher align="left" />
          <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
            <Phone className="h-4 w-4" /> {settings.phone}
          </a>
        </div>
        <ButtonLink to="/#mjerenje" onClick={onClose} className="mt-6 w-full" size="lg" icon={<Ruler className="h-4 w-4" />}>
          {t('bookMeasure')}
        </ButtonLink>
      </div>
    </Drawer>
  );
}
