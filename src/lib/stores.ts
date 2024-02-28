import { writable, derived } from 'svelte/store';

export let isLoading = writable(false);
export let timedOutError = writable(false);

export let showInfoModal = writable(false);

export let videoFile = writable<File | null>(null);
export let statusMessage = writable('');
export let videoLink = writable('');
export let fileUploadErrMsg = writable<string | null>(null);

export let showInterpolation = writable(false);
export let showFrameBlending = writable(false);
export let showFileUpload = writable(true);

export const maxFileSize = 75 * 1024 * 1024; // 25 mb

export const interpolationFps = writable(960);
export const frameBlendIntensity = writable(1);
export const selectedSpeed = writable('fast');
export const selectedWeighting = writable('equal');
export const interpolationEnabled = writable(false);
export const frameBlendEnabled = writable(true);
export const brightBlendEnabled = writable(false);
export const outputFpsValues = [24, 30, 60, 120];
export const outputFpsIndex = writable(2); // means 60, we count from 0
export const outputFps = derived(
	outputFpsIndex,
	($outputFpsIndex) => outputFpsValues[$outputFpsIndex]
);
