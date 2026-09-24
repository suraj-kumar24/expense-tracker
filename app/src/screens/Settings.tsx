import { useEffect, useState, type ReactNode } from 'react';
import type { Ctx } from '../ctx';
import { type Theme, fmt, toCsv } from '../model';
import { Bell, ChevD, ChevR, Download, Gem, Moon, Tag } from '../icons';
import { BackBtn, Sheet, sel, useSheet } from '../ui';

const card = { background: 'var(--color-neutral-100)', borderRadius: 32, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 } as const;
const badge = { width: 44, height: 44, flex: 'none', borderRadius: '50%', background: 'var(--color-accent-200)', display: 'grid', placeItems: 'center', color: 'var(--color-accent-800)' } as const;
type Draft = { thrX: number; thrY: number; want: Record<string, boolean> };

/** A card whose header toggles its body open. */
function Accordion({ icon, title, sub, open, toggle, children }: { icon: ReactNode; title: string; sub: string; open: boolean; toggle: () => void; children: ReactNode }) {
  return (
    <div style={card}>
      <button onClick={toggle} aria-expanded={open} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: 0, border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-body)', color: 'var(--color-text)' }}>
        <span style={badge}>{icon}</span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}><b style={{ fontSize: 15 }}>{title}</b><span style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>{sub}</span></span>
        <ChevD stroke="var(--color-neutral-700)" style={{ flex: 'none', transition: 'transform .25s', transform: `rotate(${open ? 180 : 0}deg)` }} />
      </button>
      {open && children}
    </div>
  );
}

/** Settings. Theme applies at once; alerts and Wants are a draft until Save. */
export function Settings({ ctx }: { ctx: Ctx }) {
  const { data, update, month } = ctx;
  const fresh = (): Draft => ({ thrX: data.thrX, thrY: data.thrY, want: Object.fromEntries(data.cats.map(c => [c.id, c.want])) });
  const [draft, setDraft] = useState<Draft>(fresh);
  const [open, setOpen] = useState({ theme: false, alerts: false, wants: false });
  const sheet = useSheet<'discard'>(ctx);
  const wantOf = (id: string) => draft.want[id] ?? data.cats.find(c => c.id === id)?.want ?? false;
  const dirty = draft.thrX !== data.thrX || draft.thrY !== data.thrY || data.cats.some(c => wantOf(c.id) !== c.want);

  // The phone's back button asks before throwing away unsaved changes.
  useEffect(() => {
    ctx.setGuard(dirty && !sheet.kind ? () => { queueMicrotask(() => sheet.open('discard')); return true; } : null);
    return () => ctx.setGuard(null);
  });

  const apply = () => update(d => ({ ...d, thrX: draft.thrX, thrY: draft.thrY, cats: d.cats.map(c => ({ ...c, want: wantOf(c.id) })) }));
  const save = () => { if (!dirty) return; apply(); ctx.toast('Settings saved'); };
  const leave = () => { ctx.setGuard(null); ctx.back(2); };
  const setTheme = (t: Theme) => update(d => ({ ...d, theme: t }));
  const wn = data.cats.filter(c => wantOf(c.id));
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;

  const exportCsv = () => {
    const name = `envelope-${month}.csv`;
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([toCsv(data)], { type: 'text/csv' }));
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      ctx.toast(`Exported ${name}`);
    } catch {
      ctx.toast('Couldn’t export. Try again.');
    }
  };

  return (
    <div style={{ padding: '10px 18px 0', display: 'flex', flexDirection: 'column', gap: 16, minHeight: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <BackBtn onClick={() => (dirty ? sheet.open('discard') : ctx.back())} />
        <h3 style={{ margin: 0, flex: 1 }}>Settings</h3>
        <button onClick={exportCsv} aria-label="Export CSV" title="Export CSV" className="ib"><Download /></button>
      </div>

      <button onClick={() => ctx.open('manage')} className="row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderRadius: 32 }}>
        <span style={badge}><Tag /></span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}><b style={{ fontSize: 15 }}>Categories</b><span style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>{data.cats.length} categories · add, rename, budgets, merge</span></span>
        <ChevR size={18} stroke="var(--color-neutral-600)" />
      </button>

      <Accordion icon={<Moon />} title="Appearance" open={open.theme} toggle={() => setOpen(o => ({ ...o, theme: !o.theme }))}
        sub={data.theme === 'system' ? `Follows your phone · ${dark ? 'dark' : 'light'} now` : data.theme === 'dark' ? 'Dark' : 'Light'}>
        <div role="radiogroup" aria-label="Appearance" style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 999, background: 'var(--color-surface)' }}>
          {([['light', 'Light'], ['dark', 'Dark'], ['system', 'Auto']] as [Theme, string][]).map(([id, label]) => {
            const s = sel(data.theme === id);
            return <button key={id} role="radio" aria-checked={data.theme === id} onClick={() => setTheme(id)} className="tab" style={{ flex: 1, height: 40, borderRadius: 999, border: 'none', background: s.background, color: s.color, font: '700 14px var(--font-body)', cursor: 'pointer' }}>{label}</button>;
          })}
        </div>
      </Accordion>

      <Accordion icon={<Bell />} title="Budget alerts" open={open.alerts} toggle={() => setOpen(o => ({ ...o, alerts: !o.alerts }))}
        sub={`Heads up at ${draft.thrX}% · Almost out at ${draft.thrY}%`}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--kh-6)', flex: 'none' }} /><span style={{ flex: 1 }}>Heads up after</span><b>{draft.thrX}% spent</b></span>
          <input type="range" min={10} max={95} step={5} value={draft.thrX} onChange={e => setDraft(d => ({ ...d, thrX: Math.min(Number(e.target.value), d.thrY - 5) }))} aria-label="Heads up after percent spent" style={{ width: '100%', height: 28 }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--kh-5)', flex: 'none' }} /><span style={{ flex: 1 }}>Almost out after</span><b>{draft.thrY}% spent</b></span>
          <input type="range" min={15} max={100} step={5} value={draft.thrY} onChange={e => setDraft(d => ({ ...d, thrY: Math.max(Number(e.target.value), d.thrX + 5) }))} aria-label="Almost out after percent spent" style={{ width: '100%', height: 28 }} />
        </label>
      </Accordion>

      <Accordion icon={<Gem />} title="Wants" open={open.wants} toggle={() => setOpen(o => ({ ...o, wants: !o.wants }))}
        sub={wn.length ? `${fmt(wn.reduce((a, c) => a + c.budget, 0))} / month · ${wn.map(c => c.emoji).join(' ')}` : 'Off · no categories picked'}>
        <div style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>Tap the categories that count as Wants.</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {data.cats.map(c => {
            const on = wantOf(c.id);
            return (
              <button key={c.id} onClick={() => setDraft(d => ({ ...d, want: { ...d.want, [c.id]: !on } }))} aria-pressed={on} className="hb pr96" style={{ height: 38, padding: '0 13px 0 9px', borderRadius: 999, border: '1.5px solid', ...sel(on), font: '600 13px var(--font-body)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 17 }}>{c.emoji}</span>{c.name}
              </button>
            );
          })}
        </div>
      </Accordion>

      <div style={{ flex: 1, marginTop: -16 }} />
      <div style={{ position: 'sticky', bottom: 0, margin: '0 -18px', padding: '12px 18px calc(20px + env(safe-area-inset-bottom))', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', zIndex: 2 }}>
        <button onClick={save} disabled={!dirty} className="dim" style={{ height: 56, borderRadius: 999, border: 'none', background: dirty ? 'var(--color-accent)' : 'var(--color-neutral-300)', color: dirty ? 'var(--color-neutral-100)' : 'var(--color-neutral-700)', fontFamily: 'var(--font-heading)', fontSize: 18, cursor: dirty ? 'pointer' : 'not-allowed' }}>Save</button>
      </div>

      {sheet.kind === 'discard' && (
        <Sheet onClose={sheet.close} label="Discard changes?">
          <h4 style={{ margin: 0 }}>Discard changes?</h4>
          <div style={{ fontSize: 14, color: 'var(--color-neutral-800)' }}>Your settings changes haven’t been saved.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={leave} className="bo" style={{ flex: 1, height: 50, fontSize: 16 }}>Discard</button>
            <button onClick={() => { apply(); leave(); ctx.toast('Settings saved'); }} className="bp" style={{ flex: 1, height: 50, fontSize: 16 }}>Save</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
