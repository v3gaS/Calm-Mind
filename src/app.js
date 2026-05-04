/**
 * Showcase different sound types with their matching visualizations
 * Cycles through available sound types at a specified interval
 * @param {HTMLElement} container - The container for the visualization
 * @param {HTMLCanvasElement} canvas - The canvas for visualization
 * @param {number} [interval=10000] - Interval in ms to switch between types
 * @returns {Object} Controller with start and stop methods
 */
export function showcaseSoundVisualizers(container, canvas, interval = 10000) {
    // Sound types we have implemented so far
    const soundTypes = [
        'binauralFocus',
        'binauralRelax',
        'pinkNoise'
    ];
    
    // Default visualizer types for each sound
    const defaultVisualizers = {
        'binauralFocus': 'particle',
        'binauralRelax': 'particle',
        'pinkNoise': 'meshWave'
    };
    
    let currentIndex = 0;
    let timerId = null;
    let isRunning = false;
    let generators = {};
    
    // Initialize the audio and visualization systems if not already done
    function ensureInitialized() {
        if (!stateManager.get('audioInitialized')) {
            initializeAudio();
        }
        
        if (!stateManager.get('visualizerInitialized')) {
            initializeVisualizer(canvas);
        }
    }
    
    // Create and initialize all sound generators
    function initializeGenerators() {
        const audioContext = stateManager.get('audioContext');
        if (!audioContext) {
            throw new Error('AudioContext not available');
        }
        
        // Initialize binaural beats generators
        generators.binauralFocus = new BinauralBeats(audioContext, stateManager, eventBus);
        generators.binauralFocus.initialize({ baseFrequency: 220, beatFrequency: 10 });
        
        generators.binauralRelax = new BinauralBeats(audioContext, stateManager, eventBus);
        generators.binauralRelax.initialize({ baseFrequency: 180, beatFrequency: 4 });
        
        // Initialize pink noise generator
        generators.pinkNoise = new PinkNoiseGenerator(audioContext, stateManager, eventBus);
        generators.pinkNoise.initialize({ stressLevel: 5 });
        
        console.log('All sound generators initialized');
    }
    
    // Switch to the next sound type
    function switchToNextType() {
        // Stop the current generator if any
        const currentType = soundTypes[currentIndex];
        if (generators[currentType]) {
            generators[currentType].stop();
        }
        
        // Move to the next sound type
        currentIndex = (currentIndex + 1) % soundTypes.length;
        const nextType = soundTypes[currentIndex];
        
        // Set the visualizer for this sound type
        setVisualizerForSoundType(nextType, defaultVisualizers[nextType]);
        
        // Update the UI if we have controls
        const soundTypeSelector = document.getElementById('soundType');
        if (soundTypeSelector) {
            soundTypeSelector.value = nextType;
        }
        
        // Start the appropriate generator
        if (generators[nextType]) {
            generators[nextType].start({ duration: interval / 1000 });
            console.log(`Switched to ${nextType} with ${defaultVisualizers[nextType]} visualization`);
        }
        
        // Emit an event
        eventBus.emit('showcase:typeChanged', { 
            soundType: nextType, 
            visualizerType: defaultVisualizers[nextType]
        });
    }
    
    return {
        // Start the showcase
        start() {
            if (isRunning) return;
            
            try {
                ensureInitialized();
                initializeGenerators();
                
                // Start with the first type
                switchToNextType();
                
                // Set up interval to switch between types
                timerId = setInterval(switchToNextType, interval);
                isRunning = true;
                
                console.log('Sound visualization showcase started');
                eventBus.emit('showcase:started');
                
                return true;
            } catch (error) {
                console.error('Failed to start showcase:', error);
                return false;
            }
        },
        
        // Stop the showcase
        stop() {
            if (!isRunning) return;
            
            // Clear the timer
            if (timerId) {
                clearInterval(timerId);
                timerId = null;
            }
            
            // Stop all generators
            Object.values(generators).forEach(generator => {
                if (generator && typeof generator.stop === 'function') {
                    generator.stop();
                }
            });
            
            isRunning = false;
            console.log('Sound visualization showcase stopped');
            eventBus.emit('showcase:stopped');
        }
    };
} 