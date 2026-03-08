<!--routes/+layout.svelte-->

<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<main class="min-h-screen flex flex-col bg-gray-900 text-gray-100">
	<div class="flex-1">
		{@render children?.()}
	</div>

	<footer class="py-6 text-center text-sm text-gray-400">
		💡 source code:
		<a
			class="underline hover:no-underline"
			href="https://github.com/namechecker/namechecker.github.io"
			target="_blank"
			rel="noreferrer"
		>
			https://github.com/namechecker/namechecker.github.io
		</a>
	</footer>
</main>
