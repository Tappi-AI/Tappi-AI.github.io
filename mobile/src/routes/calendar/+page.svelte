<!--routes/calendar/+page.svelte-->

<script lang="ts">
	import type { CalendarDay } from '$lib/types/calendar';
	import { EMOJIS, ENERGY_LABELS } from '$lib/types/calendar';
	import {
		createDay,
		formatHour,
		addDays,
		getWeekDates,
		getDayLabel,
		formatDate,
		saveCalendarData,
		loadCalendarData,
		energyColor
	} from '$lib/utils/calendar';

	let today = $state(new Date());
	let weekStart = $state(new Date());
	let view = $state<'day' | 'week'>('day');
	let allData: Record<string, CalendarDay> = $state({});

	function ensureDay(date: Date): void {
		const key = formatDate(date);
		if (!allData[key]) {
			allData[key] = createDay(date);
		}
	}

	function getDay(date: Date): CalendarDay {
		const key = formatDate(date);
		return allData[key] ?? createDay(date);
	}

	function persist() {
		allData = { ...allData };
		saveCalendarData(allData);
	}

	// Ensure days exist reactively, not during render
	$effect(() => {
		ensureDay(today);
		if (view === 'week') {
			getWeekDates(weekStart).forEach((d) => ensureDay(d));
		}
	});

	function prevDay() {
		today = addDays(today, view === 'week' ? -7 : -1);
		if (view === 'week') weekStart = today;
	}

	function nextDay() {
		today = addDays(today, view === 'week' ? 7 : 1);
		if (view === 'week') weekStart = today;
	}

	function goToday() {
		today = new Date();
		weekStart = new Date();
	}

	$effect(() => {
		allData = loadCalendarData();
	});
</script>

<div class="mx-auto max-w-6xl px-4 py-8">
	<!-- Header -->
	<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
		<h1 class="text-2xl font-bold text-white">Calendar</h1>

		<div class="flex items-center gap-2">
			<button
				onclick={() => (view = 'day')}
				class="rounded px-3 py-1 text-sm font-medium transition {view === 'day'
					? 'bg-indigo-600 text-white'
					: 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
			>
				Day
			</button>
			<button
				onclick={() => {
					view = 'week';
					weekStart = today;
				}}
				class="rounded px-3 py-1 text-sm font-medium transition {view === 'week'
					? 'bg-indigo-600 text-white'
					: 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
			>
				Week
			</button>
		</div>

		<div class="flex items-center gap-2">
			<button onclick={prevDay} class="rounded bg-gray-700 px-3 py-1 text-gray-200 hover:bg-gray-600">
				←
			</button>
			<button onclick={goToday} class="rounded bg-gray-700 px-3 py-1 text-sm text-gray-200 hover:bg-gray-600">
				Today
			</button>
			<button onclick={nextDay} class="rounded bg-gray-700 px-3 py-1 text-gray-200 hover:bg-gray-600">
				→
			</button>
			<span class="ml-2 text-lg font-semibold text-gray-200">
				{getDayLabel(today)}
			</span>
		</div>
	</div>

	<!-- Legend -->
	<div class="mb-4 flex flex-wrap items-center gap-4 text-xs text-gray-400">
		<span>Energy:</span>
		{#each Object.entries(ENERGY_LABELS) as [level, label]}
			<span class="flex items-center gap-1">
				<span class="inline-block h-3 w-3 rounded {energyColor(Number(level))}"></span>
				{label}
			</span>
		{/each}
		<span class="ml-4">Mood:</span>
		{#each EMOJIS as emoji}
			<span>{emoji}</span>
		{/each}
	</div>

	<!-- Day View -->
	{#if view === 'day'}
		{@const day = getDay(today)}
		<div class="space-y-1">
			{#each day.blocks as block}
				<div
					class="flex items-stretch gap-2 rounded-lg border border-gray-700 bg-gray-800 transition hover:border-gray-500"
				>
					<!-- Time -->
					<div class="flex w-20 shrink-0 items-center justify-center border-r border-gray-700 text-xs font-mono text-gray-400">
						{formatHour(block.hour)}
					</div>

					<!-- Task input -->
					<div class="flex min-w-0 flex-1 items-center py-2">
						<input
							type="text"
							bind:value={block.task}
							oninput={persist}
							placeholder="What's happening?"
							class="w-full bg-transparent text-sm text-gray-100 placeholder-gray-600 outline-none"
						/>
					</div>

					<!-- Energy selector -->
					<div class="flex shrink-0 items-center gap-1 px-2">
						{#each { length: 6 } as _, i}
							<button
								type="button"
								onclick={(e: MouseEvent) => {
									e.preventDefault();
									e.stopPropagation();
									block.energy = i;
									persist();
								}}
								title="{ENERGY_LABELS[i]} ({i})"
								class="h-8 w-5 cursor-pointer rounded-sm border transition
									{block.energy === i
									? energyColor(i) + ' border-white/40'
									: 'border-gray-600 bg-gray-700/50 hover:border-gray-400'}"
							>
								<span class="sr-only">{i}</span>
							</button>
						{/each}
					</div>

					<!-- Emoji selector -->
					<div class="flex shrink-0 items-center gap-1 border-l border-gray-700 px-3">
						{#each EMOJIS as emoji}
							<button
								type="button"
								onclick={(e: MouseEvent) => {
									e.preventDefault();
									e.stopPropagation();
									block.emoji = block.emoji === emoji ? null : emoji;
									persist();
								}}
								class="cursor-pointer rounded px-1.5 py-1 text-lg transition
									{block.emoji === emoji
									? 'bg-indigo-600/40'
									: 'opacity-40 hover:opacity-80'}"
							>
								{emoji}
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>

	<!-- Week View -->
	{:else}
		{@const dates = getWeekDates(weekStart)}
		<div class="overflow-x-auto">
			<div class="grid min-w-[900px] grid-cols-[60px_repeat(7,1fr)] gap-px rounded-lg bg-gray-700">
				<!-- Header row -->
				<div class="bg-gray-800 p-2"></div>
				{#each dates as d}
					<button
						onclick={() => {
							today = d;
							view = 'day';
						}}
						class="bg-gray-800 p-2 text-center text-xs font-medium transition hover:bg-gray-700
							{formatDate(d) === formatDate(new Date()) ? 'text-indigo-400' : 'text-gray-300'}"
					>
						{getDayLabel(d)}
					</button>
				{/each}

				<!-- Time rows -->
				{#each getDay(dates[0]).blocks as _, rowIdx}
					<div class="flex items-center justify-center bg-gray-800 px-1 text-xs font-mono text-gray-500">
						{formatHour(getDay(dates[0]).blocks[rowIdx].hour)}
					</div>
					{#each dates as d}
						{@const block = getDay(d).blocks[rowIdx]}
						<div
							class="group relative bg-gray-800 p-1 transition hover:bg-gray-750"
						>
							<input
								type="text"
								bind:value={block.task}
								oninput={persist}
								placeholder="·"
								class="w-full bg-transparent text-xs text-gray-200 placeholder-gray-700 outline-none"
							/>
							<div class="mt-0.5 flex items-center gap-0.5">
								<!-- Mini energy dots -->
								{#each { length: 6 } as _, i}
									<button
										type="button"
										onclick={(e: MouseEvent) => {
											e.preventDefault();
											e.stopPropagation();
											block.energy = i;
											persist();
										}}
										class="h-3 w-3 cursor-pointer rounded-full transition
											{block.energy === i
											? energyColor(i) + ' ring-1 ring-white/30'
											: 'bg-gray-700 hover:bg-gray-500'}"
									>
										<span class="sr-only">{i}</span>
									</button>
								{/each}
								<!-- Mini emoji -->
								<div class="ml-auto flex gap-0.5 opacity-0 transition group-hover:opacity-100">
									{#each EMOJIS as emoji}
										<button
											type="button"
											onclick={(e: MouseEvent) => {
												e.preventDefault();
												e.stopPropagation();
												block.emoji = block.emoji === emoji ? null : emoji;
												persist();
											}}
											class="cursor-pointer text-xs transition
												{block.emoji === emoji ? 'opacity-100' : 'opacity-30 hover:opacity-70'}"
										>
											{emoji}
										</button>
									{/each}
								</div>
								{#if block.emoji}
									<span class="ml-auto text-xs">{block.emoji}</span>
								{/if}
							</div>
						</div>
					{/each}
				{/each}
			</div>
		</div>
	{/if}
</div>
