// Lucide icons at the design system's stroke width (2.75).
import type { ReactNode } from 'react';

function Icon({ size = 20, stroke = 'currentColor', sw = 2.75, children, style }: { size?: number; stroke?: string; sw?: number; children: ReactNode; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      {children}
    </svg>
  );
}
type P = { size?: number; stroke?: string; sw?: number; style?: React.CSSProperties };

export const Back = (p: P) => <Icon {...p}><path d="m12 19-7-7 7-7M19 12H5" /></Icon>;
export const Close = (p: P) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12" /></Icon>;
export const Plus = (p: P) => <Icon {...p}><path d="M5 12h14M12 5v14" /></Icon>;
export const Check = (p: P) => <Icon {...p}><path d="M20 6 9 17l-5-5" /></Icon>;
export const Phone = (p: P) => <Icon {...p}><rect width="14" height="20" x="5" y="2" rx="2" /><path d="M12 18h.01" /></Icon>;
export const Pie = (p: P) => <Icon {...p}><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></Icon>;
export const Sliders = (p: P) => <Icon {...p}><path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" /></Icon>;
export const Pencil = (p: P) => <Icon {...p}><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /></Icon>;
export const Repeat = (p: P) => <Icon {...p}><path d="m17 2 4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3" /></Icon>;
export const Backspace = (p: P) => <Icon {...p}><path d="M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" /><path d="m12 9 6 6M18 9l-6 6" /></Icon>;
export const Merge = (p: P) => <Icon {...p}><circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M6 21V9a9 9 0 0 0 9 9" /></Icon>;
export const Trash = (p: P) => <Icon {...p}><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></Icon>;
export const Download = (p: P) => <Icon {...p}><path d="M12 15V3M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5" /></Icon>;
export const Replay = (p: P) => <Icon {...p}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></Icon>;
