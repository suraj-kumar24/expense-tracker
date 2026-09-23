import { useState } from 'react';
import type { Ctx, DialogKind, Screen } from '../ctx';
import { type Cat, RED, catView, dayMonth, fmt, monthOf, uid, validAmt } from '../model';
import { Back, Close, Merge, Pencil, Trash } from '../icons';

const col = { display: 'flex', flexDirection: 'column' } as const;
const sel = (on: boolean) => ({ background: on ? 'var(--color-accent)' : 'var(--color-neutral-100)', color: on ? 'var(--color-neutral-100)' : 'var(--color-text)', borderColor: on ? 'var(--color-accent)' : 'var(--color-divider)' });

export function Detail({ ctx, cat }: { ctx: Ctx; cat: Cat }) {
  const { data, update, month } = ctx;
  const d = catView(cat, data, month);
  const entries = data.entries.filter(e => e.cat === cat.id && monthOf(e.date) === month).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const subs = cat.subs.map(n => {
    const sp = entries.filter(e => e.sub === n).reduce((a, e) => a + e.amt, 0);
    const sh = d.spent ? (sp / d.spent) * 100 : 0;
    return { name: n, spent: sp, share: Math.round(sh) + '%', w: sh + '%' };
  });
  const unfiled = entries.filter(e => !e.sub || !cat.subs.includes(e.sub)).reduce((a, e) => a + e.amt, 0);
  const removeQuick = (id: string) => update(x => ({ ...x, cats: x.cats.map(c => (c.id === cat.id ? { ...c, quick: c.quick.filter(q => q.id !== id) } : c)) }));

  return (
    <div style={{ ...col, padding: '10px 18px 40px', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={ctx.back} aria-label="Back" className="ib"><Back /></button>
        <span style={{ flex: 1 }} />
        <button onClick={() => ctx.openDialog('rename')} aria-label="Edit name and emoji" className="ib"><Pencil size={18} /></button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-surface)', display: 'grid', placeItems: 'center', fontSize: 38, flex: 'none' }}>{d.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, overflowWrap: 'anywhere' }}>{d.name}</h2>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: d.tagBg, color: d.tagFg }}>{d.tagText}</span>
        </div>
      </div>

      <div style={{ ...col, background: 'var(--color-neutral-100)', borderRadius: 32, padding: '18px 20px', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 34, lineHeight: 1 }}>{fmt(d.spent)}</span>
          <span style={{ fontSize: 14, color: 'var(--color-neutral-700)' }}>of {fmt(d.budget)}</span>
        </div>
        <div style={{ height: 12, borderRadius: 999, background: 'var(--color-neutral-300)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: d.barW, background: d.bar, borderRadius: 999 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          <div><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-neutral-700)' }}>USED</div><div style={{ fontWeight: 700 }}>{d.pct}%</div></div>
          <div><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-neutral-700)' }}>LEFT</div><div style={{ fontWeight: 700, color: d.tagFg }}>{d.leftText}</div></div>
          <div><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-neutral-700)' }}>ENTRIES</div><div style={{ fontWeight: 700 }}>{d.count}</div></div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => ctx.openDialog('budget')} className="bo" style={{ flex: 1, height: 44, fontSize: 15 }}>Edit budget</button>
          <button onClick={() => ctx.openLog(cat.id)} className="bp" style={{ flex: 1, height: 44, fontSize: 15 }}>+ Log here</button>
        </div>
      </div>

      <div style={{ ...col, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h5 style={{ margin: 0 }}>Subcategories</h5>
          <button onClick={() => ctx.openDialog('sub')} className="bl" style={{ height: 36, padding: '0 12px' }}>+ Add</button>
        </div>
        {subs.length > 0 ? (
          <>
            {subs.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 20, background: 'var(--color-neutral-100)' }}>
                <span style={{ flex: 1, minWidth: 0, ...col, gap: 4 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><b>{s.name}</b><span>{fmt(s.spent)} · {s.share}</span></span>
                  <span style={{ height: 6, borderRadius: 999, background: 'var(--color-neutral-300)', display: 'block', overflow: 'hidden' }}>
                    <span style={{ display: 'block', height: '100%', width: s.w, background: 'var(--color-accent-2)', borderRadius: 999 }} />
                  </span>
                </span>
              </div>
            ))}
            {unfiled > 0 && <div style={{ fontSize: 12, color: 'var(--color-neutral-700)', paddingLeft: 14 }}>{fmt(unfiled)} not filed under a subcategory</div>}
          </>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--color-neutral-700)', padding: '12px 14px', borderRadius: 20, border: '1.5px dashed var(--color-neutral-400)' }}>No subcategories. Add one to split this category, e.g. Rent and Electricity under Housing.</div>
        )}
      </div>

      <div style={{ ...col, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h5 style={{ margin: 0 }}>Quick amounts</h5>
          <button onClick={() => ctx.openDialog('quick')} className="bl" style={{ height: 36, padding: '0 12px' }}>+ Add</button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {cat.quick.map(q => (
            <span key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 4, height: 38, padding: '0 4px 0 14px', borderRadius: 999, background: 'var(--color-accent-2-200)', color: 'var(--color-accent-2-900)', fontSize: 13, fontWeight: 600 }}>
              ⚡ {q.label} {fmt(q.amt)}
              {q.rec && <span title="Every month" style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: 'var(--color-accent-2-100)' }}>monthly</span>}
              <button onClick={() => removeQuick(q.id)} aria-label={`Remove quick amount ${q.label}`} className="x-sage" style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'inherit' }}><Close size={14} /></button>
            </span>
          ))}
          {!cat.quick.length && <span style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>None yet — add amounts you pay often for one-tap logging.</span>}
        </div>
      </div>

      <div style={{ ...col, gap: 6 }}>
        <h5 style={{ margin: '0 0 2px' }}>Entries this month</h5>
        {entries.length ? entries.map(e => (
          <button key={e.id} onClick={() => ctx.openDialog('entry', e.id)} className="row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 20 }}>
            <span style={{ width: 48, fontSize: 12, fontWeight: 700, color: 'var(--color-neutral-700)' }}>{dayMonth(e.date)}</span>
            <span style={{ flex: 1, fontSize: 14 }}>{e.sub || cat.name}</span>
            <b style={{ fontSize: 14 }}>{fmt(e.amt)}</b>
            <Pencil size={16} stroke="var(--color-neutral-600)" />
          </button>
        )) : (
          <div style={{ padding: '24px 20px', borderRadius: 28, background: 'var(--color-neutral-100)', ...col, alignItems: 'flex-start', gap: 6 }}>
            <span style={{ fontSize: 30 }}>{d.emoji}</span>
            <b style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: 18 }}>Nothing spent here yet</b>
            <span style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>The full {fmt(d.budget)} is still available this month.</span>
          </div>
        )}
      </div>

      <div style={{ ...col, gap: 8, marginTop: 6 }}>
        {data.cats.length > 1 && (
          <button onClick={() => ctx.openDialog('merge')} className="bo" style={{ height: 48, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Merge size={18} />Merge into another category</button>
        )}
        {data.cats.length > 1 && (
          <button onClick={() => ctx.openDialog('delete')} className="danger" style={{ height: 48, borderRadius: 999, font: '700 14px var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Trash size={17} />Delete category</button>
        )}
      </div>
    </div>
  );
}

const inputBig = { height: 56, padding: '0 20px', font: '400 26px var(--font-heading)' } as const;
const inputMid = { height: 52, padding: '0 16px', font: '600 16px var(--font-body)' } as const;
const errText = { fontSize: 13, fontWeight: 600, color: RED.fg } as const;

function Actions({ ctx, ok, okLabel, disabled }: { ctx: Ctx; ok: () => void; okLabel: string; disabled?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button type="button" onClick={ctx.back} className="bo" style={{ flex: 1, height: 50, fontSize: 16 }}>Cancel</button>
      <button type="button" onClick={ok} disabled={disabled} className="bp" style={{ flex: 1, height: 50, fontSize: 16 }}>{okLabel}</button>
    </div>
  );
}

export function DetailDialog({ ctx, cat, kind, entryId, leave }: { ctx: Ctx; cat: Cat; kind: DialogKind; entryId?: string; leave: (to: Screen, id?: string) => void }) {
  const { data, update, month } = ctx;
  const d = catView(cat, data, month);
  const entry = entryId ? data.entries.find(e => e.id === entryId) : undefined;
  const [a, setA] = useState(() => kind === 'budget' ? String(cat.budget) : kind === 'rename' ? cat.name : entry ? String(entry.amt) : '');
  const [b, setB] = useState(() => kind === 'rename' ? cat.emoji : entry ? entry.sub || '' : '');
  const updCat = (fn: (c: Cat) => Cat) => update(x => ({ ...x, cats: x.cats.map(c => (c.id === cat.id ? fn(c) : c)) }));
  const submit = (fn: () => void) => (e: React.FormEvent) => { e.preventDefault(); fn(); };

  if (kind === 'budget') {
    const ok = () => {
      if (!validAmt(a)) return;
      updCat(c => ({ ...c, budget: Number(a) }));
      ctx.back();
      ctx.toast(`Budget for ${cat.emoji} ${cat.name} set to ${fmt(Number(a))}`);
    };
    return (
      <form onSubmit={submit(ok)} style={{ display: 'contents' }}>
        <h4 style={{ margin: 0 }}>{cat.emoji} {cat.name} budget</h4>
        <input autoFocus value={a} onChange={e => setA(e.target.value)} onFocus={e => e.target.select()} inputMode="decimal" aria-label="Monthly budget" className="field" style={inputBig} />
        <div style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>Spent so far: {fmt(d.spent)}</div>
        <Actions ctx={ctx} ok={ok} okLabel="Save" disabled={!validAmt(a)} />
      </form>
    );
  }

  if (kind === 'rename') {
    const ok = () => {
      if (!a.trim()) return;
      updCat(c => ({ ...c, name: a.trim(), emoji: b.trim() || c.emoji }));
      ctx.back();
    };
    return (
      <form onSubmit={submit(ok)} style={{ display: 'contents' }}>
        <h4 style={{ margin: 0 }}>Edit category</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={b} onChange={e => setB(e.target.value)} aria-label="Emoji" maxLength={4} className="field" style={{ width: 60, height: 52, textAlign: 'center', fontSize: 24 }} />
          <input autoFocus value={a} onChange={e => setA(e.target.value)} aria-label="Name" className="field" style={{ ...inputMid, flex: 1, minWidth: 0 }} />
        </div>
        <Actions ctx={ctx} ok={ok} okLabel="Save" disabled={!a.trim()} />
      </form>
    );
  }

  if (kind === 'sub') {
    const ok = () => {
      const n = a.trim();
      if (!n) return;
      updCat(c => ({ ...c, subs: c.subs.includes(n) ? c.subs : [...c.subs, n] }));
      ctx.back();
    };
    return (
      <form onSubmit={submit(ok)} style={{ display: 'contents' }}>
        <h4 style={{ margin: 0 }}>New subcategory in {cat.emoji} {cat.name}</h4>
        <input autoFocus value={a} onChange={e => setA(e.target.value)} placeholder="e.g. Electricity" aria-label="Subcategory name" className="field" style={{ ...inputMid, padding: '0 18px' }} />
        <Actions ctx={ctx} ok={ok} okLabel="Add" disabled={!a.trim()} />
      </form>
    );
  }

  if (kind === 'quick') {
    const valid = !!a.trim() && validAmt(b);
    const ok = () => {
      if (!valid) return;
      updCat(c => ({ ...c, quick: [...c.quick, { id: uid('q'), label: a.trim(), amt: Number(b) }] }));
      ctx.back();
    };
    return (
      <form onSubmit={submit(ok)} style={{ display: 'contents' }}>
        <h4 style={{ margin: 0 }}>New quick amount</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <input autoFocus value={a} onChange={e => setA(e.target.value)} placeholder="Label, e.g. Water can" aria-label="Label" className="field" style={{ ...inputMid, font: '600 15px var(--font-body)', flex: 1, minWidth: 0 }} />
          <input value={b} onChange={e => setB(e.target.value)} placeholder="₹" inputMode="decimal" aria-label="Amount" className="field" style={{ ...inputMid, font: '600 15px var(--font-body)', width: 100 }} />
        </div>
        <Actions ctx={ctx} ok={ok} okLabel="Add" disabled={!valid} />
      </form>
    );
  }

  if (kind === 'entry') {
    if (!entry) return null;
    const invalid = !validAmt(a);
    const ok = () => {
      if (invalid) return;
      update(x => ({ ...x, entries: x.entries.map(e => (e.id === entry.id ? { ...e, amt: Number(a), sub: b || null } : e)) }));
      ctx.back();
    };
    const del = () => {
      update(x => ({ ...x, entries: x.entries.filter(e => e.id !== entry.id) }));
      ctx.back();
      ctx.toast(`Deleted ${fmt(entry.amt)} from ${cat.emoji} ${cat.name}`, () => update(x => ({ ...x, entries: [...x.entries, entry] })));
    };
    return (
      <form onSubmit={submit(ok)} style={{ display: 'contents' }}>
        <h4 style={{ margin: 0 }}>Edit entry</h4>
        <input autoFocus value={a} onChange={e => setA(e.target.value)} inputMode="decimal" aria-label="Amount" className="field" style={inputBig} />
        {invalid && <div style={errText}>Enter more than ₹0, up to 2 decimals</div>}
        {cat.subs.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[{ n: '', label: 'None' }, ...cat.subs.map(n => ({ n, label: n }))].map(o => (
              <button type="button" key={o.label} onClick={() => setB(o.n)} aria-pressed={b === o.n} className="hb" style={{ height: 36, padding: '0 13px', borderRadius: 999, border: '1.5px solid', ...sel(b === o.n), font: '600 13px var(--font-body)', cursor: 'pointer' }}>{o.label}</button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={del} className="danger soft" style={{ height: 50, padding: '0 18px', borderRadius: 999, font: '700 14px var(--font-body)' }}>Delete</button>
          <span style={{ flex: 1 }} />
          <button type="submit" disabled={invalid} className="bp" style={{ height: 50, padding: '0 26px', fontSize: 16 }}>Save</button>
        </div>
      </form>
    );
  }

  if (kind === 'merge') {
    const merge = (target: Cat) => {
      update(x => ({
        ...x,
        entries: x.entries.map(e => (e.cat === cat.id ? { ...e, cat: target.id } : e)),
        cats: x.cats.filter(c => c.id !== cat.id).map(c => (c.id === target.id ? { ...c, budget: c.budget + cat.budget, want: c.want, subs: [...new Set([...c.subs, ...cat.subs])], quick: [...c.quick, ...cat.quick] } : c))
      }));
      leave('detail', target.id);
      ctx.toast(`Merged ${cat.emoji} ${cat.name} into ${target.emoji} ${target.name}`);
    };
    return (
      <>
        <h4 style={{ margin: 0 }}>Merge {cat.emoji} {cat.name} into…</h4>
        <div style={{ fontSize: 13, color: 'var(--color-neutral-700)', marginTop: -4 }}>Its {d.countText}, subcategories and {fmt(cat.budget)} budget move to the category you pick. {cat.name} is then removed.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
          {data.cats.filter(c => c.id !== cat.id).map(t => (
            <button key={t.id} onClick={() => merge(t)} className="merge-t" style={{ display: 'flex', alignItems: 'center', gap: 8, height: 50, padding: '0 12px', borderRadius: 999, font: '600 14px var(--font-body)', color: 'var(--color-text)', cursor: 'pointer', textAlign: 'left', minWidth: 0 }}>
              <span style={{ fontSize: 20 }}>{t.emoji}</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
            </button>
          ))}
        </div>
        <button onClick={ctx.back} className="bo" style={{ height: 48, fontSize: 16 }}>Cancel</button>
      </>
    );
  }

  // delete
  const all = data.entries.filter(e => e.cat === cat.id);
  const older = all.length - d.count;
  const doDelete = () => {
    update(x => ({ ...x, cats: x.cats.filter(c => c.id !== cat.id), entries: x.entries.filter(e => e.cat !== cat.id) }));
    leave('overview');
    ctx.toast(`Deleted ${cat.emoji} ${cat.name}`);
  };
  return (
    <>
      <h4 style={{ margin: 0 }}>Delete {cat.emoji} {cat.name}?</h4>
      <div style={{ fontSize: 14, color: 'var(--color-neutral-800)' }}>
        Its {d.countText} this month ({fmt(d.spent)}){older > 0 ? ` and ${older} from earlier months` : ''} will be deleted too. To keep them, merge instead.
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => ctx.openDialog('merge')} className="bo" style={{ flex: 1, height: 50, fontSize: 15 }}>Merge instead</button>
        <button onClick={doDelete} className="danger-solid" style={{ flex: 1, height: 50, borderRadius: 999, fontFamily: 'var(--font-heading)', fontSize: 15 }}>Delete</button>
      </div>
    </>
  );
}
