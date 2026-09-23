import { useState } from 'react';
import type { Ctx } from '../ctx';
import { COL, SLICE, addMonths, fmt, monthLong, monthShort, monthYear, spentIn } from '../model';
import { Back } from '../icons';

const row = { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 20, background: 'var(--color-neutral-100)' } as const;

export function Insights({ ctx }: { ctx: Ctx }) {
  const { data, month } = ctx;
  // Up to three months, never earlier than the month tracking started.
  const months = [0, 1, 2].map(i => addMonths(month, -i)).filter(m => m >= data.startMonth);
  const [m, setM] = useState(month);
  const prev = addMonths(m, -1);
  const hasPrev = prev >= data.startMonth;

  const ranked = data.cats
    .map(c => ({ c, sp: spentIn(data.entries, c.id, m), prev: hasPrev ? spentIn(data.entries, c.id, prev) : 0 }))
    .filter(x => x.sp > 0 || x.prev > 0)
    .sort((a, b) => b.sp - a.sp);
  const total = ranked.reduce((a, x) => a + x.sp, 0);
  const prevTotal = ranked.reduce((a, x) => a + x.prev, 0);
  let acc = 0;
  const stops = ranked.filter(x => x.sp > 0).map((x, i) => { const f = (x.sp / total) * 100; const s = `${SLICE[i % SLICE.length]} ${acc}% ${acc + f}%`; acc += f; return s; });
  const top = ranked[0] && ranked[0].sp > 0 ? ranked[0] : null;
  const pct = (v: number) => Math.round((v / (total || 1)) * 100) + '%';

  return (
    <div style={{ padding: '10px 18px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={ctx.back} aria-label="Back" className="ib"><Back /></button>
        <h3 style={{ margin: 0, flex: 1 }}>Insights</h3>
      </div>
      <div role="tablist" style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 999, background: 'var(--color-surface)' }}>
        {[...months].reverse().map(k => {
          const on = k === m;
          return <button key={k} role="tab" aria-selected={on} onClick={() => setM(k)} className="tab" style={{ flex: 1, height: 40, borderRadius: 999, border: 'none', background: on ? 'var(--color-accent)' : 'var(--color-neutral-100)', color: on ? 'var(--color-neutral-100)' : 'var(--color-text)', font: '700 14px var(--font-body)', cursor: 'pointer' }}>{monthShort(k)}</button>;
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 156, height: 156, flex: 'none', borderRadius: '50%', background: stops.length ? `conic-gradient(${stops.join(',')})` : 'var(--color-neutral-300)', display: 'grid', placeItems: 'center' }}>
          <div style={{ width: 98, height: 98, borderRadius: '50%', background: 'var(--color-bg)', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-neutral-700)' }}>{monthYear(m)}</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 19, lineHeight: 1.1 }}>{fmt(total)}</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {top ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-accent-700)' }}>Biggest slice</div>
              <div style={{ fontSize: 34, lineHeight: 1 }}>{top.c.emoji}</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, lineHeight: 1.15 }}>{top.c.name} takes {pct(top.sp)}</div>
              <div style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>{fmt(top.sp)} of {fmt(total)}</div>
            </>
          ) : (
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, lineHeight: 1.15 }}>Nothing logged in {monthLong(m)}</div>
          )}
          <div style={{ fontSize: 12, fontWeight: 700, color: hasPrev ? (total > prevTotal ? COL.red.fg : COL.normal.fg) : 'var(--color-neutral-700)' }}>
            {hasPrev ? (total >= prevTotal ? `▲ ${fmt(total - prevTotal)} more than ${monthShort(prev)}` : `▼ ${fmt(prevTotal - total)} less than ${monthShort(prev)}`) : 'First month tracked'}
          </div>
        </div>
      </div>

      {ranked.some(x => x.sp > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h5 style={{ margin: '0 0 2px' }}>Largest first</h5>
          {ranked.filter(x => x.sp > 0).map((x, i) => {
            const dot = SLICE[i % SLICE.length];
            return (
              <div key={x.c.id} style={row}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: dot, flex: 'none' }} />
                <span style={{ fontSize: 20 }}>{x.c.emoji}</span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: 14 }}><b>{x.c.name}</b><span style={{ fontWeight: 700 }}>{pct(x.sp)}</span></span>
                  <span style={{ height: 6, borderRadius: 999, background: 'var(--color-neutral-300)', display: 'block', overflow: 'hidden' }}>
                    <span style={{ display: 'block', height: '100%', width: (x.sp / (ranked[0].sp || 1)) * 100 + '%', background: dot, borderRadius: 999 }} />
                  </span>
                </span>
                <span style={{ width: 78, textAlign: 'right', fontSize: 13, color: 'var(--color-neutral-800)' }}>{fmt(x.sp)}</span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h5 style={{ margin: '0 0 2px' }}>Compared with last month</h5>
        {hasPrev ? (
          <>
            {m === month && <div style={{ fontSize: 12, color: 'var(--color-neutral-700)', marginBottom: 2 }}>{monthLong(m)} so far vs all of {monthShort(prev)}. ▲ red = spent more, ▼ green = spent less.</div>}
            {ranked.map(x => {
              const diff = x.sp - x.prev, up = diff > 0;
              const fg = diff === 0 ? 'var(--color-neutral-700)' : up ? COL.red.fg : COL.normal.fg;
              const bg = diff === 0 ? 'var(--color-neutral-100)' : up ? COL.red.bg : COL.normal.bg;
              return (
                <div key={x.c.id} style={row}>
                  <span style={{ fontSize: 20 }}>{x.c.emoji}</span>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <b style={{ fontSize: 14 }}>{x.c.name}</b>
                    <span style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>{fmt(x.sp)} · was {fmt(x.prev)}</span>
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', padding: '4px 10px', borderRadius: 14, background: bg, color: fg }}>
                    <b style={{ fontSize: 13 }}>{diff === 0 ? 'Same' : (up ? '▲ ' : '▼ ') + fmt(Math.abs(diff))}</b>
                    <span style={{ fontSize: 10, fontWeight: 600 }}>{diff === 0 ? 'no change' : up ? 'spent more' : 'spent less'}</span>
                  </span>
                </div>
              );
            })}
          </>
        ) : (
          <div style={{ padding: 22, borderRadius: 28, background: 'var(--color-accent-2-100)', color: 'var(--color-accent-2-900)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 28 }}>🌱</div>
            <b style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: 18 }}>{monthLong(m)} is your first month</b>
            <span style={{ fontSize: 13 }}>There’s nothing earlier to compare with yet. From {monthLong(addMonths(m, 1))} on, each category shows whether you spent more or less.</span>
          </div>
        )}
      </div>
    </div>
  );
}
