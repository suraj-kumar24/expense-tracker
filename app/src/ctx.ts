import type { Data } from './model';

export type Screen = 'welcome' | 'setup-cats' | 'setup-budgets' | 'overview' | 'insights' | 'detail' | 'settings';
export type DialogKind = 'budget' | 'rename' | 'sub' | 'quick' | 'entry' | 'merge' | 'delete';

export type Ctx = {
  data: Data;
  update: (fn: (d: Data) => Data) => void;
  now: Date;
  month: string; // current month, YYYY-MM
  toast: (text: string, undo?: () => void) => void;
  /** Open a screen on top of the current one (hardware/browser back returns). */
  open: (screen: Screen, detailId?: string) => void;
  /** Go back one layer. */
  back: () => void;
  /** Drop all history and land on a screen. */
  reset: (screen: Screen) => void;
  openLog: (catId?: string) => void;
  openDialog: (kind: DialogKind, entryId?: string) => void;
};
