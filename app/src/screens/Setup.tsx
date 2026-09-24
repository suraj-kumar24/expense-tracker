import { useState } from 'react';
import type { Ctx } from '../ctx';
import { type Cat, EXTRA, PRESETS, clone, fmt, uid } from '../model';
import { Back, Check, Close, Phone, Repeat } from '../icons';

const col = { display: 'flex', flexDirection: 'column' } as const;

export function Welcome({ ctx }: { ctx: Ctx }) {
  return (
    <div style={{ ...col, minHeight: '100%', padding: '24px 24px 28px', gap: 18 }}>
      <div style={{ position: 'relative', height: 300 }} aria-hidden="true">
        <div style={{ position: 'absolute', left: 0, top: 10, width: 200, height: 200, borderRadius: '50%', background: 'var(--color-accent-300)' }} />
        <div style={{ position: 'absolute', left: 150, top: 90, width: 150, height: 150, borderRadius: '50%', background: 'var(--color-accent-2-300)' }} />
        <div style={{ position: 'absolute', left: 70, top: 200, width: 92, height: 92, borderRadius: '50%', background: 'var(--color-surface)' }} />
        <span style={{ position: 'absolute', left: 62, top: 62, fontSize: 72 }}>🏠</span>
        <span style={{ position: 'absolute', left: 198, top: 132, fontSize: 56 }}>🍜</span>
        <span style={{ position: 'absolute', left: 94, top: 222, fontSize: 40 }}>🛺</span>
      </div>
      <div>
        <h1 style={{ fontSize: 44, lineHeight: 1, margin: 0, letterSpacing: 0 }}>Envelope</h1>
        <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3, marginTop: 8, textWrap: 'pretty' }}>See where your money goes each month, one category at a time.</div>
      </div>
      <div style={{ ...col, gap: 10, fontSize: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-accent-2-200)', display: 'grid', placeItems: 'center', flex: 'none', color: 'var(--color-accent-2-800)' }}><Phone size={18} /></span>
          <span><b>Works offline.</b> Everything is saved on this phone. No account, no sign-in.</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-accent-200)', display: 'grid', placeItems: 'center', flex: 'none', fontSize: 17 }}>⚡</span>
          <span><b>Log in seconds.</b> Tap an amount, tap a category, done.</span>
        </div>
      </div>
      <span style={{ flex: 1 }} />
      <button onClick={() => ctx.open('setup-cats')} className="bp big">
        Set up my categories
      </button>
    </div>
  );
}

function StepHead({ ctx, step }: { ctx: Ctx; step: 1 | 2 }) {
  const dot = (on: boolean) => <span style={{ width: 24, height: 6, borderRadius: 999, background: on ? 'var(--color-accent)' : 'var(--color-neutral-300)' }} />;
  return (
    <div className="stick-top" style={{ margin: '0 -18px', padding: '12px 18px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={() => ctx.back()} aria-label="Back" className="ib"><Back /></button>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--color-neutral-700)' }}>Step {step} of 2</span>
      <span style={{ display: 'flex', gap: 4 }}>{dot(true)}{dot(step === 2)}</span>
    </div>
  );
}

export function SetupCats({ ctx }: { ctx: Ctx }) {
  const { data, update } = ctx;
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('');
  const [subFor, setSubFor] = useState<string | null>(null);
  const [subDraft, setSubDraft] = useState('');

  const updCat = (id: string, fn: (c: Cat) => Cat) => update(d => ({ ...d, cats: d.cats.map(c => (c.id === id ? fn(c) : c)) }));
  const presets = [...PRESETS, ...EXTRA, ...data.cats.filter(c => !PRESETS.some(p => p.id === c.id) && !EXTRA.some(p => p.id === c.id))];

  const toggle = (p: Pick<Cat, 'id' | 'emoji' | 'name'>) => {
    const on = data.cats.some(c => c.id === p.id);
    if (on) {
      const n = data.entries.filter(e => e.cat === p.id).length;
      if (n) { ctx.toast(`${p.emoji} ${p.name} has ${n} ${n === 1 ? 'entry' : 'entries'} — delete or merge it from its page`); return; }
      update(d => ({ ...d, cats: d.cats.filter(c => c.id !== p.id) }));
    } else {
      const base: Cat = PRESETS.find(c => c.id === p.id) || { ...p, budget: 1000, want: false, subs: [], quick: [] };
      update(d => ({ ...d, cats: [...d.cats, clone(base)] }));
    }
  };
  const addCustom = () => {
    const name = customName.trim();
    if (!name) return;
    update(d => ({ ...d, cats: [...d.cats, { id: uid('c'), emoji: customEmoji.trim() || '🏷️', name, budget: 1000, want: false, subs: [], quick: [] }] }));
    setCustomName(''); setCustomEmoji('');
  };
  const addSub = (id: string) => {
    const n = subDraft.trim();
    if (!n) return;
    updCat(id, c => ({ ...c, subs: c.subs.includes(n) ? c.subs : [...c.subs, n] }));
    setSubFor(null); setSubDraft('');
  };

  return (
    <div style={{ ...col, padding: '0 18px', gap: 14 }}>
      <StepHead ctx={ctx} step={1} />
      <div>
        <h3 style={{ margin: 0 }}>What do you spend on?</h3>
        <div style={{ fontSize: 14, color: 'var(--color-neutral-700)' }}>Pick as many as you like. {data.cats.length} selected.</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {presets.map(p => {
          const on = data.cats.some(c => c.id === p.id);
          return (
            <button key={p.id} onClick={() => toggle(p)} aria-pressed={on} className="hb4 pr95" style={{ position: 'relative', height: 88, borderRadius: 24, border: `2px solid ${on ? 'var(--color-accent)' : 'transparent'}`, background: on ? 'var(--color-accent-100)' : 'var(--color-neutral-100)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', font: '600 13px var(--font-body)', color: 'var(--color-text)', padding: 4 }}>
              <span style={{ fontSize: 30, lineHeight: 1 }}>{p.emoji}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{p.name}</span>
              {on && <span style={{ position: 'absolute', top: 7, right: 7, width: 20, height: 20, borderRadius: '50%', background: 'var(--color-accent)', display: 'grid', placeItems: 'center' }}><Check size={12} sw={3.5} stroke="var(--color-neutral-100)" /></span>}
            </button>
          );
        })}
      </div>
      <form onSubmit={e => { e.preventDefault(); addCustom(); }} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: 6, borderRadius: 999, background: 'var(--color-surface)' }}>
        <input value={customEmoji} onChange={e => setCustomEmoji(e.target.value)} placeholder="🙂" aria-label="Emoji" maxLength={4} style={{ width: 48, height: 44, borderRadius: 999, border: 'none', background: 'var(--color-neutral-100)', textAlign: 'center', fontSize: 20 }} />
        <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Your own category" aria-label="Category name" style={{ flex: 1, minWidth: 0, height: 44, borderRadius: 999, border: 'none', background: 'var(--color-neutral-100)', padding: '0 14px', font: '500 14px var(--font-body)' }} />
        <button type="submit" className="dark" style={{ height: 44, padding: '0 16px', borderRadius: 999, border: 'none', font: '700 14px var(--font-body)', cursor: 'pointer' }}>Add</button>
      </form>
      <div>
        <h5 style={{ margin: 0 }}>Subcategories</h5>
        <div style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>Optional. For example, Rent and Electricity under Housing.</div>
      </div>
      <div style={{ ...col, gap: 6 }}>
        {data.cats.map(c => (
          <div key={c.id} style={{ ...col, padding: '10px 12px', borderRadius: 22, background: 'var(--color-neutral-100)', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 20 }}>{c.emoji}</span>
              <b style={{ fontSize: 14, marginRight: 4 }}>{c.name}</b>
              {c.subs.map(n => (
                <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 2, height: 30, padding: '0 2px 0 10px', borderRadius: 999, background: 'var(--color-surface)', fontSize: 12, fontWeight: 600 }}>
                  {n}
                  <button onClick={() => updCat(c.id, x => ({ ...x, subs: x.subs.filter(y => y !== n), quick: x.quick.filter(q => q.sub !== n) }))} aria-label={`Remove ${n}`} className="x-sm" style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--color-neutral-700)' }}><Close size={12} sw={3} /></button>
                </span>
              ))}
              <button onClick={() => { setSubFor(c.id); setSubDraft(''); }} className="dashed" style={{ height: 30, padding: '0 10px', borderRadius: 999, font: '600 12px var(--font-body)', color: 'var(--color-accent-700)', cursor: 'pointer' }}>+ sub</button>
            </div>
            {subFor === c.id && (
              <form onSubmit={e => { e.preventDefault(); addSub(c.id); }} style={{ display: 'flex', gap: 6 }}>
                <input autoFocus value={subDraft} onChange={e => setSubDraft(e.target.value)} placeholder="Subcategory name" aria-label="Subcategory name" className="field" style={{ flex: 1, minWidth: 0, height: 40, background: 'var(--color-bg)', padding: '0 14px', font: '500 14px var(--font-body)' }} />
                <button type="submit" className="bp" style={{ height: 40, padding: '0 14px', font: '700 13px var(--font-body)' }}>Add</button>
                <button type="button" onClick={() => setSubFor(null)} className="ghost-sm" style={{ height: 40, padding: '0 10px', borderRadius: 999, border: 'none', font: '600 13px var(--font-body)', cursor: 'pointer' }}>Cancel</button>
              </form>
            )}
          </div>
        ))}
      </div>
      <div className="stick-bot" style={{ margin: '0 -18px', padding: '12px 18px calc(20px + env(safe-area-inset-bottom))' }}>
        <button onClick={() => ctx.open('setup-budgets')} disabled={!data.cats.length} className="bp big">Next: set budgets</button>
      </div>
    </div>
  );
}

export function SetupBudgets({ ctx }: { ctx: Ctx }) {
  const { data, update } = ctx;
  const updCat = (id: string, fn: (c: Cat) => Cat) => update(d => ({ ...d, cats: d.cats.map(c => (c.id === id ? fn(c) : c)) }));
  const total = data.cats.reduce((a, c) => a + c.budget, 0);

  /** A fixed bill is a monthly quick amount tied to a subcategory; Envelope files it on the 1st. */
  const setFixed = (c: Cat, sub: string, raw: string) => {
    const v = Number(raw.replace(/[^\d]/g, '') || 0);
    updCat(c.id, x => {
      const old = x.quick.find(q => q.rec && q.sub === sub);
      const rest = x.quick.filter(q => !(q.rec && q.sub === sub));
      return { ...x, quick: v > 0 ? [...rest, { id: old?.id || uid('q'), label: sub, sub, amt: v, rec: true }] : rest };
    });
  };
  const start = () => {
    update(d => d.setupDone ? d : ({ ...d, setupDone: true, startMonth: ctx.month, recurringFiled: ctx.month }));
    ctx.reset('overview');
  };

  return (
    <div style={{ ...col, padding: '0 18px', gap: 14 }}>
      <StepHead ctx={ctx} step={2} />
      <div>
        <h3 style={{ margin: 0 }}>Monthly budgets</h3>
        <div style={{ fontSize: 14, color: 'var(--color-neutral-700)' }}>The most you want to spend on each. Total <b style={{ color: 'var(--color-text)' }}>{fmt(total)}</b>.</div>
      </div>
      {data.cats.map(c => {
        const fixed = c.quick.filter(q => q.rec && q.sub && c.subs.includes(q.sub));
        const tot = fixed.reduce((a, q) => a + q.amt, 0), over = tot > c.budget;
        return (
          <div key={c.id} style={{ ...col, padding: '12px 14px', borderRadius: 24, background: 'var(--color-neutral-100)', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>{c.emoji}</span>
              <b style={{ flex: 1, fontSize: 15, minWidth: 0 }}>{c.name}</b>
              <label style={{ display: 'flex', alignItems: 'center', gap: 2, height: 44, width: 128, padding: '0 14px', borderRadius: 999, background: 'var(--color-surface)', fontWeight: 700 }}>
                ₹<input value={String(c.budget)} onChange={e => { const v = e.target.value.replace(/[^\d]/g, ''); updCat(c.id, x => ({ ...x, budget: Number(v || 0) })); }} inputMode="numeric" aria-label={`${c.name} budget`} onFocus={e => e.target.select()} style={{ width: '100%', border: 'none', background: 'transparent', font: '700 15px var(--font-body)', textAlign: 'right', outline: 'none' }} />
              </label>
            </div>
            {c.subs.length > 0 && (
              <div style={{ ...col, gap: 6, padding: '10px 12px', borderRadius: 20, background: 'var(--color-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Repeat size={15} stroke="var(--color-accent-2-700)" />
                  <b style={{ flex: 1, fontSize: 13 }}>Fixed bills <span style={{ fontWeight: 500, color: 'var(--color-neutral-700)' }}>· optional</span></b>
                  {tot > 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: over ? 'var(--kh-1)' : 'var(--color-accent-2-200)', color: over ? 'var(--kh-0)' : 'var(--color-accent-2-800)' }}>{fmt(tot)} fixed</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-neutral-700)', lineHeight: 1.4 }}>Pay the same amount every month? Enter it and Envelope logs it for you on the 1st. Leave blank if it changes.</div>
                {c.subs.map(n => {
                  const q = fixed.find(x => x.sub === n);
                  return (
                    <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{n}</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 2, height: 40, width: 118, padding: '0 12px', borderRadius: 999, background: 'var(--color-neutral-100)', border: `1.5px solid ${q ? 'var(--color-accent-2-400)' : 'transparent'}`, fontWeight: 700, fontSize: 14, color: 'var(--color-neutral-700)' }}>
                        ₹<input value={q ? String(q.amt) : ''} onChange={e => setFixed(c, n, e.target.value)} inputMode="numeric" placeholder="Varies" aria-label={`Fixed monthly amount for ${n}`} style={{ width: '100%', border: 'none', background: 'transparent', font: '700 14px var(--font-body)', color: 'var(--color-text)', textAlign: 'right', outline: 'none' }} />
                      </label>
                    </div>
                  );
                })}
                {over && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--kh-0)' }}>Fixed bills are more than this category’s budget.</div>}
              </div>
            )}
          </div>
        );
      })}
      <div className="stick-bot" style={{ margin: '0 -18px', padding: '12px 18px calc(20px + env(safe-area-inset-bottom))' }}>
        <button onClick={start} className="bp big">{data.setupDone ? 'Done' : 'Start tracking'}</button>
      </div>
    </div>
  );
}
