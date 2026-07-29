import type { RawRow } from '$lib/api/rows';
import type { ColumnMap } from '$lib/backend/wellbeingTable';

export interface WellbeingEntry {
	rowId: number;
	time: Date;
	mood: string;
	emoji: string;
	energy: number;
	memo: string;
	feeling: string;
}

/** Column ids are per user, so the caller supplies the resolved map. */
export function parseEntries(rows: RawRow[], col: ColumnMap): WellbeingEntry[] {
	const entries: WellbeingEntry[] = [];
	const at = (row: RawRow, name: string) => (col[name] ? row.row_data[col[name]] : undefined);

	for (const row of rows) {
		const rawTime = at(row, 'Time');
		if (typeof rawTime !== 'string') continue;

		const time = new Date(rawTime);
		if (Number.isNaN(time.getTime())) continue;

		const rawMood = String(at(row, 'Mood') ?? '');
		const [emoji = '', ...moodWords] = rawMood.split(' ');

		entries.push({
			rowId: row.row_id,
			time,
			mood: moodWords.join(' '),
			emoji,
			energy: Number(at(row, 'Energy') ?? 0),
			memo: String(at(row, 'Memo') ?? at(row, 'Title') ?? ''),
			feeling: String(at(row, 'Feeling') ?? '')
		});
	}

	return entries.sort((a, b) => a.time.getTime() - b.time.getTime());
}

export function formatTime(date: Date): string {
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	return `${hours}:${minutes}`;
}

function dayKey(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function groupByDay(entries: WellbeingEntry[]): Map<string, WellbeingEntry[]> {
	const groups = new Map<string, WellbeingEntry[]>();

	for (const entry of entries) {
		const key = dayKey(entry.time);
		const group = groups.get(key);
		if (group) {
			group.push(entry);
		} else {
			groups.set(key, [entry]);
		}
	}

	return groups;
}
