import { useEffect, useState } from 'react';
import type { Ctx } from '../ctx';
import { RED, byUse, catView, dateKey, dayMonth, fmt, fmtTyping, pressKey, uid, validAmt } from '../model';
import { Back, Backspace, Check, Close } from '../icons';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];
const sel = (on: boolean) => ({ background: on ? 'var(--color-accent)' : 'var(--color-neutral-100)', color: on ? 'var(--color-neutral-100)' : 'var(--color-text)', borderColor: on ? 'var(--color-accent)' : 'var(--color-divider)' });

/** Logging flow A — keypad first, usual category preselected, then a review step before saving. */
export function LogSheet({ ctx, initialCat }: { ctx: Ctx; initialCat?: string }) {
  const { data, update, month, now } = ctx;
  const order = byUse(data, month);
  // "usual" = most-used category this month; nothing is usual until something is logged.
  const usual = data.entries.some(e => e.cat === order[0] && e.date.startsWith(month)) ? order[0] : undefined;
  const [amt, setAmt] = useState('');
  const [catId, setCatId] = useState(initialCat || usual || order[0]);
  const [sub, setSub] = useState<string | null>(null);
  const [step, setStep] = useState<'pad' | 'review'>('pad');
  const [shake, setShake] = useState(0);

  const cat = data.cats.find(c => c.id === catId) || data.cats[0];
  const valid = validAmt(amt);
  const err = amt && !valid ? (Number(amt) <= 0 ? 'Amount must be more than ₹0' : 'Up to 2 decimals') : '';
  const dest = cat.emoji + ' ' + cat.name + (sub ? ' › ' + sub : '');

  const press = (k: string) => {
    const n = pressKey(amt, k);
    if (n === null) setShake(Date.now());
    else setAmt(n);
  };
  const toReview = () => { if (valid) setStep('review'); };
  const save = () => {
    if (!valid) return;
    const e = { id: uid('e'), cat: cat.id, sub, amt: Number(amt), date: dateKey(now) };
    update(d => ({ ...d, entries: [...d.entries, e], lastAmt: e.amt }));
    ctx.back();
    ctx.toast(`${fmt(e.amt)} filed in ${dest}`, () => update(d => ({ ...d, entries: d.entries.filter(x => x.id !== e.id) })));
  };

  // A hardware keyboard works too.
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      if (step === 'pad') {
        if (/^[0-9.]$/.test(ev.key)) press(ev.key);
        else if (ev.key === 'Backspace') press('del');
        else if (ev.key === 'Enter') toReview();
        else if (ev.key === 'Escape') ctx.back();
      } else if (ev.key === 'Enter') save();
      else if (ev.key === 'Escape' || ev.key === 'Backspace') setStep('pad');
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  const cv = catView(cat, data, month);
  const after = cv.spent + Number(amt || 0);

  return (
    <>
      <div className="scrim" onClick={ctx.back} style={{ zIndex: 10 }} />
      <div role="dialog" aria-modal="true" aria-label="Log expense" className="sheet" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 11, background: 'var(--color-bg)', borderRadius: '32px 32px 0 0', padding: '10px 18px calc(20px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: 'var(--shadow-lg)', maxHeight: '100%', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 5, borderRadius: 999, background: 'var(--color-neutral-400)', alignSelf: 'center', flex: 'none' }} />

        {step === 'pad' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0 }}>Log expense</h4>
              <button onClick={ctx.back} aria-label="Close" className="ib ghost"><Close /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 64 }}>
              <div key={shake} className={shake ? 'shake' : ''} aria-live="polite" style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-heading)', fontSize: 52, lineHeight: 1, color: amt ? 'var(--color-text)' : 'var(--color-neutral-500)', overflow: 'hidden', whiteSpace: 'nowrap' }}>₹{fmtTyping(amt)}</div>
              {!amt && data.lastAmt > 0 && <button onClick={() => setAmt(String(data.lastAmt))} className="last">Last · {fmt(data.lastAmt)}</button>}
            </div>
            {err && <div style={{ fontSize: 13, fontWeight: 600, color: RED.fg, marginTop: -8 }}>{err}</div>}

            <div className="hscroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -18px', padding: '2px 18px', flex: 'none' }}>
              {order.map(id => data.cats.find(c => c.id === id)!).map(c => (
                <button key={c.id} onClick={() => { setCatId(c.id); setSub(null); }} aria-pressed={c.id === cat.id} className="hb pr96" style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 6, height: 44, padding: '0 14px 0 10px', borderRadius: 999, border: '1.5px solid', ...sel(c.id === cat.id), font: '600 14px var(--font-body)', cursor: 'pointer' }}>
                  <span style={{ fontSize: 20 }}>{c.emoji}</span>{c.name}
                  {c.id === usual && <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.8 }}>· usual</span>}
                </button>
              ))}
            </div>

            {cat.subs.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--color-neutral-700)', fontWeight: 600 }}>Sub</span>
                {cat.subs.map(n => (
                  <button key={n} onClick={() => setSub(sub === n ? null : n)} aria-pressed={sub === n} className="hb pr96" style={{ height: 34, padding: '0 13px', borderRadius: 999, border: '1.5px solid', ...sel(sub === n), font: '600 13px var(--font-body)', cursor: 'pointer' }}>{n}</button>
                ))}
              </div>
            )}

            {cat.quick.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {cat.quick.map(q => (
                  <button key={q.id} onClick={() => { setAmt(String(q.amt)); if (q.sub && cat.subs.includes(q.sub)) setSub(q.sub); }} className="sage" style={{ height: 36, padding: '0 13px', borderRadius: 999, font: '600 13px var(--font-body)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 15, lineHeight: 1 }}>⚡</span>{q.label} {fmt(q.amt)}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {KEYS.map(k => (
                <button key={k} onClick={() => press(k)} aria-label={k === 'del' ? 'Delete' : k} className="key">
                  {k === 'del' ? <Backspace size={24} /> : k}
                </button>
              ))}
            </div>
            <button onClick={toReview} disabled={!valid} className="dim" style={{ height: 56, borderRadius: 999, border: 'none', background: valid ? 'var(--color-accent)' : 'var(--color-neutral-300)', color: valid ? 'var(--color-neutral-100)' : 'var(--color-neutral-700)', fontFamily: 'var(--font-heading)', fontSize: 18, cursor: valid ? 'pointer' : 'not-allowed', flex: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 18px' }}>
              Review · {dest}
            </button>
          </>
        )}

        {step === 'review' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setStep('pad')} aria-label="Back" className="ib ghost"><Back /></button>
              <h4 style={{ margin: 0 }}>Check before saving</h4>
            </div>
            <div style={{ background: 'var(--color-surface)', borderRadius: 32, padding: '26px 22px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-neutral-700)' }}>You’re saving</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 52, lineHeight: 1 }}>{fmt(Number(amt))}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 700, marginTop: 4 }}>
                <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--color-neutral-100)', display: 'grid', placeItems: 'center', fontSize: 22, flex: 'none' }}>{cat.emoji}</span>{dest}
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>
                Today, {dayMonth(dateKey(now))} · After this: {fmt(after)} of {fmt(cat.budget)}{after > cat.budget ? ` — ${fmt(after - cat.budget)} over` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('pad')} className="bo" style={{ flex: 1, height: 56, fontSize: 17 }}>Edit</button>
              <button onClick={save} autoFocus className="bp" style={{ flex: 2, height: 56, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Check />Save</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
