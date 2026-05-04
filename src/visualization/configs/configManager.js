/**
 * @file configManager.js
 * @description Manages configuration for visualizers, handling retrieval, validation, and merging of configs
 */

import { VISUALIZER_CONFIGS, SOUND_TYPE_CONFIGS, STRESS_LEVEL_CONFIGS, CONFIG_VALIDATION_RULES } from './visualizerConfigs.js';
import { eventBus } from '../../core/EventBus.js';
import { logger } from '../../utils/logger.js';

/**
 * Deep clones an object to avoid reference issues when modifying configs
 * @param {Object} obj - The object to clone
 * @returns {Object} A deep copy of the object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Deep merges multiple objects together, with later objects overriding earlier ones
 * @param {...Object} objects - Objects to merge
 * @returns {Object} The merged object
 */
function deepMerge(...objects) {
    const result = {};
    
    objects.forEach(obj => {
        if (!obj || typeof obj !== 'object') return;
        
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            const existingValue = result[key];
            
            // If both values are objects, merge them
            if (existingValue && typeof existingValue === 'object' && 
                value && typeof value === 'object' && !Array.isArray(value)) {
                result[key] = deepMerge(existingValue, value);
            } else {
                // Otherwise just override
                result[key] = value;
            }
        });
    });
    
    return result;
}

/**
 * Gets the base configuration for a specific visualizer type
 * @param {string} visualizerType - The type of visualizer to get config for (e.g., 'particle', 'meshWave')
 * @returns {Object|null} The configuration object or null if invalid type
 */
export function getVisualizerConfig(visualizerType) {
    if (!visualizerType || !VISUALIZER_CONFIGS[visualizerType]) {
        logger.warn(`Invalid visualizer type: ${visualizerType}`);
        return null;
    }
    
    return deepClone(VISUALIZER_CONFIGS[visualizerType]);
}

/**
 * Gets the configuration for a specific visualizer type merged with sound-type specific overrides
 * @param {string} visualizerType - The type of visualizer (e.g., 'particle', 'meshWave')
 * @param {string} soundType - The type of sound (e.g., 'binauralBeats', 'whiteNoise')
 * @param {string} stressLevel - The stress level (e.g., 'low', 'medium', 'high')
 * @returns {Object|null} The merged configuration object or null if invalid types
 */
export function getSoundTypeVisualizerConfig(visualizerType, soundType, stressLevel = 'medium') {
    const baseConfig = getVisualizerConfig(visualizerType);
    if (!baseConfig) return null;
    
    // Start with the base config
    let mergedConfig = baseConfig;
    
    // Add sound type specific overrides if available
    if (soundType && SOUND_TYPE_CONFIGS[soundType] && SOUND_TYPE_CONFIGS[soundType][visualizerType]) {
        mergedConfig = deepMerge(mergedConfig, SOUND_TYPE_CONFIGS[soundType][visualizerType]);
    }
    
    // Add stress level specific overrides if available
    if (stressLevel && STRESS_LEVEL_CONFIGS[stressLevel] && STRESS_LEVEL_CONFIGS[stressLevel][visualizerType]) {
        mergedConfig = deepMerge(mergedConfig, STRESS_LEVEL_CONFIGS[stressLevel][visualizerType]);
    }
    
    // Validate the merged config
    const validatedConfig = validateVisualizerConfig(mergedConfig, visualizerType);
    
    // Emit an event for the config creation
    eventBus.emit('visualizer:configCreated', {
        visualizerType,
        soundType,
        stressLevel,
        config: validatedConfig
    });
    
    return validatedConfig;
}

/**
 * Validates the visualizer configuration against the defined rules
 * @param {Object} config - The configuration to validate
 * @param {string} visualizerType - The type of visualizer
 * @returns {Object} The validated configuration object (invalid properties are removed)
 */
export function validateVisualizerConfig(config, visualizerType) {
    if (!config || typeof config !== 'object') {
        logger.error('Invalid config object provided for validation');
        return {};
    }
    
    const rules = CONFIG_VALIDATION_RULES[visualizerType];
    if (!rules) {
        logger.warn(`No validation rules found for visualizer type: ${visualizerType}`);
        return config;
    }
    
    const validatedConfig = {};
    
    // Check each property against the rules
    Object.keys(config).forEach(propName => {
        const value = config[propName];
        const rule = rules[propName];
        
        // If no rule exists for this property, keep it anyway
        if (!rule) {
            validatedConfig[propName] = value;
            return;
        }
        
        // Check the type
        if (rule.type === 'number' && typeof value === 'number') {
            let isValid = true;
            
            // Check min/max if specified
            if (rule.hasOwnProperty('min') && value < rule.min) {
                logger.warn(`Property ${propName} value ${value} is below minimum ${rule.min}`);
                isValid = false;
            }
            
            if (rule.hasOwnProperty('max') && value > rule.max) {
                logger.warn(`Property ${propName} value ${value} is above maximum ${rule.max}`);
                isValid = false;
            }
            
            if (isValid) {
                validatedConfig[propName] = value;
            } else {
                // Use the nearest valid value if outside range
                if (rule.hasOwnProperty('min') && value < rule.min) {
                    validatedConfig[propName] = rule.min;
                } else if (rule.hasOwnProperty('max') && value > rule.max) {
                    validatedConfig[propName] = rule.max;
                }
            }
        } 
        // Check array type
        else if (rule.type === 'array' && Array.isArray(value)) {
            validatedConfig[propName] = value;
        }
        // Check boolean type
        else if (rule.type === 'boolean' && typeof value === 'boolean') {
            validatedConfig[propName] = value;
        }
        // Check string type
        else if (rule.type === 'string' && typeof value === 'string') {
            // Check if the string should be from a specific set of options
            if (rule.options && !rule.options.includes(value)) {
                logger.warn(`Property ${propName} value ${value} is not in allowed options: ${rule.options.join(', ')}`);
                // Default to the first allowed option
                validatedConfig[propName] = rule.options[0];
            } else {
                validatedConfig[propName] = value;
            }
        }
        // Property failed validation
        else {
            logger.warn(`Property ${propName} with value ${value} failed type validation for type ${rule.type}`);
        }
    });
    
    return validatedConfig;
}

/**
 * Gets an array of all available visualizer types
 * @returns {string[]} Array of visualizer type names
 */
export function getAvailableVisualizerTypes() {
    return Object.keys(VISUALIZER_CONFIGS);
}

/**
 * Gets an array of all available sound types
 * @returns {string[]} Array of sound type names
 */
export function getAvailableSoundTypes() {
    return Object.keys(SOUND_TYPE_CONFIGS);
}

/**
 * Gets an array of all available stress levels
 * @returns {string[]} Array of stress level names
 */
export function getAvailableStressLevels() {
    return Object.keys(STRESS_LEVEL_CONFIGS);
}

// Listen for stress level changes to update visualizer configurations
eventBus.on('state:stressLevelChanged', ({ level, previousLevel }) => {
    logger.info(`Stress level changed from ${previousLevel} to ${level}`);
    
    // Emit an event to inform visualizers that they should update their configuration
    eventBus.emit('visualizer:configUpdate', {
        stressLevel: level,
        previousStressLevel: previousLevel
    });
});

// Initialize the config manager
export function initConfigManager() {
    logger.info('Initializing config manager');
    
    // Register event handlers
    eventBus.on('visualizer:requestConfig', ({ visualizerType, soundType, stressLevel }) => {
        const config = getSoundTypeVisualizerConfig(visualizerType, soundType, stressLevel);
        eventBus.emit('visualizer:configProvided', { visualizerType, soundType, config });
    });
    
    // Log available configurations
    logger.debug(`Available visualizer types: ${getAvailableVisualizerTypes().join(', ')}`);
    logger.debug(`Available sound types: ${getAvailableSoundTypes().join(', ')}`);
    
    return {
        getVisualizerConfig,
        getSoundTypeVisualizerConfig,
        getAvailableVisualizerTypes,
        getAvailableSoundTypes,
        getAvailableStressLevels,
        validateVisualizerConfig
    };
} 