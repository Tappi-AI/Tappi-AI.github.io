<!--routes/+page.svelte - Energy Tracker (Home) with Login-->

<script lang="ts">
	import { authStore, logout } from '$lib/stores/auth.store';
	import { loginPassword, fetchLoginConfig } from '$lib/backend/auth';
	import { saveEnergyEntry, resetEnergySetup } from '$lib/backend/energy';
	import { generateRandomString, generateCodeChallenge } from '$lib/auth/pkce';
	import type { LoginInfo } from '$lib/types/auth';

	type Duration = { label: string; value: number; icon: string };
	type Emotion = { emoji: string; label: string; color: string };
	type Entry = {
		activity: string;
		timestamp: number;
		duration: Duration | null;
		emotion: Emotion | null;
		energy: number;
	};

	let auth: LoginInfo | null = $state(null);
	authStore.subscribe((v) => (auth = v));

	// Login state
	let loginUser = $state('');
	let loginPass = $state('');
	let loginError = $state('');
	let loggingIn = $state(false);
	let authRequired = $state(true);
	let authConfigLoaded = $state(false);

	// Energy tracker state
	let screen: 'main' | 'duration' | 'emotion' | 'energy' = $state('main');
	let currentTime = $state(new Date());
	let activity = $state('');
	let isRecording = $state(false);
	let energy = $state(3);
	let currentEntry: Omit<Entry, 'energy'> | null = $state(null);
	let entries: Entry[] = $state([]);
	let recognition: any = $state(null);
	let saving = $state(false);

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

	$effect(() => {
		fetchLoginConfig().then((cfg) => {
			authRequired = cfg.auth_required;
			authConfigLoaded = true;
		}).catch(() => {
			authConfigLoaded = true;
		});
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

	// --- Login ---
	async function handlePasswordLogin() {
		if (!loginUser.trim() || loggingIn) return;
		loggingIn = true;
		loginError = '';
		try {
			const tokens = await loginPassword(loginUser.trim(), loginPass);
			authStore.set({
				provider: 'none',
				accessToken: tokens.access_token,
				userInfo: {
					sub: tokens.userinfo.sub,
					email: tokens.userinfo.email,
					name: tokens.userinfo.name ?? loginUser.trim()
				}
			});
		} catch (err) {
			loginError = err instanceof Error ? err.message : 'Login failed';
		}
		loggingIn = false;
	}

	async function handleGoogleLogin() {
		const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
		if (!clientId) {
			loginError = 'Google OAuth not configured';
			return;
		}
		const codeVerifier = generateRandomString(128);
		const codeChallenge = await generateCodeChallenge(codeVerifier);
		const nonce = generateRandomString(32);

		sessionStorage.setItem('pkce_google', codeVerifier);
		sessionStorage.setItem('state_google', nonce);

		const redirectUri = `${window.location.origin}/callback/google`;
		const params = new URLSearchParams({
			response_type: 'code',
			client_id: clientId,
			redirect_uri: redirectUri,
			scope: 'openid profile email',
			state: nonce,
			code_challenge: codeChallenge,
			code_challenge_method: 'S256',
			access_type: 'offline',
			prompt: 'consent'
		});
		window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
	}

	function handleLogout() {
		resetEnergySetup();
		logout();
	}

	// --- Voice ---
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

	async function saveEntry() {
		if (!currentEntry || saving) return;
		saving = true;
		const entry: Entry = { ...currentEntry, energy };
		entries = [entry, ...entries];
		localStorage.setItem('energy-entries', JSON.stringify(entries));

		try {
			await saveEnergyEntry({
				activity: entry.activity,
				timestamp: entry.timestamp,
				duration_label: entry.duration?.label,
				duration_minutes: entry.duration?.value,
				emotion_emoji: entry.emotion?.emoji,
				emotion_label: entry.emotion?.label,
				energy: entry.energy
			});
		} catch (err) {
			console.error('Failed to sync to backend:', err);
		}

		saving = false;
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
	<title>Tappi - Energy Tracker</title>
	<meta name="theme-color" content="#7c3aed" />
</svelte:head>

<!-- Login Screen -->
{#if !auth}
	<div class="min-h-[90vh] bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-4 flex items-center">
		<div class="max-w-sm mx-auto w-full">
			<div class="text-center mb-8">
				<h1 class="text-5xl font-bold text-white mb-2">Tappi</h1>
				<p class="text-white/80 text-lg">Track your energy & mood</p>
			</div>

			<div class="bg-white rounded-3xl shadow-2xl p-8">
				{#if loginError}
					<div class="bg-red-50 text-red-600 rounded-xl p-3 mb-4 text-sm text-center">
						{loginError}
					</div>
				{/if}

				<!-- Google Login (production) -->
				{#if authRequired}
					<button
						onclick={handleGoogleLogin}
						class="w-full py-4 bg-white border-2 border-gray-200 rounded-2xl font-semibold text-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50 transition-all mb-4"
					>
						<svg class="w-5 h-5" viewBox="0 0 24 24">
							<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
							<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
							<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
							<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
						</svg>
						Sign in with Google
					</button>
				{/if}

				<!-- Password Login (dev / fallback) -->
				{#if !authRequired}
					<div class="space-y-4">
						<input
							type="text"
							bind:value={loginUser}
							placeholder="Username"
							class="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100 focus:border-purple-400 focus:outline-none text-gray-800"
							onkeydown={(e) => e.key === 'Enter' && handlePasswordLogin()}
						/>
						<input
							type="password"
							bind:value={loginPass}
							placeholder="Password"
							class="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100 focus:border-purple-400 focus:outline-none text-gray-800"
							onkeydown={(e) => e.key === 'Enter' && handlePasswordLogin()}
						/>
						<button
							onclick={handlePasswordLogin}
							disabled={!loginUser.trim() || loggingIn}
							class="w-full py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-2xl font-semibold disabled:opacity-40 hover:shadow-lg transition-all"
						>
							{loggingIn ? 'Signing in...' : 'Sign In'}
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>

<!-- Energy Tracker (logged in) -->
{:else}

	<!-- Main Screen -->
	{#if screen === 'main'}
		<div class="min-h-[90vh] bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-4">
			<div class="max-w-md mx-auto">
				<!-- User bar -->
				<div class="flex justify-between items-center pt-4 pb-2">
					<span class="text-white/80 text-sm">
						{auth.userInfo?.name || auth.userInfo?.email || 'User'}
					</span>
					<button
						onclick={handleLogout}
						class="text-white/60 hover:text-white text-sm underline"
					>
						Sign out
					</button>
				</div>

				<!-- Time Display -->
				<div class="text-center pt-4 pb-6">
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
		<div class="min-h-[90vh] bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-4 flex items-center">
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
		<div class="min-h-[90vh] bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-4 flex items-center">
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
		<div class="min-h-[90vh] bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-4 flex items-center">
			<div class="max-w-md mx-auto w-full">
				<div class="bg-white rounded-3xl shadow-2xl p-8">
					<h2 class="text-2xl font-bold text-gray-800 text-center mb-2">Energy Level 🔋</h2>
					<p class="text-gray-500 text-center mb-8">How charged are you?</p>

					<!-- Battery Visual -->
					<div class="flex justify-center mb-8">
						<div class="relative">
							<div class="w-32 h-56 border-4 border-gray-800 rounded-2xl p-2 flex flex-col-reverse gap-1">
								{#each [1, 2, 3, 4, 5] as level}
									<button
										onclick={() => (energy = level)}
										class="flex-1 rounded-lg transition-all hover:opacity-80 {getBarColor(energy, level - 1)}"
									></button>
								{/each}
							</div>
							<div class="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-gray-800 rounded-t-lg"></div>
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
						disabled={saving}
						class="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-60"
					>
						{saving ? 'Saving...' : 'Save Entry ✓'}
					</button>
				</div>
			</div>
		</div>
	{/if}
{/if}
