import { useState } from 'react';
import type { Ctx } from '../ctx';
import { type SortBy, addMonths, catView, daysInMonth, daysLeft, fmt, monthLong, monthTitle } from '../model';
import { Check, ChevR, Pie, Sliders, Sort } from '../icons';
import { CloseBtn, Sheet, SpentCard, useSheet } from '../ui';

const kicker = { fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700 } as const;
const SORTS: [SortBy, string, string][] = [
  ['custom', 'Default', ''],
  ['used', 'Budget used: high to low', 'Most used'],
  ['fresh', 'Budget used: low to high', 'Least used'],
  ['name', 'Name A–Z', 'A–Z']
];

export function Overview({ ctx }: { ctx: Ctx }) {
  const { data, update, now, month } = ctx;
  const [sortOpen, setSortOpen] = useState(false);
  const sheet = useSheet<'wants'>(ctx);
  const views = data.cats.map(c => catView(c, data, month));
  const spentTotal = views.reduce((a, c) => a + c.spent, 0);
  const budgetTotal = data.cats.reduce((a, c) => a + c.budget, 0);
  const over = spentTotal > budgetTotal;
  const wants = views.filter(c => c.want);
  const wB = wants.reduce((a, c) => a + c.budget, 0), wS = wants.reduce((a, c) => a + c.spent, 0), wL = wB - wS;
  const left = daysLeft(now);
  const perDay = wL > 0 ? fmt(Math.floor(wL / left)) : '₹0';
  const wantsBarW = Math.min(100, wB ? (wS / wB) * 100 : 0) + '%';
  const sortBy = data.sortBy;
  const sorted = [...views];
  if (sortBy === 'used') sorted.sort((a, b) => b.pct - a.pct);
  else if (sortBy === 'fresh') sorted.sort((a, b) => a.pct - b.pct);
  else if (sortBy === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
  const sortLabel = SORTS.find(o => o[0] === sortBy)?.[2] || '';
  const ok = wL > 0;
  const lastDay = `${daysInMonth(now)} ${monthLong(month).slice(0, 3)}`;
  const nextFirst = '1 ' + monthLong(addMonths(month, 1)).slice(0, 3);

  return (
    <div style={{ padding: '10px 18px 120px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h1 style={{ flex: 1, minWidth: 0, fontSize: 24, lineHeight: 1.15, margin: 0, letterSpacing: 0 }}>{monthTitle(now)}</h1>
        <button onClick={() => ctx.open('insights')} aria-label="Insights" className="ib"><Pie /></button>
        <button onClick={() => ctx.open('settings')} aria-label="Settings" className="ib"><Sliders /></button>
      </div>

      <SpentCard spent={fmt(spentTotal)} budget={fmt(budgetTotal)} over={over}
        barW={Math.min(100, (spentTotal / (budgetTotal || 1)) * 100) + '%'}
        bar={over ? 'var(--kh-11)' : 'var(--color-accent-400)'}
        right={over ? 'Over by ' + fmt(spentTotal - budgetTotal) : fmt(budgetTotal - spentTotal) + ' left'} />

      {wants.length > 0 && (
        <button onClick={() => sheet.open('wants')} aria-label="Wants allowance details" className="soft" style={{ position: 'relative', overflow: 'hidden', background: ok ? 'var(--color-accent-2-200)' : 'var(--kh-1)', borderRadius: 28, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8, color: ok ? 'var(--color-accent-2-900)' : 'var(--kh-2)', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          <span style={{ position: 'absolute', right: -30, top: -40, width: 116, height: 116, borderRadius: '50%', background: ok ? 'var(--color-accent-2-300)' : 'var(--kh-3)', pointerEvents: 'none' }} />
          <span style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
            <span style={{ ...kicker, flex: 1, color: ok ? 'var(--color-accent-2-800)' : 'var(--kh-0)' }}>Wants allowance</span>
            <span style={{ display: 'flex', paddingLeft: 8 }}>
              {wants.map(w => (
                <span key={w.id} title={w.name} style={{ width: 34, height: 34, marginLeft: -8, borderRadius: '50%', background: ok ? 'var(--color-accent-2-100)' : 'var(--kh-4)', border: `2px solid ${ok ? 'var(--color-accent-2-300)' : 'var(--kh-3)'}`, display: 'grid', placeItems: 'center', fontSize: 17 }}>{w.emoji}</span>
              ))}
            </span>
            <ChevR style={{ flex: 'none', marginLeft: 2 }} />
          </span>
          <span style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 28, lineHeight: 1 }}>{perDay}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: ok ? 'var(--color-accent-2-800)' : 'var(--kh-0)' }}>/ day</span>
          </span>
          <span style={{ position: 'relative', display: 'block', width: '100%', height: 8, borderRadius: 999, background: ok ? 'var(--color-accent-2-100)' : 'var(--kh-5)', overflow: 'hidden' }}>
            {ok && <span style={{ display: 'block', height: '100%', width: wantsBarW, borderRadius: 999, background: 'var(--color-accent-2-600)' }} />}
          </span>
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6 }}>
        <h4 style={{ margin: 0 }}>Categories</h4>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setSortOpen(o => !o)} aria-haspopup="menu" aria-expanded={sortOpen} aria-label="Sort categories" className="bl" style={{ height: 40, width: sortLabel ? 'auto' : 40, padding: sortLabel ? '0 14px' : 0, background: sortOpen ? 'var(--color-accent-100)' : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <Sort size={14} />{sortLabel}
          </button>
          {sortOpen && (
            <>
              <div onClick={() => setSortOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 6 }} />
              <div role="menu" className="menu" style={{ top: 42, width: 220 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-neutral-700)', padding: '8px 12px 4px' }}>Sort by</div>
                {SORTS.map(([id, label]) => (
                  <button key={id} role="menuitemradio" aria-checked={id === sortBy} onClick={() => { update(d => ({ ...d, sortBy: id })); setSortOpen(false); }} className={'mi' + (id === sortBy ? ' on' : '')} style={{ padding: '0 12px' }}>
                    <span style={{ flex: 1 }}>{label}</span>
                    {id === sortBy && <Check size={16} stroke="var(--color-accent-700)" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map(c => (
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

      {sheet.kind === 'wants' && (
        <Sheet onClose={sheet.close} label="Wants allowance">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ margin: 0 }}>Wants allowance</h4>
            <CloseBtn onClick={sheet.close} />
          </div>
          <div style={{ background: ok ? 'var(--color-accent-2-200)' : 'var(--kh-1)', color: ok ? 'var(--color-accent-2-900)' : 'var(--kh-2)', borderRadius: 28, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 40, lineHeight: 1 }}>{perDay}</span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>/ day</span>
            </div>
            <div style={{ height: 10, borderRadius: 999, background: ok ? 'var(--color-accent-2-100)' : 'var(--kh-4)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: wantsBarW, borderRadius: 999, background: ok ? 'var(--color-accent-2-600)' : 'var(--kh-5)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13 }}>
              <span>{fmt(wS)} of {fmt(wB)}</span>
              <b>{wL > 0 ? fmt(wL) + ' left' : wL < 0 ? 'Over by ' + fmt(-wL) : 'All used'}</b>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.45 }}>
              {ok ? `${fmt(wL)} left ÷ ${left} ${left === 1 ? 'day' : 'days'} = ${perDay} a day for fun spends until ${lastDay}.` : `Your Wants budget is used up. Stick to Needs until it resets on ${nextFirst}.`}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {wants.map(w => (
              <button key={w.id} onClick={() => { ctx.back().then(() => ctx.open('detail', w.id)); }} className="row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 20 }}>
                <span style={{ fontSize: 20 }}>{w.emoji}</span>
                <b style={{ flex: 1, fontSize: 14 }}>{w.name}</b>
                <span style={{ fontSize: 13 }}><b>{fmt(w.spent)}</b> of {fmt(w.budget)}</span>
                <ChevR size={16} stroke="var(--color-neutral-600)" />
              </button>
            ))}
          </div>
          <button onClick={() => { ctx.back().then(() => ctx.open('settings')); }} className="bl" style={{ height: 44, fontSize: 14 }}>Change which categories are Wants</button>
        </Sheet>
      )}
    </div>
  );
}
