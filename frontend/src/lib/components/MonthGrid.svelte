<script lang="ts">
	import type { WellbeingEntry } from '$lib/wellbeing';
	import { monthMatrix, dayKey, isSameMonth } from '$lib/calendar';
	import EntryChip from './EntryChip.svelte';

	let {
		year,
		month,
		entriesByDay,
		onprev,
		onnext,
		ontoday
	}: {
		year: number;
		month: number;
		entriesByDay: Map<string, WellbeingEntry[]>;
		onprev: () => void;
		onnext: () => void;
		ontoday: () => void;
	} = $props();

	const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const MONTH_NAMES = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	let weeks = $derived(monthMatrix(year, month));
	let today = new Date();
</script>

<div class="flex flex-col">
	<div class="mb-2 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<button
				class="rounded border px-2 py-1 hover:bg-gray-100"
				onclick={onprev}
				aria-label="Previous month">&lt;</button
			>
			<h2 class="text-lg font-semibold">{MONTH_NAMES[month]} {year}</h2>
			<button
				class="rounded border px-2 py-1 hover:bg-gray-100"
				onclick={onnext}
				aria-label="Next month">&gt;</button
			>
		</div>
		<button class="rounded border px-3 py-1 hover:bg-gray-100" onclick={ontoday}>Today</button>
	</div>

	<div class="grid grid-cols-7 border-t border-l">
		{#each WEEKDAYS as weekday (weekday)}
			<div class="border-r border-b bg-gray-50 px-2 py-1 text-center text-sm font-medium">
				{weekday}
			</div>
		{/each}
	</div>

	<div class="grid grid-cols-7 border-l">
		{#each weeks as week, weekIndex (weekIndex)}
			{#each week as day (dayKey(day))}
				{@const isToday = dayKey(day) === dayKey(today)}
				{@const dayEntries = entriesByDay.get(dayKey(day)) ?? []}
				<div class="min-h-24 border-r border-b p-1">
					<span
						class="inline-flex h-6 w-6 items-center justify-center rounded-full text-sm"
						class:text-gray-400={!isSameMonth(day, year, month)}
						class:bg-blue-600={isToday}
						class:text-white={isToday}
					>
						{day.getDate()}
					</span>
					<div class="mt-1 flex flex-col gap-0.5">
						{#each dayEntries as entry (entry.rowId)}
							<EntryChip {entry} />
						{/each}
					</div>
				</div>
			{/each}
		{/each}
	</div>
</div>
