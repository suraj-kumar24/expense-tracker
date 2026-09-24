import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Ctx } from './ctx';
import { Back, Close } from './icons';

/** A bottom sheet over the whole app, with a scrim that closes it. */
export function Sheet({ onClose, children, z = 30, label }: { onClose: () => void; children: ReactNode; z?: number; label?: string }) {
  const root = document.getElementById('phone');
  if (!root) return null;
  return createPortal(
    <>
      <div className="scrim" onClick={onClose} style={{ zIndex: z }} />
      <div role="dialog" aria-modal="true" aria-label={label} className="sheet bsheet" style={{ zIndex: z + 1 }}>
        <div className="handle" />
        {children}
      </div>
    </>,
    root
  );
}

/** Sheet state wired into history, so the phone's back button closes it. */
export function useSheet<K extends string>(ctx: Ctx) {
  const [kind, setKind] = useState<K | null>(null);
  return {
    kind,
    open: (k: K) => {
      if (kind) setKind(k); // swap in place
      else { ctx.layer(() => setKind(null)); setKind(k); }
    },
    close: () => { ctx.back(); }
  };
}

export const BackBtn = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} aria-label="Back" className="ib"><Back /></button>
);
export const CloseBtn = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} aria-label="Close" className="ib ghost"><Close /></button>
);

/** Pill toggle colours: accent when on, neutral when off. */
export const sel = (on: boolean) => ({
  background: on ? 'var(--color-accent)' : 'var(--color-neutral-100)',
  color: on ? 'var(--color-neutral-100)' : 'var(--color-text)',
  borderColor: on ? 'var(--color-accent)' : 'var(--color-divider)'
});

/** The dark "Spent this month" card used on Overview and category detail. */
export function SpentCard({ spent, budget, barW, bar, over, right }: { spent: string; budget: string; barW: string; bar: string; over: boolean; right: string }) {
  return (
    <div style={{ background: 'var(--color-neutral-900)', color: 'var(--color-neutral-100)', borderRadius: 32, padding: '20px 22px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-neutral-400)', fontWeight: 600 }}>Spent this month</div>
      <span style={{ fontFamily: 'var(--font-heading)', fontSize: 44, lineHeight: 1 }}>{spent}</span>
      <div style={{ position: 'relative', height: 12, borderRadius: 999, background: 'var(--color-neutral-800)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: barW, borderRadius: 999, background: bar }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-neutral-300)' }}>
        <span>of {budget} budget</span>
        <span style={{ fontWeight: 700, color: over ? 'var(--kh-2)' : 'var(--color-neutral-100)', background: over ? 'var(--kh-1)' : 'transparent', padding: over ? '3px 10px' : 0, borderRadius: 999 }}>{right}</span>
      </div>
    </div>
  );
}
