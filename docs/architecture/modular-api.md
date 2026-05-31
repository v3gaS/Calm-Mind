# CalmMind Technical Documentation

## Architecture Overview

### Core Systems

#### 1. Audio System
The audio system is built on the Web Audio API and follows a modular design pattern.

```javascript
// Example usage of AudioContextManager
import { audioContextManager } from '../core/AudioContext.js';

// Initialize audio context
audioContextManager.initialize();

// Get audio context
const context = audioContextManager.getContext();

// Get analyzer for visualization
const analyser = audioContextManager.getAnalyser();
```

#### 2. State Management
The state management system uses a singleton pattern with event-based updates.

```javascript
// Example usage of StateManager
import { stateManager } from '../core/StateManager.js';

// Subscribe to state changes
const unsubscribe = stateManager.subscribe(state => {
    console.log('State updated:', state);
});

// Update state
stateManager.setState({
    audio: {
        isPlaying: true,
        volume: 0.8
    }
});

// Cleanup
unsubscribe();
```

#### 3. Event System
The event system provides a pub/sub mechanism for application-wide communication.

```javascript
// Example usage of EventBus
import { eventBus, EventTypes } from '../core/EventBus.js';

// Subscribe to events
eventBus.on(EventTypes.AUDIO.PLAY, data => {
    console.log('Audio started:', data);
});

// Emit events
eventBus.emit(EventTypes.AUDIO.PLAY, {
    trackId: '123',
    duration: 300
});
```

### Sound Generators

#### Base Sound Generator
All sound generators extend the BaseSoundGenerator class.

```javascript
class CustomSoundGenerator extends BaseSoundGenerator {
    constructor() {
        super();
        // Initialize custom properties
    }
    
    initialize() {
        if (!super.initialize()) return false;
        // Custom initialization
        return true;
    }
    
    start(duration) {
        super.start(duration);
        // Custom start logic
    }
    
    stop() {
        // Custom stop logic
        super.stop();
    }
}
```

#### Binaural Beats Generator
The BinauralBeats generator creates stereo beats for relaxation.

```javascript
const binauralBeats = new BinauralBeats();
binauralBeats.start(300, 5); // 5 minutes, stress level 5
```

### Audio Effects System

#### Audio Effects Manager
The AudioEffects class manages a chain of audio effects.

```javascript
// Example usage of AudioEffects
import { audioEffects } from '../audio/effects/AudioEffects.js';

// Initialize effects
audioEffects.initialize();

// Create a new effect
audioEffects.createEffect('reverb', {
    decay: 2,
    wet: 0.5
});

// Update effect parameters
audioEffects.updateEffect('reverb', {
    wet: 0.7
});
```

#### Buffer Pool
The BufferPool class manages audio buffer resources efficiently.

```javascript
// Example usage of BufferPool
import { bufferPool } from '../audio/core/BufferPool.js';

// Initialize buffer pool
bufferPool.initialize();

// Acquire a buffer
const buffer = bufferPool.acquire();

// Use buffer
// ...

// Release buffer back to pool
bufferPool.release(buffer);
```

### Visualization System

#### Visualizer Manager
The VisualizerManager handles different visualization types.

```javascript
const visualizerManager = new VisualizerManager();
visualizerManager.initialize(canvas);
visualizerManager.setVisualizerType('particles');
visualizerManager.start();
```

#### Custom Visualizer
To create a custom visualizer, extend the Visualizer class.

```javascript
class CustomVisualizer extends Visualizer {
    constructor(context) {
        super(context);
        // Initialize custom properties
    }
    
    initialize() {
        super.initialize();
        // Custom initialization
    }
    
    update() {
        // Custom update logic
    }
    
    resize(width, height) {
        // Custom resize logic
    }
}
```

## API Reference

### AudioContextManager

#### Methods
- `initialize(): boolean`
- `getContext(): AudioContext`
- `getMasterGain(): GainNode`
- `getAnalyser(): AnalyserNode`
- `cleanup(): void`

### StateManager

#### Methods
- `subscribe(listener: Function): Function`
- `setState(newState: Object): void`
- `getState(): Object`
- `resetState(): void`

### EventBus

#### Methods
- `on(event: string, callback: Function): Function`
- `off(event: string, callback: Function): void`
- `emit(event: string, data: any): void`
- `clear(): void`

### BaseSoundGenerator

#### Methods
- `initialize(): boolean`
- `start(duration: number): void`
- `stop(): void`
- `pause(): void`
- `resume(): void`
- `setVolume(volume: number): void`
- `cleanup(): void`

### AudioEffects

#### Methods
- `initialize(): boolean`
- `createEffect(type: string, params: Object): AudioNode`
- `connectEffects(sourceNode: AudioNode, destinationNode: AudioNode): void`
- `updateEffect(type: string, params: Object): void`
- `cleanup(): void`

### BufferPool

#### Methods
- `initialize(): boolean`
- `acquire(): AudioBuffer`
- `release(buffer: AudioBuffer): void`
- `clear(): void`
- `getAvailableCount(): number`
- `getPoolSize(): number`

### VisualizerManager

#### Methods
- `initialize(canvas: HTMLCanvasElement): boolean`
- `setVisualizerType(type: string): void`
- `start(): void`
- `stop(): void`
- `cleanup(): void`

## Performance Considerations

### Audio Processing
1. Use buffer pooling to minimize memory allocation
2. Implement proper cleanup of audio nodes
3. Handle audio context suspension/resumption
4. Monitor audio processing load
5. Use efficient effects processing chain
6. Implement proper resource management

### Visualization
1. Limit frame rate to 30 FPS
2. Implement proper WebGL context loss handling
3. Use efficient rendering techniques
4. Monitor GPU memory usage

### State Management
1. Implement proper cleanup of subscriptions
2. Use immutable state updates
3. Batch state updates when possible
4. Monitor memory usage

## Error Handling

### Audio Errors
```javascript
try {
    // Audio operations
} catch (error) {
    console.error('Audio error:', error);
    eventBus.emit(EventTypes.SYSTEM.ERROR, {
        type: 'audio',
        error: error
    });
}
```

### Visualization Errors
```javascript
try {
    // Visualization operations
} catch (error) {
    console.error('Visualization error:', error);
    eventBus.emit(EventTypes.SYSTEM.ERROR, {
        type: 'visualization',
        error: error
    });
}
```

## Testing

### Unit Tests
```javascript
describe('AudioContextManager', () => {
    test('should initialize audio context', () => {
        const manager = new AudioContextManager();
        expect(manager.initialize()).toBe(true);
    });
});
```

### Integration Tests
```javascript
describe('Audio-Visualization Integration', () => {
    test('should sync audio and visualization', () => {
        // Test implementation
    });
});
```

## Browser Compatibility

### Feature Detection
```javascript
const hasWebAudio = !!(window.AudioContext || window.webkitAudioContext);
const hasWebGL = !!(canvas.getContext('webgl') || canvas.getContext('webgl2'));
```

### Polyfills
- Web Audio API polyfill for older browsers
- WebGL polyfill for fallback rendering

## Security Considerations

1. Validate all user input
2. Sanitize audio data
3. Implement proper CORS headers
4. Use secure WebSocket connections
5. Implement rate limiting

## Accessibility

1. ARIA labels for controls
2. Keyboard navigation support
3. Screen reader compatibility
4. High contrast mode support
5. Reduced motion support 