import { BACKEND_URL } from './config';
import type { AuthProvider } from '$lib/types/auth';

export interface TokenResponse {
	access_token: string;
	refresh_token?: string;
	id_token?: string;
	expires_in?: number;
	userinfo: {
		sub: string;
		email: string;
		name?: string;
		picture?: string;
	};
}

export interface MeResponse {
	user_id: string;
	sub?: string;
	email: string;
	name?: string;
	picture?: string;
	provider: 'google' | 'authentik' | 'none';
	role?: string;
	user_name?: string;
	config?: Record<string, unknown>;
}

export async function loginPassword(user_name: string, password: string): Promise<TokenResponse> {
	const response = await fetch(`${BACKEND_URL}/api/v1/login/password`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ user_name, password })
	});
	if (!response.ok) {
		const error = await response.json().catch(() => ({ detail: 'Login failed' }));
		throw new Error(error.detail || 'Login failed');
	}
	return response.json();
}

export async function exchangeCodeViaBackend(
	provider: AuthProvider,
	code: string,
	redirectUri: string,
	codeVerifier: string
): Promise<TokenResponse> {
	const response = await fetch(`${BACKEND_URL}/api/v1/login/${provider}/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ code, redirect_uri: redirectUri, code_verifier: codeVerifier })
	});
	if (!response.ok) {
		const error = await response.json().catch(() => ({ detail: 'Token exchange failed' }));
		throw new Error(error.detail || 'Token exchange failed');
	}
	return response.json();
}

export async function fetchLoginConfig(): Promise<{ auth_required: boolean }> {
	const response = await fetch(`${BACKEND_URL}/api/v1/login/config`);
	if (!response.ok) return { auth_required: true };
	return response.json();
}

export async function fetchMe(accessToken: string): Promise<MeResponse | null> {
	const response = await fetch(`${BACKEND_URL}/api/v1/login/me`, {
		headers: { Authorization: `Bearer ${accessToken}` }
	});
	if (!response.ok) return null;
	return response.json();
}
