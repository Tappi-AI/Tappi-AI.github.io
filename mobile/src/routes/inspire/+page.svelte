<!--routes/inspire/+page.svelte-->

<script lang="ts">
	import { getRandomQuote, getLikedIds, toggleLike, getGradient } from '$lib/utils/quotes';
	import { startRecording, stopRecording, isRecordingSupported, saveMemoReference } from '$lib/services/recorder';
	import { authorPhotos } from '$lib/data/author-photos';
	import type { Quote } from '$lib/types/quotes';
	import type { RecordingState } from '$lib/services/recorder';

	let quote: Quote = $state(getRandomQuote());
	let gradientIndex = $state(0);
	let liked = $state(false);
	let heartAnimating = $state(false);
	let fadeIn = $state(true);
	let recordingState: RecordingState = $state('idle');
	let recordingDuration = $state(0);
	let recordingTimer: ReturnType<typeof setInterval> | null = $state(null);
	let memoSaved = $state(false);
	let imageLoaded = $state(false);

	function getPhoto(author: string): string | undefined {
		return authorPhotos[author];
	}

	function refreshLiked() {
		liked = getLikedIds().has(quote.id);
	}

	$effect(() => {
		refreshLiked();
	});

	function nextQuote() {
		fadeIn = false;
		imageLoaded = false;
		setTimeout(() => {
			quote = getRandomQuote(quote.id);
			gradientIndex++;
			refreshLiked();
			memoSaved = false;
			fadeIn = true;
		}, 300);
	}

	function handleLike() {
		liked = toggleLike(quote.id);
		heartAnimating = true;
		setTimeout(() => (heartAnimating = false), 600);
	}

	async function handleRecord() {
		if (recordingState === 'idle') {
			try {
				await startRecording();
				recordingState = 'recording';
				recordingDuration = 0;
				recordingTimer = setInterval(() => recordingDuration++, 1000);
			} catch {
				// Permission denied or not supported
			}
		} else if (recordingState === 'recording') {
			if (recordingTimer) clearInterval(recordingTimer);
			recordingTimer = null;
			const result = await stopRecording();
			recordingState = 'idle';
			saveMemoReference(quote.id, result.duration, result.url);
			memoSaved = true;
			setTimeout(() => (memoSaved = false), 2000);
		}
	}

	function formatTime(s: number): string {
		const m = Math.floor(s / 60);
		const sec = s % 60;
		return `${m}:${sec.toString().padStart(2, '0')}`;
	}

	// Swipe support
	let touchStartX = 0;
	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
	}
	function handleTouchEnd(e: TouchEvent) {
		const diff = touchStartX - e.changedTouches[0].clientX;
		if (diff > 80) nextQuote();
	}
</script>

<svelte:head>
	<title>Daily Inspire</title>
	<meta name="theme-color" content="#1e1b4b" />
</svelte:head>

<div
	class="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
	ontouchstart={handleTouchStart}
	ontouchend={handleTouchEnd}
	role="main"
>
	<!-- Background Photo -->
	{#if getPhoto(quote.author)}
		<img
			src={getPhoto(quote.author)}
			alt=""
			class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 {imageLoaded && fadeIn ? 'opacity-100' : 'opacity-0'}"
			onload={() => (imageLoaded = true)}
		/>
	{/if}

	<!-- Fallback gradient (shows while image loads or if no photo) -->
	<div class="absolute inset-0 bg-gradient-to-br {getGradient(gradientIndex)} transition-all duration-700 {imageLoaded && getPhoto(quote.author) ? 'opacity-0' : 'opacity-100'}"></div>

	<!-- Dark overlay for readability -->
	<div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40"></div>

	<!-- Quote Card -->
	<div class="relative z-10 flex-1 flex flex-col items-center justify-end px-6 pb-8 max-w-lg w-full transition-all duration-300 {fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}">

		<!-- Quote -->
		<blockquote class="text-center mb-6">
			<p class="text-2xl sm:text-3xl font-light leading-relaxed text-white tracking-wide drop-shadow-lg">
				"{quote.text}"
			</p>
		</blockquote>

		<!-- Author -->
		<div class="text-center">
			<p class="text-lg font-semibold text-white drop-shadow-md">{quote.author}</p>
			<p class="text-sm text-white/60 mt-1">{quote.role}</p>
		</div>
	</div>

	<!-- Bottom Controls -->
	<div class="relative z-10 pb-12 pt-6 flex items-center gap-8">

		<!-- Heart Button -->
		<button
			onclick={handleLike}
			class="group relative w-14 h-14 rounded-full bg-black/30 backdrop-blur-md border border-white/15 flex items-center justify-center transition-all hover:bg-black/40 active:scale-95 {heartAnimating ? 'animate-bounce' : ''}"
			aria-label={liked ? 'Unlike quote' : 'Like quote'}
		>
			<svg class="w-7 h-7 transition-all duration-300 {liked ? 'text-red-400 scale-110' : 'text-white/70'}" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
			</svg>
		</button>

		<!-- Next Button -->
		<button
			onclick={nextQuote}
			class="w-16 h-16 rounded-full bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all hover:bg-black/40 active:scale-95"
			aria-label="Next quote"
		>
			<svg class="w-8 h-8 text-white/80" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
			</svg>
		</button>

		<!-- Voice Memo Button -->
		<button
			onclick={handleRecord}
			disabled={!isRecordingSupported()}
			class="group relative w-14 h-14 rounded-full backdrop-blur-md border flex items-center justify-center transition-all active:scale-95
				{recordingState === 'recording'
					? 'bg-red-500/30 border-red-400/50 animate-pulse'
					: 'bg-black/30 border-white/15 hover:bg-black/40'}
				{!isRecordingSupported() ? 'opacity-40 cursor-not-allowed' : ''}"
			aria-label={recordingState === 'recording' ? 'Stop recording' : 'Start voice memo'}
		>
			{#if recordingState === 'recording'}
				<div class="w-5 h-5 rounded-sm bg-red-400"></div>
			{:else}
				<svg class="w-7 h-7 text-white/70" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3z" />
				</svg>
			{/if}
		</button>
	</div>

	<!-- Recording Timer -->
	{#if recordingState === 'recording'}
		<div class="relative z-10 absolute bottom-4 text-sm text-red-300 flex items-center gap-2 drop-shadow-md">
			<span class="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
			Recording {formatTime(recordingDuration)}
		</div>
	{/if}

	<!-- Memo Saved Toast -->
	{#if memoSaved}
		<div class="relative z-10 absolute bottom-4 text-sm text-green-300 bg-green-900/40 px-4 py-2 rounded-full backdrop-blur-md border border-green-500/20">
			Voice memo saved
		</div>
	{/if}

	<!-- Swipe hint -->
	<div class="relative z-10 absolute bottom-4 right-4 text-xs text-white/25">
		swipe or tap arrow
	</div>
</div>
