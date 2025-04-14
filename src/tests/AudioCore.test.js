import { AudioCore } from '../core/AudioCore.js';

describe('AudioCore', () => {
    let audioCore;

    beforeEach(() => {
        audioCore = new AudioCore();
    });

    afterEach(() => {
        if (audioCore.initialized) {
            audioCore.dispose();
        }
    });

    test('should initialize successfully', async () => {
        await audioCore.initialize();
        expect(audioCore.initialized).toBe(true);
        expect(audioCore.context).toBeTruthy();
        expect(audioCore.masterGain).toBeTruthy();
    });

    test('should set master volume correctly', async () => {
        await audioCore.initialize();
        audioCore.setMasterVolume(0.5);
        expect(audioCore.masterGain.gain.value).toBe(0.5);
    });

    test('should register and remove nodes', async () => {
        await audioCore.initialize();
        const oscillator = audioCore.context.createOscillator();
        const nodeId = 'test-oscillator';
        
        audioCore.registerNode(nodeId, oscillator);
        expect(audioCore.nodes.has(nodeId)).toBe(true);
        
        audioCore.removeNode(nodeId);
        expect(audioCore.nodes.has(nodeId)).toBe(false);
    });

    test('should throw error when not initialized', () => {
        expect(() => audioCore.getContext()).toThrow('AudioCore not initialized');
    });

    test('should clean up resources on dispose', async () => {
        await audioCore.initialize();
        const nodeId = 'test-node';
        const oscillator = audioCore.context.createOscillator();
        audioCore.registerNode(nodeId, oscillator);
        
        audioCore.dispose();
        expect(audioCore.initialized).toBe(false);
        expect(audioCore.nodes.size).toBe(0);
    });
}); 