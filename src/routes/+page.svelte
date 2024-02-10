<script lang="ts">
	import { writable, derived, get } from 'svelte/store';
	import { slide } from 'svelte/transition';

	const commitHash = import.meta.env.COMMIT_HASH;

	let isLoading = writable(false);

	let videoFile = writable<File | null>(null);
	let fileUploadErrMsg: string | null = null;
	let statusMessage = writable('');
	let videoLink = writable('');

	let showInfoModal = false;
	let showInterpolation = false;
	let showFrameBlending = false;
	let showFileUpload = true;

	const maxFileSize = 25 * 1024 * 1024;

	const interpolationFps = writable(960);
	const frameBlendIntensity = writable(1);
	const selectedSpeed = writable('fast');
	const selectedWeighting = writable('equal');
	const interpolationEnabled = writable(false);
	const frameBlendEnabled = writable(true);
	const brightBlendEnabled = writable(false);
	const outputFpsValues = [24, 30, 60, 120];
	const outputFpsIndex = writable(2);
	const outputFps = derived(outputFpsIndex, ($outputFpsIndex) => outputFpsValues[$outputFpsIndex]);

	function handleFileChange(event) {
		const files = event.target.files;
		fileUploadErrMsg = null;
		if (files.length > 0) {
			const file = files[0];
			if (file.type === 'video/mp4' && file.size <= maxFileSize) {
				videoFile.set(file);
			} else {
				videoFile.set(null);
				fileUploadErrMsg = 'file must be an mp4 video and under 25mb';
			}
		}
	}

	async function handleSubmit(event) {
		event.preventDefault();
		isLoading.set(true);
		const currentVideoFile = get(videoFile);
		if (!currentVideoFile) {
			fileUploadErrMsg = 'you have no video';
			isLoading.set(false);
			return;
		}
		try {
			const formData = new FormData();
			const settings = {
				interpolationFps: get(interpolationFps),
				frameBlendIntensity: get(frameBlendIntensity),
				selectedSpeed: get(selectedSpeed),
				selectedWeighting: get(selectedWeighting),
				interpolationEnabled: get(interpolationEnabled),
				frameBlendEnabled: get(frameBlendEnabled),
				brightBlendEnabled: get(brightBlendEnabled),
				outputFps: get(outputFps)
			};
			formData.append('videoFile', currentVideoFile);
			formData.append('settings', JSON.stringify(settings));

			const response = await fetch('https://api.smblender.com/blend-video', {
				method: 'POST',
				body: formData
			});

			const data = await response.json();

			if (response.ok) {
				if (data.success) {
					statusMessage.set(data.message || 'your video ready');
					videoLink.set(`https://api.smblender.com/download/${data.filename}`);
				} else {
					statusMessage.set(data.message || 'sum happened idk');
					videoLink.set('');
				}
			} else {
				statusMessage.set(data.message || 'sorry, something went wrong but i dont know what');
				videoLink.set('');
			}
		} catch (error) {
			console.error('failed to submit video and recipe:', error);
			statusMessage.set('failed to process the request. there might be a network issue');
			videoLink.set('');
		}
		isLoading.set(false);
	}
</script>

<div
	class="flex flex-col overflow-x-auto items-center justify-center min-h-screen bg-gray-900 text-gray-300 py-12"
>
	<button class="group" on:click={() => (showInfoModal = true)}>
		<div class="p-2 -m-2">
			<img src="/favicon.svg" alt="logo" class="mb-2 h-20 w-20 fill-current text-blue-500 transition-transform duration-200 ease-in-out group-hover:-translate-y-3 group-hover:rotate-12" />
		</div>
	</button>
	<h1 class="mb-4 text-3xl font-bold">smoothie-blender</h1>

	<form on:submit={handleSubmit} class="w-full max-w-md p-6 space-y-6 bg-gray-800 rounded-xl">
		<div
			class="flex items-center justify-between cursor-pointer"
			on:click={() => (showFileUpload = !showFileUpload)}
		>
			<h2 class="text-xl font-bold text-gray-200">File Upload</h2>
			<span class={`transition-transform transform ${showFileUpload ? 'rotate-90' : ''}`}>&gt;</span
			>
		</div>
		{#if showFileUpload}
			<div transition:slide class="py-4 space-y-4">
				<input
					id="file-upload"
					type="file"
					accept="video/mp4"
					on:change={handleFileChange}
					class="w-full file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:text-sm file:font-semibold file:border-0 file:text-white file:bg-blue-700 file:cursor-pointer hover:file:bg-blue-800 file:transition file:ease-in-out file:duration-300 rounded-md text-sm bg-gray-700 text-gray-300"
				/>
				{#if fileUploadErrMsg}
					<p class="text-red-500">{fileUploadErrMsg}</p>
				{:else if $videoFile}
					<p>File: {$videoFile.name}</p>
				{/if}
			</div>
		{/if}

		<hr class="border-gray-600 my-4" />

		<div
			class="flex items-center justify-between cursor-pointer"
			on:click={() => (showInterpolation = !showInterpolation)}
		>
			<h2 class="text-xl font-bold text-gray-200">Interpolation</h2>
			<span class={`transition-transform transform ${showInterpolation ? 'rotate-90' : ''}`}
				>&gt;</span
			>
		</div>
		{#if showInterpolation}
			<div transition:slide class="space-y-4">
				<div class="flex items-center justify-between">
					<label for="interpolation-enabled" class="text-sm text-gray-400">Enabled:</label>
					<label class="toggle-switch">
						<input
							id="interpolation-enabled"
							type="checkbox"
							bind:checked={$interpolationEnabled}
						/>
						<span class="toggle-slider"></span>
					</label>
				</div>
				<div>
					<label class="flex justify-between text-sm text-gray-400" for="interpolation-fps">
						FPS
						<span class="ml-2">{$interpolationFps}</span>
					</label>
					<input
						id="interpolation-fps"
						type="range"
						min="480"
						max="1440"
						step="240"
						bind:value={$interpolationFps}
						class="w-full cursor-pointer range range-accent"
					/>
				</div>
				<div class="flex items-center space-x-4">
					<div class="mr-4 text-sm text-gray-400">Speed:</div>
					{#each ['medium', 'fast', 'faster'] as speed}
						<button
							type="button"
							class={speed === $selectedSpeed ? 'text-blue-500' : 'text-gray-300'}
							on:click={() => selectedSpeed.set(speed)}>{speed}</button
						>
					{/each}
				</div>
			</div>
		{/if}

		<hr class="border-gray-600 my-4" />

		<div
			class="flex items-center justify-between cursor-pointer"
			on:click={() => (showFrameBlending = !showFrameBlending)}
		>
			<h2 class="text-xl font-bold text-gray-200">Frame Blending</h2>
			<span class={`transition-transform transform ${showFrameBlending ? 'rotate-90' : ''}`}
				>&gt;</span
			>
		</div>
		{#if showFrameBlending}
			<div transition:slide class="space-y-4">
				<div class="flex items-center justify-between">
					<label for="frame-blend-enabled" class="text-sm text-gray-400">Enabled:</label>
					<label class="toggle-switch">
						<input id="frame-blend-enabled" type="checkbox" bind:checked={$frameBlendEnabled} />
						<span class="toggle-slider"></span>
					</label>
				</div>
				<div>
					<label class="flex justify-between text-sm text-gray-400" for="frame-blend-intensity">
						Intensity
						<span class="ml-2">{$frameBlendIntensity}</span>
					</label>
					<input
						id="frame-blend-intensity"
						type="range"
						min="0.4"
						max="2"
						step="0.1"
						bind:value={$frameBlendIntensity}
						class="w-full cursor-pointer range range-accent"
					/>
				</div>
				<div>
					<label class="flex justify-between text-sm text-gray-400" for="output-fps">
						Output FPS
						<span>{$outputFps}</span>
					</label>
					<input
						id="output-fps"
						type="range"
						min="0"
						max="3"
						step="1"
						bind:value={$outputFpsIndex}
						class="w-full cursor-pointer range range-accent"
					/>
				</div>
				<div class="flex items-center space-x-4">
					<div class="mr-4 text-sm text-gray-400">Weighting:</div>
					{#each ['equal', 'gaussian', 'gaussian_sym'] as weighting}
						<button
							type="button"
							class={weighting === $selectedWeighting ? 'text-blue-500' : 'text-gray-300'}
							on:click={() => selectedWeighting.set(weighting)}>{weighting}</button
						>
					{/each}
				</div>
				<div class="flex items-center space-x-4 mt-4">
					<div class="mr-4 text-sm text-gray-400">Bright Blend:</div>
					{#each [true, false] as option}
						<button
							type="button"
							class={$brightBlendEnabled === option ? 'text-blue-500' : 'text-gray-300'}
							on:click={() => brightBlendEnabled.set(option)}>{option}</button
						>
					{/each}
				</div>
			</div>
		{/if}

		<div class="mt-4 flex flex-col items-center justify-center">
			<button
				type="submit"
				class="px-4 py-2 text-white bg-blue-700 rounded-lg shadow font-semibold hover:bg-blue-800 transition duration-300 ease-in-out flex items-center justify-center"
				disabled={$isLoading}
			>
				{#if $isLoading}
					<svg
						class="animate-spin -ml-1 mr-3 h-6 w-6 fill-white"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
					>
						<path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
					</svg>
					Blending...
				{:else}
					Blend video
				{/if}
			</button>
			{#if $statusMessage}
				<p class="mt-4 text-center {$videoLink ? 'text-green-500' : 'text-red-500'}">
					{$statusMessage}
				</p>
				{#if $videoLink}
					<div class="mt-3 flex flex-col items-center">
						<p class="px-4 text-center break-all">
							<a
								href={$videoLink}
								target="_blank"
								class="underline hover:text-blue-600 text-blue-500">{$videoLink}</a
							>
						</p>
						<p class="mt-2 text-sm text-gray-500">(it will expire in 5m)</p>
					</div>
				{/if}
			{/if}
		</div>
	</form>
	<footer class="mt-6 text-center w-full">
		<p class="text-gray-400 my-4">
			This web app uses <a
				href="https://github.com/couleur-tweak-tips/smoothie-rs/"
				class="hover:text-blue-600 text-blue-500">smoothie-rs</a
			>. <br />Both
			<a href="https://github.com/Z1xus/smoothie-blender" class="hover:text-blue-600 text-blue-500"
				>this project</a
			>
			and
			<a
				href="https://github.com/couleur-tweak-tips/smoothie-rs/"
				class="hover:text-blue-600 text-blue-500">smoothie-rs</a
			> are licensed under GPL-v3.0.
		</p>
		<div class="flex justify-center items-center gap-2 text-gray-300">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6 -mb-1 text-blue-500"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
					stroke="currentColor"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path d="M9 12H3" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
				<path
					d="M15 12L21 12"
					stroke="currentColor"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			<a href="https://github.com/Z1xus/smoothie-blender" class="text-blue-500 hover:text-blue-600"
				>{commitHash}</a
			>
		</div>
	</footer>
	{#if showInfoModal}
		<div
			class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-md overfloy-y-auto"
		>
			<div class="mx-3 my-1 p-4 bg-gray-800 rounded-lg text-center leading-relaxed text-pretty">
				<p class="mb-1 text-2xl font-bold">what?</p>
				<hr class="my-4 mx-auto w-1/2 border-gray-600" />
				<p>
					<a
						href="https://github.com/couleur-tweak-tips/smoothie-rs/"
						class="hover:text-blue-600 text-blue-500">smoothie-rs</a
					> in a form of web app with user-friendly interface
				</p>
				<br />
				<p class="mb-1 text-2xl font-bold">why?</p>
				<hr class="my-4 mx-auto w-1/2 border-gray-600" />
				<p>to test your config or render a video quickly on-the-go</p>
				<br />
				<p class="mb-1 text-2xl font-bold">by whom?</p>
				<hr class="my-4 mx-auto w-1/2 border-gray-600" />
				<p>
					developed by <a
						href="https://z1xus.netlify.app/"
						class="hover:text-blue-600 text-blue-500">z1xus</a
					>
				</p>
				<p>
					credit to <a
						href="https://github.com/couleur-tweak-tips/smoothie-rs/graphs/contributors"
						class="hover:text-blue-600 text-blue-500">couleur and contributors</a
					>
					for
					<a
						href="https://github.com/couleur-tweak-tips/smoothie-rs/"
						class="hover:text-blue-600 text-blue-500">smoothie-rs</a
					>
				</p>
				<p>renders provided to you by intel uhd graphics 630</p>
				<button
					class="mt-4 w-full px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded font-medium transition duration-300 ease-in-out"
					on:click={() => (showInfoModal = false)}>Close</button
				>
			</div>
		</div>
	{/if}
</div>
