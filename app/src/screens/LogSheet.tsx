import { useEffect, useState } from 'react';
import type { Ctx } from '../ctx';
import { byUse, catView, dateKey, dayMonth, fmt, fmtTyping, pressKey, uid, validAmt } from '../model';
import { Back, Backspace, Check, Close, Trash } from '../icons';
import { sel } from '../ui';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];
const label40 = { width: 40, fontSize: 12, color: 'var(--color-neutral-700)', fontWeight: 600 } as const;
const ease = '.45s cubic-bezier(.22,.8,.26,1)';

/**
 * Add expense (keypad first, then a review step), or edit an entry.
 * Opened from a category page, the category is locked in until you tap Change.
 */
export function LogSheet({ ctx, lockedCat, entryId }: { ctx: Ctx; lockedCat?: string; entryId?: string }) {
  const { data, update, month, now } = ctx;
  const entry = entryId ? data.entries.find(e => e.id === entryId) : undefined;
  const firstCat = entry?.cat || lockedCat;
  const [amt, setAmt] = useState(entry ? String(entry.amt) : '');
  const [catId, setCatId] = useState<string | null>(firstCat || null);
  const [sub, setSub] = useState<string | null>(entry?.sub || null);
  const [locked, setLocked] = useState(!!firstCat);
  const [step, setStep] = useState<'pad' | 'review'>('pad');
  const [shake, setShake] = useState(0);
  const [sliding, setSliding] = useState(false);

  const cat = data.cats.find(c => c.id === catId);
  const amtOk = validAmt(amt);
  const valid = amtOk && !!cat;
  const err = amt && !amtOk ? (Number(amt) <= 0 ? 'Amount must be more than ₹0' : 'Up to 2 decimals') : '';
  const dest = cat ? cat.emoji + ' ' + cat.name + (sub ? ' › ' + sub : '') : '';
  const order = byUse(data, month);
  const chips = [...order.filter(id => id === firstCat), ...order.filter(id => id !== firstCat)].map(id => data.cats.find(c => c.id === id)!);

  // Slider runs from ₹0 to what's left in the category, rounded up to ₹500.
  const cv = cat ? catView(cat, data, month) : null;
  const leftInCat = cv ? cv.budget - cv.spent + (entry && entry.cat === cat?.id ? entry.amt : 0) : 0;
  const max = leftInCat > 0 ? Math.max(500, Math.ceil(leftInCat / 500) * 500) : 2000;
  const stepSize = max <= 2000 ? 10 : max <= 10000 ? 50 : 100;
  const frac = Math.min(Number(amt) || 0, max) / max;

  const press = (k: string) => {
    const n = pressKey(amt, k);
    if (n === null) setShake(Date.now());
    else setAmt(n);
  };
  const add = () => {
    if (!valid || !cat) return;
    const e = { id: uid('e'), cat: cat.id, sub, amt: Number(amt), date: dateKey(now) };
    update(d => ({ ...d, entries: [...d.entries, e], lastAmt: e.amt }));
    ctx.back();
    ctx.toast(`${fmt(e.amt)} filed in ${dest}`, () => update(d => ({ ...d, entries: d.entries.filter(x => x.id !== e.id) })));
  };
  const saveEdit = () => {
    if (!valid || !cat || !entry) return;
    const next = { ...entry, amt: Number(amt), cat: cat.id, sub };
    update(d => ({ ...d, entries: d.entries.map(x => (x.id === entry.id ? next : x)) }));
    ctx.back();
    ctx.toast(`Updated · ${fmt(next.amt)} in ${dest}`, () => update(d => ({ ...d, entries: d.entries.map(x => (x.id === entry.id ? entry : x)) })));
  };
  const remove = () => {
    if (!entry) return;
    const c = data.cats.find(x => x.id === entry.cat);
    update(d => ({ ...d, entries: d.entries.filter(x => x.id !== entry.id) }));
    ctx.back();
    ctx.toast(`Deleted ${fmt(entry.amt)} from ${c ? c.emoji + ' ' + c.name : ''}`, () => update(d => ({ ...d, entries: [...d.entries, entry] })));
  };
  const primary = () => { if (!valid) return; if (entry) saveEdit(); else setStep('review'); };

  // A hardware keyboard works too.
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      if (ev.key === 'Enter' && ev.target instanceof HTMLButtonElement) return; // the button's own click handles it
      if (step === 'pad') {
        if (/^[0-9.]$/.test(ev.key)) press(ev.key);
        else if (ev.key === 'Backspace') press('del');
        else if (ev.key === 'Enter') primary();
        else if (ev.key === 'Escape') ctx.back();
      } else if (ev.key === 'Enter') add();
      else if (ev.key === 'Escape' || ev.key === 'Backspace') setStep('pad');
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  const after = (cv?.spent || 0) + Number(amt || 0);

  return (
    <>
      <div className="scrim" onClick={() => ctx.back()} style={{ zIndex: 10 }} />
      <div role="dialog" aria-modal="true" aria-label={entry ? 'Edit entry' : 'Add expense'} className="sheet bsheet" style={{ zIndex: 11, maxHeight: '100%' }}>
        <div className="handle" />

        {step === 'pad' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, flex: 1 }}>{entry ? 'Edit entry' : 'Add expense'}</h4>
              {entry && <button onClick={remove} aria-label="Delete entry" className="ib danger"><Trash /></button>}
              <button onClick={() => ctx.back()} aria-label="Close" className="ib ghost"><Close /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 64 }}>
              <div key={shake} className={shake ? 'shake' : ''} aria-live="polite" style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-heading)', fontSize: 52, lineHeight: 1, color: amt ? 'var(--color-text)' : 'var(--color-neutral-500)', overflow: 'hidden', whiteSpace: 'nowrap' }}>₹{fmtTyping(amt)}</div>
            </div>
            {err && <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-0)', marginTop: -8 }}>{err}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: -4, flex: 'none' }}>
              <div style={{ position: 'relative', height: 40 }}>
                <div style={{ position: 'absolute', left: 0, right: 0, top: 6, height: 28, borderRadius: 999, background: 'var(--color-neutral-300)', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `calc(20px + (100% - 40px) * ${frac})`, transition: sliding ? 'none' : `width ${ease}`, borderRadius: 999, backgroundColor: 'var(--color-accent)', overflow: 'hidden' }}>
                    <div className="kh-bub a" /><div className="kh-bub b" />
                  </div>
                </div>
                <div style={{ position: 'absolute', top: 0, left: `calc(20px + (100% - 40px) * ${frac})`, transition: sliding ? 'none' : `left ${ease}`, width: 40, height: 40, marginLeft: -20, borderRadius: '50%', background: 'var(--kh-thumb)', boxShadow: 'var(--shadow-md)', pointerEvents: 'none' }} />
                <input type="range" min={0} max={max} step={stepSize} value={Math.min(Number(amt) || 0, max)}
                  onChange={e => setAmt(e.target.value === '0' ? '' : e.target.value)}
                  onPointerDown={() => setSliding(true)} onPointerUp={() => setSliding(false)} onPointerCancel={() => setSliding(false)}
                  aria-label="Amount slider" className="slider" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--color-neutral-700)' }}><span>₹0</span><span>{fmt(max)}</span></div>
            </div>

            {locked && cat ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, height: 44, padding: '0 16px 0 10px', borderRadius: 999, background: 'var(--color-accent)', color: 'var(--color-neutral-100)', font: '600 14px var(--font-body)' }}>
                  <span style={{ fontSize: 20 }}>{cat.emoji}</span>{cat.name}
                </span>
                <button onClick={() => setLocked(false)} className="bl" style={{ height: 36, padding: '0 12px' }}>Change</button>
              </div>
            ) : (
              <div className="hscroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -18px', padding: '2px 18px', flex: 'none' }}>
                {chips.map(c => (
                  <button key={c.id} onClick={() => { setCatId(c.id); setSub(null); }} aria-pressed={c.id === catId} className="hb pr96" style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 6, height: 44, padding: '0 14px 0 10px', borderRadius: 999, border: '1.5px solid', ...sel(c.id === catId), font: '600 14px var(--font-body)', cursor: 'pointer' }}>
                    <span style={{ fontSize: 20 }}>{c.emoji}</span>{c.name}
                  </button>
                ))}
              </div>
            )}

            {cat && cat.subs.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={label40}>Sub</span>
                {cat.subs.map(n => (
                  <button key={n} onClick={() => setSub(sub === n ? null : n)} aria-pressed={sub === n} className="hb pr96" style={{ height: 34, padding: '0 13px', borderRadius: 999, border: '1.5px solid', ...sel(sub === n), font: '600 13px var(--font-body)', cursor: 'pointer' }}>{n}</button>
                ))}
              </div>
            )}

            {cat && cat.quick.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={label40}>Quick</span>
                {cat.quick.map(q => {
                  const on = Number(amt) === q.amt && (!q.sub || sub === q.sub);
                  const hasSub = !!q.sub && cat.subs.includes(q.sub);
                  return (
                    <button key={q.id} aria-pressed={on} onClick={() => { if (on) { setAmt(''); if (hasSub) setSub(null); } else { setAmt(String(q.amt)); if (hasSub) setSub(q.sub!); } }} className="pr96 dimmer" style={{ height: 36, padding: '0 13px', borderRadius: 999, border: `1.5px solid ${on ? 'var(--color-accent-2-700)' : 'transparent'}`, background: on ? 'var(--color-accent-2-700)' : 'var(--color-accent-2-200)', color: on ? 'var(--color-accent-2-100)' : 'var(--color-accent-2-900)', font: '600 13px var(--font-body)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background .2s, color .2s' }}>
                      {on ? <Check size={15} sw={3} /> : <span style={{ fontSize: 15, lineHeight: 1 }}>⚡</span>}{q.label} {fmt(q.amt)}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {KEYS.map(k => (
                <button key={k} onClick={() => press(k)} aria-label={k === 'del' ? 'Delete' : k} className="key">
                  {k === 'del' ? <Backspace size={24} /> : k}
                </button>
              ))}
            </div>
            <button onClick={primary} disabled={!valid} className="dim" style={{ height: 56, borderRadius: 999, border: 'none', background: valid ? 'var(--color-accent)' : 'var(--color-neutral-300)', color: valid ? 'var(--color-neutral-100)' : 'var(--color-neutral-700)', fontFamily: 'var(--font-heading)', fontSize: 18, cursor: valid ? 'pointer' : 'not-allowed', flex: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 18px' }}>
              {!amtOk ? 'Enter an amount' : !cat ? 'Pick a category' : entry ? 'Save changes' : `Review · ${dest}`}
            </button>
          </>
        )}

        {step === 'review' && cat && (
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
                Today, {dayMonth(dateKey(now))} · After this: {fmt(after)} of {fmt(cat.budget)}{after > cat.budget ? `, over by ${fmt(after - cat.budget)}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('pad')} className="bo" style={{ flex: 1, height: 56, fontSize: 17 }}>Edit</button>
              <button onClick={add} autoFocus className="bp" style={{ flex: 2, height: 56, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Check />Save</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
