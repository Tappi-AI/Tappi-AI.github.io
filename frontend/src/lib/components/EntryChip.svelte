<script lang="ts">
	import type { WellbeingEntry } from '$lib/wellbeing';
	import { formatTime } from '$lib/wellbeing';
	import { energyColor, energyTextColor } from '$lib/energyColor';

	let { entry }: { entry: WellbeingEntry } = $props();

	let backgroundColor = $derived(energyColor(entry.energy));
	let textColor = $derived(energyTextColor(entry.energy));
	let label = $derived(`${entry.emoji} ${formatTime(entry.time)} ${entry.memo}`);
	let tooltip = $derived(`${entry.memo} — energy ${entry.energy}%, feeling: ${entry.feeling}`);
</script>

<div
	class="truncate rounded px-2 py-0.5 text-sm"
	style:background-color={backgroundColor}
	style:color={textColor}
	title={tooltip}
>
	{label}
</div>
