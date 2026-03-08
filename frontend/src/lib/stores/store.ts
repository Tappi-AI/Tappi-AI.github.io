import { writable } from 'svelte/store';

// ============================================
// Global Reactive State
// ============================================

// Example: App theme
export const isDarkMode = writable(false);

// Example: User session
export const currentUser = writable<{ id: string; name: string } | null>(null);

// Example: Loading state
export const isLoading = writable(false);

// Example: Error messages
export const errorMessage = writable<string | null>(null);

// ============================================
// Derived stores (computed values)
// ============================================

import { derived } from 'svelte/store';

// Auto-hide error after 5 seconds
export const displayError = derived(errorMessage, ($error, set) => {
	set($error);
	if ($error) {
		const timer = setTimeout(() => set(null), 5000);
		return () => clearTimeout(timer);
	}
});

// ============================================
// Local storage persistence
// ============================================

function createLocalStore<T>(key: string, initialValue: T) {
	const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
	const initial = stored ? JSON.parse(stored) : initialValue;

	const store = writable<T>(initial);

	store.subscribe((value) => {
		if (typeof window !== 'undefined') {
			localStorage.setItem(key, JSON.stringify(value));
		}
	});

	return store;
}

export const userPreferences = createLocalStore('userPrefs', {
	language: 'en',
	fontSize: 'normal'
});

// ============================================
// Usage in components
// ============================================

// In any .svelte file:
// <script>
//   import { isDarkMode, isLoading } from '$lib/stores/store';
// </script>
//
// <button onclick={() => isDarkMode.set(!$isDarkMode)}>
//   {$isDarkMode ? '🌙' : '☀️'}
// </button>
//
// {#if $isLoading}
//   Loading...
// {/if}
