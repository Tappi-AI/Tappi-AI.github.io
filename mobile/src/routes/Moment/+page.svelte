<!--routes/Celine/+page.svelte - Beautiful Moments-->

<script lang="ts">
	type Moment = { image: string; text: string; time: number };

	let page: 'home' | 'capture' | 'collection' = $state('home');
	let stream: MediaStream | null = $state(null);
	let currentImage: string | null = $state(null);
	let momentText = $state('');
	let moments: Moment[] = $state([]);
	let videoEl: HTMLVideoElement | undefined = $state(undefined);
	let canvasEl: HTMLCanvasElement | undefined = $state(undefined);

	function loadMoments() {
		try {
			moments = JSON.parse(localStorage.getItem('moments') || '[]');
		} catch {
			moments = [];
		}
	}

	function go(p: typeof page) {
		if (p === 'collection') loadMoments();
		page = p;
	}

	async function openCamera() {
		go('capture');
		currentImage = null;
		momentText = '';
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: { exact: 'environment' } }
			});
		} catch {
			stream = await navigator.mediaDevices.getUserMedia({ video: true });
		}
		if (videoEl) videoEl.srcObject = stream;
	}

	function takePhoto() {
		if (!videoEl || !canvasEl) return;
		canvasEl.width = videoEl.videoWidth;
		canvasEl.height = videoEl.videoHeight;
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;
		ctx.drawImage(videoEl, 0, 0);
		currentImage = canvasEl.toDataURL('image/jpeg', 0.7);
	}

	function saveMoment() {
		if (!currentImage) return;
		const stored: Moment[] = JSON.parse(localStorage.getItem('moments') || '[]');
		stored.unshift({ image: currentImage, text: momentText, time: Date.now() });
		localStorage.setItem('moments', JSON.stringify(stored));
		momentText = '';
		currentImage = null;
		stopCamera();
		go('collection');
	}

	function stopCamera() {
		if (stream) {
			stream.getTracks().forEach((t) => t.stop());
			stream = null;
		}
	}

	function cancelCapture() {
		stopCamera();
		go('home');
	}

	function deleteMoment(index: number) {
		const stored: Moment[] = JSON.parse(localStorage.getItem('moments') || '[]');
		stored.splice(index, 1);
		localStorage.setItem('moments', JSON.stringify(stored));
		moments = stored;
	}

	function formatDate(ts: number): string {
		return new Date(ts).toLocaleDateString('zh-Hant', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Beautiful Moments</title>
	<meta name="theme-color" content="#0f1115" />
</svelte:head>

<!-- Home -->
{#if page === 'home'}
	<div class="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
		<h1 class="text-4xl font-light tracking-wide mb-3">Beautiful Moments</h1>
		<p class="text-gray-400 mb-10">Capture a small but meaningful moment.</p>
		<button
			onclick={openCamera}
			class="w-full max-w-xs py-3.5 rounded-2xl bg-white text-black font-medium text-lg transition hover:bg-gray-200 active:scale-95"
		>
			Tap to Capture
		</button>
		<button
			onclick={() => go('collection')}
			class="w-full max-w-xs py-3.5 rounded-2xl bg-gray-800 text-white font-medium text-lg mt-3 transition hover:bg-gray-700 active:scale-95"
		>
			View Collection
		</button>
	</div>
{/if}

<!-- Capture -->
{#if page === 'capture'}
	<div class="flex flex-col items-center px-6 py-6 max-w-lg mx-auto">
		<h1 class="text-2xl font-light mb-4 self-start">This moment</h1>

		{#if !currentImage}
			<!-- svelte-ignore element_invalid_self_closing_tag -->
			<video bind:this={videoEl} autoplay playsinline class="w-full rounded-2xl bg-black" />
			<button
				onclick={takePhoto}
				class="w-full py-3.5 rounded-2xl bg-white text-black font-medium text-lg mt-4 transition hover:bg-gray-200 active:scale-95"
			>
				Take Photo
			</button>
		{:else}
			<img src={currentImage} alt="Captured moment" class="w-full rounded-2xl" />
		{/if}

		<canvas bind:this={canvasEl} class="hidden"></canvas>

		<textarea
			bind:value={momentText}
			placeholder="Write one sentence..."
			class="w-full mt-4 p-3.5 rounded-2xl bg-gray-800 text-white border border-gray-700 focus:border-gray-500 focus:outline-none resize-none text-base"
			rows="2"
		></textarea>

		<button
			onclick={saveMoment}
			disabled={!currentImage}
			class="w-full py-3.5 rounded-2xl bg-white text-black font-medium text-lg mt-3 transition hover:bg-gray-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
		>
			Save
		</button>
		<button
			onclick={cancelCapture}
			class="w-full py-3.5 rounded-2xl bg-gray-800 text-white font-medium text-lg mt-3 transition hover:bg-gray-700 active:scale-95"
		>
			Cancel
		</button>
	</div>
{/if}

<!-- Collection -->
{#if page === 'collection'}
	<div class="px-6 py-6 max-w-lg mx-auto">
		<h1 class="text-2xl font-light mb-6">My Moments</h1>

		{#if moments.length === 0}
			<p class="text-gray-400">No moments yet. Go capture one!</p>
		{:else}
			<div class="space-y-6">
				{#each moments as m, i}
					<div class="rounded-2xl overflow-hidden bg-gray-800/50 border border-gray-700/50">
						<img src={m.image} alt="Moment {i + 1}" class="w-full" />
						<div class="p-4 flex items-start justify-between gap-3">
							<div>
								{#if m.text}
									<p class="text-base text-gray-200">{m.text}</p>
								{/if}
								<p class="text-xs text-gray-500 mt-1">{formatDate(m.time)}</p>
							</div>
							<button
								onclick={() => deleteMoment(i)}
								class="text-gray-500 hover:text-red-400 transition shrink-0 p-1"
								aria-label="Delete moment"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<button
			onclick={() => go('home')}
			class="w-full py-3.5 rounded-2xl bg-gray-800 text-white font-medium text-lg mt-6 transition hover:bg-gray-700 active:scale-95"
		>
			Back
		</button>
	</div>
{/if}
