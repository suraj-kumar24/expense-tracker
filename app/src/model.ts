// Data model, formatting and derived numbers for Khata. Pure functions only — UI lives in components.

export type Quick = { id: string; label: string; amt: number; sub?: string | null; rec?: boolean };
export type Cat = { id: string; emoji: string; name: string; budget: number; want: boolean; subs: string[]; quick: Quick[] };
export type Entry = { id: string; cat: string; sub: string | null; amt: number; date: string /* YYYY-MM-DD */ };
export type Data = {
  version: 1;
  setupDone: boolean;
  startMonth: string; // YYYY-MM — first month tracked
  recurringFiled: string; // YYYY-MM — last month whose monthly amounts were auto-filed
  cats: Cat[];
  entries: Entry[];
  thrX: number; // amber from (% of budget)
  thrY: number; // red from
  lastAmt: number;
};

export const PRESETS: Cat[] = [
  { id: 'housing', emoji: '🏠', name: 'Housing', budget: 25000, want: false, subs: ['Rent', 'Electricity', 'Water'], quick: [] },
  { id: 'groceries', emoji: '🛒', name: 'Groceries', budget: 8000, want: false, subs: [], quick: [] },
  { id: 'food', emoji: '🍜', name: 'Eating out', budget: 4000, want: true, subs: ['Swiggy', 'Cafés'], quick: [] },
  { id: 'transport', emoji: '🛺', name: 'Transport', budget: 3000, want: false, subs: ['Auto', 'Metro'], quick: [] },
  { id: 'shopping', emoji: '🛍️', name: 'Shopping', budget: 3000, want: true, subs: [], quick: [] },
  { id: 'fun', emoji: '🎬', name: 'Entertainment', budget: 2000, want: true, subs: ['Movies', 'Subscriptions'], quick: [] },
  { id: 'health', emoji: '💊', name: 'Health', budget: 2000, want: false, subs: [], quick: [] },
  { id: 'bills', emoji: '📶', name: 'Bills', budget: 1500, want: false, subs: ['Internet', 'Mobile'], quick: [] }
];
export const EXTRA: Pick<Cat, 'id' | 'emoji' | 'name'>[] = [
  { id: 'edu', emoji: '📚', name: 'Education' },
  { id: 'travel', emoji: '✈️', name: 'Travel' },
  { id: 'gifts', emoji: '🎁', name: 'Gifts' },
  { id: 'pets', emoji: '🐾', name: 'Pets' }
];

export const RED = { bar: 'oklch(0.5 0.18 18)', bg: 'oklch(0.93 0.045 18)', fg: 'oklch(0.44 0.17 20)' };
export const COL = {
  normal: { bar: 'var(--color-accent-2)', bg: 'var(--color-accent-2-100)', fg: 'var(--color-accent-2-800)' },
  amber: { bar: 'oklch(0.79 0.15 78)', bg: 'oklch(0.95 0.06 88)', fg: 'oklch(0.44 0.09 65)' },
  red: RED
};
export const SLICE = ['var(--color-accent)', 'var(--color-accent-2)', 'var(--color-accent-400)', 'var(--color-accent-2-400)', 'var(--color-accent-700)', 'var(--color-accent-2-700)', 'var(--color-neutral-500)', 'var(--color-accent-300)', 'var(--color-accent-2-300)', 'var(--color-neutral-700)', 'var(--color-accent-800)', 'var(--color-accent-2-800)'];

export const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
export const uid = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ── formatting ────────────────────────────────────────────────────────────
/** Indian digit grouping: ₹1,23,456.50 */
export function fmt(n: number): string {
  const neg = n < 0;
  n = Math.abs(Math.round(n * 100) / 100);
  const [i, d] = n.toFixed(2).split('.');
  const last3 = i.slice(-3);
  let rest = i.slice(0, -3);
  if (rest) rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  let s = (rest ? rest + ',' : '') + last3;
  if (d !== '00') s += '.' + d;
  return (neg ? '−' : '') + '₹' + s;
}
/** Formats a keypad string while typing, keeping a trailing "." or partial decimals. */
export function fmtTyping(s: string): string {
  if (!s) return '0';
  const [i, d] = s.split('.');
  const g = fmt(Number(i || 0)).slice(1);
  return s.includes('.') ? g + '.' + (d || '') : g;
}
export const validAmt = (s: string | number) => /^\d+(\.\d{1,2})?$/.test(String(s).trim()) && Number(s) > 0;

/** Applies one keypad press to the amount string. Returns null when the press is rejected (third decimal). */
export function pressKey(a: string, k: string): string | null {
  if (k === 'del') return a.slice(0, -1);
  if (k === '.') return a.includes('.') ? a : (a || '0') + '.';
  if (a.includes('.') && a.split('.')[1].length >= 2) return null;
  if (a.replace('.', '').length >= 8) return a;
  return a === '0' ? k : a + k;
}

// ── dates ─────────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0');
export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const monthKey = (d: Date) => dateKey(d).slice(0, 7);
export const monthOf = (date: string) => date.slice(0, 7);
export function addMonths(key: string, n: number): string {
  const [y, m] = key.split('-').map(Number);
  const t = y * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${pad((t % 12) + 1)}`;
}
// Fixed English names — ICU's en-GB short form is "Sept", the design uses "Sep".
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const monthLong = (key: string) => MONTHS[Number(key.slice(5, 7)) - 1];
export const monthShort = (key: string) => monthLong(key).slice(0, 3);
/** "Wednesday, 23 September" */
export const longDate = (d: Date) => `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
export const monthYear = (key: string) => monthShort(key) + ' ' + key.slice(0, 4);
export const dayMonth = (date: string) => Number(date.slice(8, 10)) + ' ' + monthShort(date);
export const daysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
/** Days left in the month, counting today. */
export const daysLeft = (d: Date) => daysInMonth(d) - d.getDate() + 1;

// ── storage ───────────────────────────────────────────────────────────────
const KEY = 'khata.v1';
export function emptyData(now: Date): Data {
  const mk = monthKey(now);
  return { version: 1, setupDone: false, startMonth: mk, recurringFiled: mk, cats: clone(PRESETS), entries: [], thrX: 70, thrY: 90, lastAmt: 0 };
}
export function load(now: Date): Data {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw) as Data;
      if (d && d.version === 1 && Array.isArray(d.cats) && Array.isArray(d.entries)) return d;
    }
  } catch { /* fall through to a fresh start */ }
  return emptyData(now);
}
export function save(d: Data) {
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* storage full or blocked */ }
}

/** Files every "same every month" quick amount for each month since the last run. */
export function fileRecurring(d: Data, now: Date): { data: Data; filed: Entry[] } {
  const cur = monthKey(now);
  if (!d.setupDone || d.recurringFiled >= cur) return { data: d, filed: [] };
  const filed: Entry[] = [];
  for (let m = addMonths(d.recurringFiled, 1); m <= cur; m = addMonths(m, 1)) {
    d.cats.forEach(c => c.quick.forEach(q => {
      if (q.rec) filed.push({ id: uid('r'), cat: c.id, sub: q.sub || null, amt: q.amt, date: m + '-01' });
    }));
  }
  return { data: { ...d, entries: [...d.entries, ...filed], recurringFiled: cur }, filed };
}

// ── derived ───────────────────────────────────────────────────────────────
export const spentIn = (entries: Entry[], cat: string, month: string) =>
  entries.reduce((s, e) => (e.cat === cat && monthOf(e.date) === month ? s + e.amt : s), 0);

export type Level = 'normal' | 'amber' | 'red' | 'over';
export const levelOf = (pct: number, thrX: number, thrY: number): Level =>
  pct > 100 ? 'over' : pct >= thrY ? 'red' : pct >= thrX ? 'amber' : 'normal';

export type CatView = Cat & {
  spent: number; pct: number; st: Level; bar: string; tagBg: string; tagFg: string; barW: string;
  tagText: string; leftText: string; count: number; countText: string;
};
export function catView(c: Cat, d: Data, month: string): CatView {
  const spent = spentIn(d.entries, c.id, month);
  const pct = c.budget ? (spent / c.budget) * 100 : spent ? 101 : 0;
  const st = levelOf(pct, d.thrX, d.thrY);
  const col = st === 'over' ? COL.red : COL[st];
  const count = d.entries.filter(e => e.cat === c.id && monthOf(e.date) === month).length;
  return {
    ...c, spent, pct: Math.round(pct), st, bar: col.bar, tagBg: col.bg, tagFg: col.fg, barW: Math.min(pct, 100) + '%',
    tagText: st === 'over' ? fmt(spent - c.budget) + ' over' : st === 'normal' ? 'On track' : Math.round(pct) + '% used',
    leftText: st === 'over' ? fmt(spent - c.budget) + ' over budget' : fmt(c.budget - spent) + ' left',
    count, countText: count + (count === 1 ? ' entry' : ' entries')
  };
}

/** Category ids sorted by how many entries they have this month (most used first). */
export function byUse(d: Data, month: string): string[] {
  const cnt: Record<string, number> = {};
  d.entries.forEach(e => { if (monthOf(e.date) === month) cnt[e.cat] = (cnt[e.cat] || 0) + 1; });
  return [...d.cats].sort((a, b) => (cnt[b.id] || 0) - (cnt[a.id] || 0)).map(c => c.id);
}

export function toCsv(d: Data): string {
  const names: Record<string, string> = {};
  d.cats.forEach(c => (names[c.id] = c.name));
  const q = (v: string | number) => (/[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v));
  const rows = [...d.entries].sort((a, b) => a.date.localeCompare(b.date)).map(e => [e.date, names[e.cat] || '', e.sub || '', e.amt]);
  return [['date', 'category', 'subcategory', 'amount'], ...rows].map(r => r.map(q).join(',')).join('\n');
}
