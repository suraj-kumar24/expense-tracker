import type { Ctx } from '../ctx';
import { COL, RED, catView, fmt, toCsv } from '../model';
import { Back, Download, Phone, Replay } from '../icons';

const card = { background: 'var(--color-neutral-100)', borderRadius: 32, padding: '18px 20px', display: 'flex', flexDirection: 'column' } as const;
const pill = { padding: '4px 10px', borderRadius: 999 } as const;

export function Settings({ ctx }: { ctx: Ctx }) {
  const { data, update, month } = ctx;
  const { thrX, thrY } = data;
  const views = data.cats.map(c => catView(c, data, month));
  const stc = { normal: 0, amber: 0, red: 0 };
  views.forEach(c => { stc[c.st === 'over' ? 'red' : c.st]++; });
  const wantsBudget = data.cats.filter(c => c.want).reduce((a, c) => a + c.budget, 0);

  const setX = (v: number) => update(d => ({ ...d, thrX: Math.min(v, d.thrY - 5) }));
  const setY = (v: number) => update(d => ({ ...d, thrY: Math.max(v, d.thrX + 5) }));

  const exportCsv = () => {
    const name = `khata-${month}.csv`;
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([toCsv(data)], { type: 'text/csv' }));
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      ctx.toast(`Exported ${name}`);
    } catch {
      ctx.toast('Couldn’t export — try again');
    }
  };

  return (
    <div style={{ padding: '10px 18px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={ctx.back} aria-label="Back" className="ib"><Back /></button>
        <h3 style={{ margin: 0 }}>Settings</h3>
      </div>

      <div style={{ ...card, gap: 12 }}>
        <h5 style={{ margin: 0 }}>Warning levels</h5>
        <div style={{ fontSize: 13, color: 'var(--color-neutral-700)', marginTop: -6 }}>Applied to every category.</div>
        <div style={{ display: 'flex', height: 22, borderRadius: 999, overflow: 'hidden', fontSize: 11, fontWeight: 700 }} aria-hidden="true">
          <div style={{ width: thrX + '%', background: 'var(--color-accent-2)', color: 'var(--color-accent-2-100)', display: 'flex', alignItems: 'center', paddingLeft: 10 }}>Normal</div>
          <div style={{ width: thrY - thrX + '%', background: COL.amber.bar, color: 'oklch(0.3 0.07 65)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>Amber</div>
          <div style={{ width: 100 - thrY + '%', background: RED.bar, color: 'var(--color-neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>Red</div>
        </div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}><span>Amber from</span><b style={{ color: 'oklch(0.44 0.09 65)' }}>{thrX}%</b></span>
          <input type="range" min={10} max={95} step={5} value={thrX} onChange={e => setX(Number(e.target.value))} style={{ width: '100%', height: 28 }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}><span>Red from</span><b style={{ color: RED.fg }}>{thrY}%</b></span>
          <input type="range" min={15} max={100} step={5} value={thrY} onChange={e => setY(Number(e.target.value))} style={{ width: '100%', height: 28 }} />
        </label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 12, fontWeight: 700 }}>
          <span style={{ ...pill, background: COL.normal.bg, color: COL.normal.fg }}>{stc.normal} on track</span>
          <span style={{ ...pill, background: COL.amber.bg, color: COL.amber.fg }}>{stc.amber} amber</span>
          <span style={{ ...pill, background: RED.bg, color: RED.fg }}>{stc.red} red or over</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-neutral-700)', marginTop: -4 }}>Red always stays at least 5% above amber.</div>
      </div>

      <div style={{ ...card, gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><h5 style={{ margin: 0 }}>Wants</h5><b style={{ fontSize: 14 }}>{fmt(wantsBudget)} / month</b></div>
        <div style={{ fontSize: 13, color: 'var(--color-neutral-700)', marginTop: -4 }}>Tap the categories that count as Wants. Their budgets add up to the Wants budget used for your daily allowance.</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {data.cats.map(c => (
            <button key={c.id} onClick={() => update(d => ({ ...d, cats: d.cats.map(x => (x.id === c.id ? { ...x, want: !x.want } : x)) }))} aria-pressed={c.want} className="hb pr96" style={{ height: 38, padding: '0 13px 0 9px', borderRadius: 999, border: `1.5px solid ${c.want ? 'var(--color-accent)' : 'var(--color-divider)'}`, background: c.want ? 'var(--color-accent)' : 'var(--color-neutral-100)', color: c.want ? 'var(--color-neutral-100)' : 'var(--color-text)', font: '600 13px var(--font-body)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 17 }}>{c.emoji}</span>{c.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...card, padding: '6px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-divider)', fontSize: 14 }}><span>Currency</span><b>₹ Indian Rupee</b></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 14 }}><span>Month starts on</span><b>1st</b></div>
      </div>

      <div style={{ ...card, gap: 10, background: 'var(--color-accent-2-200)', color: 'var(--color-accent-2-900)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-accent-2-100)', display: 'grid', placeItems: 'center', flex: 'none' }}><Phone /></span>
          <h5 style={{ margin: 0 }}>Everything stays on this phone</h5>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>No account, no login, no internet. Your {data.entries.length} {data.entries.length === 1 ? 'entry is' : 'entries are'} saved in the app’s storage on this device as you make them. Uninstalling the app deletes them — export a CSV to keep a copy.</div>
        <button onClick={exportCsv} className="sage-dark" style={{ height: 46, borderRadius: 999, border: 'none', fontFamily: 'var(--font-heading)', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Download size={18} />Export CSV</button>
      </div>

      <button onClick={() => ctx.open('welcome')} className="bo" style={{ height: 48, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Replay size={18} />Replay setup</button>
    </div>
  );
}
