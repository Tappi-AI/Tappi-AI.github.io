import { describe, expect, it } from 'vitest';
import type { RawRow } from '$lib/api/rows';
import { groupByDay, parseEntries } from './wellbeing';

// Column ids are per user and resolved at runtime, so these are arbitrary —
// the point is that parseEntries reads them via the supplied map, not constants.
const COLUMN_IDS = {
	time: 'col-time-uuid',
	mood: 'col-mood-uuid',
	energy: 'col-energy-uuid',
	memo: 'col-memo-uuid',
	feeling: 'col-feeling-uuid'
};

const COL = {
	Time: COLUMN_IDS.time,
	Mood: COLUMN_IDS.mood,
	Energy: COLUMN_IDS.energy,
	Memo: COLUMN_IDS.memo,
	Feeling: COLUMN_IDS.feeling
};

function makeRow(
	rowId: number,
	fields: Partial<{ time: string; mood: string; energy: number; memo: string; feeling: string }>
): RawRow {
	const row_data: Record<string, unknown> = {};
	if (fields.time !== undefined) row_data[COLUMN_IDS.time] = fields.time;
	if (fields.mood !== undefined) row_data[COLUMN_IDS.mood] = fields.mood;
	if (fields.energy !== undefined) row_data[COLUMN_IDS.energy] = fields.energy;
	if (fields.memo !== undefined) row_data[COLUMN_IDS.memo] = fields.memo;
	if (fields.feeling !== undefined) row_data[COLUMN_IDS.feeling] = fields.feeling;
	return { row_id: rowId, row_data };
}

describe('parseEntries', () => {
	it('maps column ids to fields and splits mood into emoji + word', () => {
		const rows = [
			makeRow(1, {
				time: '2026-07-09T09:00:00',
				mood: '😊 happy',
				energy: 80,
				memo: 'good morning',
				feeling: 'refreshed'
			})
		];

		const entries = parseEntries(rows, COL);

		expect(entries).toEqual([
			{
				rowId: 1,
				time: new Date('2026-07-09T09:00:00'),
				mood: 'happy',
				emoji: '😊',
				energy: 80,
				memo: 'good morning',
				feeling: 'refreshed'
			}
		]);
	});

	it('sorts entries ascending by time', () => {
		const rows = [
			makeRow(1, { time: '2026-07-09T18:00:00', mood: '😴 tired', energy: 10 }),
			makeRow(2, { time: '2026-07-09T08:00:00', mood: '😊 happy', energy: 90 })
		];

		const entries = parseEntries(rows, COL);

		expect(entries.map((e) => e.rowId)).toEqual([2, 1]);
	});

	it('skips rows with missing or invalid time', () => {
		const rows = [
			makeRow(1, { mood: '😊 happy', energy: 50 }),
			makeRow(2, { time: 'not-a-date', mood: '😊 happy', energy: 50 }),
			makeRow(3, { time: '2026-07-09T08:00:00', mood: '😊 happy', energy: 50 })
		];

		const entries = parseEntries(rows, COL);

		expect(entries.map((e) => e.rowId)).toEqual([3]);
	});
});

describe('groupByDay', () => {
	it('groups entries by local YYYY-MM-DD key', () => {
		const rows = [
			makeRow(1, { time: '2026-07-09T08:00:00', mood: '😊 happy', energy: 50 }),
			makeRow(2, { time: '2026-07-09T20:00:00', mood: '😴 tired', energy: 30 }),
			makeRow(3, { time: '2026-07-10T08:00:00', mood: '😌 calm', energy: 70 })
		];
		const entries = parseEntries(rows, COL);

		const groups = groupByDay(entries);

		expect([...groups.keys()]).toEqual(['2026-07-09', '2026-07-10']);
		expect(groups.get('2026-07-09')?.map((e) => e.rowId)).toEqual([1, 2]);
		expect(groups.get('2026-07-10')?.map((e) => e.rowId)).toEqual([3]);
	});
});
