import { BACKEND_URL } from '$lib/backend/config';
import { getAuthHeaders } from '$lib/backend/http';
import { TABLE_ID, ensureWellbeingTable, type ColumnMap } from '$lib/backend/wellbeingTable';

export interface RawRow {
	row_id: number;
	row_data: Record<string, unknown>;
}

/** Rows of the current user's tappi/wellbeing table, with the column map
 *  needed to interpret them (column ids differ per user). */
export async function listWellbeingRows(): Promise<{ rows: RawRow[]; col: ColumnMap }> {
	const { col } = await ensureWellbeingTable();
	const headers = await getAuthHeaders();

	const res = await fetch(`${BACKEND_URL}/api/v1/tables/${TABLE_ID}/rows?limit=500`, {
		headers
	});

	if (!res.ok) {
		throw new Error(`listWellbeingRows failed: ${res.status} ${res.statusText}`);
	}

	return { rows: await res.json(), col };
}
