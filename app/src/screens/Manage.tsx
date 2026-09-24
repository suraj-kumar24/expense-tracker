import { useState } from 'react';
import type { Ctx } from '../ctx';
import { EXTRA, PRESETS, type Cat, catView, clone, fmt, uid } from '../model';
import { ChevR } from '../icons';
import { BackBtn } from '../ui';

/** Settings › Categories: every category, plus adding new ones. */
export function Manage({ ctx }: { ctx: Ctx }) {
  const { data, update, month } = ctx;
  const [emoji, setEmoji] = useState('');
  const [name, setName] = useState('');
  const suggestions = [...PRESETS, ...EXTRA].filter(p => !data.cats.some(c => c.id === p.id));

  const add = (c: Cat) => update(d => ({ ...d, cats: [...d.cats, c] }));
  const addCustom = () => {
    const n = name.trim();
    if (!n) return;
    const e = emoji.trim() || '🏷️';
    add({ id: uid('c'), emoji: e, name: n, budget: 1000, want: false, subs: [], quick: [] });
    setName(''); setEmoji('');
    ctx.toast(`Added ${e} ${n} · ₹1,000 budget, tap it to change`);
  };

  return (
    <div style={{ padding: '10px 18px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <BackBtn onClick={() => ctx.back()} />
        <h3 style={{ margin: 0 }}>Categories</h3>
      </div>
      <div style={{ fontSize: 14, color: 'var(--color-neutral-700)', marginTop: -4 }}>Tap a category to rename it, change its budget, add subcategories or quick amounts, merge or delete it. Your entries stay as they are.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.cats.map(c => {
          const v = catView(c, data, month);
          const meta = [c.subs.length ? c.subs.length + ' sub' + (c.subs.length > 1 ? 's' : '') : '', v.countText].filter(Boolean).join(' · ');
          return (
            <button key={c.id} onClick={() => ctx.open('detail', c.id)} className="row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 22 }}>
              <span style={{ width: 44, height: 44, flex: 'none', borderRadius: '50%', background: 'var(--color-surface)', display: 'grid', placeItems: 'center', fontSize: 22 }}>{c.emoji}</span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <b style={{ fontSize: 15 }}>{c.name}</b>
                <span style={{ fontSize: 12, color: 'var(--color-neutral-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fmt(c.budget)} / month · {meta}</span>
              </span>
              <ChevR size={18} stroke="var(--color-neutral-600)" />
            </button>
          );
        })}
      </div>
      <h5 style={{ margin: '6px 0 0' }}>Add a category</h5>
      <form autoComplete="off" onSubmit={e => { e.preventDefault(); addCustom(); }} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: 6, borderRadius: 999, background: 'var(--color-surface)' }}>
        <input autoComplete="off" value={emoji} onChange={e => setEmoji(e.target.value)} placeholder="🙂" aria-label="Emoji" maxLength={4} style={{ width: 48, height: 44, borderRadius: 999, border: 'none', background: 'var(--color-neutral-100)', textAlign: 'center', fontSize: 20 }} />
        <input autoComplete="off" value={name} onChange={e => setName(e.target.value)} placeholder="Category name" aria-label="Category name" style={{ flex: 1, minWidth: 0, height: 44, borderRadius: 999, border: 'none', background: 'var(--color-neutral-100)', padding: '0 14px', font: '500 14px var(--font-body)' }} />
        <button type="submit" className="bp" style={{ height: 44, padding: '0 16px', font: '700 14px var(--font-body)' }}>Add</button>
      </form>
      {suggestions.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-neutral-700)' }}>Suggestions</span>
          {suggestions.map(p => (
            <button key={p.id} onClick={() => { add(clone(PRESETS.find(x => x.id === p.id) || { ...p, budget: 1000, want: false, subs: [], quick: [] })); ctx.toast(`Added ${p.emoji} ${p.name}`); }} className="dashed" style={{ height: 38, padding: '0 13px 0 9px', borderRadius: 999, font: '600 13px var(--font-body)', color: 'var(--color-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 17 }}>{p.emoji}</span>+ {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
