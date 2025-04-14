# Enhanced Audio System

The Enhanced Audio System is a comprehensive framework for generating, manipulating, and analyzing therapeutic sound content. It provides a robust foundation for building audio applications focused on health and wellness.

## Core Components

### EnhancedAudioCore

The `EnhancedAudioCore` class serves as the foundation of the audio system, providing efficient memory management, error handling, and audio processing capabilities. It includes:

- Advanced buffer pooling for optimized memory usage
- Comprehensive error handling and recovery
- Automatic context resumption on user interaction
- Built-in audio analysis capabilities
- Performance metrics tracking
- Automatic cleanup of resources

### EnhancedAudioManager

The `EnhancedAudioManager` class provides a high-level interface for creating and managing therapeutic audio sessions. It supports:

- Multiple generator types (binaural, solfeggio, monaural, isochronic, EMDR, HRV, ambient)
- Audio effects (spatial, filter, reverb)
- Session management for complex sound combinations
- Worker offloading for CPU-intensive tasks
- System status monitoring

## Audio Generators

The system includes several specialized audio generators:

- **BinauralGenerator**: Creates binaural beats by playing different frequencies in each ear
- **SolfeggioGenerator**: Generates Solfeggio frequencies for healing and transformation
- **MonauralGenerator**: Creates monaural beats within a single audio channel
- **IsochronicGenerator**: Generates rhythmic tones with distinct on-off patterns
- **EMDRGenerator**: Creates sounds for Eye Movement Desensitization and Reprocessing therapy
- **HRVGenerator**: Produces sounds to guide Heart Rate Variability breathing exercises
- **AmbientGenerator**: Provides natural ambient sounds for relaxation

## Audio Effects

The system supports various audio effects for enhanced therapeutic experiences:

- **SpatialAudioEffect**: Positions sounds in 3D space around the listener
- **FilterEffect**: Applies various filters (lowpass, highpass, bandpass, notch)
- **ReverbEffect**: Adds spatial and environmental characteristics to sounds

## Utility Components

Several utility classes enhance the functionality of the system:

- **AudioAnalyzer**: Provides real-time audio analysis with feature extraction
- **BufferPool**: Manages audio buffer reuse for optimized memory usage
- **WorkerPool**: Offloads CPU-intensive tasks to Web Workers
- **ErrorHandler**: Centralizes error handling with custom error types

## Using the System

### Basic Usage

```javascript
import { EnhancedAudioManager } from './core/EnhancedAudioManager.js';

// Create and initialize manager
const audioManager = new EnhancedAudioManager();
await audioManager.initialize();

// Create a simple binaural beat generator
const binaural = audioManager.createGenerator('binaural', 'my_binaural', {
  carrierFrequency: 200,  // 200 Hz carrier
  beatFrequency: 10,      // 10 Hz beat (alpha waves)
  amplitude: 0.7,         // 70% volume
  waveform: 'sine'        // Sine wave
});

// Start the generator
await binaural.start();

// Later: stop and clean up
await binaural.stop();
audioManager.removeGenerator('my_binaural');
```

### Creating Therapeutic Sessions

```javascript
// Create a therapeutic session with multiple sound elements
const session = await audioManager.createTherapeuticSession({
  // Binaural beat (alpha waves)
  binaural: {
    carrierFrequency: 200,
    beatFrequency: 10,
    amplitude: 0.5
  },
  
  // Solfeggio frequency (528 Hz - MI)
  solfeggio: {
    frequency: 528,
    amplitude: 0.3,
    harmonics: [1, 0.5, 0.25]
  },
  
  // EMDR panning effect
  emdr: {
    frequency: 1.2,  // 1.2 Hz panning rate
    amplitude: 0.6,
    panRange: 0.8
  },
  
  // Add spatial and filter effects
  effects: {
    spatial: {
      x: 0,
      y: 0,
      z: -1  // Sound positioned in front
    },
    filter: {
      type: 'lowpass',
      frequency: 2000,  // 2 kHz cutoff
      Q: 1
    }
  }
});

// Start the session
await session.start();

// Get real-time audio analysis data
const cancelAnalysis = session.onAudioData((data) => {
  console.log('Audio features:', data);
  
  // Use data for visualization, biofeedback, etc.
  updateVisualization(data);
});

// Later: stop the session and clean up
cancelAnalysis();  // Stop the analysis
await session.stop();
session.dispose();
```

### Worker Offloading

For complex processing, operations can be offloaded to Web Workers:

```javascript
const audioManager = new EnhancedAudioManager({
  useWorkers: true,
  maxWorkers: 4
});

await audioManager.initialize();

// Processing will automatically use workers when available
const session = await audioManager.createTherapeuticSession({...});
```

## Performance Considerations

- Use buffer pooling for efficient memory usage
- Limit the number of simultaneous generators for best performance
- Be mindful of CPU usage on mobile devices
- Visualizations can be CPU-intensive; consider throttling updates
- Worker offloading can significantly improve performance for complex sessions

## Error Handling

The system includes comprehensive error handling with custom error types:

```javascript
try {
  await audioManager.initialize();
} catch (error) {
  if (error instanceof AudioContextError) {
    // Handle audio context initialization errors
    showFallbackExperience();
  } else if (error instanceof GeneratorError) {
    // Handle generator-specific errors
    offerAlternativeGenerator();
  } else {
    // Handle other errors
    showGenericErrorMessage(error.message);
  }
}
```

## Accessibility Considerations

- Provide visual feedback for audio events
- Offer presets with descriptions of therapeutic effects
- Include volume controls with clear visual indicators
- Provide alternative experiences for users with hearing impairments

## Browser Compatibility

The Enhanced Audio System is designed to work in modern browsers that support:

- Web Audio API
- Web Workers
- ES6+ JavaScript features

For best compatibility, consider using a bundler like Webpack or Rollup with appropriate polyfills.