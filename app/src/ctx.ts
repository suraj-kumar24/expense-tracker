import type { Data } from './model';

export type Screen = 'welcome' | 'setup-cats' | 'setup-budgets' | 'overview' | 'insights' | 'detail' | 'settings' | 'manage';

export type Ctx = {
  data: Data;
  update: (fn: (d: Data) => Data) => void;
  now: Date;
  month: string; // current month, YYYY-MM
  toast: (text: string, undo?: () => void) => void;
  /** Open a screen on top of the current one (hardware/browser back returns). */
  open: (screen: Screen, detailId?: string) => void;
  /** Push a history layer (a sheet); `close` runs when it's popped. */
  layer: (close: () => void) => void;
  /** Go back `n` layers, running their close handlers. Resolves once they have closed. */
  back: (n?: number) => Promise<void>;
  /** Drop all history and land on a screen. */
  reset: (screen: Screen) => void;
  /** Switch the open detail screen to another category (after a merge). */
  showDetail: (id: string) => void;
  /** Open the add-expense sheet, optionally locked to a category or editing an entry. */
  openLog: (opts?: { cat?: string; entryId?: string }) => void;
  /** While set, a back gesture calls this instead of leaving; return true to block. */
  setGuard: (fn: (() => boolean) | null) => void;
};
