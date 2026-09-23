import { useCallback, useEffect, useRef, useState } from 'react';
import type { Ctx, DialogKind, Screen } from './ctx';
import { type Data, fileRecurring, fmt, load, monthKey, save } from './model';
import { Check, Close } from './icons';
import { Welcome, SetupCats, SetupBudgets } from './screens/Setup';
import { Overview } from './screens/Overview';
import { Insights } from './screens/Insights';
import { Detail, DetailDialog } from './screens/Detail';
import { Settings } from './screens/Settings';
import { LogSheet } from './screens/LogSheet';

type Toast = { text: string; undo?: () => void } | null;
type Dialog = { kind: DialogKind; entryId?: string } | null;

/** Re-reads the clock whenever the app comes back to the foreground, so "today" stays right. */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') setNow(new Date()); };
    document.addEventListener('visibilitychange', tick);
    const t = setInterval(tick, 60_000);
    return () => { document.removeEventListener('visibilitychange', tick); clearInterval(t); };
  }, []);
  return now;
}

export default function App() {
  const now = useNow();
  const month = monthKey(now);
  const [data, setData] = useState<Data>(() => load(new Date()));
  const [screen, setScreen] = useState<Screen>(() => (data.setupDone ? 'overview' : 'welcome'));
  const [detailId, setDetailId] = useState<string>('');
  const [logOpen, setLogOpen] = useState<{ cat?: string; key: number } | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [toast, setToast] = useState<Toast>(null);
  const scRef = useRef<HTMLDivElement>(null);
  const tt = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { save(data); }, [data]);
  useEffect(() => { navigator.storage?.persist?.().catch(() => {}); }, []);

  const update = useCallback((fn: (d: Data) => Data) => setData(fn), []);

  const showToast = useCallback((text: string, undo?: () => void) => {
    clearTimeout(tt.current);
    setToast({ text, undo });
    tt.current = setTimeout(() => setToast(null), 5000);
  }, []);
  useEffect(() => () => clearTimeout(tt.current), []);

  // Monthly amounts: file anything due since the app was last opened.
  useEffect(() => {
    const { data: next, filed } = fileRecurring(data, now);
    if (!filed.length) return;
    setData(next);
    const ids = new Set(filed.map(e => e.id));
    const total = filed.reduce((a, e) => a + e.amt, 0);
    showToast(`Filed ${filed.length} monthly amount${filed.length === 1 ? '' : 's'} · ${fmt(total)}`, () => {
      setData(d => ({ ...d, entries: d.entries.filter(e => !ids.has(e.id)) }));
      setToast(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, data.setupDone]);

  // ── navigation: every layer is a history entry, so the phone's back button walks back through them ──
  const closers = useRef<(() => void)[]>([]);
  const skip = useRef(0);
  useEffect(() => {
    const onPop = () => {
      if (skip.current > 0) { skip.current--; return; }
      closers.current.pop()?.();
    };
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);
  const pushLayer = (close: () => void) => {
    closers.current.push(close);
    history.pushState({ khata: closers.current.length }, '');
  };
  const back = useCallback(() => { if (closers.current.length) history.back(); }, []);
  /** Forget the top `n` layers without running their closers. */
  const drop = (n: number) => {
    n = Math.min(n, closers.current.length);
    if (!n) return;
    closers.current.splice(-n);
    skip.current++;
    history.go(-n);
  };
  const scrollTop = () => { if (scRef.current) scRef.current.scrollTop = 0; };

  const ctx: Ctx = {
    data, update, now, month, toast: showToast, back,
    open: (s, id) => {
      const prev = screen, prevId = detailId;
      pushLayer(() => { setScreen(prev); setDetailId(prevId); setDialog(null); });
      setScreen(s); if (id) setDetailId(id); setDialog(null); scrollTop();
    },
    reset: s => { drop(closers.current.length); setScreen(s); setDialog(null); setLogOpen(null); scrollTop(); },
    openLog: cat => { pushLayer(() => setLogOpen(null)); setLogOpen({ cat, key: Date.now() }); },
    openDialog: (kind, entryId) => {
      if (dialog) setDialog({ kind, entryId }); // swap in place (e.g. Delete → Merge instead)
      else { pushLayer(() => setDialog(null)); setDialog({ kind, entryId }); }
    }
  };
  /** Close the dialog, then leave the detail screen and land on another. Used by merge and delete. */
  const leaveDetail = (to: Screen, id?: string) => {
    setDialog(null);
    if (to === 'detail' && id) {
      drop(1); // just the dialog — detail stays open, now on another category
      setDetailId(id);
    } else {
      drop(2);
      setScreen(to);
    }
    scrollTop();
  };

  const detail = data.cats.find(c => c.id === detailId);
  const onScreen = (s: Screen) => screen === s;

  return (
    <div className="shell">
      <div className="phone">
        <div ref={scRef} className="scroll">
          {onScreen('welcome') && <Welcome ctx={ctx} />}
          {onScreen('setup-cats') && <SetupCats ctx={ctx} />}
          {onScreen('setup-budgets') && <SetupBudgets ctx={ctx} />}
          {onScreen('overview') && <Overview ctx={ctx} />}
          {onScreen('insights') && <Insights ctx={ctx} />}
          {onScreen('detail') && detail && <Detail ctx={ctx} cat={detail} />}
          {onScreen('settings') && <Settings ctx={ctx} />}
        </div>

        {onScreen('overview') && !logOpen && (
          <button onClick={() => ctx.openLog()} className="bp pr98" style={{ position: 'absolute', right: 18, bottom: 'calc(22px + env(safe-area-inset-bottom))', height: 60, padding: '0 24px 0 18px', fontSize: 18, display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--shadow-lg)', zIndex: 4 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14M12 5v14" /></svg>Log expense
          </button>
        )}

        {logOpen && <LogSheet key={logOpen.key} ctx={ctx} initialCat={logOpen.cat} />}

        {toast && (
          <div role="status" style={{ position: 'absolute', left: 14, right: 14, bottom: 'calc(96px + env(safe-area-inset-bottom))', zIndex: 20, background: 'var(--color-neutral-900)', color: 'var(--color-neutral-100)', borderRadius: 24, padding: '10px 10px 10px 18px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-lg)' }} className="sheet">
            <Check stroke="var(--color-accent-2-300)" style={{ flex: 'none' }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{toast.text}</span>
            {toast.undo && (
              <button onClick={() => { toast.undo!(); setToast(null); }} className="undo" style={{ flex: 'none', height: 40, padding: '0 16px', borderRadius: 999, border: 'none', background: 'var(--color-accent-400)', color: 'var(--color-neutral-900)', font: '700 14px var(--font-body)', cursor: 'pointer' }}>Undo</button>
            )}
            <button onClick={() => setToast(null)} aria-label="Dismiss" className="toast-x" style={{ flex: 'none', width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'transparent', color: 'var(--color-neutral-300)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
              <Close size={16} />
            </button>
          </div>
        )}

        {dialog && detail && (
          <>
            <div className="scrim" onClick={back} style={{ zIndex: 30 }} />
            <div role="dialog" aria-modal="true" className="sheet" style={{ position: 'absolute', left: 12, right: 12, bottom: 'calc(16px + env(safe-area-inset-bottom))', zIndex: 31, background: 'var(--color-bg)', borderRadius: 32, padding: '22px 20px 18px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: 'var(--shadow-lg)' }}>
              <DetailDialog key={dialog.kind + (dialog.entryId || "")} ctx={ctx} cat={detail} kind={dialog.kind} entryId={dialog.entryId} leave={leaveDetail} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
