// Voice Intent Signal Extraction Utility
// Extracts tonality and prosody features from voice input for covert intent detection

// This is a scaffold for browser-based (Web Audio API) voice feature extraction
// For production, integrate with your actual audio pipeline
import { extractAudioFeatures } from './audioFeatureExtractor';

export async function extractVoiceFeatures(audioBuffer, transcript, durationMs) {
  // Use real feature extraction for production
  return await extractAudioFeatures(audioBuffer, transcript, durationMs);
}

// Example: usage in a voice input handler
// const features = await extractVoiceFeatures(audioBuffer, transcript, durationMs);
// sendToIntentDetection({ content: transcript, behavioralSignals: [features] });
