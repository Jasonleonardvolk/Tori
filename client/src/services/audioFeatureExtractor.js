// audioFeatureExtractor.js
// Modern, browser-compatible audio feature extraction for covert intent detection
// Uses Web Audio API and Meyda (if available) for pitch, volume, and sentiment estimation

// Note: Meyda can be loaded via CDN or npm for production
// For demonstration, fallback to simple pitch/volume estimation if Meyda is not present

export async function extractAudioFeatures(audioBuffer, transcript, durationMs) {
  // Try Meyda if available
  let features = {};
  if (window.Meyda && audioBuffer) {
    try {
      const analyzer = Meyda.createMeydaAnalyzer({
        audioContext: audioBuffer.context,
        source: audioBuffer.source || null,
        bufferSize: 2048,
        featureExtractors: ['rms', 'zcr', 'perceptualSpread', 'perceptualSharpness', 'mfcc', 'chroma', 'spectralCentroid', 'spectralFlatness', 'spectralSlope', 'spectralRolloff', 'pitch'],
        callback: () => {}
      });
      analyzer._m.signal = audioBuffer.getChannelData(0);
      features = analyzer.get(['rms', 'zcr', 'perceptualSpread', 'perceptualSharpness', 'mfcc', 'chroma', 'spectralCentroid', 'spectralFlatness', 'spectralSlope', 'spectralRolloff', 'pitch']);
      analyzer.stop();
    } catch (e) {
      // fallback below
    }
  }
  // Fallback: simple pitch/volume estimation
  if (!features.pitch && audioBuffer) {
    features.pitch = estimatePitch(audioBuffer);
    features.volume = estimateVolume(audioBuffer);
  }
  // Sentiment estimation (very basic):
  let sentiment = 'neutral';
  if (transcript) {
    if (/thank|great|awesome|love|good|nice|cool/i.test(transcript)) sentiment = 'positive';
    if (/hate|bad|angry|annoy|frustrat|sad|upset/i.test(transcript)) sentiment = 'negative';
  }
  // Compose feature object
  return {
    type: 'voice',
    transcript,
    pitch: features.pitch || null,
    pitchVariance: null, // Meyda can provide this if needed
    volume: features.volume || features.rms || null,
    speakingRate: transcript ? transcript.split(/\s+/).length / (durationMs / 1000) : 0,
    sentiment,
    emphasis: 'neutral', // placeholder
    pauseCount: 1, // placeholder
    durationMs
  };
}

// --- Simple pitch estimation (autocorrelation) ---
function estimatePitch(audioBuffer) {
  const data = audioBuffer.getChannelData(0);
  let maxSamples = Math.floor(data.length / 2);
  let bestOffset = -1, bestCorrelation = 0, rms = 0, foundGoodCorrelation = false, correlations = new Array(maxSamples);
  for (let i = 0; i < data.length; i++) rms += data[i] * data[i];
  rms = Math.sqrt(rms / data.length);
  if (rms < 0.01) return null;
  let lastCorrelation = 1;
  for (let offset = 0; offset < maxSamples; offset++) {
    let correlation = 0;
    for (let i = 0; i < maxSamples; i++) {
      correlation += Math.abs((data[i]) - (data[i + offset]));
    }
    correlation = 1 - (correlation / maxSamples);
    correlations[offset] = correlation;
    if ((correlation > 0.9) && (correlation > lastCorrelation)) {
      foundGoodCorrelation = true;
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    } else if (foundGoodCorrelation) {
      // return frequency
      const sampleRate = audioBuffer.sampleRate;
      return sampleRate / bestOffset;
    }
    lastCorrelation = correlation;
  }
  if (bestCorrelation > 0.01) {
    const sampleRate = audioBuffer.sampleRate;
    return sampleRate / bestOffset;
  }
  return null;
}

function estimateVolume(audioBuffer) {
  const data = audioBuffer.getChannelData(0);
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += Math.abs(data[i]);
  return sum / data.length;
}
