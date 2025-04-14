# CalmMind - Advanced Binaural Beat Generator

**CalmMind** is a web application designed to help users achieve their ideal mood and improve their state of mind through personalized binaural beats and ambient sound patterns. It features a modern, sleek interface inspired by contemporary mobile app designs.

## Features

*   **Personalized Track Generation**: Users can generate audio tracks based on:
    *   Current stress level (1-10)
    *   Desired duration (minutes)
    *   Choice of ambient background sounds (e.g., rain, forest, ocean)
    *   Specific sound types for brain function (e.g., Binaural Beats for relaxation, focus, sleep).
*   **Audio Player**: Integrated player with controls for Play/Pause, Stop, Skip (generate next track), and Loop.
*   **Volume Control**: Adjustable volume slider.
*   **Multiple Visualizers**: 
    *   **Particle System**: Real-time particle-based visualization of audio frequencies.
    *   **3D Mesh Wave**: Smooth, flowing 3D wave visualization that reacts to audio.
*   **Spatial Audio Cue**: Subtle visual indicator suggesting spatial audio playback (when enabled).
*   **Modern UI/UX**: Dark-themed interface with vibrant gradients, card-based layout, and smooth transitions.
*   **Accessibility**: Option to disable animations.

## Design

The application features a modern, mobile-first design aesthetic:

*   **Theme**: Dark background (`#14172B`) with contrasting card backgrounds (`#1E213A`).
*   **Color Palette**: Vibrant gradients (Purple `#8A2BE2` to `#4A00E0`, Coral `#FF6B6B` to `#EEA8A8`) and accent colors (Violet `#7F00FF`, Cyan `#00EFFF`).
*   **Typography**: Uses the 'Poppins' sans-serif font family for clean readability.
*   **Layout**: Sections are organized into rounded cards (`.glass-section`) within a centered, max-width container (`#app`) simulating a mobile view.
*   **Logo**: Features the official CalmMind logo in the header.
*   **Controls**: Styled buttons, sliders, and dropdowns matching the overall theme.
*   **Visualizers**: Multiple visualization options to enhance the audio experience.

## Technologies Used

*   HTML5
*   CSS3 (with CSS Variables for theming)
*   JavaScript (ES6+)
*   Web Audio API (for audio generation and manipulation)
*   Three.js (for 3D visualizations)
*   Canvas API (for 2D visualization)

## Project Structure

```
/
├── index.html         # Main application page structure
├── styles.css         # CSS rules for styling and layout
├── app.js             # Main application logic, UI interactions, event listeners
├── audio.js           # Web Audio API implementation for sound generation
├── visualizer.js      # Three.js implementation for audio visualization
├── Logo.png           # Application logo file
└── README.md          # This file
```

## Setup and Running

1.  Clone the repository (or ensure all files are in the same directory).
2.  Serve the `index.html` file using a local web server. A simple way is using Python's built-in server:
    ```bash
    python -m http.server
    ```
    Or using PHP:
    ```bash
    php -S localhost:8000
    ```
3.  Open your web browser and navigate to the server address (e.g., `http://localhost:8000`).

## Development Notes

*   The audio generation logic uses Web Audio API to create various types of binaural beats, isochronic tones, and ambient sounds.
*   The visualizer uses Three.js to create both particle-based and mesh-based visualizations that react to audio frequencies.
*   Error handling and browser compatibility (especially for Web Audio API) has been implemented to ensure stability.
*   The application is designed to be responsive and work well on mobile devices.

## Recent Updates

*   Added support for multiple visualization types, including a 3D mesh wave that reacts to audio frequencies.
*   Enhanced sound generation with new beat types for different use cases: relaxation, focus, and sleep.
*   Improved UI with better contrast, responsive design, and accessibility options.
*   Added app logo and refined overall design for a more polished look.

## Luxury Apple-Inspired Redesign (2023 Update)

CalmMind has undergone a significant redesign to align with a luxury Apple market aesthetic, focusing on a minimalistic, premium interface with intuitive interactions. Below is the progress and roadmap for this transformation:

### Phase 1: Visual Foundation (Completed)
- **Adaptive Themes**: Introduced multiple themes inspired by Apple hardware finishes (Dark, Light, Space Gray, Silver, Gold, Midnight Green) with dynamic switching based on user preference or system settings.
- **Neumorphic Controls**: Updated buttons and sliders with soft shadows for a tactile, premium feel.
- **UI Enhancements**: Added a theme selector in the Settings section and enhanced visualizer styling with glow effects.

### Phase 2: Interactive Enhancements (Completed)
- **Gesture-Based Interactions**: Implemented swipe gestures for volume control on the player section, with visual feedback mimicking Apple's haptic design language.
- **Event Listeners**: Added JavaScript logic to handle theme selection and gesture interactions seamlessly.

### Phase 3: Advanced Visualizations (Completed)
- **3D Visualizer Enhancements**: Upgraded the audio visualizer to feature fluid, wave-like 3D animations using Three.js, reactive to audio frequencies.
- **Theme-Based Colors**: Adapted visualizer particle colors to match the selected UI theme for a cohesive luxury experience.

### Phase 4: Personalization and Immersive Features (In Progress)
- **Accessibility Options**: Plan to add a toggle to disable animations for performance or accessibility needs.
- **Spatial Audio Cues**: Introduce visual indicators in the player section to suggest spatial audio effects.

### Phase 5: Documentation and Polish (Planned)
- **Final Documentation**: Update all project files with detailed comments and finalize this README with usage instructions for new features.
- **Design Review**: Conduct a final pass to refine UI/UX elements for consistency and polish.

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