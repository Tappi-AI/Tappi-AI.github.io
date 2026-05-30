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
let colMap: Record<string, string> = {};
let initialized = false;
let initPromise: Promise<void> | null = null;

const NEEDED_COLS: { name: string; type: string }[] = [
	{ name: 'Activity', type: 'text' },
	{ name: 'Mood', type: 'text' },
	{ name: 'Duration', type: 'text' },
	{ name: 'Energy', type: 'number' }
];

async function ensureSetup(): Promise<void> {
	if (initialized) return;
	if (initPromise) return initPromise;
	initPromise = doSetup();
	try {
		await initPromise;
	} finally {
		initPromise = null;
	}
}

async function doSetup(): Promise<void> {
	if (initialized) return;

	const headers = getHeaders();

	// Find or create workspace
	const wsRes = await fetch(`${BACKEND_URL}/api/v1/workspaces`, { headers });
	if (!wsRes.ok) throw new Error('Failed to fetch workspaces');
	const workspaces = await wsRes.json();

	const tappiWs = workspaces.find((w: { workspace_name: string }) => w.workspace_name === 'Tappi');
	if (tappiWs) {
		workspaceId = tappiWs.workspace_id;
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

	// Check if energy table exists in Tappi workspace
	const tablesRes = await fetch(`${BACKEND_URL}/api/v1/tables`, { headers });
	if (!tablesRes.ok) throw new Error('Failed to fetch tables');
	const tables = await tablesRes.json();
	const hasEnergy = tables.some(
		(t: { table_id: string; workspace_id: string }) =>
			t.table_id === 'energy' && t.workspace_id === workspaceId
	);

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

	// Fetch columns and ensure needed ones exist
	let tableRes = await fetch(`${BACKEND_URL}/api/v1/tables/energy`, { headers });
	if (!tableRes.ok) throw new Error('Failed to fetch energy table');
	let table = await tableRes.json();

	const existingNames = new Set(table.columns.map((c: { name: string }) => c.name));
	let created = false;
	for (const needed of NEEDED_COLS) {
		if (!existingNames.has(needed.name)) {
			await fetch(`${BACKEND_URL}/api/v1/tables/energy/columns`, {
				method: 'POST',
				headers,
				body: JSON.stringify({ name: needed.name, type: needed.type })
			});
			created = true;
		}
	}

	if (created) {
		tableRes = await fetch(`${BACKEND_URL}/api/v1/tables/energy`, { headers });
		if (!tableRes.ok) throw new Error('Failed to re-fetch energy table');
		table = await tableRes.json();
	}

	colMap = {};
	for (const c of table.columns) {
		colMap[c.name] = c.column_id;
	}
	initialized = true;
}

export function resetEnergySetup(): void {
	initialized = false;
	workspaceId = null;
	colMap = {};
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

	const row_data: Record<string, string | number> = {};

	if (colMap['Title']) row_data[colMap['Title']] = entry.activity;
	if (colMap['Activity']) row_data[colMap['Activity']] = entry.activity;
	if (colMap['Mood'])
		row_data[colMap['Mood']] = (entry.emotion_emoji || '') + ' ' + (entry.emotion_label || '');
	if (colMap['Duration']) row_data[colMap['Duration']] = entry.duration_label || '';
	if (colMap['Energy']) row_data[colMap['Energy']] = entry.energy;

	const response = await fetch(`${BACKEND_URL}/api/v1/tables/energy/rows`, {
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
	await ensureSetup();
	const response = await fetch(
		`${BACKEND_URL}/api/v1/tables/energy/rows?limit=100&sort=desc`,
		{ headers: getHeaders() }
	);
	if (!response.ok) return [];
	const rows = await response.json();

	const actCol = colMap['Activity'] || colMap['Title'];
	const moodCol = colMap['Mood'];
	const durCol = colMap['Duration'];
	const engCol = colMap['Energy'];

	return rows.map((r: { row_data: Record<string, string | number> }) => ({
		activity: r.row_data[actCol] || '',
		timestamp: 0,
		emotion_label: moodCol ? String(r.row_data[moodCol] || '') : '',
		duration_label: durCol ? String(r.row_data[durCol] || '') : '',
		energy: engCol ? Number(r.row_data[engCol] || 0) : 0
	}));
}
