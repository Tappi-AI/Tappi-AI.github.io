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

let workspaceId: string | null = null;
let initialized = false;

async function ensureSetup(): Promise<void> {
	if (initialized) return;

	const headers = getHeaders();

	// Find or create workspace
	const wsRes = await fetch(`${BACKEND_URL}/api/v1/workspaces`, { headers });
	if (!wsRes.ok) throw new Error('Failed to fetch workspaces');
	const workspaces = await wsRes.json();

	if (workspaces.length > 0) {
		workspaceId = workspaces[0].workspace_id;
	} else {
		const createWs = await fetch(`${BACKEND_URL}/api/v1/workspaces`, {
			method: 'POST',
			headers,
			body: JSON.stringify({ workspace_name: 'Tappi' })
		});
		if (!createWs.ok) throw new Error('Failed to create workspace');
		const ws = await createWs.json();
		workspaceId = ws.workspace_id;
	}

	// Check if energy table exists
	const tablesRes = await fetch(`${BACKEND_URL}/api/v1/tables`, { headers });
	if (!tablesRes.ok) throw new Error('Failed to fetch tables');
	const tables = await tablesRes.json();
	const hasEnergy = tables.some((t: { table_id: string }) => t.table_id === 'energy');

	if (!hasEnergy) {
		const createTable = await fetch(`${BACKEND_URL}/api/v1/tables`, {
			method: 'POST',
			headers,
			body: JSON.stringify({ table_id: 'energy', workspace_id: workspaceId })
		});
		if (!createTable.ok) {
			const err = await createTable.json().catch(() => ({ detail: 'Failed' }));
			throw new Error(err.detail || 'Failed to create energy table');
		}
	}

	initialized = true;
}

export function resetEnergySetup(): void {
	initialized = false;
	workspaceId = null;
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
	await ensureSetup();
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
	await ensureSetup();
	const response = await fetch(
		`${BACKEND_URL}/api/v1/tables/energy/rows?limit=100&sort=desc`,
		{ headers: getHeaders() }
	);
	if (!response.ok) return [];
	const rows = await response.json();
	return rows.map((r: { row_data: EnergyEntry }) => r.row_data);
}
