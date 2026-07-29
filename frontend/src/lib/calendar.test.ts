import { describe, expect, it } from 'vitest';
import { dayKey, isSameMonth, monthMatrix } from './calendar';

describe('monthMatrix', () => {
	it('builds full Sun-start weeks padded with prev/next month days for July 2026', () => {
		const weeks = monthMatrix(2026, 6);

		expect(weeks).toHaveLength(5);
		for (const week of weeks) {
			expect(week).toHaveLength(7);
		}

		const firstDay = weeks[0][0];
		const lastDay = weeks[weeks.length - 1][6];

		expect(dayKey(firstDay)).toBe('2026-06-28');
		expect(dayKey(lastDay)).toBe('2026-08-01');

		expect(isSameMonth(firstDay, 2026, 6)).toBe(false);
		expect(isSameMonth(lastDay, 2026, 6)).toBe(false);
	});

	it('does not pad when the month starts on Sunday and ends on Saturday', () => {
		const weeks = monthMatrix(2026, 1); // February 2026

		expect(weeks).toHaveLength(4);
		expect(dayKey(weeks[0][0])).toBe('2026-02-01');
		expect(dayKey(weeks[weeks.length - 1][6])).toBe('2026-02-28');
	});

	it('always contains full weeks in consecutive order with no gaps', () => {
		const weeks = monthMatrix(2026, 6);
		const flat = weeks.flat();

		for (let i = 1; i < flat.length; i++) {
			const diffDays = (flat[i].getTime() - flat[i - 1].getTime()) / (24 * 60 * 60 * 1000);
			expect(diffDays).toBe(1);
		}
	});
});

describe('dayKey', () => {
	it('formats local dates as YYYY-MM-DD with zero padding', () => {
		expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
		expect(dayKey(new Date(2026, 11, 25))).toBe('2026-12-25');
	});
});

describe('isSameMonth', () => {
	it('returns true only for days within the given year/month', () => {
		expect(isSameMonth(new Date(2026, 6, 15), 2026, 6)).toBe(true);
		expect(isSameMonth(new Date(2026, 5, 30), 2026, 6)).toBe(false);
		expect(isSameMonth(new Date(2025, 6, 15), 2026, 6)).toBe(false);
	});
});
