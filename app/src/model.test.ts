import { describe, expect, it } from 'vitest';
import { addMonths, catView, daysLeft, emptyData, fileRecurring, fmt, fmtTyping, pressKey, toCsv, validAmt } from './model';

describe('formatting', () => {
  it('groups digits the Indian way', () => {
    expect(fmt(19333)).toBe('₹19,333');
    expect(fmt(1234567.5)).toBe('₹12,34,567.50');
    expect(fmt(-540)).toBe('−₹540');
  });
  it('formats while typing', () => {
    expect(fmtTyping('')).toBe('0');
    expect(fmtTyping('12000.')).toBe('12,000.');
    expect(fmtTyping('12000.5')).toBe('12,000.5');
  });
  it('validates amounts', () => {
    expect(validAmt('0')).toBe(false);
    expect(validAmt('0.5')).toBe(true);
    expect(validAmt('1.234')).toBe(false);
  });
});

describe('keypad', () => {
  it('rejects a third decimal and replaces a lone zero', () => {
    expect(pressKey('1.23', '4')).toBeNull();
    expect(pressKey('0', '5')).toBe('5');
    expect(pressKey('', '.')).toBe('0.');
    expect(pressKey('1.', '.')).toBe('1.');
    expect(pressKey('12345678', '9')).toBe('12345678');
  });
});

describe('dates', () => {
  it('adds months across years', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -2)).toBe('2025-11');
  });
  it('counts today in days left', () => {
    expect(daysLeft(new Date(2026, 8, 23))).toBe(8);
  });
});

describe('data', () => {
  const now = new Date(2026, 8, 23);
  it('classifies spending against thresholds', () => {
    const d = emptyData(now);
    d.entries = [{ id: 'a', cat: 'groceries', sub: null, amt: 6000, date: '2026-09-02' }];
    const v = catView(d.cats.find(c => c.id === 'groceries')!, d, '2026-09');
    expect(v.st).toBe('amber');
    expect(v.tagText).toBe('75% used');
    expect(v.leftText).toBe('₹2,000 left');
  });
  it('files monthly amounts once per missed month', () => {
    const d = { ...emptyData(now), setupDone: true, recurringFiled: '2026-07' };
    d.cats[0].quick = [{ id: 'q', label: 'Rent', amt: 19333, sub: 'Rent', rec: true }];
    const { data, filed } = fileRecurring(d, now);
    expect(filed.map(e => e.date)).toEqual(['2026-08-01', '2026-09-01']);
    expect(fileRecurring(data, now).filed).toHaveLength(0);
  });
  it('escapes CSV fields', () => {
    const d = emptyData(now);
    d.cats[0].name = 'Rent, flat';
    d.entries = [{ id: 'a', cat: 'housing', sub: null, amt: 5, date: '2026-09-01' }];
    expect(toCsv(d).split('\n')[1]).toBe('2026-09-01,"Rent, flat",,5');
  });
});
