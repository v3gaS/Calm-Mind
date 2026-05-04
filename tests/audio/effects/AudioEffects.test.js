import { AudioEffects } from '../../../src/audio/effects/AudioEffects.js';
import { audioContextManager } from '../../../src/core/AudioContext.js';

jest.mock('../../../src/core/EventBus.js', () => ({
    eventBus: { emit: jest.fn() },
    EventTypes: { SYSTEM: { ERROR: 'system:error' } },
}));

jest.mock('../../../src/core/AudioContext.js', () => ({
    audioContextManager: { getContext: jest.fn() },
}));

function chainNode() {
    return {
        connect: jest.fn().mockReturnThis(),
        disconnect: jest.fn(),
    };
}

function mockContext() {
    return {
        sampleRate: 44100,
        destination: {},
        createGain: jest.fn(() => ({
            gain: { value: 0, setValueAtTime: jest.fn() },
            ...chainNode(),
        })),
        createConvolver: jest.fn(() => ({ buffer: null, ...chainNode() })),
        createDelay: jest.fn(() => ({
            delayTime: { value: 0.3, setValueAtTime: jest.fn() },
            ...chainNode(),
        })),
        createBiquadFilter: jest.fn(() => ({
            type: 'lowpass',
            frequency: { value: 1000, setValueAtTime: jest.fn() },
            Q: { value: 1, setValueAtTime: jest.fn() },
            ...chainNode(),
        })),
        createBuffer: jest.fn((ch, len) => ({
            getChannelData: jest.fn(() => new Float32Array(len)),
            numberOfChannels: ch,
            length: len,
            sampleRate: 44100,
        })),
    };
}

describe('AudioEffects', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        audioContextManager.getContext.mockReturnValue(mockContext());
    });

    it('initializes default reverb, delay, and filter', () => {
        const fx = new AudioEffects();
        expect(fx.initialize()).toBe(true);
        expect(fx.isInitialized).toBe(true);
        expect(fx.effects.size).toBe(3);
        expect(fx.effects.has('reverb')).toBe(true);
        fx.cleanup();
    });
});
