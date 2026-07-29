<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.store';
	import { loginState, validationError, submit, resetLoginState } from '$lib/auth/login.svelte';

	let error = $derived(validationError());

	onMount(() => {
		resetLoginState();
		if ($authStore?.role) {
			goto('/');
		}
	});
</script>

<div
	class="flex min-h-screen items-center justify-center bg-linear-to-br from-emerald-600 via-teal-500 to-cyan-500 p-4"
>
	<div class="mx-auto w-full max-w-sm">
		<div class="mb-8 text-center">
			<h1 class="mb-2 text-4xl font-bold text-white">Tappi</h1>
			<p class="text-white/80">Sign in to continue</p>
		</div>

		<div class="rounded-3xl bg-white p-8 shadow-2xl">
			<div class="space-y-4">
				<input
					type="text"
					bind:value={loginState.userId}
					placeholder="User name"
					disabled={loginState.loggingIn}
					onkeydown={(e) => e.key === 'Enter' && submit()}
					class="w-full rounded-2xl border-2 bg-gray-50 px-4 py-4 text-center text-lg text-gray-800 placeholder-gray-400 focus:outline-none disabled:opacity-50
						{error && loginState.userId.trim()
						? 'border-red-400 focus:border-red-500'
						: 'border-gray-200 focus:border-teal-500'}"
				/>
				<input
					type="password"
					bind:value={loginState.password}
					placeholder="Password"
					disabled={loginState.loggingIn}
					onkeydown={(e) => e.key === 'Enter' && submit()}
					class="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-4 text-center text-lg text-gray-800 placeholder-gray-400 focus:border-teal-500 focus:outline-none disabled:opacity-50"
				/>
				{#if error && loginState.userId.trim()}
					<p class="text-center text-sm text-red-500">{error}</p>
				{:else if loginState.error}
					<p class="text-center text-sm text-red-500">
						{loginState.error}
					</p>
				{/if}
				<button
					onclick={submit}
					disabled={!loginState.userId.trim() || !!error || loginState.loggingIn}
					class="w-full rounded-2xl bg-linear-to-r from-emerald-600 to-teal-500 px-4 py-4 font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
				>
					{loginState.loggingIn ? 'Signing in...' : 'Sign in'}
				</button>
			</div>
		</div>
	</div>
</div>
