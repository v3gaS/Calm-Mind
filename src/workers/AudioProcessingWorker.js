/**
 * AudioProcessingWorker.js
 * Web Worker for offloading heavy audio processing tasks
 */

// State
let initialized = false;
let config = {
  sampleRate: 44100,
  blockSize: 4096,
  channels: 2
};

// Initialize worker
function initialize(data) {
  config = {
    ...config,
    ...data
  };
  
  initialized = true;
  
  // Send initialized message
  self.postMessage({
    type: 'initialized'
  });
}

// Process audio data
function processAudioData(data) {
  const { buffer, processingType, options, id } = data;
  
  try {
    let result;
    
    switch (processingType) {
      case 'generateBinaural':
        result = generateBinauralBeats(buffer, options);
        break;
      case 'generateMono':
        result = generateMonauralBeats(buffer, options);
        break;
      case 'applyReverb':
        result = applyReverb(buffer, options);
        break;
      case 'generateSolfeggio':
        result = generateSolfeggioFrequency(buffer, options);
        break;
      case 'signalProcessing':
        result = performSignalProcessing(buffer, options);
        break;
      default:
        throw new Error(`Unknown processing type: ${processingType}`);
    }
    
    // Return processed data
    self.postMessage({
      id,
      result,
      processingType
    }, [result.buffer]);
  } catch (error) {
    self.postMessage({
      id,
      error: error.message,
      processingType
    });
  }
}

/**
 * Generate binaural beats
 * @param {Float32Array} buffer - Output buffer
 * @param {Object} options - Processing options
 * @returns {Float32Array} Processed buffer
 */
function generateBinauralBeats(buffer, options) {
  const {
    leftFrequency = 200,
    rightFrequency = 210,
    amplitude = 0.5,
    waveform = 'sine',
    duration = 1
  } = options;
  
  const sampleRate = config.sampleRate;
  const channels = config.channels;
  const length = Math.ceil(duration * sampleRate);
  
  // Create output buffer
  const outputBuffer = new Float32Array(length * channels);
  
  // Generate waveforms
  for (let i = 0; i < length; i++) {
    const time = i / sampleRate;
    
    // Calculate waveform values
    let leftValue, rightValue;
    
    // Left channel
    switch (waveform) {
      case 'sine':
        leftValue = Math.sin(2 * Math.PI * leftFrequency * time);
        break;
      case 'square':
        leftValue = Math.sin(2 * Math.PI * leftFrequency * time) >= 0 ? 1 : -1;
        break;
      case 'triangle':
        leftValue = 2 * Math.abs(2 * ((leftFrequency * time) % 1) - 1) - 1;
        break;
      case 'sawtooth':
        leftValue = 2 * ((leftFrequency * time) % 1) - 1;
        break;
      default:
        leftValue = Math.sin(2 * Math.PI * leftFrequency * time);
    }
    
    // Right channel
    switch (waveform) {
      case 'sine':
        rightValue = Math.sin(2 * Math.PI * rightFrequency * time);
        break;
      case 'square':
        rightValue = Math.sin(2 * Math.PI * rightFrequency * time) >= 0 ? 1 : -1;
        break;
      case 'triangle':
        rightValue = 2 * Math.abs(2 * ((rightFrequency * time) % 1) - 1) - 1;
        break;
      case 'sawtooth':
        rightValue = 2 * ((rightFrequency * time) % 1) - 1;
        break;
      default:
        rightValue = Math.sin(2 * Math.PI * rightFrequency * time);
    }
    
    // Apply envelope if needed
    let envelope = 1;
    
    // Simple linear attack/release
    const attack = Math.min(0.1, duration / 10);
    const release = Math.min(0.1, duration / 10);
    
    if (time < attack) {
      envelope = time / attack;
    } else if (time > duration - release) {
      envelope = (duration - time) / release;
    }
    
    // Write to output buffer (interleaved stereo)
    outputBuffer[i * channels] = leftValue * amplitude * envelope;
    outputBuffer[i * channels + 1] = rightValue * amplitude * envelope;
  }
  
  return outputBuffer;
}

/**
 * Generate monaural beats
 * @param {Float32Array} buffer - Output buffer
 * @param {Object} options - Processing options
 * @returns {Float32Array} Processed buffer
 */
function generateMonauralBeats(buffer, options) {
  const {
    baseFrequency = 200,
    beatFrequency = 10,
    amplitude = 0.5,
    waveform = 'sine',
    duration = 1
  } = options;
  
  const sampleRate = config.sampleRate;
  const channels = config.channels;
  const length = Math.ceil(duration * sampleRate);
  
  // Create output buffer
  const outputBuffer = new Float32Array(length * channels);
  
  // Generate monaural beats by adding two frequencies together
  for (let i = 0; i < length; i++) {
    const time = i / sampleRate;
    
    // Calculate waveform values for f1 and f2
    const f1 = baseFrequency;
    const f2 = baseFrequency + beatFrequency;
    
    let wave1, wave2;
    
    // Waveform for f1
    switch (waveform) {
      case 'sine':
        wave1 = Math.sin(2 * Math.PI * f1 * time);
        break;
      case 'square':
        wave1 = Math.sin(2 * Math.PI * f1 * time) >= 0 ? 1 : -1;
        break;
      case 'triangle':
        wave1 = 2 * Math.abs(2 * ((f1 * time) % 1) - 1) - 1;
        break;
      case 'sawtooth':
        wave1 = 2 * ((f1 * time) % 1) - 1;
        break;
      default:
        wave1 = Math.sin(2 * Math.PI * f1 * time);
    }
    
    // Waveform for f2
    switch (waveform) {
      case 'sine':
        wave2 = Math.sin(2 * Math.PI * f2 * time);
        break;
      case 'square':
        wave2 = Math.sin(2 * Math.PI * f2 * time) >= 0 ? 1 : -1;
        break;
      case 'triangle':
        wave2 = 2 * Math.abs(2 * ((f2 * time) % 1) - 1) - 1;
        break;
      case 'sawtooth':
        wave2 = 2 * ((f2 * time) % 1) - 1;
        break;
      default:
        wave2 = Math.sin(2 * Math.PI * f2 * time);
    }
    
    // Apply envelope
    let envelope = 1;
    
    // Simple linear attack/release
    const attack = Math.min(0.1, duration / 10);
    const release = Math.min(0.1, duration / 10);
    
    if (time < attack) {
      envelope = time / attack;
    } else if (time > duration - release) {
      envelope = (duration - time) / release;
    }
    
    // Combine waves (monaural beats)
    const monauralValue = (wave1 + wave2) / 2;
    
    // Write to output buffer (same for all channels)
    for (let channel = 0; channel < channels; channel++) {
      outputBuffer[i * channels + channel] = monauralValue * amplitude * envelope;
    }
  }
  
  return outputBuffer;
}

/**
 * Generate Solfeggio frequency
 * @param {Float32Array} buffer - Output buffer
 * @param {Object} options - Processing options
 * @returns {Float32Array} Processed buffer
 */
function generateSolfeggioFrequency(buffer, options) {
  const {
    frequency = 528, // Default to MI (528 Hz)
    amplitude = 0.5,
    waveform = 'sine',
    harmonics = [1, 0.5, 0.25], // Fundamental and harmonics
    duration = 1
  } = options;
  
  const sampleRate = config.sampleRate;
  const channels = config.channels;
  const length = Math.ceil(duration * sampleRate);
  
  // Create output buffer
  const outputBuffer = new Float32Array(length * channels);
  
  // Generate Solfeggio frequency with harmonics
  for (let i = 0; i < length; i++) {
    const time = i / sampleRate;
    let sample = 0;
    
    // Add fundamental and harmonics
    for (let h = 0; h < harmonics.length; h++) {
      const harmonicFreq = frequency * (h + 1);
      const harmonicAmp = harmonics[h];
      
      switch (waveform) {
        case 'sine':
          sample += harmonicAmp * Math.sin(2 * Math.PI * harmonicFreq * time);
          break;
        case 'square':
          sample += harmonicAmp * (Math.sin(2 * Math.PI * harmonicFreq * time) >= 0 ? 1 : -1);
          break;
        case 'triangle':
          sample += harmonicAmp * (2 * Math.abs(2 * ((harmonicFreq * time) % 1) - 1) - 1);
          break;
        case 'sawtooth':
          sample += harmonicAmp * (2 * ((harmonicFreq * time) % 1) - 1);
          break;
        default:
          sample += harmonicAmp * Math.sin(2 * Math.PI * harmonicFreq * time);
      }
    }
    
    // Normalize to avoid clipping
    const normalizationFactor = harmonics.reduce((sum, h) => sum + Math.abs(h), 0);
    sample = sample / normalizationFactor;
    
    // Apply envelope
    let envelope = 1;
    
    // Simple linear attack/release
    const attack = Math.min(0.1, duration / 10);
    const release = Math.min(0.1, duration / 10);
    
    if (time < attack) {
      envelope = time / attack;
    } else if (time > duration - release) {
      envelope = (duration - time) / release;
    }
    
    // Write to output buffer (same for all channels)
    for (let channel = 0; channel < channels; channel++) {
      outputBuffer[i * channels + channel] = sample * amplitude * envelope;
    }
  }
  
  return outputBuffer;
}

/**
 * Apply reverb effect
 * @param {Float32Array} buffer - Input buffer
 * @param {Object} options - Processing options
 * @returns {Float32Array} Processed buffer
 */
function applyReverb(buffer, options) {
  const {
    decayTime = 1.5,
    preDelay = 0.01,
    wetDry = 0.5
  } = options;
  
  const sampleRate = config.sampleRate;
  const channels = config.channels;
  const inputLength = buffer.length / channels;
  
  // Calculate impulse response for reverb
  const impulseLength = Math.ceil(decayTime * sampleRate);
  const preDelayLength = Math.ceil(preDelay * sampleRate);
  const impulseResponse = new Float32Array(impulseLength);
  
  // Simple exponential decay for impulse response
  for (let i = 0; i < impulseLength; i++) {
    if (i < preDelayLength) {
      impulseResponse[i] = 0;
    } else {
      const t = (i - preDelayLength) / (impulseLength - preDelayLength);
      impulseResponse[i] = Math.exp(-t * 8) * (1 - t); // Exponential decay with slight shaping
    }
  }
  
  // Calculate output length (input + reverb tail)
  const outputLength = inputLength + impulseLength;
  const outputBuffer = new Float32Array(outputLength * channels);
  
  // Process each channel
  for (let channel = 0; channel < channels; channel++) {
    // Convolve input with impulse response (simple convolution for reverb)
    for (let i = 0; i < inputLength; i++) {
      const inputSample = buffer[i * channels + channel];
      
      // Direct (dry) signal
      outputBuffer[i * channels + channel] += inputSample * (1 - wetDry);
      
      // Convolution (wet signal)
      for (let j = 0; j < impulseLength; j++) {
        if (i + j < outputLength) {
          outputBuffer[(i + j) * channels + channel] += inputSample * impulseResponse[j] * wetDry;
        }
      }
    }
  }
  
  return outputBuffer;
}

/**
 * Perform general signal processing
 * @param {Float32Array} buffer - Input buffer
 * @param {Object} options - Processing options
 * @returns {Float32Array} Processed buffer
 */
function performSignalProcessing(buffer, options) {
  const {
    processType = 'normalize',
    parameters = {}
  } = options;
  
  const channels = config.channels;
  const inputLength = buffer.length / channels;
  const outputBuffer = new Float32Array(buffer.length);
  
  switch (processType) {
    case 'normalize': {
      // Find peak value
      let peak = 0;
      for (let i = 0; i < buffer.length; i++) {
        peak = Math.max(peak, Math.abs(buffer[i]));
      }
      
      // Apply normalization
      const targetLevel = parameters.level || 0.9;
      const gain = peak > 0 ? targetLevel / peak : 1;
      
      for (let i = 0; i < buffer.length; i++) {
        outputBuffer[i] = buffer[i] * gain;
      }
      break;
    }
    
    case 'filter': {
      // Simple FIR filter implementation
      const coefficients = parameters.coefficients || [0.2, 0.3, 0.5, 0.3, 0.2];
      const filterSize = coefficients.length;
      const halfSize = Math.floor(filterSize / 2);
      
      // Apply filter (per channel)
      for (let channel = 0; channel < channels; channel++) {
        for (let i = 0; i < inputLength; i++) {
          let sum = 0;
          
          for (let j = 0; j < filterSize; j++) {
            const sampleIndex = i + j - halfSize;
            
            // Handle boundaries with zero-padding
            if (sampleIndex >= 0 && sampleIndex < inputLength) {
              sum += buffer[sampleIndex * channels + channel] * coefficients[j];
            }
          }
          
          outputBuffer[i * channels + channel] = sum;
        }
      }
      break;
    }
    
    case 'mix': {
      // Mix with another buffer
      const mixBuffer = parameters.buffer;
      const mixGain = parameters.gain || 0.5;
      
      if (!mixBuffer || mixBuffer.length !== buffer.length) {
        throw new Error('Invalid mix buffer');
      }
      
      for (let i = 0; i < buffer.length; i++) {
        outputBuffer[i] = buffer[i] * (1 - mixGain) + mixBuffer[i] * mixGain;
      }
      break;
    }
    
    default:
      // Return original buffer if unknown process type
      buffer.forEach((sample, i) => {
        outputBuffer[i] = sample;
      });
  }
  
  return outputBuffer;
}

// Message handler
self.onmessage = function(e) {
  const { type, data, id } = e.data;
  
  switch (type) {
    case 'init':
      initialize(data);
      break;
      
    case 'process':
      if (!initialized) {
        self.postMessage({
          id,
          error: 'Worker not initialized'
        });
        return;
      }
      processAudioData({ ...data, id });
      break;
      
    case 'terminate':
      self.close();
      break;
      
    default:
      self.postMessage({
        id,
        error: `Unknown message type: ${type}`
      });
  }
};

// Send ready message
self.postMessage({
  type: 'ready'
}); 