import type { Ctx } from '../ctx';
import { RED, addMonths, catView, daysInMonth, daysLeft, fmt, longDate, monthLong } from '../model';
import { Phone, Pie, Sliders } from '../icons';

const kicker = { fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700 } as const;

export function Overview({ ctx }: { ctx: Ctx }) {
  const { data, now, month } = ctx;
  const views = data.cats.map(c => catView(c, data, month));
  const spentTotal = views.reduce((a, c) => a + c.spent, 0);
  const budgetTotal = data.cats.reduce((a, c) => a + c.budget, 0);
  const wants = views.filter(c => c.want);
  const wB = wants.reduce((a, c) => a + c.budget, 0), wS = wants.reduce((a, c) => a + c.spent, 0), wL = wB - wS;
  const left = daysLeft(now), dim = daysInMonth(now);
  const mName = monthLong(month);
  const wantsNames = wants.map(c => c.emoji).join(' ');
  const nextFirst = '1 ' + monthLong(addMonths(month, 1));

  return (
    <div style={{ padding: '10px 18px 120px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-neutral-700)' }}>{longDate(now)}</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 24, lineHeight: 1.15 }}>{left === 1 ? `Last day of ${mName}` : `${left} days left in ${mName}`}</div>
        </div>
        <button onClick={() => ctx.open('insights')} aria-label="Insights" className="ib"><Pie /></button>
        <button onClick={() => ctx.open('settings')} aria-label="Settings" className="ib"><Sliders /></button>
      </div>

      <div style={{ background: 'var(--color-neutral-900)', color: 'var(--color-neutral-100)', borderRadius: 32, padding: '20px 22px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ ...kicker, fontWeight: 600, color: 'var(--color-neutral-400)' }}>Spent in {mName}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 44, lineHeight: 1 }}>{fmt(spentTotal)}</span>
          <span style={{ fontSize: 14, color: 'var(--color-neutral-300)', whiteSpace: 'nowrap' }}>of {fmt(budgetTotal)}</span>
        </div>
        <div style={{ position: 'relative', height: 12, borderRadius: 999, background: 'var(--color-neutral-800)' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: Math.min(100, (spentTotal / (budgetTotal || 1)) * 100) + '%', borderRadius: 999, background: 'var(--color-accent-400)' }} />
          <div title="Today" style={{ position: 'absolute', top: -4, bottom: -4, left: (now.getDate() / dim) * 100 + '%', width: 3, borderRadius: 2, background: 'var(--color-neutral-100)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-neutral-300)' }}>
          <span>{Math.round((spentTotal / (budgetTotal || 1)) * 100)}% of budget used</span>
          <span style={{ fontWeight: 700, color: 'var(--color-neutral-100)' }}>{spentTotal <= budgetTotal ? fmt(budgetTotal - spentTotal) + ' left' : fmt(spentTotal - budgetTotal) + ' over'}</span>
        </div>
      </div>

      {wB > 0 && wL > 0 && (
        <div style={{ background: 'var(--color-accent-2-200)', borderRadius: 32, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...kicker, color: 'var(--color-accent-2-800)' }}>Wants allowance {wantsNames}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 36, lineHeight: 1.1, color: 'var(--color-accent-2-900)' }}>{fmt(Math.floor(wL / left))}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-accent-2-800)' }}>/ day</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-accent-2-800)' }}>{fmt(wL)} of {fmt(wB)} Wants budget left</div>
          </div>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-accent-2-500)', color: 'var(--color-accent-2-100)', display: 'grid', placeItems: 'center', textAlign: 'center', lineHeight: 1, flex: 'none' }}>
            <div><div style={{ fontFamily: 'var(--font-heading)', fontSize: 24 }}>{left}</div><div style={{ fontSize: 10, fontWeight: 700 }}>{left === 1 ? 'DAY' : 'DAYS'}</div></div>
          </div>
        </div>
      )}
      {wB > 0 && wL <= 0 && (
        <div style={{ background: RED.bg, borderRadius: 32, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ ...kicker, color: RED.fg }}>Wants allowance {wantsNames}</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, lineHeight: 1.1, color: 'oklch(0.38 0.15 20)' }}>Wants are spent</div>
          <div style={{ fontSize: 13, color: 'oklch(0.4 0.15 20)' }}>
            {wL < 0 ? `${fmt(-wL)} over the ${fmt(wB)} Wants budget` : `The ${fmt(wB)} Wants budget is used up`} · {left === 1 ? 'Last day' : `${left} days to go`} — stick to Needs until {nextFirst}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6 }}>
        <h4 style={{ margin: 0 }}>Categories</h4>
        <span style={{ fontSize: 12, color: 'var(--color-neutral-700)', display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={13} />Saved on this phone</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {views.map(c => (
          <button key={c.id} onClick={() => ctx.open('detail', c.id)} className="row sc" style={{ display: 'flex', gap: 12, alignItems: 'center', width: '100%', padding: '12px 14px', borderRadius: 24 }}>
            <span style={{ width: 44, height: 44, flex: 'none', borderRadius: '50%', background: 'var(--color-surface)', display: 'grid', placeItems: 'center', fontSize: 22 }}>{c.emoji}</span>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 15, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: c.tagBg, color: c.tagFg, whiteSpace: 'nowrap' }}>{c.tagText}</span>
              </span>
              {c.subs.length > 0 && <span style={{ fontSize: 12, color: 'var(--color-neutral-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.subs.join(' · ')}</span>}
              <span style={{ height: 8, borderRadius: 999, background: 'var(--color-neutral-300)', overflow: 'hidden', display: 'block' }}>
                <span style={{ display: 'block', height: '100%', width: c.barW, background: c.bar, borderRadius: 999 }} />
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}><b style={{ color: 'var(--color-text)' }}>{fmt(c.spent)}</b> of {fmt(c.budget)}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
