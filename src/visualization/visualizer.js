/**
 * visualizer.js
 * Exports visualization components for audio visualization
 */

import { AudioVisualizer } from './AudioVisualizer.js';
import ThreeDVisualizer from './ThreeDVisualizer.js';

// Basic analyser reference for legacy code
let analyser;

/**
 * Set the audio analyser node for basic visualization
 * @param {AnalyserNode} analyserNode - Web Audio API analyser node
 */
export function setAnalyser(analyserNode) {
  analyser = analyserNode;
}

/**
 * Get the audio analyser node
 * @returns {AnalyserNode} The current analyser node
 */
export function getAnalyser() {
  return analyser;
}

// Export visualization components
export { AudioVisualizer, ThreeDVisualizer };

// Export a factory function to create the appropriate visualizer
export function createVisualizer(type, container, options = {}) {
  switch (type) {
    case '3d':
      return new ThreeDVisualizer(container, options);
    case '2d':
    default:
      return new AudioVisualizer(container, options);
  }
} 