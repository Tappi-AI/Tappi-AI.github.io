<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.store';
	import { exchangeCodeViaBackend, fetchMe } from '$lib/backend/auth';

	let error = $state('');
	let processing = $state(true);

	$effect(() => {
		const params = $page.url.searchParams;
		const code = params.get('code');
		const state = params.get('state');
		const errorParam = params.get('error');

		if (errorParam) {
			error = errorParam;
			processing = false;
			return;
		}

		if (!code || !state) {
			error = 'Missing authorization code';
			processing = false;
			return;
		}

		const savedState = sessionStorage.getItem('state_google');
		const verifier = sessionStorage.getItem('pkce_google');

		if (!verifier || state !== savedState) {
			error = 'Invalid OAuth state';
			processing = false;
			return;
		}

		const redirectUri = `${window.location.origin}/callback/google`;

		exchangeCodeViaBackend('google', code, redirectUri, verifier)
			.then(async (tokens) => {
				const me = await fetchMe(tokens.access_token);
				sessionStorage.removeItem('pkce_google');
				sessionStorage.removeItem('state_google');

				authStore.set({
					provider: 'google',
					accessToken: tokens.access_token,
					refreshToken: tokens.refresh_token,
					idToken: tokens.id_token,
					expiresAt: tokens.expires_in
						? Math.floor(Date.now() / 1000) + tokens.expires_in
						: undefined,
					userInfo: {
						sub: tokens.userinfo.sub,
						email: tokens.userinfo.email,
						name: tokens.userinfo.name,
						picture: tokens.userinfo.picture
					},
					role: me?.role
				});
				goto('/');
			})
			.catch((err) => {
				error = err instanceof Error ? err.message : 'Login failed';
				processing = false;
			});
	});
</script>

<div class="min-h-[90vh] bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-4 flex items-center justify-center">
	<div class="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
		{#if error}
			<p class="text-red-500 mb-4">{error}</p>
			<a href="/" class="text-purple-600 underline">Back to login</a>
		{:else if processing}
			<div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600 mb-4"></div>
			<p class="text-gray-600">Signing you in...</p>
		{/if}
	</div>
</div>
