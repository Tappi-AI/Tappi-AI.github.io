<!--routes/Focus/+page.svelte - Focus Timer-->

<script lang="ts">
	type Task = { id: string; title: string; icon: string; done: boolean };
	type Session = { duration: number; task: string; timestamp: number };

	let screen: 'home' | 'timer-select' | 'active' = $state('home');
	let currentTime = $state(new Date());
	let selectedMinutes = $state(0);
	let remaining = $state(0);
	let timerInterval: ReturnType<typeof setInterval> | null = $state(null);
	let isPaused = $state(false);
	let sessions: Session[] = $state([]);

	let tasks: Task[] = $state([
		{ id: '1', title: 'English hometask', icon: '📚', done: false },
		{ id: '2', title: 'Finish design for the project', icon: '🎨', done: false },
		{ id: '3', title: 'Research', icon: '🔍', done: false },
		{ id: '4', title: 'Publish post', icon: '✏️', done: false }
	]);

	let newTaskTitle = $state('');
	let showAddTask = $state(false);

	const durations = [5, 10, 15, 20, 25, 30, 45];

	$effect(() => {
		const t = setInterval(() => (currentTime = new Date()), 1000);
		return () => clearInterval(t);
	});

	$effect(() => {
		try {
			const saved = localStorage.getItem('focus-tasks');
			if (saved) tasks = JSON.parse(saved);
			const savedSessions = localStorage.getItem('focus-sessions');
			if (savedSessions) sessions = JSON.parse(savedSessions);
		} catch {}
	});

	function saveTasks() {
		localStorage.setItem('focus-tasks', JSON.stringify(tasks));
	}

	function greeting(): string {
		const h = currentTime.getHours();
		if (h < 12) return 'Good Morning';
		if (h < 17) return 'Good Afternoon';
		return 'Good Evening';
	}

	function todayTotal(): string {
		const today = new Date().toDateString();
		const mins = sessions
			.filter((s) => new Date(s.timestamp).toDateString() === today)
			.reduce((sum, s) => sum + s.duration, 0);
		const h = Math.floor(mins / 60);
		const m = mins % 60;
		return h > 0 ? `${h}h ${m}m` : `${m}m`;
	}

	function sessionCount(): number {
		const today = new Date().toDateString();
		return sessions.filter((s) => new Date(s.timestamp).toDateString() === today).length;
	}

	function startTimer(mins: number) {
		selectedMinutes = mins;
		remaining = mins * 60;
		isPaused = false;
		screen = 'active';
		timerInterval = setInterval(() => {
			if (!isPaused) {
				remaining--;
				if (remaining <= 0) {
					completeTimer();
				}
			}
		}, 1000);
	}

	function togglePause() {
		isPaused = !isPaused;
	}

	function stopTimer() {
		if (timerInterval) clearInterval(timerInterval);
		timerInterval = null;
		const elapsed = selectedMinutes * 60 - remaining;
		if (elapsed > 10) {
			const s: Session = {
				duration: Math.round(elapsed / 60),
				task: 'Focus session',
				timestamp: Date.now()
			};
			sessions = [s, ...sessions];
			localStorage.setItem('focus-sessions', JSON.stringify(sessions));
		}
		screen = 'home';
	}

	function completeTimer() {
		if (timerInterval) clearInterval(timerInterval);
		timerInterval = null;
		const s: Session = {
			duration: selectedMinutes,
			task: 'Focus session',
			timestamp: Date.now()
		};
		sessions = [s, ...sessions];
		localStorage.setItem('focus-sessions', JSON.stringify(sessions));
		remaining = 0;
		screen = 'home';
	}

	function formatRemaining(sec: number): string {
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	function progress(): number {
		if (selectedMinutes === 0) return 0;
		return ((selectedMinutes * 60 - remaining) / (selectedMinutes * 60)) * 100;
	}

	function circumference(): number {
		return 2 * Math.PI * 90;
	}

	function strokeOffset(): number {
		return circumference() - (progress() / 100) * circumference();
	}

	function toggleTask(id: string) {
		tasks = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
		saveTasks();
	}

	function addTask() {
		if (!newTaskTitle.trim()) return;
		tasks = [
			...tasks,
			{ id: Date.now().toString(), title: newTaskTitle.trim(), icon: '📌', done: false }
		];
		newTaskTitle = '';
		showAddTask = false;
		saveTasks();
	}

	function removeTask(id: string) {
		tasks = tasks.filter((t) => t.id !== id);
		saveTasks();
	}
</script>

<svelte:head>
	<title>Focus Timer</title>
	<meta name="theme-color" content="#fafafa" />
</svelte:head>

<!-- Home Screen -->
{#if screen === 'home'}
	<div class="min-h-[90vh] bg-[#fafafa] text-gray-900 p-4">
		<div class="max-w-md mx-auto">
			<!-- Greeting -->
			<div class="pt-6 pb-4">
				<h1 class="text-2xl font-bold">{greeting()}</h1>
				<p class="text-gray-500 text-sm mt-1">Here are your plan for today</p>
			</div>

			<!-- Stats Row -->
			<div class="flex gap-4 mb-5">
				<div class="flex items-center gap-2 text-sm text-gray-600">
					<span class="text-purple-500">⚡</span>
					<span class="font-medium">{sessionCount()}</span> sessions
				</div>
				<div class="flex items-center gap-2 text-sm text-gray-600">
					<span class="text-purple-500">⏱</span>
					<span class="font-medium">{todayTotal()}</span> focus
				</div>
			</div>

			<!-- Events Card -->
			<button
				onclick={() => (screen = 'timer-select')}
				class="w-full bg-purple-100 rounded-2xl p-5 mb-5 text-left transition hover:bg-purple-200 active:scale-[0.98]"
			>
				<div class="flex items-center justify-between mb-2">
					<p class="text-sm font-semibold text-gray-800">START A FOCUS SESSION</p>
					<span class="text-gray-500">→</span>
				</div>
				<p class="text-gray-600 text-sm">Tap to select a timer and start focusing</p>
			</button>

			<!-- Tasks -->
			<div class="space-y-3 mb-5">
				{#each tasks as task}
					<div
						class="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100"
					>
						<button
							onclick={() => toggleTask(task.id)}
							class="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition
								{task.done ? 'bg-purple-500 border-purple-500' : 'border-gray-300'}"
						>
							{#if task.done}
								<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
							{/if}
						</button>
						<span class="text-lg">{task.icon}</span>
						<span class="flex-1 text-sm font-medium {task.done ? 'line-through text-gray-400' : 'text-gray-800'}">
							{task.title}
						</span>
						<button
							onclick={() => removeTask(task.id)}
							class="text-gray-300 hover:text-red-400 transition p-1"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				{/each}
			</div>

			<!-- Add Task -->
			{#if showAddTask}
				<div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
					<form
						onsubmit={(e) => { e.preventDefault(); addTask(); }}
						class="flex gap-2"
					>
						<input
							bind:value={newTaskTitle}
							placeholder="New task..."
							class="flex-1 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 focus:border-purple-400 focus:outline-none text-sm text-gray-800"
						/>
						<button
							type="submit"
							class="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition"
						>
							Add
						</button>
					</form>
				</div>
			{/if}

			<!-- Bottom Nav -->
			<div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
				<div class="max-w-md mx-auto flex items-center justify-between">
					<button class="p-2 text-gray-900">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
						</svg>
					</button>
					<button onclick={() => (screen = 'timer-select')} class="p-2 text-gray-400 hover:text-gray-900 transition">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</button>
					<button
						onclick={() => (showAddTask = !showAddTask)}
						class="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition active:scale-95"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Timer Selection Screen -->
{#if screen === 'timer-select'}
	<div class="min-h-[90vh] bg-[#fafafa] text-gray-900 p-4">
		<div class="max-w-md mx-auto">
			<h1 class="text-2xl font-bold pt-6 pb-6">TRACK YOUR<br />FOCUS TIME</h1>

			<div class="grid grid-cols-2 gap-3 mb-4">
				{#each durations as mins}
					<button
						onclick={() => startTimer(mins)}
						class="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:border-purple-300 hover:bg-purple-50 transition active:scale-95"
					>
						<span class="text-3xl font-bold text-gray-900">{mins}</span>
						<span class="block text-sm text-gray-500 mt-1">min</span>
					</button>
				{/each}
				<button
					onclick={() => startTimer(60)}
					class="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:border-purple-300 hover:bg-purple-50 transition active:scale-95"
				>
					<span class="text-3xl text-gray-400">+</span>
				</button>
			</div>

			<!-- Back button -->
			<div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
				<div class="max-w-md mx-auto flex items-center justify-between">
					<button onclick={() => (screen = 'home')} class="p-2 text-gray-900">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
						</svg>
					</button>
					<button class="p-2 text-gray-900">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</button>
					<div class="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
						</svg>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Active Timer Screen -->
{#if screen === 'active'}
	<div class="min-h-[90vh] bg-[#fafafa] text-gray-900 p-4 flex flex-col items-center">
		<div class="max-w-md mx-auto w-full flex flex-col items-center pt-8">
			<h1 class="text-2xl font-bold mb-2 self-start">TRACK YOUR<br />FOCUS TIME</h1>

			<!-- Circular Timer -->
			<div class="relative my-12">
				<svg width="220" height="220" class="-rotate-90">
					<circle cx="110" cy="110" r="90" fill="none" stroke="#e5e7eb" stroke-width="8" />
					<circle
						cx="110"
						cy="110"
						r="90"
						fill="none"
						stroke="#c4b5fd"
						stroke-width="8"
						stroke-linecap="round"
						stroke-dasharray={circumference()}
						stroke-dashoffset={strokeOffset()}
						class="transition-all duration-1000"
					/>
				</svg>
				<div class="absolute inset-0 flex flex-col items-center justify-center">
					<span class="text-5xl font-light tracking-wider text-gray-900">
						{formatRemaining(remaining)}
					</span>
					<span class="text-sm text-gray-500 mt-1">just focus</span>
				</div>
			</div>

			<!-- Controls -->
			<div class="flex items-center gap-6">
				<button
					onclick={stopTimer}
					class="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center hover:bg-gray-800 transition active:scale-95"
					aria-label="Stop"
				>
					<div class="w-5 h-5 bg-white rounded-sm"></div>
				</button>
				<button
					onclick={togglePause}
					class="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center hover:bg-gray-800 transition active:scale-95"
					aria-label={isPaused ? 'Resume' : 'Pause'}
				>
					{#if isPaused}
						<svg class="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
							<path d="M8 5v14l11-7z" />
						</svg>
					{:else}
						<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
							<path d="M6 4h4v16H6zM14 4h4v16h-4z" />
						</svg>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
