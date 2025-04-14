# Advanced Audio Analysis Guide

## Overview

The audio system now includes advanced audio analysis capabilities through the `AudioAnalyzer` class. This guide covers the implementation and usage of FFT (Fast Fourier Transform) and wavelet transform analysis, along with various audio feature extraction methods.

## Features

### 1. Frequency Domain Analysis
- FFT-based spectral analysis
- Frequency centroid calculation
- Spectral spread measurement
- Spectral flux tracking
- Spectral rolloff detection

### 2. Time Domain Analysis
- RMS (Root Mean Square) energy
- Zero crossing rate
- Crest factor calculation
- Time-domain waveform analysis

### 3. Wavelet Transform Analysis
- Haar wavelet transform implementation
- Wavelet energy calculation
- Wavelet entropy measurement
- Multi-resolution analysis

### 4. Memory Optimization
- Buffer pooling system
- Efficient memory management
- Reduced garbage collection

## Usage

### Basic Setup

```javascript
import { AudioAnalyzer } from '../src/audio/AudioAnalyzer';

// Create audio context
const audioContext = new AudioContext();

// Create analyzer with custom options
const analyzer = new AudioAnalyzer(audioContext, {
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    minDecibels: -100,
    maxDecibels: -30
});

// Connect to audio source
const source = audioContext.createOscillator();
analyzer.connect(source);
```

### Getting Audio Features

```javascript
// Get comprehensive audio features
const features = analyzer.getAudioFeatures();

// Access individual features
const {
    frequencyCentroid,  // Center of mass of the spectrum
    frequencySpread,    // Spread of the spectrum
    spectralFlux,      // Rate of change of the spectrum
    spectralRolloff,   // Frequency below which 85% of energy is contained
    rms,               // Root mean square energy
    zeroCrossings,     // Number of zero crossings
    crestFactor,       // Peak to RMS ratio
    waveletEnergy,     // Energy in wavelet domain
    waveletEntropy     // Entropy in wavelet domain
} = features;
```

### Individual Analysis Methods

```javascript
// Get frequency data
const frequencyData = analyzer.getFrequencyData();

// Get time domain data
const timeData = analyzer.getTimeData();

// Get wavelet transform data
const waveletData = analyzer.getWaveletData();
```

## Performance Considerations

### Buffer Pooling
The analyzer implements a buffer pooling system to minimize memory allocation and garbage collection:

```javascript
// Get a buffer from the pool
const buffer = analyzer.getBuffer();

// Use the buffer
// ...

// Release the buffer back to the pool
analyzer.releaseBuffer(buffer);
```

### FFT Size Selection
Choose appropriate FFT size based on your needs:
- Smaller sizes (256-1024): Lower latency, less frequency resolution
- Larger sizes (2048-4096): Better frequency resolution, higher latency

### Memory Management
Always dispose of the analyzer when done:

```javascript
// Clean up resources
analyzer.dispose();
```

## Advanced Usage

### Custom Feature Extraction
You can extend the analyzer with custom feature extraction:

```javascript
class CustomAnalyzer extends AudioAnalyzer {
    calculateCustomFeature(data) {
        // Implement custom feature calculation
        return result;
    }
}
```

### Real-time Analysis
For real-time analysis, consider using a Web Worker:

```javascript
// Create analyzer in main thread
const analyzer = new AudioAnalyzer(audioContext);

// Send analysis results to worker
setInterval(() => {
    const features = analyzer.getAudioFeatures();
    worker.postMessage(features);
}, 100);
```

## Best Practices

1. **Resource Management**
   - Always dispose of analyzers when no longer needed
   - Use buffer pooling for frequent operations
   - Monitor memory usage with large FFT sizes

2. **Performance Optimization**
   - Choose appropriate FFT size for your use case
   - Use Web Workers for heavy computations
   - Implement throttling for real-time analysis

3. **Feature Selection**
   - Use frequency features for spectral analysis
   - Use time features for temporal analysis
   - Use wavelet features for multi-resolution analysis

4. **Error Handling**
   - Check for valid audio context
   - Handle buffer allocation failures
   - Validate input data

## Troubleshooting

### Common Issues

1. **High CPU Usage**
   - Reduce FFT size
   - Implement analysis throttling
   - Use Web Workers for heavy computations

2. **Memory Leaks**
   - Ensure proper disposal of analyzers
   - Monitor buffer pool usage
   - Check for unreleased buffers

3. **Analysis Accuracy**
   - Verify audio context sample rate
   - Check FFT size appropriateness
   - Validate input signal levels

## Resources

- [Web Audio API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [FFT Fundamentals](https://en.wikipedia.org/wiki/Fast_Fourier_transform)
- [Wavelet Transform Guide](https://en.wikipedia.org/wiki/Wavelet_transform)
- [Audio Feature Extraction](https://en.wikipedia.org/wiki/Audio_feature_extraction) 