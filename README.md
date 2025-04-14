# CalmMind - Advanced Audio for Mental Wellbeing

CalmMind is a sophisticated web application for generating personalized audio experiences to promote relaxation, focus, and mental wellbeing. The application uses advanced audio technologies including binaural beats, isochronic tones, nature sounds, and other psychoacoustic techniques.

## Features

- **Multiple Sound Types**: Offers various sound types including binaural beats, pink noise, isochronic tones, nature sounds, solfeggio frequencies, monaural beats, gamma wave entrainment, HRV coherence, sound bath, and psychoacoustic harmony.
- **Personalization**: Tailors sound based on stress level and duration preferences.
- **Ambient Sounds**: Option to blend with rain, ocean waves, or forest sounds.
- **Interactive Visualizer**: Real-time Three.js-based audio visualization that adapts to the sound type.
- **Responsive Design**: Works across different devices with a modern interface.

## Technical Architecture

The application is built with vanilla JavaScript and uses the Web Audio API for sound generation. Key components include:

### Core Files

- **index.html**: Main HTML structure with form elements for user input
- **styles.css**: Styling with glass-morphism design elements
- **app.js**: Main application controller, handles UI interactions
- **audio.js**: Manages audio generation using Web Audio API
- **visualizer.js**: Three.js-based audio visualization

### Audio System

The audio system uses the Web Audio API to generate different types of sounds:

- Oscillators for tones and beats
- Gain nodes for volume control
- StereoPanner nodes for spatial audio
- Buffer-based generation for complex sounds like pink noise
- Custom envelopes for natural sound fading

### Visualization System

The visualizer uses Three.js to create different particle-based visualizations that respond to audio frequency data:

- Each sound type has a custom visualization pattern
- Particles react to audio amplitude and frequency
- Various positioning patterns (spiral, circular, grid, bowl, harmonic)
- Custom color schemes matched to each sound type
- Frame rate limiting for performance

## Recent Updates

- Fixed issues with neuroacoustic visualization
- Added missing visualizerState object
- Fixed data handling in audio visualization
- Improved Three.js dependency loading
- Enhanced error handling for better resilience

## Browser Compatibility

CalmMind works best in modern browsers that support the Web Audio API and WebGL:
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Performance Considerations

- Frame rate limiting for visualizer (30 FPS) to reduce CPU usage
- Optimized particle count for smooth animation
- Audio node cleanup to prevent memory leaks

## Future Development

Potential areas for enhancement include:
- Adding more sound types and visualization patterns
- Implementing user profiles to save preferences
- Creating mobile apps for offline usage
- Adding spatial audio capabilities with head tracking
- Integrating with wearable devices for biofeedback

## Getting Started

### Prerequisites

- Node.js 14.0 or higher
- Modern web browser with Web Audio API support
- npm or yarn package manager
- Web browser with Web Worker support

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/enhanced-audio-system.git
cd enhanced-audio-system
```

2. Install dependencies:
```bash
npm install
```

### Usage

Basic example of using the enhanced audio system:

```javascript
import { EnhancedAudioManager } from './src/core/EnhancedAudioManager.js';

// Initialize the audio system
const audioManager = new EnhancedAudioManager({
  useWorkers: true,
  autoStartOnUserGesture: true
});

await audioManager.initialize();

// Create a therapeutic session with EMDR and HRV
const session = await audioManager.createTherapeuticSession({
  // Binaural beat for relaxation
  binaural: {
    carrierFrequency: 200,
    beatFrequency: 10,  // 10 Hz (Alpha waves)
    amplitude: 0.5,
    waveform: 'sine'
  },
  
  // EMDR for bilateral stimulation
  emdr: {
    frequency: 1.2,  // 1.2 Hz panning rate
    amplitude: 0.6,
    panRange: 0.8
  },
  
  // HRV synchronization for breathing
  hrv: {
    breathsPerMinute: 6,  // 6 breaths per minute (0.1 Hz)
    amplitude: 0.4
  },
  
  // Add audio effects
  effects: {
    // 3D spatial positioning
    spatial: {
      x: 0,
      y: 0,
      z: -1  // Sound positioned in front
    },
    
    // Filter effect
    filter: {
      type: 'lowpass',
      frequency: 2000,  // 2 kHz cutoff
      Q: 1
    },
    
    // Reverb effect
    reverb: {
      decayTime: 1.5,
      wetDry: 0.3
    }
  }
});

// Start the session
await session.start();

// Get audio analysis data for visualization
const cancelAnalysis = session.onAudioData((data) => {
  // Use data for visualization
  updateVisualization(data);
  
  // Log audio features
  console.log('Dominant frequency:', data.dominantFrequency);
  console.log('Spectral centroid:', data.spectralCentroid);
  console.log('RMS level:', data.rms);
});

// Later: stop and clean up
await session.stop();
cancelAnalysis();
session.dispose();
```

## Project Structure

```
src/
├── core/
│   ├── AudioCore.js                # Basic audio context management
│   ├── EnhancedAudioCore.js        # Advanced audio core with optimizations
│   ├── AudioManager.js             # Basic audio manager 
│   └── EnhancedAudioManager.js     # Advanced manager with all features
├── generators/
│   ├── BaseGenerator.js            # Base class for generators
│   ├── BinauralGenerator.js        # Binaural beat generator
│   ├── SolfeggioGenerator.js       # Solfeggio frequency generator
│   ├── MonauralGenerator.js        # Monaural beat generator
│   ├── IsochronicGenerator.js      # Isochronic tone generator
│   ├── EMDRGenerator.js            # EMDR therapy generator
│   ├── HRVGenerator.js             # HRV synchronization generator
│   └── AmbientGenerator.js         # Ambient sound generator
├── effects/
│   ├── AudioEffect.js              # Base effect class
│   ├── SpatialAudioEffect.js       # 3D audio positioning
│   ├── FilterEffect.js             # Audio filtering
│   └── ReverbEffect.js             # Reverberation effect
├── utils/
│   ├── AudioUtils.js               # Audio utility functions
│   ├── AudioAnalyzer.js            # Audio analysis tools
│   ├── MemoryManager.js            # Buffer pooling and worker management
│   └── ErrorHandler.js             # Error handling system
├── workers/
│   └── AudioProcessingWorker.js    # Web Worker for audio processing
├── visualization/
│   ├── AudioVisualizer.js          # Basic audio visualization
│   └── ThreeDVisualizer.js         # 3D particle visualization
└── example.js                      # Example implementation
```

## Documentation

- [API Documentation](docs/api.md)
- [User Guide](docs/user_guide.md)
- [Developer Guide](docs/developer_guide.md)
- [Therapy Guide](docs/therapy_guide.md)
- [Visualization Guide](docs/visualization_guide.md)
- [Enhanced Audio System](docs/audio-system.md)
- [Development Guidelines](docs/development_guidelines.md)
- [Project Roadmap](docs/project_roadmap.md)
- [Project Progress](docs/project_progress.md)

## Performance Optimization

The Enhanced Audio System includes several optimizations for performance:

1. **Buffer Pooling**: Audio buffers are reused to reduce garbage collection
2. **Web Worker Offloading**: CPU-intensive tasks are moved to separate threads
3. **Efficient Node Management**: Audio nodes are created, connected, and disposed efficiently
4. **Memory Usage Tracking**: System monitors memory usage and takes corrective actions
5. **Selective Processing**: Only necessary audio processing is performed
6. **Optimized Visualization**: Visualization renders efficiently based on device capabilities

## Error Handling

The system includes comprehensive error handling:

1. **Custom Error Types**: Specific error types for different components
2. **Centralized Handling**: All errors go through a central handler
3. **Automatic Recovery**: System attempts to recover from certain errors
4. **Context Reset**: Audio context can be reset in case of severe issues
5. **Detailed Logging**: Errors are logged with context information
6. **User Feedback**: Appropriate error messages can be displayed to users

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Testing

Run the test suite:
```bash
npm test
```

Run linting:
```bash
npm run lint
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all contributors who have helped shape this project
- Special thanks to the open-source community for inspiration and tools
- Research references for therapeutic sound techniques
- Web Audio API specification and community 