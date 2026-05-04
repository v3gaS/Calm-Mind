/**
 * @file configManager.test.js
 * @description Tests for the visualization configuration manager
 */

import { 
    getVisualizerConfig, 
    getSoundTypeVisualizerConfig, 
    validateVisualizerConfig,
    getAvailableVisualizerTypes,
    getAvailableSoundTypes,
    getAvailableStressLevels,
    initConfigManager
} from '../../../src/visualization/configs/configManager.js';

// Mock dependencies
jest.mock('../../../src/visualization/configs/visualizerConfigs.js', () => {
    return {
        VISUALIZER_CONFIGS: {
            'particle': {
                particleCount: 100,
                colorPalette: ['#FFFFFF', '#0000FF'],
                fadeRate: 0.05,
                speed: 2
            },
            'meshWave': {
                resolution: 32,
                amplitude: 10,
                colorPalette: ['#00FF00', '#0000FF']
            }
        },
        SOUND_TYPE_CONFIGS: {
            'binauralBeats': {
                'particle': {
                    particleCount: 150,
                    fadeRate: 0.02
                }
            },
            'whiteNoise': {
                'particle': {
                    colorPalette: ['#EEEEEE', '#CCCCCC']
                }
            }
        },
        STRESS_LEVEL_CONFIGS: {
            'low': {
                'particle': {
                    speed: 1
                }
            },
            'medium': {
                'particle': {
                    speed: 2
                }
            },
            'high': {
                'particle': {
                    speed: 3
                }
            }
        },
        CONFIG_VALIDATION_RULES: {
            'particle': {
                particleCount: { type: 'number', min: 10, max: 500 },
                colorPalette: { type: 'array' },
                fadeRate: { type: 'number', min: 0.01, max: 0.1 },
                speed: { type: 'number', min: 0.5, max: 5 }
            },
            'meshWave': {
                resolution: { type: 'number', min: 8, max: 64 },
                amplitude: { type: 'number', min: 1, max: 20 },
                colorPalette: { type: 'array' }
            }
        }
    };
});

jest.mock('../../../src/core/EventBus.js', () => {
    const listeners = {};
    return {
        eventBus: {
            on: jest.fn((event, callback) => {
                if (!listeners[event]) {
                    listeners[event] = [];
                }
                listeners[event].push(callback);
            }),
            emit: jest.fn((event, data) => {
                if (listeners[event]) {
                    listeners[event].forEach(callback => callback(data));
                }
            }),
            // Helper for tests to get listeners
            __getListeners: () => listeners
        }
    };
});

jest.mock('../../../src/utils/logger.js', () => {
    return {
        logger: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn()
        }
    };
});

// Import mocks after they're defined
import { eventBus } from '../../../src/core/EventBus.js';
import { logger } from '../../../src/utils/logger.js';

describe('Configuration Manager', () => {
    
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });
    
    describe('getVisualizerConfig', () => {
        it('should return the correct configuration for a valid visualizer type', () => {
            const config = getVisualizerConfig('particle');
            expect(config).toEqual({
                particleCount: 100,
                colorPalette: ['#FFFFFF', '#0000FF'],
                fadeRate: 0.05,
                speed: 2
            });
        });
        
        it('should return a deep clone of the configuration to prevent modifications', () => {
            const config1 = getVisualizerConfig('particle');
            const config2 = getVisualizerConfig('particle');
            
            // Modify the first config
            config1.particleCount = 200;
            
            // The second config should still have the original value
            expect(config2.particleCount).toBe(100);
        });
        
        it('should return null for an invalid visualizer type', () => {
            const config = getVisualizerConfig('nonexistent');
            expect(config).toBeNull();
            expect(logger.warn).toHaveBeenCalledWith('Invalid visualizer type: nonexistent');
        });
        
        it('should return null when no visualizer type is provided', () => {
            expect(getVisualizerConfig()).toBeNull();
            expect(logger.warn).toHaveBeenCalled();
        });
    });
    
    describe('getSoundTypeVisualizerConfig', () => {
        it('should merge base config with sound-type overrides', () => {
            const config = getSoundTypeVisualizerConfig('particle', 'binauralBeats');
            
            // Should have the base properties
            expect(config).toHaveProperty('colorPalette', ['#FFFFFF', '#0000FF']);
            
            // Should have the overridden properties
            expect(config).toHaveProperty('particleCount', 150);
            expect(config).toHaveProperty('fadeRate', 0.02);
        });
        
        it('should apply stress level overrides', () => {
            const config = getSoundTypeVisualizerConfig('particle', 'binauralBeats', 'high');
            
            // Should have the base properties and sound-type overrides
            expect(config).toHaveProperty('colorPalette', ['#FFFFFF', '#0000FF']);
            expect(config).toHaveProperty('particleCount', 150);
            
            // Should have the stress level override
            expect(config).toHaveProperty('speed', 3);
        });
        
        it('should emit an event when a config is created', () => {
            getSoundTypeVisualizerConfig('particle', 'binauralBeats');
            
            expect(eventBus.emit).toHaveBeenCalledWith(
                'visualizer:configCreated',
                expect.objectContaining({
                    visualizerType: 'particle',
                    soundType: 'binauralBeats'
                })
            );
        });
        
        it('should return null if the base config is not found', () => {
            const config = getSoundTypeVisualizerConfig('nonexistent', 'binauralBeats');
            expect(config).toBeNull();
        });
        
        it('should use default medium stress level if not specified', () => {
            const config = getSoundTypeVisualizerConfig('particle', 'binauralBeats');
            
            // Should have the medium stress level speed
            expect(config).toHaveProperty('speed', 2);
        });
    });
    
    describe('validateVisualizerConfig', () => {
        it('should validate numeric properties against min/max constraints', () => {
            const config = {
                particleCount: 600, // over max of 500
                fadeRate: 0.005,    // under min of 0.01
                speed: 2,           // within range
                colorPalette: ['#FF0000']
            };
            
            const validatedConfig = validateVisualizerConfig(config, 'particle');
            
            // Should adjust values to be within range
            expect(validatedConfig.particleCount).toBe(500); // Capped at max
            expect(validatedConfig.fadeRate).toBe(0.01);    // Set to min
            expect(validatedConfig.speed).toBe(2);          // Unchanged
            expect(validatedConfig.colorPalette).toEqual(['#FF0000']); // Unchanged
        });
        
        it('should validate array properties', () => {
            const config = {
                particleCount: 100,
                colorPalette: 'invalid', // Should be array
                fadeRate: 0.05
            };
            
            const validatedConfig = validateVisualizerConfig(config, 'particle');
            
            // Should not include the invalid property
            expect(validatedConfig).toHaveProperty('particleCount');
            expect(validatedConfig).toHaveProperty('fadeRate');
            expect(validatedConfig).not.toHaveProperty('colorPalette');
        });
        
        it('should return an empty object for invalid configs', () => {
            expect(validateVisualizerConfig(null, 'particle')).toEqual({});
            expect(validateVisualizerConfig('not-an-object', 'particle')).toEqual({});
            expect(logger.error).toHaveBeenCalled();
        });
        
        it('should return the original config if no validation rules exist', () => {
            const config = { custom: 'value' };
            const result = validateVisualizerConfig(config, 'nonexistent');
            expect(result).toBe(config);
            expect(logger.warn).toHaveBeenCalledWith(
                'No validation rules found for visualizer type: nonexistent'
            );
        });
    });
    
    describe('Available Types Functions', () => {
        it('should return all available visualizer types', () => {
            const types = getAvailableVisualizerTypes();
            expect(types).toEqual(['particle', 'meshWave']);
        });
        
        it('should return all available sound types', () => {
            const types = getAvailableSoundTypes();
            expect(types).toEqual(['binauralBeats', 'whiteNoise']);
        });
        
        it('should return all available stress levels', () => {
            const types = getAvailableStressLevels();
            expect(types).toEqual(['low', 'medium', 'high']);
        });
    });
    
    describe('Event Handling', () => {
        it('should set up event listeners for stress level changes', () => {
            // Get the stress level change listener
            const listeners = eventBus.__getListeners();
            const stressLevelListeners = listeners['state:stressLevelChanged'];
            
            expect(stressLevelListeners).toBeDefined();
            expect(stressLevelListeners.length).toBeGreaterThan(0);
            
            // Simulate a stress level change
            eventBus.emit('state:stressLevelChanged', { 
                level: 'high', 
                previousLevel: 'medium' 
            });
            
            // Should log the change
            expect(logger.info).toHaveBeenCalledWith('Stress level changed from medium to high');
            
            // Should emit a config update event
            expect(eventBus.emit).toHaveBeenCalledWith(
                'visualizer:configUpdate',
                expect.objectContaining({
                    stressLevel: 'high',
                    previousStressLevel: 'medium'
                })
            );
        });
        
        it('should handle visualizer config requests', () => {
            // Initialize the config manager to register the event handlers
            initConfigManager();
            
            // Simulate a config request
            eventBus.emit('visualizer:requestConfig', {
                visualizerType: 'particle',
                soundType: 'binauralBeats',
                stressLevel: 'low'
            });
            
            // Should respond with the config
            expect(eventBus.emit).toHaveBeenCalledWith(
                'visualizer:configProvided',
                expect.objectContaining({
                    visualizerType: 'particle',
                    soundType: 'binauralBeats',
                    config: expect.any(Object)
                })
            );
        });
    });
    
    describe('initConfigManager', () => {
        it('should initialize the config manager and return the API', () => {
            const api = initConfigManager();
            
            // Should log initialization
            expect(logger.info).toHaveBeenCalledWith('Initializing config manager');
            
            // Should register event handlers
            expect(eventBus.on).toHaveBeenCalledWith(
                'visualizer:requestConfig',
                expect.any(Function)
            );
            
            // Should return the API functions
            expect(api).toHaveProperty('getVisualizerConfig');
            expect(api).toHaveProperty('getSoundTypeVisualizerConfig');
            expect(api).toHaveProperty('validateVisualizerConfig');
            expect(api).toHaveProperty('getAvailableVisualizerTypes');
            expect(api).toHaveProperty('getAvailableSoundTypes');
            expect(api).toHaveProperty('getAvailableStressLevels');
        });
    });
}); 