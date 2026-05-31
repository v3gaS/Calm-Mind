/**
 * AudioUtils.js
 * Utility functions for audio processing and manipulation
 */

/**
 * Convert frequency in Hz to a note name
 * @param {number} frequency - Frequency in Hz
 * @returns {string} Note name (e.g., "A4", "C#5")
 */
export function frequencyToNote(frequency) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const a4 = 440;
  const c0 = a4 * Math.pow(2, -4.75);
  
  if (frequency < 16) return 'Too low';
  if (frequency > 20000) return 'Too high';
  
  const h = Math.round(12 * Math.log2(frequency / c0));
  const octave = Math.floor(h / 12);
  const n = h % 12;
  
  return noteNames[n] + octave;
}

/**
 * Convert a note name to frequency in Hz
 * @param {string} note - Note name (e.g., "A4", "C#5")
 * @returns {number} Frequency in Hz
 */
export function noteToFrequency(note) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = parseInt(note.slice(-1));
  const noteName = note.slice(0, -1);
  const a4 = 440;
  
  const noteIndex = noteNames.indexOf(noteName);
  if (noteIndex === -1) throw new Error('Invalid note name');
  
  const semitonesFromA4 = (octave - 4) * 12 + noteIndex - 9;
  return a4 * Math.pow(2, semitonesFromA4 / 12);
}

/**
 * Calculate the beat frequency between two frequencies
 * @param {number} freq1 - First frequency in Hz
 * @param {number} freq2 - Second frequency in Hz
 * @returns {number} Beat frequency in Hz
 */
export function calculateBeatFrequency(freq1, freq2) {
  return Math.abs(freq1 - freq2);
}

/**
 * Convert linear amplitude (0-1) to decibels
 * @param {number} amplitude - Linear amplitude (0-1)
 * @returns {number} Amplitude in dB
 */
export function amplitudeToDb(amplitude) {
  return 20 * Math.log10(Math.max(amplitude, 0.0000001));
}

/**
 * Convert decibels to linear amplitude (0-1)
 * @param {number} db - Amplitude in dB
 * @returns {number} Linear amplitude (0-1)
 */
export function dbToAmplitude(db) {
  return Math.pow(10, db / 20);
}

/**
 * Get Solfeggio frequency by name
 * @param {string} name - Solfeggio frequency name (e.g., "UT", "RE", "MI")
 * @returns {number} Frequency in Hz
 */
export function getSolfeggioFrequency(name) {
  const frequencies = {
    'UT': 396,  // Liberating guilt and fear
    'RE': 417,  // Undoing situations and facilitating change
    'MI': 528,  // Transformation and miracles
    'FA': 639,  // Connecting/relationships
    'SOL': 741, // Awakening intuition
    'LA': 852,  // Returning to spiritual order
    '174': 174, // Pain reduction
    '285': 285, // Influence on energy fields
    '963': 963  // Awakening perfect state
  };
  
  return frequencies[name] || null;
}

/**
 * Calculate the frequency for a particular brainwave state
 * @param {string} state - Brainwave state (delta, theta, alpha, beta, gamma)
 * @param {string} range - Range within the state (low, mid, high)
 * @returns {number} Frequency in Hz
 */
export function getBrainwaveFrequency(state, range = 'mid') {
  const ranges = {
    delta: { low: 0.5, mid: 2, high: 4 },
    theta: { low: 4, mid: 6, high: 8 },
    alpha: { low: 8, mid: 10, high: 12 },
    beta: { low: 13, mid: 20, high: 30 },
    gamma: { low: 30, mid: 50, high: 80 }
  };
  
  return ranges[state]?.[range] || null;
}

/**
 * Calculate optimal carrier frequencies for binaural beats
 * @param {number} targetHz - Target frequency difference in Hz
 * @param {string} frequencyRange - Base frequency range (low, mid, high)
 * @returns {Object} Left and right carrier frequencies
 */
export function calculateCarrierFrequencies(targetHz, frequencyRange = 'mid') {
  let baseFrequency;
  
  switch (frequencyRange) {
    case 'low':
      baseFrequency = 100;
      break;
    case 'mid':
      baseFrequency = 200;
      break;
    case 'high':
      baseFrequency = 400;
      break;
    default:
      baseFrequency = 200;
  }
  
  const leftFreq = baseFrequency;
  const rightFreq = baseFrequency + targetHz;
  
  return { left: leftFreq, right: rightFreq };
}

/**
 * Calculate values for HRV synchronization
 * @param {number} breathsPerMinute - Target breathing rate 
 * @returns {Object} HRV parameters
 */
export function calculateHrvParameters(breathsPerMinute) {
  const breathCycleSeconds = 60 / breathsPerMinute;
  const inhaleSeconds = breathCycleSeconds * 0.4;
  const exhaleSeconds = breathCycleSeconds * 0.6;
  
  return {
    frequency: 1 / breathCycleSeconds,
    inhaleDuration: inhaleSeconds,
    exhaleDuration: exhaleSeconds,
    pauseDuration: 0  // Can be adjusted for different breathing patterns
  };
}

/**
 * Linear interpolation between two values
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} amt - Amount (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end;
}

/**
 * Apply an envelope to a value
 * @param {number} value - Input value
 * @param {Object} envelope - Envelope parameters (attack, decay, sustain, release)
 * @param {number} time - Current time
 * @param {number} duration - Total duration
 * @returns {number} Processed value
 */
export function applyEnvelope(value, envelope, time, duration) {
  const { attack, decay, sustain, release } = envelope;
  const attackEnd = attack;
  const decayEnd = attackEnd + decay;
  const releaseStart = duration - release;
  
  let multiplier = 0;
  
  if (time < attackEnd) {
    // Attack phase
    multiplier = time / attack;
  } else if (time < decayEnd) {
    // Decay phase
    const decayProgress = (time - attackEnd) / decay;
    multiplier = lerp(1, sustain, decayProgress);
  } else if (time < releaseStart) {
    // Sustain phase
    multiplier = sustain;
  } else {
    // Release phase
    const releaseProgress = (time - releaseStart) / release;
    multiplier = lerp(sustain, 0, releaseProgress);
  }
  
  return value * multiplier;
}

export default {
  frequencyToNote,
  noteToFrequency,
  calculateBeatFrequency,
  amplitudeToDb,
  dbToAmplitude,
  getSolfeggioFrequency,
  getBrainwaveFrequency,
  calculateCarrierFrequencies,
  calculateHrvParameters,
  lerp,
  applyEnvelope
}; 