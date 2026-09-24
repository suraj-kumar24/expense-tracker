import { useState } from 'react';
import type { Ctx } from '../ctx';
import { COL, SLICE, addMonths, fmt, insightMonths, monthLong, monthShort, monthTick, monthTotal, monthYear, spentIn } from '../model';
import { ChevD, ChevL, ChevR } from '../icons';
import { BackBtn, Sheet, sel, useSheet } from '../ui';

const row = { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 20, background: 'var(--color-neutral-100)' } as const;
const tile = { padding: '12px 14px', borderRadius: 22, background: 'var(--color-neutral-100)' } as const;
const tileKick = { fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' } as const;
const tileNum = { fontFamily: 'var(--font-heading)', fontSize: 20 } as const;

export function Insights({ ctx }: { ctx: Ctx }) {
  const { data, month } = ctx;
  const months = insightMonths(data, month); // oldest first, ends with this month
  const [m, setM] = useState<string>(month);
  const [overall, setOverall] = useState(false);
  const sheet = useSheet<'pick'>(ctx);
  const i = months.indexOf(m);
  const prev = i > 0 ? months[i - 1] : null;
  const budgetTotal = data.cats.reduce((a, c) => a + c.budget, 0);

  // Per-category totals for the selected month, or all shown months in Overall.
  const inScope = (id: string, mm: string | null) => (mm ? spentIn(data.entries, id, mm) : months.reduce((a, k) => a + spentIn(data.entries, id, k), 0));
  const ranked = data.cats
    .map(c => ({ c, sp: inScope(c.id, overall ? null : m), prev: !overall && prev ? spentIn(data.entries, c.id, prev) : 0 }))
    .filter(x => x.sp > 0 || x.prev > 0)
    .sort((a, b) => b.sp - a.sp);
  const total = ranked.reduce((a, x) => a + x.sp, 0);
  const prevTotal = ranked.reduce((a, x) => a + x.prev, 0);
  let acc = 0;
  const stops = ranked.filter(x => x.sp > 0).map((x, k) => { const f = (x.sp / total) * 100; const s = `${SLICE[k % SLICE.length]} ${acc}% ${acc + f}%`; acc += f; return s; });
  const top = ranked[0] && ranked[0].sp > 0 ? ranked[0] : null;
  const pct = (v: number) => Math.round((v / (total || 1)) * 100) + '%';

  return (
    <div style={{ padding: '10px 18px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="stick-top" style={{ margin: '-10px -18px 0', padding: '10px 18px 12px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BackBtn onClick={() => ctx.back()} />
          <h3 style={{ margin: 0, flex: 1 }}>Insights</h3>
        </div>
        <div role="tablist" style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 4, borderRadius: 999, background: 'var(--color-surface)' }}>
          <span style={{ position: 'absolute', top: 4, bottom: 4, left: 4, width: 'calc(50% - 4px)', borderRadius: 999, background: 'var(--color-accent)', boxShadow: 'var(--shadow-sm)', transform: `translateX(${overall ? '0%' : '100%'})`, transition: 'transform .3s cubic-bezier(.22,.8,.26,1)' }} />
          {[['Overall', true], ['Monthly', false]].map(([label, o]) => (
            <button key={String(label)} role="tab" aria-selected={overall === o} onClick={() => setOverall(o as boolean)} className="pr96" style={{ position: 'relative', height: 40, borderRadius: 999, border: 'none', background: 'transparent', color: overall === o ? 'var(--color-neutral-100)' : 'var(--color-text)', font: '700 14px var(--font-body)', cursor: 'pointer', transition: 'color .3s' }}>{label}</button>
          ))}
        </div>
        {!overall && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: -6 }}>
            <button onClick={() => prev && setM(prev)} disabled={!prev} aria-label="Previous month" className="ib ghost" style={{ opacity: prev ? 1 : 0.3 }}><ChevL /></button>
            <button onClick={() => sheet.open('pick')} aria-label="Choose month" className="ghost-bg" style={{ flex: 1, height: 44, borderRadius: 999, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', font: '700 16px var(--font-body)', color: 'var(--color-text)' }}>
              {monthLong(m)} {m.slice(0, 4)}<ChevD size={16} />
            </button>
            <button onClick={() => i < months.length - 1 && setM(months[i + 1])} disabled={i >= months.length - 1} aria-label="Next month" className="ib ghost" style={{ opacity: i < months.length - 1 ? 1 : 0.3 }}><ChevR /></button>
          </div>
        )}
      </div>

      {overall && <Overall ctx={ctx} months={months} budgetTotal={budgetTotal} pick={k => { setM(k); setOverall(false); }} />}

      {!overall && (
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
            <div style={{ fontSize: 12, fontWeight: 700, color: prev ? (total > prevTotal ? COL.red.fg : COL.normal.fg) : 'var(--color-neutral-700)' }}>
              {prev ? (total >= prevTotal ? `▲ ${fmt(total - prevTotal)} more than ${monthShort(prev)}` : `▼ ${fmt(prevTotal - total)} less than ${monthShort(prev)}`) : 'First month tracked'}
            </div>
          </div>
        </div>
      )}

      {ranked.some(x => x.sp > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h5 style={{ margin: '0 0 2px' }}>{overall ? `Where it went · ${months.length} ${months.length === 1 ? 'month' : 'months'}` : 'Largest first'}</h5>
          {ranked.filter(x => x.sp > 0).map((x, k) => {
            const dot = SLICE[k % SLICE.length];
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

      {!overall && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h5 style={{ margin: '0 0 2px' }}>Compared with last month</h5>
          {prev ? (
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
              <b style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: 18 }}>{monthLong(m)} {m.slice(0, 4)} is your first month</b>
              <span style={{ fontSize: 13 }}>There’s nothing earlier to compare with yet. From {monthLong(addMonths(m, 1))} on, each category shows whether you spent more or less.</span>
            </div>
          )}
        </div>
      )}

      {sheet.kind === 'pick' && (
        <Sheet onClose={sheet.close} label="Pick a month">
          <h4 style={{ margin: 0 }}>Pick a month</h4>
          {[...new Set(months.map(k => k.slice(0, 4)))].map(year => (
            <div key={year} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-neutral-700)' }}>{year}</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {months.filter(k => k.startsWith(year)).reverse().map(k => (
                  <button key={k} onClick={() => { setM(k); sheet.close(); }} className="hb pr96" style={{ height: 48, borderRadius: 999, border: '1.5px solid', ...sel(k === m), font: '700 14px var(--font-body)', cursor: 'pointer' }}>{monthShort(k)}</button>
                ))}
              </div>
            </div>
          ))}
        </Sheet>
      )}
    </div>
  );
}

/** Total spent each month as a line, with the budget as a dashed line. Tap a point to open that month. */
function Overall({ ctx, months, budgetTotal, pick }: { ctx: Ctx; months: string[]; budgetTotal: number; pick: (m: string) => void }) {
  const { data } = ctx;
  const tot = months.map(k => monthTotal(data, k));
  const n = months.length, last = n - 1;
  const full = tot.slice(0, last); // the current month is still in progress
  const lo = Math.min(...tot, budgetTotal) * 0.85, hi = Math.max(...tot, budgetTotal) * 1.06 || 1;
  const X = (k: number) => (n === 1 ? 160 : 14 + k * (292 / last));
  const Y = (v: number) => 20 + (1 - (v - lo) / (hi - lo || 1)) * 112;
  const pts = tot.map((v, k) => ({ x: X(k), y: Y(v) }));
  const line = pts.map((p, k) => (k ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ');
  const area = line + ` L${X(last)} 140 L${X(0)} 140 Z`;
  const hiI = full.length ? full.indexOf(Math.max(...full)) : -1, loI = full.length ? full.indexOf(Math.min(...full)) : -1;
  const avg = full.length ? Math.round(full.reduce((a, v) => a + v, 0) / full.length / 10) * 10 : null;
  const range = n > 1 ? `${monthTick(months[0])} – ${monthTick(months[last])}` : monthTick(months[0]);

  return (
    <>
      <div style={{ background: 'var(--color-neutral-100)', borderRadius: 32, padding: '16px 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 4px' }}>
          <h5 style={{ margin: 0 }}>Total spent each month</h5>
          <span style={{ fontSize: 12, color: 'var(--color-neutral-700)' }}>{range}</span>
        </div>
        <div style={{ position: 'relative' }}>
          <svg viewBox="0 0 320 146" width="100%" style={{ display: 'block', overflow: 'visible' }} role="img" aria-label="Total spent each month">
            {n > 1 && <path d={area} fill="var(--color-accent-100)" />}
            <line x1="6" x2="314" y1={Y(budgetTotal).toFixed(1)} y2={Y(budgetTotal).toFixed(1)} stroke="var(--color-neutral-500)" strokeWidth="1.5" strokeDasharray="4 4" />
            <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, k) => (
              <g key={months[k]} onClick={() => pick(months[k])} style={{ cursor: 'pointer' }}>
                <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
                <circle cx={p.x} cy={p.y} r={k === last ? 6 : 4} fill={k === last ? 'var(--color-accent)' : 'var(--color-neutral-100)'} stroke="var(--color-accent)" strokeWidth="2.5" />
              </g>
            ))}
          </svg>
          <span style={{ position: 'absolute', left: (8 / 320) * 100 + '%', top: ((Y(budgetTotal) - 3) / 146) * 100 + '%', transform: 'translateY(-100%)', fontSize: 10, fontWeight: 700, color: 'var(--color-neutral-700)', pointerEvents: 'none', whiteSpace: 'nowrap' }}>Budget {fmt(budgetTotal)}</span>
          <span style={{ position: 'absolute', left: (X(last) / 320) * 100 + '%', top: ((Y(tot[last]) - 9) / 146) * 100 + '%', transform: n > 1 ? 'translate(-100%,-100%)' : 'translate(-50%,-100%)', fontSize: 11, fontWeight: 800, color: 'var(--color-accent-800)', pointerEvents: 'none', whiteSpace: 'nowrap' }}>{fmt(tot[last])}</span>
        </div>
        {n > 1 && (
          <div style={{ position: 'relative', height: 16 }}>
            {months.map((k, j) => (
              <span key={k} style={{ position: 'absolute', left: (X(j) / 320) * 100 + '%', transform: 'translateX(-50%)', fontSize: 11, fontWeight: j === last ? 800 : 600, color: j === last ? 'var(--color-accent-800)' : 'var(--color-neutral-700)' }}>{monthShort(k).slice(0, 1)}</span>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
        <div style={tile}><div style={{ ...tileKick, color: 'var(--color-neutral-700)' }}>{n}-month total</div><div style={tileNum}>{fmt(tot.reduce((a, v) => a + v, 0))}</div></div>
        <div style={tile}><div style={{ ...tileKick, color: 'var(--color-neutral-700)' }}>Monthly average</div><div style={tileNum}>{avg === null ? '—' : fmt(avg)}</div></div>
        <div style={{ ...tile, background: 'var(--kh-1)', color: 'var(--kh-2)' }}><div style={tileKick}>Highest{hiI >= 0 ? ' · ' + monthYear(months[hiI]) : ''}</div><div style={tileNum}>{hiI >= 0 ? fmt(full[hiI]) : '—'}</div></div>
        <div style={{ ...tile, background: 'var(--color-accent-2-200)', color: 'var(--color-accent-2-900)' }}><div style={tileKick}>Lowest{loI >= 0 ? ' · ' + monthYear(months[loI]) : ''}</div><div style={tileNum}>{loI >= 0 ? fmt(full[loI]) : '—'}</div></div>
      </div>
      {!full.length && <div style={{ fontSize: 12, color: 'var(--color-neutral-700)', marginTop: -8 }}>Average, highest and lowest appear once a full month has passed.</div>}
    </>
  );
}
