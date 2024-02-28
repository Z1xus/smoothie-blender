import { get } from 'svelte/store';
import {
	videoFile,
	statusMessage,
	videoLink,
	isLoading,
	timedOutError,
	interpolationFps,
	frameBlendIntensity,
	selectedSpeed,
	selectedWeighting,
	interpolationEnabled,
	frameBlendEnabled,
	brightBlendEnabled,
	outputFps,
	outputFpsIndex,
	fileUploadErrMsg,
	maxFileSize
} from './stores';

export function handleFileChange(event: Event) {
	const input = event.target as HTMLInputElement;
	const files = input.files;
	fileUploadErrMsg.set(null);
	if (files && files.length > 0) {
		const file = files[0];
		if (file.type === 'video/mp4' && file.size <= maxFileSize) {
			videoFile.set(file);
		} else {
			videoFile.set(null);
			fileUploadErrMsg.set('file must be an mp4 video and under 75mb');
		}
	}
}

export async function handleSubmit(event: Event) {
	event.preventDefault();
	isLoading.set(true);
	timedOutError.set(false);
	statusMessage.set('');
	const currentVideoFile = get(videoFile);
	if (!currentVideoFile) {
		fileUploadErrMsg.set('you have no video');
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

		if (response.status === 508) {
			timedOutError.set(true);
			statusMessage.set('sorry, i timed out');
			videoLink.set('');
		} else {
			const data = await response.json();
			if (response.ok) {
				if (data.success) {
					statusMessage.set(data.message || 'your video ready');
					videoLink.set(`https://api.smblender.com/download/${data.filename}`);
				} else {
					statusMessage.set(data.message || 'something happened, i dont know what');
					videoLink.set('');
				}
			} else {
				statusMessage.set(data.message || 'sorry, something went wrong, but i dont know what');
				videoLink.set('');
			}
		}
	} catch (error) {
		console.error('failed to submit video and recipe:', error);
		statusMessage.set(
			'failed to process the request. there might be a network issue, or the worker is down'
		);
		videoLink.set('');
	}
	isLoading.set(false);
}
