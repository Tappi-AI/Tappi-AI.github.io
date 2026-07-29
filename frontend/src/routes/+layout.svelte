<script lang="ts">
	import '../app.css';
	import { goto } from '$app/navigation';
	import { authStore, logout } from '$lib/stores/auth.store';
	import { resetWellbeingTable } from '$lib/backend/wellbeingTable';

	let { children } = $props();

	function handleLogout() {
		resetWellbeingTable();
		logout();
		goto('/login');
	}
</script>

{#if $authStore?.role}
	<div class="flex items-center justify-between border-b bg-white px-4 py-2">
		<span class="text-lg font-semibold text-teal-700">Tappi</span>
		<div class="flex items-center gap-3">
			<span class="text-sm text-gray-600">{$authStore.userInfo?.name || $authStore.userInfo?.email || ''}</span>
			<button
				onclick={handleLogout}
				class="rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
			>
				Sign out
			</button>
		</div>
	</div>
{/if}

{@render children()}
