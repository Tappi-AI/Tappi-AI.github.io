<script lang="ts">
	import { checkDomain } from '$lib/checker/domain';

	type CheckResult = {
		platform: string;
		url: string;
		icon: string;
		available: boolean;
	};

	let username = $state('');
	let results = $state<CheckResult[]>([]);
	let isChecking = $state(false);

	const platforms = [
		{
			name: 'Domain (.com)',
			url: (id: string) => `${id}.com`,
			icon: 'globe',
			checkFn: checkDomain
		}
	];

	async function handleCheck() {
		if (!username.trim()) return;

		isChecking = true;
		results = [];

		for (const platform of platforms) {
			let available = true;

			try {
				if ('checkFn' in platform && platform.checkFn) {
					available = await platform.checkFn(username);
				} else {
					await new Promise((r) => setTimeout(r, 200));
					available = Math.random() > 0.5;
				}
			} catch (err) {
				console.error(`Error checking ${platform.name}:`, err);
				available = false;
			}

			results = [
				...results,
				{
					platform: platform.name,
					url: platform.url(username),
					icon: platform.icon,
					available
				}
			];
		}

		isChecking = false;
	}

	function handleKeyPress(e: KeyboardEvent) {
		if (e.key === 'Enter') handleCheck();
	}
</script>

<div
	class="min-h-screen p-8
         bg-gradient-to-br from-purple-50 to-blue-50
         dark:from-gray-900 dark:to-black
         text-gray-800 dark:text-gray-100"
>
	<div class="max-w-3xl mx-auto">
		<!-- Header -->
		<div class="text-center mb-8">
			<h1 class="text-4xl font-bold mb-2 text-gray-900 dark:text-white">Username Checker</h1>
			<p class="text-gray-600 dark:text-gray-400">Check username availability across platforms</p>
		</div>

		<!-- Card -->
		<div
			class="rounded-2xl shadow-xl p-8 mb-6
             bg-white dark:bg-gray-900
             border border-gray-200 dark:border-gray-700"
		>
			<!-- Input -->
			<div class="flex gap-3 mb-6">
				<input
					type="text"
					bind:value={username}
					onkeypress={handleKeyPress}
					placeholder="Enter username..."
					class="flex-1 px-4 py-3 rounded-lg text-lg
                 bg-white dark:bg-gray-800
                 text-gray-900 dark:text-white
                 placeholder-gray-400
                 border-2 border-gray-300 dark:border-gray-700
                 focus:border-purple-500 focus:outline-none"
				/>

				<button
					onclick={handleCheck}
					disabled={!username.trim() || isChecking}
					class="px-6 py-3 rounded-lg font-semibold
                 bg-purple-600 text-white
                 hover:bg-purple-700
                 disabled:bg-gray-400 dark:disabled:bg-gray-700
                 disabled:cursor-not-allowed
                 transition-colors"
				>
					{isChecking ? 'Checking…' : 'Check'}
				</button>
			</div>

			<!-- Results -->
			{#if results.length > 0}
				<div class="space-y-3">
					{#each results as result (result.platform)}
						<div
							class="flex items-center justify-between p-4 rounded-lg
                     bg-gray-50 dark:bg-gray-800
                     border border-gray-200 dark:border-gray-700
                     hover:bg-gray-100 dark:hover:bg-gray-700
                     transition-colors"
						>
							<div class="flex items-center gap-3">
								<div class="text-2xl">
									{#if result.icon === 'globe'}🌐{/if}
									{#if result.icon === 'youtube'}▶️{/if}
									{#if result.icon === 'github'}💻{/if}
									{#if result.icon === 'facebook'}📘{/if}
									{#if result.icon === 'twitter'}🐦{/if}
									{#if result.icon === 'instagram'}📷{/if}
									{#if result.icon === 'linkedin'}💼{/if}
								</div>

								<div>
									<div class="font-semibold text-gray-900 dark:text-white">
										{result.platform}
									</div>
									<div class="text-sm text-gray-500 dark:text-gray-400">
										{result.url}
									</div>
								</div>
							</div>

							<div
								class="flex items-center gap-2 font-semibold
                       {result.available
									? 'text-green-600 dark:text-green-400'
									: 'text-red-600 dark:text-red-400'}"
							>
								<span class="text-xl">
									{result.available ? '✓' : '✗'}
								</span>
								{result.available ? 'Available' : 'Taken'}
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Loading -->
			{#if isChecking && results.length < platforms.length}
				<div class="text-center py-8">
					<div
						class="inline-block h-12 w-12 animate-spin rounded-full
                   border-4 border-purple-200 dark:border-gray-700
                   border-t-purple-600"
					></div>
					<p class="mt-4 text-gray-600 dark:text-gray-400">Checking platforms...</p>
				</div>
			{/if}
		</div>
	</div>
</div>
