import { BinauralBeats } from '../../../src/audio/generators/BinauralBeats.js';
import { audioEffects } from '../../../src/audio/effects/AudioEffects.js';
import { bufferPool } from '../../../src/audio/core/BufferPool.js';
import { eventBus, EventTypes } from '../../../src/core/EventBus.js';
import { audioContextManager } from '../../../src/core/AudioContext.js';

// Mock dependencies
jest.mock('../../../src/audio/effects/AudioEffects.js');
jest.mock('../../../src/audio/core/BufferPool.js');
jest.mock('../../../src/core/EventBus.js');
jest.mock('../../../src/core/AudioContext.js');

describe('BinauralBeats', () => {
  let binauralBeats;
  let mockContext;
  let mockGain;
  let mockOscillator;
  let mockPanner;
  
  beforeEach(() => {
    // Mock audio nodes
    mockOscillator = {
      type: null,
      frequency: {
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn()
      },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      disconnect: jest.fn()
    };
    
    mockPanner = {
      pan: { value: 0 },
      connect: jest.fn(),
      disconnect: jest.fn()
    };
    
    mockGain = {
      gain: { value: 1 },
      connect: jest.fn(),
      disconnect: jest.fn()
    };
    
    mockContext = {
      createOscillator: jest.fn().mockReturnValue(mockOscillator),
      createStereoPanner: jest.fn().mockReturnValue(mockPanner),
      currentTime: 0
    };
    
    // Mock AudioContextManager
    audioContextManager.getContext = jest.fn().mockReturnValue(mockContext);
    audioContextManager.getMasterGain = jest.fn().mockReturnValue(mockGain);
    
    // Mock AudioEffects
    audioEffects.initialize = jest.fn().mockReturnValue(true);
    audioEffects.connectEffects = jest.fn();
    audioEffects.updateEffect = jest.fn();
    
    // Create instance
    binauralBeats = new BinauralBeats();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('initialization', () => {
    it('should initialize successfully with default parameters', () => {
      const result = binauralBeats.initialize();
      
      expect(result).toBe(true);
      expect(mockContext.createOscillator).toHaveBeenCalledTimes(2);
      expect(mockContext.createStereoPanner).toHaveBeenCalledTimes(2);
      expect(mockPanner.connect).toHaveBeenCalledTimes(2);
    });
    
    it('should initialize with custom stress level', () => {
      const stressLevel = 8;
      const result = binauralBeats.initialize(stressLevel);
      
      expect(result).toBe(true);
      // Should set frequencies based on stress level
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledTimes(2);
    });
    
    it('should handle initialization errors gracefully', () => {
      mockContext.createOscillator.mockImplementation(() => {
        throw new Error('Failed to create oscillator');
      });
      
      const result = binauralBeats.initialize();
      
      expect(result).toBe(false);
      expect(eventBus.emit).toHaveBeenCalledWith(EventTypes.SYSTEM.ERROR, expect.any(Object));
    });
  });
  
  describe('frequency calculations', () => {
    it('should calculate correct base frequency for different stress levels', () => {
      expect(binauralBeats.calculateBaseFrequency(1)).toBe(195); // Low stress
      expect(binauralBeats.calculateBaseFrequency(5)).toBe(175); // Medium stress
      expect(binauralBeats.calculateBaseFrequency(10)).toBe(150); // High stress
    });
    
    it('should calculate correct beat frequency for different stress levels', () => {
      expect(binauralBeats.calculateBeatFrequency(1)).toBe(9.5); // Low stress
      expect(binauralBeats.calculateBeatFrequency(5)).toBe(7.5); // Medium stress
      expect(binauralBeats.calculateBeatFrequency(10)).toBe(5); // High stress
    });
  });
  
  describe('playback control', () => {
    beforeEach(() => {
      binauralBeats.initialize();
    });
    
    it('should start playback successfully', () => {
      const duration = 10;
      const stressLevel = 5;
      
      binauralBeats.start(duration, stressLevel);
      
      expect(mockOscillator.start).toHaveBeenCalledTimes(2);
      expect(binauralBeats.isPlaying).toBe(true);
      expect(eventBus.emit).toHaveBeenCalledWith(EventTypes.AUDIO.PLAY, expect.any(Object));
    });
    
    it('should stop playback successfully', () => {
      binauralBeats.start(10);
      binauralBeats.stop();
      
      expect(mockOscillator.stop).toHaveBeenCalledTimes(2);
      expect(binauralBeats.isPlaying).toBe(false);
      expect(eventBus.emit).toHaveBeenCalledWith(EventTypes.AUDIO.STOP, expect.any(Object));
    });
    
    it('should automatically stop after duration', () => {
      jest.useFakeTimers();
      
      binauralBeats.start(10);
      expect(binauralBeats.isPlaying).toBe(true);
      
      // Fast-forward time
      jest.advanceTimersByTime(10000); // 10 seconds in ms
      
      expect(mockOscillator.stop).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });
  });
  
  describe('parameter updates', () => {
    beforeEach(() => {
      binauralBeats.initialize();
      binauralBeats.start(10);
    });
    
    it('should update frequencies based on stress level', () => {
      const newStressLevel = 8;
      
      binauralBeats.update(newStressLevel);
      
      expect(mockOscillator.frequency.linearRampToValueAtTime).toHaveBeenCalledTimes(2);
    });
    
    it('should not update when not playing', () => {
      binauralBeats.stop();
      mockOscillator.frequency.linearRampToValueAtTime.mockClear();
      
      binauralBeats.update(8);
      
      expect(mockOscillator.frequency.linearRampToValueAtTime).not.toHaveBeenCalled();
    });
    
    it('should update effects when enabled', () => {
      binauralBeats.effectsEnabled = true;
      
      binauralBeats.update(8);
      
      expect(audioEffects.updateEffect).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('effects management', () => {
    beforeEach(() => {
      binauralBeats.initialize();
    });
    
    it('should toggle effects correctly', () => {
      binauralBeats.toggleEffects(true);
      
      expect(binauralBeats.effectsEnabled).toBe(true);
    });
    
    it('should reinitialize when toggling effects while playing', () => {
      binauralBeats.start(10);
      mockContext.createOscillator.mockClear();
      
      binauralBeats.toggleEffects(true);
      
      expect(mockContext.createOscillator).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('resource management', () => {
    it('should clean up resources properly', () => {
      binauralBeats.initialize();
      binauralBeats.cleanup();
      
      expect(binauralBeats.leftOscillator).toBeNull();
      expect(binauralBeats.rightOscillator).toBeNull();
      expect(binauralBeats.leftPanner).toBeNull();
      expect(binauralBeats.rightPanner).toBeNull();
    });
  });
}); 