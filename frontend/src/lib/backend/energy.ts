import { BACKEND_URL } from './config';
import { get } from 'svelte/store';
import { authStore } from '$lib/stores/auth.store';

function getHeaders(): Record<string, string> {
	const auth = get(authStore);
	if (!auth?.accessToken) throw new Error('Not authenticated');
	return {
		Authorization: `Bearer ${auth.accessToken}`,
		'Content-Type': 'application/json'
	};
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
	const response = await fetch(`${BACKEND_URL}/api/v1/tables/energy/rows`, {
		method: 'POST',
		headers: getHeaders(),
		body: JSON.stringify({ row_data: entry })
	});
	if (!response.ok) {
		const error = await response.json().catch(() => ({ detail: 'Save failed' }));
		throw new Error(error.detail || 'Failed to save entry');
	}
}

export async function loadEnergyEntries(): Promise<EnergyEntry[]> {
	const response = await fetch(
		`${BACKEND_URL}/api/v1/tables/energy/rows?limit=100&sort=desc`,
		{ headers: getHeaders() }
	);
	if (!response.ok) return [];
	const rows = await response.json();
	return rows.map((r: { row_data: EnergyEntry }) => r.row_data);
}
