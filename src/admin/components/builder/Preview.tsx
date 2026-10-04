import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ExternalLink, Lock, Monitor, RotateCw, Smartphone, Tablet } from 'lucide-react';
import type { Lang } from '@/lib/types';
import { LANGS, useDict } from '@/i18n';
import { useUi } from '@/store/ui';
import { useDb } from '@/store/db';
import { cn } from '@/lib/utils';
import { B } from './i18n';

export type Device = 'desktop' | 'tablet' | 'mobile';

const DEVICES: Record<Device, { w: number; h: number; icon: typeof Monitor; bezel: number }> = {
  desktop: { w: 1280, h: 0, icon: Monitor, bezel: 0 },
  tablet: { w: 820, h: 1180, icon: Tablet, bezel: 12 },
  mobile: { w: 390, h: 844, icon: Smartphone, bezel: 9 },
};
const CHROME = 38;
const PREVIEW_URL = '/?preview=1';

/**
 * Live storefront preview: the real homepage in an iframe, scaled to fit the panel.
 * It re-renders by itself — the iframe's stores rehydrate on the localStorage `storage` event.
 */
export function Preview({
  device,
  onDevice,
  focus,
  reloadTick,
  className,
}: {
  device: Device;
  onDevice: (d: Device) => void;
  focus: { id: string; n: number } | null;
  reloadTick: number;
  className?: string;
}) {
  const t = useDict(B, 'admin');
  const siteLang = useUi((s) => s.lang);
  const setSiteLang = useUi((s) => s.setLang);
  const domain = useDb((s) => s.settings.adminEmail.split('@')[1] || 'selca.me');
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [loaded, setLoaded] = useState(false);
  const [frameKey, setFrameKey] = useState(0);

  // Measure the stage (keeps the last non-zero size while the panel is hidden on mobile)
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    // clientWidth/Height include the stage padding (the geometry below subtracts it)
    const ro = new ResizeObserver(() => {
      const width = el.clientWidth;
      const height = el.clientHeight;
      if (width > 0 && height > 0) setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const reload = useCallback(() => {
    setLoaded(false);
    setFrameKey((k) => k + 1);
  }, []);

  const firstReload = useRef(true);
  useEffect(() => {
    if (firstReload.current) {
      firstReload.current = false;
      return;
    }
    reload();
  }, [reloadTick, reload]);

  // Scroll the preview to the focused section once it exists in the iframe's DOM
  useEffect(() => {
    if (!loaded || !focus) return;
    let tries = 0;
    let timer = 0;
    const tick = () => {
      const win = frameRef.current?.contentWindow;
      const doc = frameRef.current?.contentDocument;
      const ready = !!doc?.querySelector(`[data-section="${CSS.escape(focus.id)}"]`);
      if (win && ready) {
        win.postMessage({ type: 'selca:scrollTo', id: focus.id }, window.location.origin);
      } else if (tries++ < 25) {
        timer = window.setTimeout(tick, 120);
      }
    };
    timer = window.setTimeout(tick, 140);
    return () => window.clearTimeout(timer);
  }, [focus, loaded, device]);

  const onLoad = () => {
    // Hide the storefront's floating "demo → CMS" badge inside the preview only.
    try {
      const doc = frameRef.current?.contentDocument;
      if (doc && !doc.getElementById('selca-builder-preview')) {
        const st = doc.createElement('style');
        st.id = 'selca-builder-preview';
        st.textContent = 'a.fixed[href="/admin"]{display:none!important}';
        doc.head.appendChild(st);
      }
    } catch {
      /* cross-origin — ignore */
    }
    setLoaded(true);
  };

  // Geometry
  const d = DEVICES[device];
  const pad = size.w < 520 ? 12 : 20;
  let scale = 1;
  const innerW = d.w;
  let innerH = d.h;
  let boxW = 0;
  let boxH = 0;
  if (device === 'desktop') {
    const availW = size.w - pad * 2;
    const availH = size.h - pad * 2 - CHROME;
    scale = Math.min(1, availW / d.w);
    boxW = d.w * scale;
    boxH = Math.max(0, availH);
    innerH = boxH / scale;
  } else {
    const availW = size.w - pad * 2 - d.bezel * 2;
    const availH = size.h - pad * 2 - d.bezel * 2;
    scale = Math.min(1, availW / d.w, availH / d.h);
    boxW = d.w * scale;
    boxH = d.h * scale;
  }
  const measured = size.w > 0;

  return (
    <section className={cn('flex min-h-0 flex-col overflow-hidden rounded-2xl border border-line/80 bg-white shadow-[0_1px_2px_rgb(28_26_23/0.04)]', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-line/70 px-3 py-2.5 sm:px-4">
        <div className="mr-auto hidden min-w-0 items-center gap-2 md:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="truncate text-[13.5px] font-bold text-ink">{t('livePreview')}</span>
        </div>

        <div className="flex rounded-lg bg-canvas p-0.5 max-md:mr-auto" role="tablist">
          {(Object.keys(DEVICES) as Device[]).map((k) => {
            const Icon = DEVICES[k].icon;
            return (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={device === k}
                onClick={() => onDevice(k)}
                title={t(k)}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-semibold transition-colors',
                  device === k ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink',
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden 2xl:inline">{t(k)}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center rounded-lg bg-canvas p-0.5" title={t('siteLang')}>
          {LANGS.map((lg) => (
            <button
              key={lg.code}
              type="button"
              onClick={() => setSiteLang(lg.code as Lang)}
              className={cn('h-8 rounded-md px-2 text-[11px] font-bold tracking-wide transition-colors', siteLang === lg.code ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink')}
            >
              {lg.short}
            </button>
          ))}
        </div>

        <button type="button" onClick={reload} title={t('reload')} aria-label={t('reload')} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-soft transition hover:bg-canvas hover:text-ink">
          <RotateCw className={cn('h-4 w-4', !loaded && 'animate-spin')} />
        </button>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          title={t('openSite')}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-ink-soft ring-1 ring-line transition hover:bg-canvas hover:text-ink"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">{t('openSite')}</span>
        </a>
      </div>

      {/* Stage */}
      <div
        ref={stageRef}
        className={cn('relative min-h-0 flex-1 overflow-hidden bg-[#ebe5dc]', device === 'desktop' ? 'flex justify-center' : 'grid place-items-center')}
        style={{ backgroundImage: 'radial-gradient(rgb(28 26 23 / 0.09) 1px, transparent 1px)', backgroundSize: '18px 18px', padding: pad }}
      >
        {measured && (
          <div
            className={cn(
              'relative flex flex-col overflow-hidden transition-[width,height] duration-300 ease-out',
              device === 'desktop' && 'rounded-xl bg-white shadow-[0_24px_60px_-28px_rgb(28_26_23/0.5)] ring-1 ring-ink/10',
              device === 'tablet' && 'rounded-[30px] bg-ink shadow-[0_30px_70px_-30px_rgb(28_26_23/0.7)] ring-1 ring-black/40',
              device === 'mobile' && 'rounded-[38px] bg-ink shadow-[0_30px_70px_-30px_rgb(28_26_23/0.7)] ring-1 ring-black/40',
            )}
            style={{ width: boxW + d.bezel * 2, height: boxH + d.bezel * 2 + (device === 'desktop' ? CHROME : 0), padding: d.bezel }}
          >
            {device === 'desktop' && (
              <div className="flex shrink-0 items-center gap-3 border-b border-line/80 bg-[#f6f3ef] px-3.5" style={{ height: CHROME }}>
                <span className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ec6a5e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f4be4f]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#61c454]" />
                </span>
                <span className="mx-auto flex h-6 min-w-0 max-w-[60%] flex-1 items-center justify-center gap-1.5 rounded-md bg-white px-3 text-[11.5px] font-medium text-muted ring-1 ring-line/80">
                  <Lock className="h-3 w-3 shrink-0" />
                  <span className="truncate">{domain}</span>
                </span>
                <span className="w-[42px]" />
              </div>
            )}
            <div
              className={cn('relative overflow-hidden bg-paper', device === 'tablet' && 'rounded-[18px]', device === 'mobile' && 'rounded-[30px]')}
              style={{ width: boxW, height: boxH }}
            >
              <iframe
                key={frameKey}
                ref={frameRef}
                src={PREVIEW_URL}
                title={t('livePreview')}
                onLoad={onLoad}
                className="absolute left-0 top-0 border-0 bg-paper"
                style={{ width: innerW, height: innerH, transform: `scale(${scale})`, transformOrigin: '0 0' }}
              />
              <div className={cn('pointer-events-none absolute inset-0 grid place-items-center bg-paper transition-opacity duration-300', loaded ? 'opacity-0' : 'opacity-100')}>
                <div className="flex flex-col items-center gap-3 text-[13px] font-medium text-muted">
                  <span className="h-7 w-7 animate-spin rounded-full border-2 border-ink/15 border-t-brand-600" />
                  {t('loadingPreview')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
