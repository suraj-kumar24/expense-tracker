import { useState } from 'react';
import type { Ctx } from '../ctx';
import { type Cat, catView, dayMonth, fmt, monthOf, uid, validAmt } from '../model';
import { Close, Merge, More, Pencil, Trash } from '../icons';
import { BackBtn, Sheet, SpentCard, useSheet } from '../ui';

type Kind = 'rename' | 'sub' | 'quick' | 'merge' | 'delete';
const col = { display: 'flex', flexDirection: 'column' } as const;

export function Detail({ ctx, cat }: { ctx: Ctx; cat: Cat }) {
  const { data, update, month } = ctx;
  const [menu, setMenu] = useState(false);
  const sheet = useSheet<Kind>(ctx);
  const d = catView(cat, data, month);
  const entries = data.entries.filter(e => e.cat === cat.id && monthOf(e.date) === month).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const subs = cat.subs.map(n => {
    const sp = entries.filter(e => e.sub === n).reduce((a, e) => a + e.amt, 0);
    const sh = d.spent ? (sp / d.spent) * 100 : 0;
    return { name: n, spent: sp, share: Math.round(sh) + '%', w: sh + '%' };
  });
  const unfiled = entries.filter(e => !e.sub || !cat.subs.includes(e.sub)).reduce((a, e) => a + e.amt, 0);
  const updCat = (fn: (c: Cat) => Cat) => update(x => ({ ...x, cats: x.cats.map(c => (c.id === cat.id ? fn(c) : c)) }));
  const pick = (k: Kind) => { setMenu(false); sheet.open(k); };

  return (
    <div style={{ ...col, padding: '10px 18px 110px', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <BackBtn onClick={() => ctx.back()} />
        <span style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenu(o => !o)} aria-label="More actions" aria-haspopup="menu" aria-expanded={menu} className="ib"><More /></button>
          {menu && (
            <>
              <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 6 }} />
              <div role="menu" className="menu" style={{ top: 50, width: 230 }}>
                <button role="menuitem" onClick={() => pick('rename')} className="mi"><Pencil size={17} />Edit category</button>
                {data.cats.length > 1 && <button role="menuitem" onClick={() => pick('merge')} className="mi"><Merge size={17} />Merge into another</button>}
                {data.cats.length > 1 && <button role="menuitem" onClick={() => pick('delete')} className="mi red"><Trash size={17} />Delete category</button>}
              </div>
            </>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-surface)', display: 'grid', placeItems: 'center', fontSize: 38, flex: 'none' }}>{d.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, overflowWrap: 'anywhere' }}>{d.name}</h2>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: d.tagBg, color: d.tagFg }}>{d.tagText}</span>
        </div>
      </div>

      <SpentCard spent={fmt(d.spent)} budget={fmt(d.budget)} barW={d.barW} bar={d.bar} over={d.st === 'over'} right={d.leftShort} />

      <div style={{ ...col, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h5 style={{ margin: 0 }}>Subcategories</h5>
          <button onClick={() => sheet.open('sub')} className="bl" style={{ height: 36, padding: '0 12px' }}>+ Add</button>
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
          <button onClick={() => sheet.open('quick')} className="bl" style={{ height: 36, padding: '0 12px' }}>+ Add</button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {cat.quick.map(q => (
            <span key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 4, height: 38, padding: '0 4px 0 14px', borderRadius: 999, background: 'var(--color-accent-2-200)', color: 'var(--color-accent-2-900)', fontSize: 13, fontWeight: 600 }}>
              ⚡ {q.label} {fmt(q.amt)}
              {q.rec && <span title="Every month" style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: 'var(--color-accent-2-100)' }}>monthly</span>}
              <button onClick={() => updCat(c => ({ ...c, quick: c.quick.filter(x => x.id !== q.id) }))} aria-label={`Remove quick amount ${q.label}`} className="x-sage" style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'inherit' }}><Close size={14} /></button>
            </span>
          ))}
          {!cat.quick.length && <span style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>None yet. Add amounts you pay often to log them in one tap.</span>}
        </div>
      </div>

      <div style={{ ...col, gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
          <h5 style={{ margin: 0 }}>Entries this month</h5>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-neutral-700)' }}>({d.count})</span>
        </div>
        {entries.length ? entries.map(e => (
          <button key={e.id} onClick={() => ctx.openLog({ entryId: e.id })} className="row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 20 }}>
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

      {sheet.kind && (
        <Sheet onClose={sheet.close}>
          <DetailSheet key={sheet.kind} ctx={ctx} cat={cat} kind={sheet.kind} close={sheet.close} swap={sheet.open} />
        </Sheet>
      )}
    </div>
  );
}

const field = { height: 52, padding: '0 16px', font: '600 16px var(--font-body)' } as const;

/** Cancel + submit. Lives inside a form, so the submit button (or Enter) runs the form's handler. */
function Actions({ close, okLabel, disabled }: { close: () => void; okLabel: string; disabled?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button type="button" onClick={close} className="bo" style={{ flex: 1, height: 50, fontSize: 16 }}>Cancel</button>
      <button type="submit" disabled={disabled} className="bp" style={{ flex: 1, height: 50, fontSize: 16 }}>{okLabel}</button>
    </div>
  );
}

function DetailSheet({ ctx, cat, kind, close, swap }: { ctx: Ctx; cat: Cat; kind: Kind; close: () => void; swap: (k: Kind) => void }) {
  const { data, update, month } = ctx;
  const d = catView(cat, data, month);
  const [a, setA] = useState(() => (kind === 'rename' ? cat.name : ''));
  const [b, setB] = useState(() => (kind === 'rename' ? cat.emoji : ''));
  const [c, setC] = useState(() => (kind === 'rename' ? String(cat.budget) : ''));
  const updCat = (fn: (x: Cat) => Cat) => update(x => ({ ...x, cats: x.cats.map(y => (y.id === cat.id ? fn(y) : y)) }));
  const form = (ok: () => void) => ({ onSubmit: (e: React.FormEvent) => { e.preventDefault(); ok(); }, style: { display: 'contents' } });

  if (kind === 'rename') {
    const ok = () => {
      if (!a.trim()) return;
      const budget = validAmt(c) ? Number(c) : null;
      updCat(x => ({ ...x, name: a.trim(), emoji: b.trim() || x.emoji, budget: budget ?? x.budget }));
      close();
      ctx.toast(`Saved ${b.trim() || cat.emoji} ${a.trim()}`);
    };
    return (
      <form autoComplete="off" {...form(ok)}>
        <h4 style={{ margin: 0 }}>Edit category</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <input autoComplete="off" value={b} onChange={e => setB(e.target.value)} aria-label="Emoji" maxLength={4} className="field" style={{ width: 60, height: 52, textAlign: 'center', fontSize: 24 }} />
          <input autoComplete="off" value={a} onChange={e => setA(e.target.value)} aria-label="Name" className="field" style={{ ...field, flex: 1, minWidth: 0 }} />
        </div>
        <label style={{ ...col, gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-neutral-700)' }}>Monthly budget</span>
          <span className="field" style={{ display: 'flex', alignItems: 'center', gap: 4, height: 52, padding: '0 18px', font: '700 16px var(--font-body)' }}>
            ₹<input autoComplete="off" value={c} onChange={e => setC(e.target.value.replace(/[^\d.]/g, ''))} onFocus={e => e.target.select()} inputMode="decimal" aria-label="Monthly budget" style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', font: '700 16px var(--font-body)', outline: 'none' }} />
          </span>
          <span style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>Spent so far: {fmt(d.spent)}</span>
        </label>
        <Actions close={close} okLabel="Save" disabled={!a.trim()} />
      </form>
    );
  }

  if (kind === 'sub') {
    const ok = () => {
      const n = a.trim();
      if (!n) return;
      updCat(x => ({ ...x, subs: x.subs.includes(n) ? x.subs : [...x.subs, n] }));
      close();
    };
    return (
      <form autoComplete="off" {...form(ok)}>
        <h4 style={{ margin: 0 }}>New subcategory in {cat.emoji} {cat.name}</h4>
        <input autoComplete="off" autoFocus value={a} onChange={e => setA(e.target.value)} placeholder="e.g. Electricity" aria-label="Subcategory name" className="field" style={{ ...field, padding: '0 18px' }} />
        <Actions close={close} okLabel="Add" disabled={!a.trim()} />
      </form>
    );
  }

  if (kind === 'quick') {
    const valid = !!a.trim() && validAmt(b);
    const ok = () => {
      if (!valid) return;
      updCat(x => ({ ...x, quick: [...x.quick, { id: uid('q'), label: a.trim(), amt: Number(b) }] }));
      close();
    };
    return (
      <form autoComplete="off" {...form(ok)}>
        <h4 style={{ margin: 0 }}>New quick amount</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <input autoComplete="off" autoFocus value={a} onChange={e => setA(e.target.value)} placeholder="Label, e.g. Water can" aria-label="Label" className="field" style={{ ...field, font: '600 15px var(--font-body)', flex: 1, minWidth: 0 }} />
          <input autoComplete="off" value={b} onChange={e => setB(e.target.value)} placeholder="₹" inputMode="decimal" aria-label="Amount" className="field" style={{ ...field, font: '600 15px var(--font-body)', width: 100 }} />
        </div>
        <Actions close={close} okLabel="Add" disabled={!valid} />
      </form>
    );
  }

  if (kind === 'merge') {
    const merge = (target: Cat) => {
      update(x => ({
        ...x,
        entries: x.entries.map(e => (e.cat === cat.id ? { ...e, cat: target.id } : e)),
        cats: x.cats.filter(y => y.id !== cat.id).map(y => (y.id === target.id ? { ...y, budget: y.budget + cat.budget, subs: [...new Set([...y.subs, ...cat.subs])], quick: [...y.quick, ...cat.quick] } : y))
      }));
      ctx.back().then(() => ctx.showDetail(target.id));
      ctx.toast(`Merged ${cat.emoji} ${cat.name} into ${target.emoji} ${target.name}`);
    };
    return (
      <>
        <h4 style={{ margin: 0 }}>Merge {cat.emoji} {cat.name} into…</h4>
        <div style={{ fontSize: 13, color: 'var(--color-neutral-700)', marginTop: -4 }}>Its {d.countText}, subcategories and {fmt(cat.budget)} budget move to the category you pick. {cat.name} is then removed.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
          {data.cats.filter(y => y.id !== cat.id).map(t => (
            <button key={t.id} onClick={() => merge(t)} className="merge-t" style={{ display: 'flex', alignItems: 'center', gap: 8, height: 50, padding: '0 12px', borderRadius: 999, font: '600 14px var(--font-body)', color: 'var(--color-text)', cursor: 'pointer', textAlign: 'left', minWidth: 0 }}>
              <span style={{ fontSize: 20 }}>{t.emoji}</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
            </button>
          ))}
        </div>
        <button onClick={close} className="bo" style={{ height: 48, fontSize: 16 }}>Cancel</button>
      </>
    );
  }

  // delete
  const older = data.entries.filter(e => e.cat === cat.id).length - d.count;
  const doDelete = () => {
    update(x => ({ ...x, cats: x.cats.filter(y => y.id !== cat.id), entries: x.entries.filter(e => e.cat !== cat.id) }));
    ctx.back(2); // the sheet and this screen
    ctx.toast(`Deleted ${cat.emoji} ${cat.name}`);
  };
  return (
    <>
      <h4 style={{ margin: 0 }}>Delete {cat.emoji} {cat.name}?</h4>
      <div style={{ fontSize: 14, color: 'var(--color-neutral-800)' }}>
        Its {d.countText} this month ({fmt(d.spent)}){older > 0 ? ` and ${older} from earlier months` : ''} will be deleted too. To keep them, merge instead.
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => swap('merge')} className="bo" style={{ flex: 1, height: 50, fontSize: 15 }}>Merge instead</button>
        <button onClick={doDelete} className="danger-solid" style={{ flex: 1, height: 50, borderRadius: 999, fontFamily: 'var(--font-heading)', fontSize: 15 }}>Delete</button>
      </div>
    </>
  );
}
