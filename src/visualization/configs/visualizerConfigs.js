/**
 * @file visualizerConfigs.js
 * @description Configuration objects for various visualizer types and sound-specific modifications
 */

/**
 * Base configurations for each visualizer type
 * @type {Object}
 */
export const VISUALIZER_CONFIGS = {
    // Particle-based visualizer configuration
    particle: {
        particleCount: 100,
        colorPalette: ['#F5B7B1', '#D2B4DE', '#AED6F1', '#A2D9CE', '#ABEBC6', '#F9E79F', '#F5CBA7'],
        fadeRate: 0.05,
        speed: 1.5,
        sizeRange: [2, 8],
        particleLifetime: 3000,
        responsiveness: 0.8,
        blendMode: 'screen',
        motionType: 'radial'
    },
    
    // Mesh wave visualizer configuration
    meshWave: {
        resolution: 64,
        amplitude: 2.0,
        colorPalette: ['#5D6D7E', '#85C1E9', '#A569BD', '#F5B041', '#ECF0F1'],
        wireframe: true,
        background: '#000000',
        waveSpeed: 0.5,
        complexity: 3,
        smoothingFactor: 0.85,
        distortion: 0.2,
        perspective: 75
    },
    
    // Spectrum analyzer visualization configuration
    spectrum: {
        barCount: 128,
        colorGradient: [
            { position: 0, color: '#1A237E' },
            { position: 0.5, color: '#7B1FA2' },
            { position: 1, color: '#C62828' }
        ],
        smoothingFactor: 0.5,
        barSpacing: 2,
        barWidthRatio: 0.7,
        minHeight: 2,
        maxHeight: 200,
        reactivity: 1.2
    }
};

/**
 * Sound-type specific configuration overrides for visualizers
 * @type {Object}
 */
export const SOUND_TYPE_CONFIGS = {
    // Binaural beats specific visualizer configurations
    binauralBeats: {
        particle: {
            particleCount: 200,
            speed: 0.8,
            motionType: 'circular',
            colorPalette: ['#D6EAF8', '#85C1E9', '#3498DB', '#2E86C1', '#1B4F72'],
            responsiveness: 0.5
        },
        meshWave: {
            amplitude: 3.0,
            waveSpeed: 0.3,
            colorPalette: ['#1A5276', '#2874A6', '#3498DB', '#85C1E9', '#D6EAF8'],
            distortion: 0.1
        },
        spectrum: {
            smoothingFactor: 0.8,
            colorGradient: [
                { position: 0, color: '#1A237E' },
                { position: 1, color: '#2874A6' }
            ]
        }
    },
    
    // White noise specific visualizer configurations
    whiteNoise: {
        particle: {
            particleCount: 300,
            fadeRate: 0.1,
            motionType: 'random',
            colorPalette: ['#EAECEE', '#D5D8DC', '#ABB2B9', '#808B96', '#566573'],
            speed: 2.0
        },
        meshWave: {
            amplitude: 0.8,
            distortion: 0.4,
            colorPalette: ['#17202A', '#1B2631', '#273746', '#2C3E50', '#34495E']
        },
        spectrum: {
            barCount: 256,
            reactivity: 0.7
        }
    },
    
    // Nature sounds specific visualizer configurations
    natureSounds: {
        particle: {
            particleCount: 150,
            colorPalette: ['#A9DFBF', '#7DCEA0', '#52BE80', '#27AE60', '#145A32'],
            motionType: 'flow',
            responsiveness: 1.2
        },
        meshWave: {
            wireframe: false,
            colorPalette: ['#145A32', '#196F3D', '#1E8449', '#27AE60', '#52BE80'],
            complexity: 2
        },
        spectrum: {
            colorGradient: [
                { position: 0, color: '#196F3D' },
                { position: 1, color: '#52BE80' }
            ]
        }
    },
    
    // Meditation specific visualizer configurations
    meditation: {
        particle: {
            particleCount: 80,
            fadeRate: 0.03,
            speed: 0.6,
            colorPalette: ['#6C3483', '#7D3C98', '#8E44AD', '#A569BD', '#BB8FCE'],
            motionType: 'spiral'
        },
        meshWave: {
            amplitude: 1.5,
            waveSpeed: 0.2,
            colorPalette: ['#4A235A', '#6C3483', '#8E44AD', '#BB8FCE', '#D7BDE2'],
            smoothingFactor: 0.95
        },
        spectrum: {
            smoothingFactor: 0.9,
            barWidthRatio: 0.9,
            barSpacing: 1
        }
    }
};

/**
 * Default configurations for when stress levels change
 * @type {Object}
 */
export const STRESS_LEVEL_CONFIGS = {
    low: {
        particle: {
            speed: 0.8,
            fadeRate: 0.03,
            colorPalette: ['#AED6F1', '#85C1E9', '#5DADE2', '#3498DB', '#2E86C1']
        },
        meshWave: {
            amplitude: 1.2,
            waveSpeed: 0.3,
            complexity: 2
        }
    },
    medium: {
        particle: {
            speed: 1.5,
            fadeRate: 0.05,
            colorPalette: ['#F9E79F', '#F7DC6F', '#F4D03F', '#F1C40F', '#D4AC0D']
        },
        meshWave: {
            amplitude: 2.0,
            waveSpeed: 0.5,
            complexity: 3
        }
    },
    high: {
        particle: {
            speed: 2.5,
            fadeRate: 0.08,
            colorPalette: ['#F5B7B1', '#F1948A', '#EC7063', '#E74C3C', '#CB4335']
        },
        meshWave: {
            amplitude: 3.5,
            waveSpeed: 0.8,
            complexity: 4
        }
    }
};

/**
 * Configuration validation rules for visualizer properties
 * @type {Object}
 */
export const CONFIG_VALIDATION_RULES = {
    particle: {
        particleCount: { type: 'number', min: 1, max: 1000 },
        colorPalette: { type: 'array' },
        fadeRate: { type: 'number', min: 0.01, max: 1 },
        speed: { type: 'number', min: 0.1, max: 5 },
        sizeRange: { type: 'array' },
        particleLifetime: { type: 'number', min: 100, max: 10000 },
        responsiveness: { type: 'number', min: 0.1, max: 3 },
        blendMode: { type: 'string' },
        motionType: { type: 'string', options: ['radial', 'circular', 'random', 'flow', 'spiral'] }
    },
    meshWave: {
        resolution: { type: 'number', min: 16, max: 256 },
        amplitude: { type: 'number', min: 0.1, max: 10 },
        colorPalette: { type: 'array' },
        wireframe: { type: 'boolean' },
        background: { type: 'string' },
        waveSpeed: { type: 'number', min: 0.1, max: 2 },
        complexity: { type: 'number', min: 1, max: 10 },
        smoothingFactor: { type: 'number', min: 0.1, max: 0.99 },
        distortion: { type: 'number', min: 0, max: 1 },
        perspective: { type: 'number', min: 30, max: 120 }
    },
    spectrum: {
        barCount: { type: 'number', min: 8, max: 512 },
        colorGradient: { type: 'array' },
        smoothingFactor: { type: 'number', min: 0, max: 0.99 },
        barSpacing: { type: 'number', min: 0, max: 10 },
        barWidthRatio: { type: 'number', min: 0.1, max: 1 },
        minHeight: { type: 'number', min: 0, max: 100 },
        maxHeight: { type: 'number', min: 10, max: 1000 },
        reactivity: { type: 'number', min: 0.1, max: 3 }
    }
}; 