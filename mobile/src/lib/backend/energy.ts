import { BACKEND_URL } from './config';
import { get } from 'svelte/store';
import { authStore } from '$lib/stores/auth.store';
import {
	TABLE_ID,
	ensureWellbeingTable,
	resetWellbeingTable,
	toMoodChoice,
	toEnergyPercent,
	fromEnergyPercent,
	toLocalTimeString
} from './wellbeingTable';

function getHeaders(): Record<string, string> {
	const auth = get(authStore);
	if (!auth?.accessToken) throw new Error('Not authenticated');
	return {
		Authorization: `Bearer ${auth.accessToken}`,
		'Content-Type': 'application/json'
	};
}

/** Drop the resolved workspace/table cache — call on logout. */
export function resetEnergySetup(): void {
	resetWellbeingTable();
}

export interface EnergyEntry {
	activity: string;
	timestamp: number;
	duration_label?: string;
	duration_minutes?: number;
	emotion_emoji?: string;
	emotion_label?: string;
	energy: number;
}

export async function saveEnergyEntry(entry: EnergyEntry): Promise<void> {
	const { col } = await ensureWellbeingTable();

	// Duration lives in its own column rather than being appended to the memo,
	// so reading the row back reproduces the entry exactly.
	const row_data: Record<string, string | number> = {};
	const set = (name: string, value: string | number) => {
		if (col[name]) row_data[col[name]] = value;
	};

	set('Title', entry.activity);
	set('Time', toLocalTimeString(entry.timestamp || Date.now()));
	set('Mood', toMoodChoice(entry.emotion_label));
	set('Energy', toEnergyPercent(entry.energy));
	set('Memo', entry.activity);
	set('Feeling', entry.emotion_label || '');
	set('Description', entry.duration_label || '');

	const response = await fetch(`${BACKEND_URL}/api/v1/tables/${TABLE_ID}/rows`, {
		method: 'POST',
		headers: getHeaders(),
		body: JSON.stringify({ row_data })
	});
	if (!response.ok) {
		const error = await response.json().catch(() => ({ detail: 'Save failed' }));
		throw new Error(error.detail || 'Failed to save entry');
	}
}

export async function loadEnergyEntries(): Promise<EnergyEntry[]> {
	const { col } = await ensureWellbeingTable();

	const response = await fetch(`${BACKEND_URL}/api/v1/tables/${TABLE_ID}/rows?limit=100`, {
		headers: getHeaders()
	});
	if (!response.ok) return [];
	const rows = await response.json();

	return rows.map((r: { row_data: Record<string, string | number> }) => {
		const at = (name: string) => (col[name] ? r.row_data[col[name]] : undefined);

		const rawMood = String(at('Mood') ?? '');
		const [emoji = ''] = rawMood.split(' ');
		const parsed = new Date(String(at('Time') ?? '')).getTime();

		return {
			activity: String(at('Memo') ?? at('Title') ?? ''),
			timestamp: Number.isNaN(parsed) ? 0 : parsed,
			duration_label: String(at('Description') ?? ''),
			emotion_emoji: emoji,
			emotion_label: String(at('Feeling') ?? ''),
			energy: fromEnergyPercent(Number(at('Energy') ?? 0))
		};
	});
}

/** Entries whose timestamp falls on the given local calendar day, newest first. */
export function filterToday(entries: EnergyEntry[], now: Date = new Date()): EnergyEntry[] {
	const sameDay = (ts: number) => {
		const d = new Date(ts);
		return (
			d.getFullYear() === now.getFullYear() &&
			d.getMonth() === now.getMonth() &&
			d.getDate() === now.getDate()
		);
	};
	return entries
		.filter((e) => e.timestamp > 0 && sameDay(e.timestamp))
		.sort((a, b) => b.timestamp - a.timestamp);
}
