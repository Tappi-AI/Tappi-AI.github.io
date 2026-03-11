<!--routes/Focus2/+page.svelte - Pomodoro Focus (Orange)-->

<script lang="ts">
	type Task = { id: string; title: string; time: string; completed: boolean };
	type Session = { task: string; duration: number; timestamp: number };

	let screen: 'focus' | 'status' = $state('focus');
	let remaining = $state(25 * 60);
	let totalSeconds = $state(25 * 60);
	let isRunning = $state(false);
	let isPaused = $state(false);
	let interval: ReturnType<typeof setInterval> | null = $state(null);
	let currentTask = $state('Social Media Design');
	let taskTime = $state('09:15 - 10:15');

	let tasks: Task[] = $state([
		{ id: '1', title: 'Social Media Design', time: '09:15 - 10:15', completed: false },
		{ id: '2', title: 'Email & Messages', time: '10:30 - 11:00', completed: false },
		{ id: '3', title: 'Project Research', time: '11:00 - 12:00', completed: false },
		{ id: '4', title: 'Team Meeting Notes', time: '13:00 - 13:30', completed: false }
	]);

	let sessions: Session[] = $state([]);
	let statusTab: 'today' | 'week' = $state('today');

	$effect(() => {
		try {
			const s = localStorage.getItem('focus2-sessions');
			if (s) sessions = JSON.parse(s);
			const t = localStorage.getItem('focus2-tasks');
			if (t) tasks = JSON.parse(t);
		} catch {}
	});

	function saveSessions() {
		localStorage.setItem('focus2-sessions', JSON.stringify(sessions));
	}

	function saveTasks() {
		localStorage.setItem('focus2-tasks', JSON.stringify(tasks));
	}

	function startTimer() {
		if (isRunning && !isPaused) return;
		if (isPaused) {
			isPaused = false;
			return;
		}
		isRunning = true;
		isPaused = false;
		interval = setInterval(() => {
			if (!isPaused) {
				remaining--;
				if (remaining <= 0) {
					finishSession();
				}
			}
		}, 1000);
	}

	function pauseTimer() {
		isPaused = true;
	}

	function resetTimer() {
		if (interval) clearInterval(interval);
		interval = null;
		isRunning = false;
		isPaused = false;
		remaining = totalSeconds;
	}

	function finishSession() {
		if (interval) clearInterval(interval);
		interval = null;
		const s: Session = { task: currentTask, duration: totalSeconds / 60, timestamp: Date.now() };
		sessions = [s, ...sessions];
		saveSessions();
		isRunning = false;
		isPaused = false;
		remaining = totalSeconds;
	}

	function skipTimer() {
		const elapsed = totalSeconds - remaining;
		if (elapsed > 30) {
			const s: Session = {
				task: currentTask,
				duration: Math.round(elapsed / 60),
				timestamp: Date.now()
			};
			sessions = [s, ...sessions];
			saveSessions();
		}
		resetTimer();
	}

	function selectTask(task: Task) {
		currentTask = task.title;
		taskTime = task.time;
		resetTimer();
	}

	function toggleTask(id: string) {
		tasks = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
		saveTasks();
	}

	function formatTime(sec: number): string {
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	function progress(): number {
		return ((totalSeconds - remaining) / totalSeconds) * 100;
	}

	// Status helpers
	function todayFocusMinutes(): number {
		const today = new Date().toDateString();
		return sessions
			.filter((s) => new Date(s.timestamp).toDateString() === today)
			.reduce((sum, s) => sum + s.duration, 0);
	}

	function todayBreakMinutes(): number {
		return Math.round(todayFocusMinutes() * 0.2);
	}

	function formatHM(mins: number): { h: number; m: number } {
		return { h: Math.floor(mins / 60), m: mins % 60 };
	}

	function weekData(): number[] {
		const days = [];
		for (let i = 6; i >= 0; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			const ds = d.toDateString();
			const mins = sessions
				.filter((s) => new Date(s.timestamp).toDateString() === ds)
				.reduce((sum, s) => sum + s.duration, 0);
			days.push(mins);
		}
		return days;
	}

	function dayLabels(): string[] {
		const labels = [];
		for (let i = 6; i >= 0; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
		}
		return labels;
	}

	let circumference = 2 * Math.PI * 80;
	let strokeOffset = $derived(circumference - (progress() / 100) * circumference);
	let focusTime = $derived(formatHM(todayFocusMinutes()));
	let breakTime = $derived(formatHM(todayBreakMinutes()));
	let week = $derived(weekData());
	let maxWeek = $derived(Math.max(...week, 1));
	let days = $derived(dayLabels());
</script>

<svelte:head>
	<title>Focus</title>
	<meta name="theme-color" content="#fff7ed" />
</svelte:head>

<!-- Tab Switcher -->
<div class="min-h-[90vh] bg-gradient-to-b from-orange-50 to-white">
	<div class="max-w-md mx-auto px-4">
		<!-- Header Tabs -->
		<div class="flex items-center justify-center gap-1 pt-5 pb-4">
			<button
				onclick={() => (screen = 'focus')}
				class="px-5 py-2 rounded-full text-sm font-semibold transition
					{screen === 'focus' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}"
			>
				Focus
			</button>
			<button
				onclick={() => (screen = 'status')}
				class="px-5 py-2 rounded-full text-sm font-semibold transition
					{screen === 'status' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}"
			>
				Status
			</button>
		</div>

		<!-- FOCUS SCREEN -->
		{#if screen === 'focus'}
			<!-- Current Task Label -->
			<div class="text-center mb-6">
				<h2 class="text-lg font-semibold text-gray-800">{currentTask}</h2>
				<p class="text-sm text-gray-400 mt-0.5">{taskTime}</p>
			</div>

			<!-- Circular Timer -->
			<div class="flex justify-center mb-8">
				<div class="relative">
					<!-- Outer glow -->
					<div class="absolute inset-0 rounded-full bg-orange-200/40 blur-xl scale-110"></div>
					<svg width="200" height="200" class="-rotate-90 relative">
						<circle cx="100" cy="100" r="80" fill="none" stroke="#fed7aa" stroke-width="10" />
						<circle
							cx="100"
							cy="100"
							r="80"
							fill="none"
							stroke="url(#orangeGrad)"
							stroke-width="10"
							stroke-linecap="round"
							stroke-dasharray={circumference}
							stroke-dashoffset={strokeOffset}
							class="transition-all duration-500"
						/>
						<defs>
							<linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
								<stop offset="0%" stop-color="#f97316" />
								<stop offset="100%" stop-color="#ea580c" />
							</linearGradient>
						</defs>
					</svg>
					<div class="absolute inset-0 flex flex-col items-center justify-center">
						<span class="text-4xl font-light text-gray-800 tracking-wider">
							{formatTime(remaining)}
						</span>
						<span class="text-xs text-orange-400 mt-1 font-medium">
							{isRunning && !isPaused ? 'FOCUSING' : isPaused ? 'PAUSED' : 'READY'}
						</span>
					</div>
				</div>
			</div>

			<!-- Controls -->
			<div class="flex items-center justify-center gap-4 mb-8">
				<button
					onclick={resetTimer}
					class="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 hover:bg-orange-200 transition active:scale-95"
					aria-label="Reset"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
				</button>

				{#if !isRunning || isPaused}
					<button
						onclick={startTimer}
						class="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-300/50 hover:shadow-orange-400/60 transition active:scale-95"
						aria-label="Start"
					>
						<svg class="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M8 5v14l11-7z" />
						</svg>
					</button>
				{:else}
					<button
						onclick={pauseTimer}
						class="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-300/50 transition active:scale-95"
						aria-label="Pause"
					>
						<svg class="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
							<path d="M6 4h4v16H6zM14 4h4v16h-4z" />
						</svg>
					</button>
				{/if}

				<button
					onclick={skipTimer}
					class="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 hover:bg-orange-200 transition active:scale-95"
					aria-label="Skip"
				>
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M5 4l10 8-10 8V4zM19 4v16h-2V4h2z" />
					</svg>
				</button>
			</div>

			<!-- Recent Tasks -->
			<div>
				<h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Tasks</h3>
				<div class="space-y-2 pb-6">
					{#each tasks as task}
						<div
							onclick={() => selectTask(task)}
							onkeydown={(e) => { if (e.key === 'Enter') selectTask(task); }}
							role="button"
							tabindex="0"
							class="w-full bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-orange-100/60 hover:border-orange-300 transition text-left active:scale-[0.98] cursor-pointer"
						>
							<button
								onclick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
								class="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition
									{task.completed ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}"
							>
								{#if task.completed}
									<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
									</svg>
								{/if}
							</button>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-gray-800 {task.completed ? 'line-through text-gray-400' : ''}">{task.title}</p>
								<p class="text-xs text-gray-400">{task.time}</p>
							</div>
							<span class="text-orange-300">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
								</svg>
							</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- STATUS SCREEN -->
		{#if screen === 'status'}
			<!-- Status Sub-tabs -->
			<div class="flex items-center justify-center gap-4 mb-6">
				<button
					onclick={() => (statusTab = 'today')}
					class="text-sm font-semibold pb-1 border-b-2 transition
						{statusTab === 'today' ? 'text-orange-500 border-orange-500' : 'text-gray-400 border-transparent'}"
				>
					Today
				</button>
				<button
					onclick={() => (statusTab = 'week')}
					class="text-sm font-semibold pb-1 border-b-2 transition
						{statusTab === 'week' ? 'text-orange-500 border-orange-500' : 'text-gray-400 border-transparent'}"
				>
					This Week
				</button>
			</div>

			<!-- Stats Cards -->
			<div class="grid grid-cols-2 gap-3 mb-6">
				<div class="bg-white rounded-2xl p-5 shadow-sm border border-orange-100/60 text-center">
					<p class="text-3xl font-bold text-gray-800">
						{focusTime.h > 0 ? `${focusTime.h}h ${focusTime.m}m` : `${focusTime.m}m`}
					</p>
					<p class="text-xs text-gray-400 mt-1 uppercase tracking-wider">Focus Time</p>
				</div>
				<div class="bg-white rounded-2xl p-5 shadow-sm border border-orange-100/60 text-center">
					<p class="text-3xl font-bold text-gray-800">
						{breakTime.h > 0 ? `${breakTime.h}h ${breakTime.m}m` : `${breakTime.m}m`}
					</p>
					<p class="text-xs text-gray-400 mt-1 uppercase tracking-wider">Break Time</p>
				</div>
			</div>

			<!-- Focus Progress Chart -->
			<div class="bg-white rounded-2xl p-5 shadow-sm border border-orange-100/60 mb-6">
				<h3 class="text-sm font-semibold text-gray-800 mb-4">Your Focus Progress</h3>
				<div class="flex items-end justify-between gap-2 h-32">
					{#each week as mins, i}
						<div class="flex-1 flex flex-col items-center gap-1">
							<div class="w-full flex flex-col justify-end h-24">
								<div
									class="w-full rounded-t-lg transition-all duration-500 {i === week.length - 1 ? 'bg-gradient-to-t from-orange-500 to-orange-400' : 'bg-orange-200'}"
									style="height: {Math.max((mins / maxWeek) * 100, 4)}%"
								></div>
							</div>
							<span class="text-[10px] text-gray-400">{days[i]}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Focus Journey -->
			<div class="bg-white rounded-2xl p-5 shadow-sm border border-orange-100/60 mb-6">
				<h3 class="text-sm font-semibold text-gray-800 mb-3">Your Focus Journey</h3>
				{#if sessions.length === 0}
					<p class="text-sm text-gray-400">No sessions yet. Start focusing!</p>
				{:else}
					<div class="space-y-3">
						{#each sessions.slice(0, 5) as s}
							<div class="flex items-center gap-3">
								<div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
									<span class="text-orange-500 text-xs font-bold">{s.duration}m</span>
								</div>
								<div class="flex-1">
									<p class="text-sm font-medium text-gray-700">{s.task}</p>
									<p class="text-xs text-gray-400">
										{new Date(s.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
									</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
