<!--routes/Energy/+page.svelte - Energy Tracker-->

<script lang="ts">
	type Duration = { label: string; value: number; icon: string };
	type Emotion = { emoji: string; label: string; color: string };
	type Entry = {
		activity: string;
		timestamp: number;
		duration: Duration | null;
		emotion: Emotion | null;
		energy: number;
	};

	let screen: 'main' | 'duration' | 'emotion' | 'energy' = $state('main');
	let currentTime = $state(new Date());
	let activity = $state('');
	let isRecording = $state(false);
	let energy = $state(3);
	let currentEntry: Omit<Entry, 'energy'> | null = $state(null);
	let entries: Entry[] = $state([]);
	let recognition: any = $state(null);

	const durations: Duration[] = [
		{ label: '15 min', value: 15, icon: '⚡' },
		{ label: '30 min', value: 30, icon: '🕐' },
		{ label: '1 hour', value: 60, icon: '⏰' },
		{ label: '1h 30m', value: 90, icon: '🕑' },
		{ label: '2 hours', value: 120, icon: '🕒' }
	];

	const emotions: Emotion[] = [
		{ emoji: '😢', label: 'Awful', color: 'from-blue-400 to-blue-600' },
		{ emoji: '😔', label: 'Bad', color: 'from-indigo-400 to-indigo-600' },
		{ emoji: '😐', label: 'Okay', color: 'from-gray-400 to-gray-600' },
		{ emoji: '😊', label: 'Good', color: 'from-amber-400 to-amber-600' },
		{ emoji: '😄', label: 'Great', color: 'from-green-400 to-green-600' }
	];

	$effect(() => {
		const timer = setInterval(() => (currentTime = new Date()), 1000);
		return () => clearInterval(timer);
	});

	$effect(() => {
		try {
			entries = JSON.parse(localStorage.getItem('energy-entries') || '[]');
		} catch {
			entries = [];
		}
	});

	function formatTime(date: Date) {
		const h = date.getHours();
		const m = date.getMinutes().toString().padStart(2, '0');
		const ampm = h >= 12 ? 'PM' : 'AM';
		const hour = h % 12 || 12;
		return { hour, minute: m, ampm };
	}

	function formatDate(date: Date) {
		return {
			weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
			month: date.toLocaleDateString('en-US', { month: 'long' }),
			day: date.getDate()
		};
	}

	function formatEntryTime(ts: number): string {
		return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
	}

	async function startVoice() {
		activity = '';
		isRecording = true;
		try {
			await navigator.mediaDevices.getUserMedia({ audio: true });
			const SpeechRecognition =
				(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
			if (SpeechRecognition) {
				const rec = new SpeechRecognition();
				rec.continuous = true;
				rec.interimResults = true;
				rec.onresult = (e: any) => {
					let transcript = '';
					for (let i = 0; i < e.results.length; i++) {
						transcript += e.results[i][0].transcript;
					}
					activity = transcript;
				};
				rec.onerror = () => (isRecording = false);
				rec.onend = () => (isRecording = false);
				recognition = rec;
				rec.start();
			}
		} catch {
			isRecording = false;
		}
	}

	function stopVoice() {
		if (recognition) recognition.stop();
		isRecording = false;
	}

	function submitActivity() {
		if (!activity.trim()) return;
		currentEntry = {
			activity: activity.trim(),
			timestamp: Date.now(),
			duration: null,
			emotion: null
		};
		activity = '';
		screen = 'duration';
	}

	function pickDuration(dur: Duration) {
		if (currentEntry) currentEntry = { ...currentEntry, duration: dur };
		screen = 'emotion';
	}

	function pickEmotion(emo: Emotion) {
		if (currentEntry) currentEntry = { ...currentEntry, emotion: emo };
		energy = 3;
		screen = 'energy';
	}

	function saveEntry() {
		if (!currentEntry) return;
		const entry: Entry = { ...currentEntry, energy };
		entries = [entry, ...entries];
		localStorage.setItem('energy-entries', JSON.stringify(entries));
		currentEntry = null;
		screen = 'main';
	}

	function getBarColor(level: number, index: number): string {
		if (index >= level) return 'bg-gray-200';
		if (level <= 1) return 'bg-red-500';
		if (level <= 2) return 'bg-orange-500';
		if (level <= 3) return 'bg-yellow-500';
		return 'bg-green-500';
	}

	function energyLabel(e: number): string {
		if (e === 1) return 'Running on empty 😴';
		if (e === 2) return 'Pretty low 🥱';
		if (e === 3) return 'Doing okay 👍';
		if (e === 4) return 'Feeling good! 💪';
		return 'Fully charged! ⚡';
	}

	let time = $derived(formatTime(currentTime));
	let date = $derived(formatDate(currentTime));
</script>

<svelte:head>
	<title>Energy Tracker</title>
	<meta name="theme-color" content="#7c3aed" />
</svelte:head>

<!-- Main Screen -->
{#if screen === 'main'}
	<div class="min-h-[90vh] bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-4">
		<div class="max-w-md mx-auto">
			<!-- Time Display -->
			<div class="text-center pt-8 pb-6">
				<div class="flex items-baseline justify-center text-white">
					<span class="text-8xl font-thin tracking-tight">{time.hour}</span>
					<span class="text-8xl font-thin animate-pulse">:</span>
					<span class="text-8xl font-thin tracking-tight">{time.minute}</span>
					<span class="text-2xl font-light ml-2 opacity-80">{time.ampm}</span>
				</div>
				<p class="text-white/80 text-lg mt-2">
					{date.weekday}, {date.month} {date.day}
				</p>
			</div>

			<!-- Main Card -->
			<div class="bg-white rounded-3xl shadow-2xl p-6 mb-6">
				<h2 class="text-2xl font-bold text-gray-800 text-center mb-6">What's happening? 🌟</h2>

				<div class="mb-4">
					<textarea
						bind:value={activity}
						placeholder="Type or tap the mic to speak..."
						class="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 focus:border-purple-400 focus:outline-none resize-none text-gray-800 placeholder-gray-400"
						rows="3"
					></textarea>
				</div>

				{#if isRecording}
					<div class="flex items-center justify-center gap-2 mb-4 py-2">
						<div class="flex gap-1">
							{#each Array(5) as _, i}
								<div
									class="w-1 bg-red-500 rounded-full animate-pulse"
									style="height: {12 + i * 4}px; animation-delay: {i * 0.1}s"
								></div>
							{/each}
						</div>
						<span class="text-red-500 font-medium ml-2">Recording...</span>
					</div>
				{/if}

				<div class="flex gap-3">
					<button
						onclick={isRecording ? stopVoice : startVoice}
						class="flex-1 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all
							{isRecording ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
					>
						{#if isRecording}
							<span class="w-4 h-4 bg-white rounded-sm"></span> Stop
						{:else}
							🎤 Speak
						{/if}
					</button>

					<button
						onclick={submitActivity}
						disabled={!activity.trim()}
						class="flex-1 py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-2xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition-all"
					>
						Continue →
					</button>
				</div>
			</div>

			<!-- Today's Entries -->
			{#if entries.length > 0}
				<div class="bg-white/20 backdrop-blur-sm rounded-3xl p-4">
					<h3 class="text-white font-semibold mb-3">Today's Log</h3>
					<div class="space-y-2">
						{#each entries.slice(0, 3) as entry}
							<div class="bg-white/90 rounded-xl p-3 flex items-center gap-3">
								<span class="text-2xl">{entry.emotion?.emoji}</span>
								<div class="flex-1 min-w-0">
									<p class="text-gray-800 font-medium truncate">{entry.activity}</p>
									<p class="text-gray-500 text-sm">
										{formatEntryTime(entry.timestamp)} &bull; {entry.duration?.label}
									</p>
								</div>
								<div class="text-sm text-gray-500">🔋{entry.energy}</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<p class="text-center text-white/60 py-4">Your activity log is empty. Start tracking!</p>
			{/if}
		</div>
	</div>
{/if}

<!-- Duration Screen -->
{#if screen === 'duration'}
	<div
		class="min-h-[90vh] bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-4 flex items-center"
	>
		<div class="max-w-md mx-auto w-full">
			<div class="bg-white rounded-3xl shadow-2xl p-8">
				<h2 class="text-2xl font-bold text-gray-800 text-center mb-2">How long? ⏱️</h2>
				<p class="text-gray-500 text-center mb-8 truncate px-4">
					"{currentEntry?.activity}"
				</p>
				<div class="space-y-3">
					{#each durations as dur}
						<button
							onclick={() => pickDuration(dur)}
							class="w-full py-4 px-6 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-violet-50 hover:to-fuchsia-50 rounded-2xl flex items-center justify-between group transition-all border-2 border-transparent hover:border-purple-200"
						>
							<span class="text-2xl">{dur.icon}</span>
							<span class="font-semibold text-gray-800 text-lg">{dur.label}</span>
							<span class="text-gray-400 group-hover:text-purple-500 transition-colors">→</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Emotion Screen -->
{#if screen === 'emotion'}
	<div
		class="min-h-[90vh] bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-4 flex items-center"
	>
		<div class="max-w-md mx-auto w-full">
			<div class="bg-white rounded-3xl shadow-2xl p-8">
				<h2 class="text-2xl font-bold text-gray-800 text-center mb-2">How do you feel? 💭</h2>
				<p class="text-gray-500 text-center mb-8">Tap your current mood</p>
				<div class="flex justify-center gap-2 mb-4">
					{#each emotions as emo}
						<button
							onclick={() => pickEmotion(emo)}
							class="flex flex-col items-center p-3 rounded-2xl hover:bg-gray-50 transition-all hover:scale-110 active:scale-95"
						>
							<span class="text-5xl mb-2">{emo.emoji}</span>
							<span class="text-xs text-gray-500 font-medium">{emo.label}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Energy Screen -->
{#if screen === 'energy'}
	<div
		class="min-h-[90vh] bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-4 flex items-center"
	>
		<div class="max-w-md mx-auto w-full">
			<div class="bg-white rounded-3xl shadow-2xl p-8">
				<h2 class="text-2xl font-bold text-gray-800 text-center mb-2">Energy Level 🔋</h2>
				<p class="text-gray-500 text-center mb-8">How charged are you?</p>

				<!-- Battery Visual -->
				<div class="flex justify-center mb-8">
					<div class="relative">
						<div
							class="w-32 h-56 border-4 border-gray-800 rounded-2xl p-2 flex flex-col-reverse gap-1"
						>
							{#each [1, 2, 3, 4, 5] as level}
								<button
									onclick={() => (energy = level)}
									class="flex-1 rounded-lg transition-all hover:opacity-80 {getBarColor(energy, level - 1)}"
								></button>
							{/each}
						</div>
						<div
							class="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-gray-800 rounded-t-lg"
						></div>
					</div>
				</div>

				<!-- Slider -->
				<div class="px-4 mb-8">
					<input
						type="range"
						min="1"
						max="5"
						bind:value={energy}
						class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
					/>
					<div class="flex justify-between text-sm text-gray-500 mt-2">
						<span>Empty</span>
						<span>Full</span>
					</div>
				</div>

				<!-- Energy Label -->
				<div class="text-center mb-6">
					<span class="text-4xl font-bold text-gray-800">{energy}</span>
					<span class="text-gray-500">/5</span>
					<p class="text-gray-500 mt-1">{energyLabel(energy)}</p>
				</div>

				<button
					onclick={saveEntry}
					class="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-bold text-lg hover:shadow-lg transition-all"
				>
					Save Entry ✓
				</button>
			</div>
		</div>
	</div>
{/if}
