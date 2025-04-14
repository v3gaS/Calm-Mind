# Visualization Guide

This guide provides detailed information about the 3D visualization capabilities of the audio system, including setup, configuration, and best practices.

## Overview

The 3D visualization system uses Three.js to create immersive, responsive visual representations of audio data. The system features particle-based visualization that responds to audio input in real-time, creating an engaging and therapeutic visual experience.

## Setup

### Basic Setup

```javascript
import { ThreeDVisualizer } from '../src/visualization/ThreeDVisualizer.js';

// Create canvas element
const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);

// Initialize visualizer
const visualizer = new ThreeDVisualizer(canvas, {
    particleCount: 1000,
    particleSize: 2,
    backgroundColor: 0x000000
});
```

### Configuration Options

```javascript
const options = {
    // Particle system configuration
    particleCount: 1000,      // Number of particles
    particleSize: 2,          // Size of each particle
    backgroundColor: 0x000000, // Background color (hex)
    
    // Animation configuration
    rotationSpeed: 0.2,       // Base rotation speed
    amplitudeScale: 2,        // Scale factor for audio response
    colorIntensity: 0.5,      // Base color intensity
    
    // Performance options
    useInstancing: true,      // Use instanced rendering
    maxParticles: 10000,      // Maximum particles
    enablePostProcessing: false // Enable post-processing effects
};
```

## Audio Integration

### Connecting to Audio Data

```javascript
// In your audio session
session.onAudioData((data) => {
    visualizer.updateAudioData(data);
});
```

### Audio Data Processing

The visualizer processes audio data in the following ways:
- Frequency analysis for particle movement
- Amplitude mapping to particle size
- Spectral data for color modulation
- Phase information for particle distribution

## Visualization Features

### 1. Particle System

The core visualization uses a particle system that responds to audio input:

```javascript
// Custom particle behavior
visualizer.setParticleBehavior({
    movement: 'spherical',    // Movement pattern
    response: 'amplitude',    // Response type
    damping: 0.95,           // Movement damping
    turbulence: 0.1          // Random movement
});
```

### 2. Color Schemes

Customize the color response to audio:

```javascript
visualizer.setColorScheme({
    baseColor: 0x00ff00,     // Base color
    responseType: 'spectral', // Color response type
    intensity: 0.8,          // Color intensity
    transition: 0.1          // Color transition speed
});
```

### 3. Movement Patterns

Configure particle movement patterns:

```javascript
visualizer.setMovementPattern({
    type: 'spiral',          // Movement type
    speed: 0.5,              // Movement speed
    radius: 2,               // Movement radius
    complexity: 0.3          // Pattern complexity
});
```

## Performance Optimization

### 1. Rendering Optimization

```javascript
// Optimize rendering performance
visualizer.setPerformanceOptions({
    useInstancing: true,     // Use instanced rendering
    maxParticles: 10000,     // Limit particle count
    culling: true,           // Enable frustum culling
    levelOfDetail: 'adaptive' // Adaptive LOD
});
```

### 2. Memory Management

```javascript
// Manage memory usage
visualizer.setMemoryManagement({
    bufferSize: 1024,        // Audio buffer size
    cleanupInterval: 1000,   // Cleanup interval (ms)
    maxHistory: 100          // Maximum history size
});
```

## Advanced Features

### 1. Post-Processing Effects

```javascript
// Enable post-processing effects
visualizer.enablePostProcessing({
    bloom: true,             // Enable bloom effect
    bloomStrength: 0.5,      // Bloom strength
    bloomRadius: 0.4,        // Bloom radius
    bloomThreshold: 0.8      // Bloom threshold
});
```

### 2. Interactive Controls

```javascript
// Add interactive controls
visualizer.enableInteraction({
    rotation: true,          // Enable rotation
    zoom: true,              // Enable zoom
    pan: true,               // Enable panning
    sensitivity: 0.5         // Control sensitivity
});
```

## Best Practices

1. **Performance**
   - Monitor frame rate
   - Adjust particle count based on device capability
   - Use appropriate buffer sizes
   - Implement cleanup routines

2. **Visual Quality**
   - Balance particle count and size
   - Use appropriate color schemes
   - Consider lighting effects
   - Maintain smooth transitions

3. **User Experience**
   - Ensure responsive controls
   - Provide visual feedback
   - Maintain consistent performance
   - Consider accessibility

## Troubleshooting

### Common Issues

1. **Performance Problems**
   - Reduce particle count
   - Disable post-processing
   - Check buffer sizes
   - Monitor memory usage

2. **Visual Artifacts**
   - Check WebGL support
   - Verify Three.js version
   - Update graphics drivers
   - Check for conflicts

3. **Audio Sync Issues**
   - Verify audio buffer size
   - Check sample rate
   - Monitor latency
   - Adjust update frequency

## Examples

### Basic Visualization

```javascript
// Basic setup with default options
const visualizer = new ThreeDVisualizer(canvas);
session.onAudioData(visualizer.updateAudioData.bind(visualizer));
```

### Advanced Visualization

```javascript
// Advanced setup with custom options
const visualizer = new ThreeDVisualizer(canvas, {
    particleCount: 2000,
    particleSize: 3,
    backgroundColor: 0x000033,
    useInstancing: true
});

// Configure advanced features
visualizer.setParticleBehavior({
    movement: 'spiral',
    response: 'spectral',
    damping: 0.95
});

visualizer.enablePostProcessing({
    bloom: true,
    bloomStrength: 0.6
});

// Connect to audio
session.onAudioData(visualizer.updateAudioData.bind(visualizer));
```

## Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [WebGL Best Practices](https://www.khronos.org/webgl/wiki/WebGL_Best_Practices)
- [Performance Optimization](https://threejs.org/docs/#manual/en/introduction/How-to-dispose-of-objects) 