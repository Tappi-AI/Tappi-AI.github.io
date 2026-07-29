// Shared contract with the web FE (demo.tappi.ai).
//
// Storage is PER USER: each user owns a workspace named "tappi" holding a
// table "wellbeing". Column ids are therefore NOT constant across users —
// they must be resolved at runtime from the table schema. `scripts/
// provision-wellbeing.sh` pre-creates this for a user; the resolver below
// also creates anything missing so a fresh login just works.

import { BACKEND_URL } from './config';
import { get } from 'svelte/store';
import { authStore } from '$lib/stores/auth.store';

export const WORKSPACE_NAME = 'tappi';
export const TABLE_ID = 'wellbeing';

/** Column display-name → column_id (UUID) for the current user's table. */
export type ColumnMap = Record<string, string>;

export interface WellbeingTable {
	workspaceId: string;
	col: ColumnMap;
}

const NEEDED_COLUMNS: { name: string; type: string; options?: unknown }[] = [
	{ name: 'Time', type: 'text' },
	{
		name: 'Mood',
		type: 'select',
		options: {
			choices: [
				{ color: '#4ade80', value: '😊 happy' },
				{ color: '#ef4444', value: '😠 angry' },
				{ color: '#60a5fa', value: '😢 sad' },
				{ color: '#a7f3d0', value: '😌 calm' },
				{ color: '#fbbf24', value: '😰 anxious' },
				{ color: '#9ca3af', value: '😴 tired' },
				{ color: '#c084fc', value: '🤩 excited' }
			]
		}
	},
	{ name: 'Energy', type: 'number' },
	{ name: 'Memo', type: 'text' },
	{ name: 'Feeling', type: 'text' }
];

function headers(): Record<string, string> {
	const auth = get(authStore);
	if (!auth?.accessToken) throw new Error('Not authenticated');
	return {
		Authorization: `Bearer ${auth.accessToken}`,
		'Content-Type': 'application/json'
	};
}

let cached: WellbeingTable | null = null;
// Concurrent callers must share one resolution, otherwise each would see the
// columns as missing and create duplicates.
let inflight: Promise<WellbeingTable> | null = null;

export function resetWellbeingTable(): void {
	cached = null;
	inflight = null;
}

export async function ensureWellbeingTable(): Promise<WellbeingTable> {
	if (cached) return cached;
	if (inflight) return inflight;
	inflight = resolve();
	try {
		cached = await inflight;
		return cached;
	} finally {
		inflight = null;
	}
}

async function resolve(): Promise<WellbeingTable> {
	const h = headers();

	// 1. Workspace "tappi"
	const wsRes = await fetch(`${BACKEND_URL}/api/v1/workspaces`, { headers: h });
	if (!wsRes.ok) throw new Error('Failed to list workspaces');
	const workspaces: { workspace_id: string; workspace_name: string }[] = await wsRes.json();

	let workspaceId = workspaces.find((w) => w.workspace_name === WORKSPACE_NAME)?.workspace_id;
	if (!workspaceId) {
		const created = await fetch(`${BACKEND_URL}/api/v1/workspaces`, {
			method: 'POST',
			headers: h,
			body: JSON.stringify({ workspace_name: WORKSPACE_NAME })
		});
		if (!created.ok) throw new Error('Failed to create workspace');
		workspaceId = (await created.json()).workspace_id;
	}

	// 2. Table "wellbeing" in that workspace
	const tablesRes = await fetch(`${BACKEND_URL}/api/v1/tables`, { headers: h });
	if (!tablesRes.ok) throw new Error('Failed to list tables');
	const tables: { table_id: string; workspace_id: string }[] = await tablesRes.json();

	const exists = tables.some(
		(t) => t.table_id === TABLE_ID && String(t.workspace_id) === String(workspaceId)
	);
	if (!exists) {
		const created = await fetch(`${BACKEND_URL}/api/v1/tables`, {
			method: 'POST',
			headers: h,
			body: JSON.stringify({ table_id: TABLE_ID, workspace_id: workspaceId })
		});
		if (!created.ok) throw new Error('Failed to create wellbeing table');
	}

	// 3. Columns — add whatever is missing, then re-read for authoritative ids.
	let schema = await readSchema(workspaceId!, h);
	const present = new Set(schema.map((c) => c.name));
	let added = false;

	for (const needed of NEEDED_COLUMNS) {
		if (present.has(needed.name)) continue;
		await fetch(`${BACKEND_URL}/api/v1/tables/${TABLE_ID}/columns`, {
			method: 'POST',
			headers: h,
			body: JSON.stringify({
				name: needed.name,
				type: needed.type,
				options: needed.options ?? {}
			})
		});
		added = true;
	}
	if (added) schema = await readSchema(workspaceId!, h);

	const col: ColumnMap = {};
	for (const c of schema) col[c.name] = c.column_id;

	return { workspaceId: workspaceId!, col };
}

async function readSchema(
	workspaceId: string,
	h: Record<string, string>
): Promise<{ name: string; column_id: string }[]> {
	const res = await fetch(
		`${BACKEND_URL}/api/v1/tables/${TABLE_ID}?workspace_id=${workspaceId}`,
		{ headers: h }
	);
	if (!res.ok) throw new Error('Failed to read wellbeing table schema');
	return (await res.json()).columns ?? [];
}

// Mood is a `select` column — only these values exist as choices.
// The mobile UI uses a 5-point Awful..Great scale, so map onto the shared
// vocabulary. The original mobile label is preserved in the Feeling column.
const MOOD_BY_LABEL: Record<string, string> = {
	Awful: '😢 sad',
	Bad: '😰 anxious',
	Okay: '😌 calm',
	Good: '😊 happy',
	Great: '🤩 excited'
};

export function toMoodChoice(emotionLabel: string | undefined): string {
	return MOOD_BY_LABEL[emotionLabel ?? ''] ?? '😌 calm';
}

/** Mobile records energy on a 1..5 scale; the shared table stores 0..100. */
export function toEnergyPercent(energy1to5: number): number {
	return Math.min(100, Math.max(0, Math.round(energy1to5 * 20)));
}

export function fromEnergyPercent(pct: number): number {
	return Math.min(5, Math.max(1, Math.round(pct / 20)));
}

/** Local (not UTC) "YYYY-MM-DDTHH:mm" — matches the seeded rows' format. */
export function toLocalTimeString(timestamp: number): string {
	const d = new Date(timestamp);
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
