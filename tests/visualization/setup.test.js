/**
 * Tests for visualization setup module
 */
import { 
    initializeVisualizer, 
    getVisualizerConfig, 
    setVisualizerType, 
    startVisualization,
    stopVisualization,
    cleanupVisualizer,
    getSoundTypeVisualizerConfig,
    setVisualizerForSoundType
} from '../../src/visualization/setup.js';
import { VisualizerManager } from '../../src/visualization/VisualizerManager.js';
import { stateManager } from '../../src/core/StateManager.js';
import { eventBus } from '../../src/core/EventBus.js';

// Mock dependencies
jest.mock('../../src/visualization/VisualizerManager.js');
jest.mock('../../src/core/StateManager.js');
jest.mock('../../src/core/EventBus.js');

describe('Visualization Setup', () => {
    // Set up mocks
    let mockCanvas;
    let mockVisualizerManager;
    
    beforeEach(() => {
        jest.clearAllMocks();
        cleanupVisualizer();

        mockCanvas = document.createElement('canvas');
        
        // Setup VisualizerManager mock
        mockVisualizerManager = {
            initialize: jest.fn(),
            setVisualizerType: jest.fn(),
            start: jest.fn(),
            stop: jest.fn(),
            cleanup: jest.fn()
        };
        
        // Make the constructor return our mock
        VisualizerManager.mockImplementation(() => mockVisualizerManager);
        
        // Setup StateManager mock
        stateManager.set = jest.fn();
        stateManager.get = jest.fn();
        
        // Setup EventBus mock
        eventBus.emit = jest.fn();
    });
    
    describe('initializeVisualizer', () => {
        test('should initialize visualizer with canvas and options', () => {
            const options = { frameRateLimit: 60 };
            const result = initializeVisualizer(mockCanvas, options);
            
            expect(result).toBe(mockVisualizerManager);
            expect(mockVisualizerManager.initialize).toHaveBeenCalledWith(mockCanvas, options);
            expect(stateManager.set).toHaveBeenCalledWith('visualizerManager', mockVisualizerManager);
            expect(eventBus.emit).toHaveBeenCalledWith('visualizer:initialized', { success: true });
        });
        
        test('should return null if canvas is not provided', () => {
            const result = initializeVisualizer(null);
            
            expect(result).toBeNull();
            expect(mockVisualizerManager.initialize).not.toHaveBeenCalled();
            expect(stateManager.set).not.toHaveBeenCalled();
        });
        
        test('should handle initialization errors', () => {
            mockVisualizerManager.initialize.mockImplementation(() => {
                throw new Error('Initialization error');
            });
            
            const result = initializeVisualizer(mockCanvas);
            
            expect(result).toBeNull();
            expect(eventBus.emit).toHaveBeenCalledWith('visualizer:initialized', {
                success: false,
                error: expect.any(Error)
            });
        });
    });
    
    describe('getVisualizerConfig', () => {
        test('should return config for particle visualizer', () => {
            const config = getVisualizerConfig('particle');

            expect(config).toHaveProperty('particleCount');
            expect(config).toHaveProperty('speed');
            expect(config).toHaveProperty('sizeRange');
        });

        test('should return config for meshWave visualizer', () => {
            const config = getVisualizerConfig('meshWave');

            expect(config).toHaveProperty('resolution');
            expect(config).toHaveProperty('amplitude');
        });

        test('should return null for unknown visualizer type', () => {
            const config = getVisualizerConfig('unknown');
            expect(config).toBeNull();
        });
    });
    
    describe('getSoundTypeVisualizerConfig', () => {
        test('should merge base visualizer config with sound type config', () => {
            const config = getSoundTypeVisualizerConfig('particle', 'binauralBeats');
            expect(config).toHaveProperty('particleCount');
            expect(config.particleCount).toBeGreaterThanOrEqual(100);
        });

        test('should use base config if sound type is not recognized', () => {
            const config = getSoundTypeVisualizerConfig('particle', 'unknownSoundType');
            expect(config).toHaveProperty('particleCount');
        });

        test('should merge meshWave with sound overrides', () => {
            const config = getSoundTypeVisualizerConfig('meshWave', 'binauralBeats');
            expect(config).toHaveProperty('resolution');
            expect(config).toHaveProperty('amplitude');
        });
    });
    
    describe('setVisualizerType', () => {
        test('should set visualizer type and update state', () => {
            // Initialize visualizer first
            initializeVisualizer(mockCanvas);
            
            const result = setVisualizerType('particle');
            
            expect(result).toBe(true);
            expect(mockVisualizerManager.setVisualizerType).toHaveBeenCalledWith(
                'particle',
                expect.any(Object)
            );
            expect(stateManager.set).toHaveBeenCalledWith('currentVisualizerType', 'particle');
            expect(eventBus.emit).toHaveBeenCalledWith('visualizer:typeChanged', {
                type: 'particle',
                config: expect.any(Object)
            });
        });
        
        test('should return false if visualizer is not initialized', () => {
            const result = setVisualizerType('particle');
            
            expect(result).toBe(false);
            expect(mockVisualizerManager.setVisualizerType).not.toHaveBeenCalled();
        });
        
        test('should handle errors when setting visualizer type', () => {
            // Initialize visualizer first
            initializeVisualizer(mockCanvas);
            
            // Make setVisualizerType throw an error
            mockVisualizerManager.setVisualizerType.mockImplementation(() => {
                throw new Error('Error setting visualizer type');
            });
            
            const result = setVisualizerType('particle');
            
            expect(result).toBe(false);
        });
    });
    
    describe('setVisualizerForSoundType', () => {
        test('should set visualizer configuration based on sound type', () => {
            // Initialize visualizer first
            initializeVisualizer(mockCanvas);
            
            const result = setVisualizerForSoundType('binauralRelax');
            
            expect(result).toBe(true);
            expect(mockVisualizerManager.setVisualizerType).toHaveBeenCalled();
            expect(stateManager.set).toHaveBeenCalledWith('currentVisualizerType', expect.any(String));
            expect(stateManager.set).toHaveBeenCalledWith('currentSoundType', 'binauralRelax');
            expect(eventBus.emit).toHaveBeenCalledWith('visualizer:soundTypeSet', {
                soundType: 'binauralRelax',
                visualizerType: expect.any(String),
                config: expect.any(Object)
            });
        });
        
        test('should use specified visualizer type if provided', () => {
            initializeVisualizer(mockCanvas);
            
            setVisualizerForSoundType('binauralRelax', 'meshWave');
            
            expect(mockVisualizerManager.setVisualizerType).toHaveBeenCalledWith(
                'meshWave',
                expect.any(Object)
            );
        });
        
        test('should use current visualizer type from state if not specified', () => {
            initializeVisualizer(mockCanvas);
            stateManager.get.mockImplementation(key => {
                if (key === 'currentVisualizerType') return 'meshWave';
                return null;
            });
            
            setVisualizerForSoundType('binauralRelax');
            
            expect(mockVisualizerManager.setVisualizerType).toHaveBeenCalledWith(
                'meshWave',
                expect.any(Object)
            );
        });
        
        test('should return false if visualizer is not initialized', () => {
            const result = setVisualizerForSoundType('binauralRelax');
            
            expect(result).toBe(false);
            expect(mockVisualizerManager.setVisualizerType).not.toHaveBeenCalled();
        });
        
        test('should handle errors when setting visualizer for sound type', () => {
            initializeVisualizer(mockCanvas);
            
            mockVisualizerManager.setVisualizerType.mockImplementation(() => {
                throw new Error('Error setting visualizer type');
            });
            
            const result = setVisualizerForSoundType('binauralRelax');
            
            expect(result).toBe(false);
        });
    });
    
    describe('control functions', () => {
        test('startVisualization should start the visualizer', () => {
            initializeVisualizer(mockCanvas);
            
            const result = startVisualization();
            
            expect(result).toBe(true);
            expect(mockVisualizerManager.start).toHaveBeenCalled();
            expect(stateManager.set).toHaveBeenCalledWith('visualizationActive', true);
            expect(eventBus.emit).toHaveBeenCalledWith('visualizer:started');
        });
        
        test('stopVisualization should stop the visualizer', () => {
            initializeVisualizer(mockCanvas);
            
            const result = stopVisualization();
            
            expect(result).toBe(true);
            expect(mockVisualizerManager.stop).toHaveBeenCalled();
            expect(stateManager.set).toHaveBeenCalledWith('visualizationActive', false);
            expect(eventBus.emit).toHaveBeenCalledWith('visualizer:stopped');
        });
        
        test('cleanupVisualizer should clean up resources', () => {
            initializeVisualizer(mockCanvas);
            
            const result = cleanupVisualizer();
            
            expect(result).toBe(true);
            expect(mockVisualizerManager.cleanup).toHaveBeenCalled();
            expect(stateManager.set).toHaveBeenCalledWith('visualizerManager', null);
            expect(stateManager.set).toHaveBeenCalledWith('visualizationActive', false);
            expect(eventBus.emit).toHaveBeenCalledWith('visualizer:cleaned');
        });
        
        test('control functions should return false if visualizer is not initialized', () => {
            expect(startVisualization()).toBe(false);
            expect(stopVisualization()).toBe(false);
            expect(cleanupVisualizer()).toBe(true); // Cleanup returns true if nothing to clean
        });
    });
}); 