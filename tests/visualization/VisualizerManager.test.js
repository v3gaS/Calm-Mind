/**
 * Smoke tests aligned with current VisualizerManager (no legacy EventBus injection).
 */
import { VisualizerManager } from '../../src/visualization/VisualizerManager.js';

describe('VisualizerManager', () => {
    it('constructs with default state', () => {
        const vm = new VisualizerManager();
        expect(vm.currentVisualizer).toBeNull();
        expect(vm.isActive).toBe(false);
        expect(vm.visualizers.size).toBe(0);
    });

    it('cleanup does not throw when nothing was started', () => {
        const vm = new VisualizerManager();
        expect(() => vm.cleanup()).not.toThrow();
    });
});
