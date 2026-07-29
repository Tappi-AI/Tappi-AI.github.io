<script lang="ts">
	import { onMount } from 'svelte';
	import { listWellbeingRows } from '$lib/api/rows';
	import { parseEntries, groupByDay, type WellbeingEntry } from '$lib/wellbeing';
	import MonthGrid from '$lib/components/MonthGrid.svelte';

	const today = new Date();

	let year = $state(today.getFullYear());
	let month = $state(today.getMonth());
	let entries = $state<WellbeingEntry[]>([]);

	let entriesByDay = $derived(groupByDay(entries));

	let error = $state('');

	onMount(async () => {
		try {
			const { rows, col } = await listWellbeingRows();
			entries = parseEntries(rows, col);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load entries';
		}
	});

	function handlePrev() {
		if (month === 0) {
			year -= 1;
			month = 11;
		} else {
			month -= 1;
		}
	}

	function handleNext() {
		if (month === 11) {
			year += 1;
			month = 0;
		} else {
			month += 1;
		}
	}

	function handleToday() {
		year = today.getFullYear();
		month = today.getMonth();
	}
</script>

<div class="mx-auto max-w-4xl p-4">
	<h1 class="mb-4 text-2xl font-bold">Wellbeing</h1>
	{#if error}
		<p class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
	{/if}
	<MonthGrid
		{year}
		{month}
		{entriesByDay}
		onprev={handlePrev}
		onnext={handleNext}
		ontoday={handleToday}
	/>
</div>
