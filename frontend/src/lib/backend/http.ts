import { get } from 'svelte/store';
import { authStore } from '$lib/stores/auth.store';

export async function getAuthHeaders(): Promise<Record<string, string>> {
	const auth = get(authStore);
	if (!auth?.accessToken) {
		throw new Error('Not authenticated');
	}
	return {
		Authorization: `Bearer ${auth.accessToken}`,
		'Content-Type': 'application/json'
	};
}

export async function getBearerHeader(): Promise<Record<string, string>> {
	const auth = get(authStore);
	if (!auth?.accessToken) {
		throw new Error('Not authenticated');
	}
	return { Authorization: `Bearer ${auth.accessToken}` };
}
