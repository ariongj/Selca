import { AnimatePresence, motion } from 'motion/react';
import { Eye, EyeOff, Trash2, X } from 'lucide-react';
import { useDict } from '@/i18n';
import { pd } from './dict';

/** Floating action bar shown while rows are selected in the product list. */
export function BulkBar({ count, onActivate, onDeactivate, onDelete, onClear }: { count: number; onActivate: () => void; onDeactivate: () => void; onDelete: () => void; onClear: () => void }) {
  const t = useDict(pd, 'admin');
  const btn = 'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition-colors';
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="fixed bottom-5 left-1/2 z-50 flex w-max max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-1 rounded-2xl bg-ink p-1.5 pl-4 text-paper shadow-2xl lg:left-[calc(50%+130px)]"
        >
          <span className="mr-2 flex items-center gap-2 whitespace-nowrap text-[13px] font-semibold">
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold tabular-nums text-white">{count}</span>
            <span className="max-sm:hidden">{t('selected')}</span>
          </span>
          <button type="button" onClick={onActivate} className={`${btn} hover:bg-white/10`}>
            <Eye className="h-4 w-4 text-emerald-300" /> <span className="max-[420px]:sr-only">{t('bulkActivate')}</span>
          </button>
          <button type="button" onClick={onDeactivate} className={`${btn} hover:bg-white/10`}>
            <EyeOff className="h-4 w-4 text-paper/60" /> <span className="max-[420px]:sr-only">{t('bulkDeactivate')}</span>
          </button>
          <button type="button" onClick={onDelete} className={`${btn} text-red-300 hover:bg-red-500/15 hover:text-red-200`}>
            <Trash2 className="h-4 w-4" /> <span className="max-[420px]:sr-only">{t('delete')}</span>
          </button>
          <span className="mx-1 h-6 w-px bg-white/15" />
          <button type="button" onClick={onClear} title={t('clearSelection')} aria-label={t('clearSelection')} className="grid h-9 w-9 place-items-center rounded-lg text-paper/70 hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
