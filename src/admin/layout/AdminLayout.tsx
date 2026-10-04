import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  Bell, BookOpen, ExternalLink, FileText, FolderTree, Home, Image as ImageIcon, LayoutDashboard, LogOut, Menu,
  Package, Settings, ShoppingCart, Ticket, Users, Inbox, Hammer, X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Logo, LogoMark } from '@/components/brand/Logo';
import { LangSwitcher } from '@/components/LangSwitcher';
import { ConfirmHost } from '@/admin/components/kit';
import { useDict, useLang } from '@/i18n';
import { adm } from '@/admin/i18n';
import { useUi } from '@/store/ui';
import { useDb } from '@/store/db';
import { useAdminBadges } from '@/store/hooks';
import { money, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

type Item = { to: string; label: string; icon: ComponentType<{ className?: string }>; badge?: number; end?: boolean };

function useNav() {
  const t = useDict(adm, 'admin');
  const { newOrders, newInquiries } = useAdminBadges();
  return [
    { title: t('nav_overview'), items: [{ to: '/admin', label: t('nav_dashboard'), icon: LayoutDashboard, end: true }] },
    {
      title: t('nav_sales'),
      items: [
        { to: '/admin/narudzbe', label: t('nav_orders'), icon: ShoppingCart, badge: newOrders },
        { to: '/admin/upiti', label: t('nav_inquiries'), icon: Inbox, badge: newInquiries },
        { to: '/admin/kupci', label: t('nav_customers'), icon: Users },
        { to: '/admin/kuponi', label: t('nav_coupons'), icon: Ticket },
      ],
    },
    {
      title: t('nav_catalog'),
      items: [
        { to: '/admin/proizvodi', label: t('nav_products'), icon: Package },
        { to: '/admin/kategorije', label: t('nav_categories'), icon: FolderTree },
      ],
    },
    {
      title: t('nav_content'),
      items: [
        { to: '/admin/sadrzaj', label: t('nav_home'), icon: Home },
        { to: '/admin/stranice', label: t('nav_pages'), icon: FileText },
        { to: '/admin/savjeti', label: t('nav_posts'), icon: BookOpen },
        { to: '/admin/projekti', label: t('nav_projects'), icon: Hammer },
        { to: '/admin/mediji', label: t('nav_media'), icon: ImageIcon },
      ],
    },
    { title: t('nav_system'), items: [{ to: '/admin/postavke', label: t('nav_settings'), icon: Settings }] },
  ] as { title: string; items: Item[] }[];
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const t = useDict(adm, 'admin');
  const groups = useNav();
  const email = useDb((s) => s.settings.adminEmail);
  const logout = useUi((s) => s.logout);
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[72px] items-center px-5">
        <Link to="/admin" onClick={onNavigate} className="flex items-center gap-2.5">
          <Logo tone="light" className="h-10" />
          <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-paper/70">CMS</span>
        </Link>
      </div>
      <nav className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-3 pb-6 pt-2">
        {groups.map((g) => (
          <div key={g.title}>
            <div className="mb-1.5 px-3 text-[10.5px] font-bold uppercase tracking-[0.18em] text-paper/35">{g.title}</div>
            <ul className="space-y-0.5">
              {g.items.map((it) => (
                <li key={it.to}>
                  <NavLink
                    to={it.to}
                    end={it.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors',
                        isActive ? 'bg-white/[0.09] text-white' : 'text-paper/65 hover:bg-white/[0.05] hover:text-white',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <it.icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-brand-300' : 'text-paper/45 group-hover:text-paper/80')} />
                        <span className="flex-1 truncate">{it.label}</span>
                        {!!it.badge && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1.5 text-[10.5px] font-bold text-white">{it.badge}</span>}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <a href="/" target="_blank" rel="noreferrer" className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium text-paper/65 hover:bg-white/[0.05] hover:text-white">
          <ExternalLink className="h-[18px] w-[18px] text-paper/45" /> {t('viewSite')}
        </a>
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.05] p-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">S</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-white">SELCA Admin</span>
            <span className="block truncate text-[11.5px] text-paper/50">{email}</span>
          </span>
          <button
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
            className="grid h-8 w-8 place-items-center rounded-lg text-paper/55 hover:bg-white/10 hover:text-white"
            title={t('logout')}
            aria-label={t('logout')}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Notifications() {
  const t = useDict(adm, 'admin');
  const lang = useLang('admin');
  const orders = useDb((s) => s.orders);
  const inquiries = useDb((s) => s.inquiries);
  const markAllOrdersSeen = useDb((s) => s.markAllOrdersSeen);
  const updateInquiry = useDb((s) => s.updateInquiry);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const items = useMemo(() => {
    const o = orders.filter((x) => !x.seen).map((x) => ({ id: x.id, at: x.createdAt, to: `/admin/narudzbe/${x.id}`, title: t('newOrder', { n: x.number }), sub: `${x.customer.firstName} ${x.customer.lastName} · ${money(x.total, lang)}`, kind: 'order' as const }));
    const q = inquiries.filter((x) => !x.seen).map((x) => ({ id: x.id, at: x.createdAt, to: '/admin/upiti', title: t('newInquiry', { name: x.name }), sub: x.message.slice(0, 60), kind: 'inq' as const }));
    return [...o, ...q].sort((a, b) => b.at.localeCompare(a.at));
  }, [orders, inquiries, t, lang]);

  // Toast when a new order arrives from the storefront (another tab)
  const seenIds = useRef<Set<string> | null>(null);
  useEffect(() => {
    const unseen = orders.filter((o) => !o.seen);
    if (seenIds.current === null) {
      seenIds.current = new Set(unseen.map((o) => o.id));
      return;
    }
    for (const o of unseen) {
      if (!seenIds.current.has(o.id)) {
        seenIds.current.add(o.id);
        toast.success(t('newOrder', { n: o.number }), { description: `${o.customer.firstName} ${o.customer.lastName} · ${money(o.total, lang)}` });
      }
    }
  }, [orders, t, lang]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative grid h-10 w-10 place-items-center rounded-lg text-ink-soft hover:bg-ink/[0.05] hover:text-ink" aria-label={t('notifications')}>
        <Bell className="h-[19px] w-[19px]" />
        {items.length > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 animate-pop place-items-center rounded-full bg-brand-600 px-1 text-[9.5px] font-bold text-white">{items.length}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 top-full z-50 mt-2 w-[340px] overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-sm font-bold">{t('notifications')}</span>
              {items.length > 0 && (
                <button
                  className="text-xs font-semibold text-brand-700 hover:underline"
                  onClick={() => {
                    markAllOrdersSeen();
                    inquiries.filter((q) => !q.seen).forEach((q) => updateInquiry(q.id, { seen: true }));
                  }}
                >
                  {t('markAllRead')}
                </button>
              )}
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted">{t('noNotifications')}</p>
              ) : (
                items.map((n) => (
                  <Link key={n.id} to={n.to} onClick={() => setOpen(false)} className="flex gap-3 border-b border-line/60 px-4 py-3 last:border-0 hover:bg-canvas/60">
                    <span className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full', n.kind === 'order' ? 'bg-brand-50 text-brand-700' : 'bg-sky-50 text-sky-700')}>
                      {n.kind === 'order' ? <ShoppingCart className="h-4 w-4" /> : <Inbox className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-ink">{n.title}</span>
                      <span className="block truncate text-xs text-muted">{n.sub}</span>
                      <span className="mt-0.5 block text-[11px] text-muted/80">{timeAgo(n.at, lang)}</span>
                    </span>
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminLayout() {
  const t = useDict(adm, 'admin');
  const [mobile, setMobile] = useState(false);
  const location = useLocation();
  const companyName = useDb((s) => s.settings.companyName);

  useEffect(() => setMobile(false), [location.pathname]);
  useEffect(() => {
    document.title = `CMS — ${companyName}`;
  }, [companyName, location.pathname]);

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] bg-ink lg:block">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobile && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0 bg-ink/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobile(false)} />
            <motion.aside className="absolute inset-y-0 left-0 w-[280px] bg-ink" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.3 }}>
              <button onClick={() => setMobile(false)} className="absolute right-3 top-5 grid h-9 w-9 place-items-center rounded-lg text-paper/70 hover:bg-white/10" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
              <SidebarContent onNavigate={() => setMobile(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line/80 bg-canvas/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button onClick={() => setMobile(true)} className="-ml-1 grid h-10 w-10 place-items-center rounded-lg hover:bg-ink/[0.05] lg:hidden" aria-label={t('menu')}>
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/admin" className="lg:hidden">
            <LogoMark className="h-7" />
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <span className="mr-2 hidden items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 ring-1 ring-amber-600/20 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {t('demoData')}
            </span>
            <LangSwitcher scope="admin" compact />
            <Notifications />
            <a href="/" target="_blank" rel="noreferrer" className="ml-1 hidden h-9 items-center gap-2 rounded-lg bg-ink px-3.5 text-[13px] font-semibold text-paper hover:bg-ink-soft sm:inline-flex">
              {t('viewSite')} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
      <ConfirmHost />
    </div>
  );
}
