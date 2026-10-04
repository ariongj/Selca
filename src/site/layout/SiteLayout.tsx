import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { LayoutDashboard } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from './CartDrawer';
import { SearchOverlay } from './SearchOverlay';
import { useDict, LANGS, useLang } from '@/i18n';
import { site } from '@/i18n/site';
import { useSettings } from '@/store/hooks';
import { useDb } from '@/store/db';

function DemoBadge() {
  const t = useDict(site);
  const settings = useSettings();
  if (!settings.demoBanner) return null;
  return (
    <Link
      to="/admin"
      className="group fixed bottom-4 left-4 z-30 flex items-center gap-2.5 rounded-full bg-ink/90 py-1.5 pl-1.5 pr-4 text-[12px] font-semibold text-paper shadow-xl ring-1 ring-white/10 backdrop-blur transition-all hover:bg-ink"
    >
      <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-600">
        <LayoutDashboard className="h-3.5 w-3.5" />
      </span>
      <span className="hidden sm:inline">{t('demoBanner')}</span>
      <span className="text-brand-200 group-hover:text-white">{t('demoBannerCta')} →</span>
    </Link>
  );
}

export function SiteLayout() {
  const location = useLocation();
  const lang = useLang();
  const isHome = location.pathname === '/';
  const heroFirst = useDb((s) => s.home.find((h) => h.enabled)?.type === 'hero');

  useEffect(() => {
    document.documentElement.lang = LANGS.find((l) => l.code === lang)?.htmlLang ?? 'sr-Latn-ME';
  }, [lang]);

  // Smooth-scroll to in-page anchors like /#mjerenje after navigation
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    return () => clearTimeout(t);
  }, [location.pathname, location.hash]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header transparentTop={isHome && heroFirst} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <SearchOverlay />
      <DemoBadge />
    </div>
  );
}

/** Page title helper for storefront pages. */
export function usePageTitle(title: string | undefined) {
  const settings = useSettings();
  useEffect(() => {
    document.title = title ? `${title} — ${settings.companyName}` : settings.seo.title;
  }, [title, settings.companyName, settings.seo.title]);
}
