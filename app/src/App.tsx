import { useCallback, useEffect, useRef, useState } from 'react';
import type { Ctx, Screen } from './ctx';
import { type Data, fileRecurring, fmt, load, monthKey, save } from './model';
import { Check, Close, Plus } from './icons';
import { Welcome, SetupCats, SetupBudgets } from './screens/Setup';
import { Overview } from './screens/Overview';
import { Insights } from './screens/Insights';
import { Detail } from './screens/Detail';
import { Manage } from './screens/Manage';
import { Settings } from './screens/Settings';
import { LogSheet } from './screens/LogSheet';

type Toast = { text: string; undo?: () => void } | null;
type LogOpts = { cat?: string; entryId?: string; key: number };

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
  const [log, setLog] = useState<LogOpts | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const scRef = useRef<HTMLDivElement>(null);
  const tt = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { save(data); }, [data]);
  useEffect(() => { navigator.storage?.persist?.().catch(() => {}); }, []);

  // Theme: the palette swap lives in app.css under [data-theme].
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = data.theme;
    const meta = document.querySelector('meta[name=theme-color]');
    const apply = () => meta?.setAttribute('content', getComputedStyle(root).getPropertyValue('--color-bg').trim() || '#f5ead8');
    apply();
    const mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [data.theme]);

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
    showToast(`Filed ${filed.length} fixed bill${filed.length === 1 ? '' : 's'} · ${fmt(total)}`, () =>
      setData(d => ({ ...d, entries: d.entries.filter(e => !ids.has(e.id)) })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, data.setupDone]);

  // ── navigation: every screen and sheet is a history entry, so the phone's back button walks back through them.
  // history.state.khata holds the depth; on popstate, every layer above the new depth is closed.
  const closers = useRef<(() => void)[]>([]);
  const guard = useRef<(() => boolean) | null>(null);
  const waiting = useRef<(() => void)[]>([]);
  const pending = useRef(0); // back steps requested but not yet delivered by popstate
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const depth = (e.state && e.state.khata) || 0;
      pending.current = Math.max(0, pending.current - (closers.current.length - depth));
      if (depth < closers.current.length && guard.current && guard.current()) {
        // Blocked (e.g. unsaved settings): put the history entries back.
        for (let i = depth; i < closers.current.length; i++) history.pushState({ khata: i + 1 }, '');
        return;
      }
      while (closers.current.length > depth) closers.current.pop()!();
      waiting.current.splice(0).forEach(r => r());
    };
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);
  const layer = useCallback((close: () => void) => {
    closers.current.push(close);
    history.pushState({ khata: closers.current.length }, '');
  }, []);
  const back = useCallback((n = 1) => new Promise<void>(resolve => {
    n = Math.min(n, closers.current.length - pending.current);
    if (n <= 0) return resolve();
    pending.current += n;
    waiting.current.push(resolve);
    history.go(-n);
  }), []);
  const scrollTop = () => { if (scRef.current) scRef.current.scrollTop = 0; };

  const ctx: Ctx = {
    data, update, now, month, toast: showToast, back, layer,
    open: (s, id) => {
      const prev = screen, prevId = detailId;
      layer(() => { setScreen(prev); setDetailId(prevId); guard.current = null; });
      setScreen(s); if (id) setDetailId(id); scrollTop();
    },
    reset: s => {
      const n = closers.current.length;
      closers.current = [];
      guard.current = null;
      pending.current = 0;
      if (n) history.go(-n); // popstate finds nothing to close
      setScreen(s); setLog(null); scrollTop();
    },
    showDetail: id => { setDetailId(id); scrollTop(); },
    openLog: opts => { layer(() => setLog(null)); setLog({ ...opts, key: Date.now() }); },
    setGuard: fn => { guard.current = fn; }
  };

  const detail = data.cats.find(c => c.id === detailId);
  const on = (s: Screen) => screen === s;
  const fab = (on('overview') || (on('detail') && detail)) && !log;

  return (
    <div className="shell">
      <div className="phone" id="phone">
        <div ref={scRef} className="scroll">
          {on('welcome') && <Welcome ctx={ctx} />}
          {on('setup-cats') && <SetupCats ctx={ctx} />}
          {on('setup-budgets') && <SetupBudgets ctx={ctx} />}
          {on('overview') && <Overview ctx={ctx} />}
          {on('insights') && <Insights ctx={ctx} />}
          {on('detail') && detail && <Detail ctx={ctx} cat={detail} />}
          {on('manage') && <Manage ctx={ctx} />}
          {on('settings') && <Settings ctx={ctx} />}
        </div>

        {fab && (
          <button onClick={() => ctx.openLog(on('detail') ? { cat: detailId } : undefined)} className="bp pr98" style={{ position: 'absolute', right: 18, bottom: 'calc(22px + env(safe-area-inset-bottom))', height: 60, padding: '0 24px 0 18px', fontSize: 18, display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--shadow-lg)', zIndex: 4 }}>
            <Plus size={22} />Add expense
          </button>
        )}

        {log && <LogSheet key={log.key} ctx={ctx} lockedCat={log.cat} entryId={log.entryId} />}

        {toast && (
          <div role="status" className="sheet" style={{ position: 'absolute', left: 14, right: 14, bottom: 'calc(96px + env(safe-area-inset-bottom))', zIndex: 20, background: 'var(--color-neutral-900)', color: 'var(--color-neutral-100)', borderRadius: 24, padding: '10px 10px 10px 18px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-lg)' }}>
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
      </div>
    </div>
  );
}
