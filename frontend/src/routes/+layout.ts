import { get } from 'svelte/store';
import { redirect } from '@sveltejs/kit';
import { authStore } from '$lib/stores/auth.store';
import type { LayoutLoad } from './$types';

export const ssr = false;
export const prerender = false;

const PUBLIC_PREFIXES = ['/login', '/callback'];

export const load: LayoutLoad = ({ url }) => {
	const isPublic = PUBLIC_PREFIXES.some((p) => url.pathname.startsWith(p));
	const authed = !!get(authStore)?.role;

	if (!authed && !isPublic) redirect(302, '/login');
};
