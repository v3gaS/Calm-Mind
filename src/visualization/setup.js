/**
 * @file setup.js
 * @description Setup module for visualization system
 */

import { VisualizerManager } from './VisualizerManager.js';
import { stateManager } from '../core/StateManager.js';
import { eventBus } from '../core/EventBus.js';
import { getVisualizerConfig, getSoundTypeVisualizerConfig, validateVisualizerConfig } from './configs/configManager.js';

export { getVisualizerConfig, getSoundTypeVisualizerConfig, validateVisualizerConfig };

// Singleton instance of the visualizer manager
let visualizerManager = null;

/**
 * Initialize the visualizer system
 * @param {HTMLCanvasElement} canvas - Canvas element for visualization
 * @param {Object} options - Configuration options
 * @returns {VisualizerManager} The visualizer manager instance
 */
export function initializeVisualizer(canvas, options = {}) {
    if (!canvas) {
        console.error('Cannot initialize visualizer: Canvas element is required');
        return null;
    }

    try {
        visualizerManager = new VisualizerManager();
        visualizerManager.initialize(canvas, options);
        
        // Register visualizer with state manager
        stateManager.set('visualizerManager', visualizerManager);
        
        // Log initialization
        console.log('Visualizer initialized with options:', options);
        eventBus.emit('visualizer:initialized', { success: true });
        
        return visualizerManager;
    } catch (error) {
        console.error('Failed to initialize visualizer:', error);
        eventBus.emit('visualizer:initialized', { success: false, error });
        return null;
    }
}

/**
 * Set the current visualizer type
 * @param {string} type - The visualizer type to set
 * @param {Object} customConfig - Optional custom configuration to override defaults
 * @returns {boolean} Success status
 */
export function setVisualizerType(type, customConfig = {}) {
    if (!visualizerManager) {
        console.error('Cannot set visualizer type: Visualizer not initialized');
        return false;
    }
    
    try {
        // Get base configuration for this visualizer type
        const baseConfig = getVisualizerConfig(type);
        
        if (!baseConfig) {
            console.error(`Unknown visualizer type: ${type}`);
            return false;
        }
        
        // Merge with any custom configuration, validating the result
        const config = validateVisualizerConfig({...baseConfig, ...customConfig}, type);
        
        // Apply the configuration
        visualizerManager.setVisualizerType(type, config);
        stateManager.set('currentVisualizerType', type);
        eventBus.emit('visualizer:typeChanged', { type, config });
        return true;
    } catch (error) {
        console.error(`Failed to set visualizer type to ${type}:`, error);
        return false;
    }
}

/**
 * Set visualizer configuration based on sound type
 * @param {string} soundType - The sound type to set visualization for
 * @param {string} visualizerType - Optional visualizer type to use (default: current or 'particle')
 * @returns {boolean} Success status
 */
export function setVisualizerForSoundType(soundType, visualizerType = null) {
    if (!visualizerManager) {
        console.error('Cannot set visualizer for sound type: Visualizer not initialized');
        return false;
    }
    
    try {
        // If no visualizer type specified, use current or default to particle
        const vizType = visualizerType || stateManager.get('currentVisualizerType') || 'particle';
        
        // Get config for sound type
        const config = getSoundTypeVisualizerConfig(vizType, soundType);
        
        if (!config) {
            console.error(`Failed to get configuration for sound type ${soundType} and visualizer ${vizType}`);
            return false;
        }
        
        // Set the visualizer type with merged configuration
        visualizerManager.setVisualizerType(vizType, config);
        
        // Update state and emit event
        stateManager.set('currentVisualizerType', vizType);
        stateManager.set('currentSoundType', soundType);
        eventBus.emit('visualizer:soundTypeSet', { soundType, visualizerType: vizType, config });
        
        return true;
    } catch (error) {
        console.error(`Failed to set visualizer for sound type ${soundType}:`, error);
        return false;
    }
}

/**
 * Start the visualization
 * @returns {boolean} Success status
 */
export function startVisualization() {
    if (!visualizerManager) {
        console.error('Cannot start visualization: Visualizer not initialized');
        return false;
    }
    
    try {
        visualizerManager.start();
        stateManager.set('visualizationActive', true);
        eventBus.emit('visualizer:started');
        return true;
    } catch (error) {
        console.error('Failed to start visualization:', error);
        return false;
    }
}

/**
 * Stop the visualization
 * @returns {boolean} Success status
 */
export function stopVisualization() {
    if (!visualizerManager) {
        console.error('Cannot stop visualization: Visualizer not initialized');
        return false;
    }
    
    try {
        visualizerManager.stop();
        stateManager.set('visualizationActive', false);
        eventBus.emit('visualizer:stopped');
        return true;
    } catch (error) {
        console.error('Failed to stop visualization:', error);
        return false;
    }
}

/**
 * Clean up visualization resources
 * @returns {boolean} Success status
 */
export function cleanupVisualizer() {
    if (!visualizerManager) {
        console.warn('No visualizer to clean up');
        return true;
    }
    
    try {
        visualizerManager.cleanup();
        visualizerManager = null;
        stateManager.set('visualizerManager', null);
        stateManager.set('visualizationActive', false);
        eventBus.emit('visualizer:cleaned');
        return true;
    } catch (error) {
        console.error('Failed to clean up visualizer:', error);
        return false;
    }
}

// Export for global access if needed
window.initializeVisualizer = initializeVisualizer;
window.setVisualizerType = setVisualizerType;
window.setVisualizerForSoundType = setVisualizerForSoundType;
window.startVisualization = startVisualization;
window.stopVisualization = stopVisualization;
window.cleanupVisualizer = cleanupVisualizer; 