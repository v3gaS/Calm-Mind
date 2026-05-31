/**
 * AudioAnalyzer.js
 * Utilities for advanced audio analysis and feature extraction
 */

/**
 * Class for performing real-time audio analysis on audio data
 */
export class AudioAnalyzer {
  /**
   * Create an audio analyzer
   * @param {AudioContext} audioContext - Web Audio API context
   * @param {number} fftSize - FFT size for analysis (power of 2)
   */
  constructor(audioContext, fftSize = 2048) {
    this.audioContext = audioContext;
    this.analyzer = audioContext.createAnalyser();
    this.analyzer.fftSize = fftSize;
    this.fftSize = fftSize;
    this.bufferLength = this.analyzer.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    this.floatDataArray = new Float32Array(this.bufferLength);
    this.frequencyData = new Uint8Array(this.bufferLength);
    this.floatFrequencyData = new Float32Array(this.bufferLength);
    this.timeDataBuffer = new Float32Array(this.fftSize * 10); // 10 frames history
    this.timeDataPointer = 0;
    this.isRecording = false;
    
    // Set up features extractors
    this.features = {
      rms: 0,
      peakLevel: 0,
      spectralCentroid: 0,
      spectralFlatness: 0,
      zeroCrossingRate: 0,
      dominantFrequency: 0,
      energyByBands: new Array(6).fill(0)
    };
  }

  /**
   * Connect the analyzer to an audio node
   * @param {AudioNode} sourceNode - Source audio node
   * @param {AudioNode} [destinationNode] - Optional destination node
   * @returns {AudioNode} The last node in the chain for further connections
   */
  connect(sourceNode, destinationNode = null) {
    sourceNode.connect(this.analyzer);
    
    if (destinationNode) {
      this.analyzer.connect(destinationNode);
      return destinationNode;
    }
    
    return this.analyzer;
  }

  /**
   * Analyze audio and update all features
   */
  analyze() {
    this.getTimeData();
    this.getFrequencyData();
    this.calculateFeatures();
  }

  /**
   * Get time domain data
   * @returns {Uint8Array} Time domain data
   */
  getTimeData() {
    this.analyzer.getByteTimeDomainData(this.dataArray);
    this.analyzer.getFloatTimeDomainData(this.floatDataArray);
    
    // Store data in circular buffer for longer analysis
    if (this.isRecording) {
      for (let i = 0; i < this.floatDataArray.length; i++) {
        this.timeDataBuffer[this.timeDataPointer] = this.floatDataArray[i];
        this.timeDataPointer = (this.timeDataPointer + 1) % this.timeDataBuffer.length;
      }
    }
    
    return this.dataArray;
  }

  /**
   * Get frequency domain data
   * @returns {Uint8Array} Frequency domain data
   */
  getFrequencyData() {
    this.analyzer.getByteFrequencyData(this.frequencyData);
    this.analyzer.getFloatFrequencyData(this.floatFrequencyData);
    return this.frequencyData;
  }

  /**
   * Calculate all audio features
   */
  calculateFeatures() {
    this.features.rms = this.calculateRMS();
    this.features.peakLevel = this.calculatePeakLevel();
    this.features.spectralCentroid = this.calculateSpectralCentroid();
    this.features.spectralFlatness = this.calculateSpectralFlatness();
    this.features.zeroCrossingRate = this.calculateZeroCrossingRate();
    this.features.dominantFrequency = this.calculateDominantFrequency();
    this.features.energyByBands = this.calculateEnergyBands();
  }

  /**
   * Calculate RMS (Root Mean Square) amplitude
   * @returns {number} RMS value (0-1)
   */
  calculateRMS() {
    let sum = 0;
    for (let i = 0; i < this.floatDataArray.length; i++) {
      sum += this.floatDataArray[i] * this.floatDataArray[i];
    }
    return Math.sqrt(sum / this.floatDataArray.length);
  }

  /**
   * Calculate peak level
   * @returns {number} Peak level (0-1)
   */
  calculatePeakLevel() {
    let max = 0;
    for (let i = 0; i < this.floatDataArray.length; i++) {
      const abs = Math.abs(this.floatDataArray[i]);
      if (abs > max) max = abs;
    }
    return max;
  }

  /**
   * Calculate spectral centroid (brightness)
   * @returns {number} Spectral centroid in Hz
   */
  calculateSpectralCentroid() {
    let sumAmplitude = 0;
    let sumWeightedAmplitude = 0;
    
    for (let i = 0; i < this.frequencyData.length; i++) {
      const amplitude = this.frequencyData[i] / 255;
      const frequency = i * this.audioContext.sampleRate / (this.fftSize * 2);
      
      sumAmplitude += amplitude;
      sumWeightedAmplitude += amplitude * frequency;
    }
    
    if (sumAmplitude > 0) {
      return sumWeightedAmplitude / sumAmplitude;
    }
    
    return 0;
  }

  /**
   * Calculate spectral flatness (noise vs. tone)
   * @returns {number} Spectral flatness (0-1)
   */
  calculateSpectralFlatness() {
    let geometricMean = 0;
    let arithmeticMean = 0;
    let count = 0;
    
    // Skip first bins to avoid DC
    for (let i = 5; i < this.floatFrequencyData.length; i++) {
      // Convert from dB to linear
      const magnitude = Math.pow(10, this.floatFrequencyData[i] / 20);
      
      if (magnitude > 0) {
        geometricMean += Math.log(magnitude);
        arithmeticMean += magnitude;
        count++;
      }
    }
    
    if (count > 0 && arithmeticMean > 0) {
      geometricMean = Math.exp(geometricMean / count);
      arithmeticMean = arithmeticMean / count;
      return geometricMean / arithmeticMean;
    }
    
    return 0;
  }

  /**
   * Calculate zero crossing rate
   * @returns {number} Zero crossing rate
   */
  calculateZeroCrossingRate() {
    let crossings = 0;
    
    for (let i = 1; i < this.floatDataArray.length; i++) {
      if ((this.floatDataArray[i] * this.floatDataArray[i - 1]) < 0) {
        crossings++;
      }
    }
    
    return crossings / (this.floatDataArray.length - 1);
  }

  /**
   * Calculate dominant frequency
   * @returns {number} Dominant frequency in Hz
   */
  calculateDominantFrequency() {
    let maxBin = 0;
    let maxMagnitude = 0;
    
    for (let i = 1; i < this.frequencyData.length; i++) {
      if (this.frequencyData[i] > maxMagnitude) {
        maxMagnitude = this.frequencyData[i];
        maxBin = i;
      }
    }
    
    return maxBin * this.audioContext.sampleRate / (this.fftSize * 2);
  }

  /**
   * Calculate energy in frequency bands
   * @returns {Array<number>} Energy by bands (0-1 for each band)
   */
  calculateEnergyBands() {
    const bandRanges = [
      [20, 60],     // Sub-bass
      [60, 250],    // Bass
      [250, 500],   // Low mids
      [500, 2000],  // Mids
      [2000, 6000], // High mids
      [6000, 20000] // Highs
    ];
    
    const sampleRate = this.audioContext.sampleRate;
    const binSize = sampleRate / (this.fftSize * 2);
    const energyBands = new Array(bandRanges.length).fill(0);
    
    for (let bandIdx = 0; bandIdx < bandRanges.length; bandIdx++) {
      let sum = 0;
      let count = 0;
      
      const lowBin = Math.floor(bandRanges[bandIdx][0] / binSize);
      const highBin = Math.min(Math.ceil(bandRanges[bandIdx][1] / binSize), this.frequencyData.length);
      
      for (let i = lowBin; i < highBin; i++) {
        sum += this.frequencyData[i];
        count++;
      }
      
      if (count > 0) {
        energyBands[bandIdx] = sum / (count * 255); // Normalize to 0-1
      }
    }
    
    return energyBands;
  }

  /**
   * Start or stop recording audio for long-term analysis
   * @param {boolean} record - Whether to record
   */
  setRecording(record) {
    this.isRecording = record;
    if (record) {
      this.timeDataPointer = 0;
      this.timeDataBuffer.fill(0);
    }
  }

  /**
   * Get all calculated features
   * @returns {Object} All audio features
   */
  getFeatures() {
    return { ...this.features };
  }

  /**
   * Disconnect the analyzer
   */
  disconnect() {
    try {
      this.analyzer.disconnect();
    } catch (e) {
      console.warn('Error disconnecting analyzer:', e);
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.disconnect();
    this.dataArray = null;
    this.floatDataArray = null;
    this.frequencyData = null;
    this.floatFrequencyData = null;
    this.timeDataBuffer = null;
  }
}

export default AudioAnalyzer; 