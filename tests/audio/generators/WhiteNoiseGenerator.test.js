import { WhiteNoiseGenerator } from '../../../src/audio/generators/WhiteNoiseGenerator.js';
import { eventBus, EventTypes } from '../../../src/core/EventBus.js';
import { audioEffects } from '../../../src/audio/effects/AudioEffects.js';
import { audioContextManager } from '../../../src/core/AudioContext.js';

// Mock dependencies
jest.mock('../../../src/core/EventBus.js');
jest.mock('../../../src/audio/effects/AudioEffects.js');
jest.mock('../../../src/core/AudioContext.js');

describe('WhiteNoiseGenerator', () => {
  let whiteNoiseGenerator;
  let mockContext;
  let mockGain;
  let mockBufferSource;
  let mockFilter;
  
  beforeEach(() => {
    // Mock audio nodes
    mockBufferSource = {
      buffer: null,
      loop: false,
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn()
    };
    
    mockGain = {
      gain: { value: 1 },
      connect: jest.fn(),
      disconnect: jest.fn()
    };
    
    mockFilter = {
      type: null,
      frequency: { value: 0 },
      Q: { value: 0 },
      connect: jest.fn(),
      disconnect: jest.fn()
    };
    
    // Mock audio buffer
    const mockBuffer = {
      numberOfChannels: 2,
      getChannelData: jest.fn().mockReturnValue(new Float32Array(44100))
    };
    
    // Mock context
    mockContext = {
      sampleRate: 44100,
      currentTime: 0,
      createGain: jest.fn().mockReturnValue(mockGain),
      createBuffer: jest.fn().mockReturnValue(mockBuffer),
      createBufferSource: jest.fn().mockReturnValue(mockBufferSource),
      createBiquadFilter: jest.fn().mockReturnValue(mockFilter)
    };
    
    // Mock AudioContextManager
    audioContextManager.getContext = jest.fn().mockReturnValue(mockContext);
    audioContextManager.getMasterGain = jest.fn().mockReturnValue(mockGain);
    
    // Mock AudioEffects
    audioEffects.initialize = jest.fn().mockReturnValue(true);
    audioEffects.connectEffects = jest.fn();
    audioEffects.updateEffect = jest.fn();
    
    // Create instance
    whiteNoiseGenerator = new WhiteNoiseGenerator();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    // Clear any timeouts
    jest.useRealTimers();
  });
  
  describe('initialization', () => {
    it('should initialize successfully with default parameters', () => {
      const result = whiteNoiseGenerator.initialize();
      
      expect(result).toBe(true);
      expect(mockContext.createBuffer).toHaveBeenCalled();
      expect(mockContext.createBufferSource).toHaveBeenCalled();
      expect(mockBufferSource.loop).toBe(true);
      expect(eventBus.emit).toHaveBeenCalledWith(EventTypes.AUDIO.INITIALIZED, expect.any(Object));
    });
    
    it('should initialize with custom filter type', () => {
      const result = whiteNoiseGenerator.initialize(5, { filterType: 'lowpass' });
      
      expect(result).toBe(true);
      expect(whiteNoiseGenerator.filterType).toBe('lowpass');
      expect(mockContext.createBiquadFilter).toHaveBeenCalled();
      expect(mockFilter.type).toBe('lowpass');
    });
    
    it('should handle initialization errors gracefully', () => {
      mockContext.createBuffer.mockImplementation(() => {
        throw new Error('Failed to create buffer');
      });
      
      const result = whiteNoiseGenerator.initialize();
      
      expect(result).toBe(false);
      expect(eventBus.emit).toHaveBeenCalledWith(EventTypes.SYSTEM.ERROR, expect.any(Object));
    });
  });
  
  describe('filter type determination', () => {
    it('should determine filter type based on stress level', () => {
      expect(whiteNoiseGenerator.determineFilterType(2)).toBe('lowpass');   // Low stress
      expect(whiteNoiseGenerator.determineFilterType(5)).toBe('bandpass');  // Medium stress
      expect(whiteNoiseGenerator.determineFilterType(9)).toBe('highpass');  // High stress
    });
    
    it('should apply filter with correct parameters', () => {
      whiteNoiseGenerator.initialize(5);
      whiteNoiseGenerator.filterType = 'lowpass';
      whiteNoiseGenerator.applyFilter(5);
      
      expect(mockFilter.type).toBe('lowpass');
      expect(mockFilter.frequency.value).toBe(750); // 1000 - (5 * 50)
      expect(mockFilter.Q.value).toBe(0.7);
    });
  });
  
  describe('playback control', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    
    it('should start playback successfully', () => {
      whiteNoiseGenerator.start(10, 5);
      
      expect(mockBufferSource.start).toHaveBeenCalled();
      expect(whiteNoiseGenerator.isPlaying).toBe(true);
      expect(whiteNoiseGenerator.duration).toBe(10);
      expect(eventBus.emit).toHaveBeenCalledWith(EventTypes.AUDIO.PLAY, expect.any(Object));
    });
    
    it('should stop playback after specified duration', () => {
      whiteNoiseGenerator.start(2, 5);
      
      expect(whiteNoiseGenerator.isPlaying).toBe(true);
      
      jest.advanceTimersByTime(2000); // 2 seconds
      
      expect(mockBufferSource.stop).toHaveBeenCalled();
      expect(whiteNoiseGenerator.isPlaying).toBe(false);
    });
    
    it('should stop playback manually', () => {
      whiteNoiseGenerator.start(10);
      whiteNoiseGenerator.stop();
      
      expect(mockBufferSource.stop).toHaveBeenCalled();
      expect(whiteNoiseGenerator.isPlaying).toBe(false);
      expect(eventBus.emit).toHaveBeenCalledWith(EventTypes.AUDIO.STOP, expect.any(Object));
    });
    
    it('should handle stop errors gracefully', () => {
      whiteNoiseGenerator.start(10);
      
      mockBufferSource.stop.mockImplementation(() => {
        throw new Error('Stop error');
      });
      
      // Should not throw
      expect(() => whiteNoiseGenerator.stop()).not.toThrow();
      expect(whiteNoiseGenerator.isPlaying).toBe(false);
    });
  });
  
  describe('parameter updates', () => {
    beforeEach(() => {
      whiteNoiseGenerator.initialize();
      whiteNoiseGenerator.start(10);
      
      // Reset mocks for clear test
      mockContext.createBiquadFilter.mockClear();
      mockFilter.disconnect.mockClear();
    });
    
    it('should update filter type when stress level changes significantly', () => {
      // Start with medium stress (bandpass)
      whiteNoiseGenerator.filterType = 'bandpass';
      
      // Update to high stress (should change to highpass)
      whiteNoiseGenerator.update(9);
      
      expect(whiteNoiseGenerator.filterType).toBe('highpass');
      expect(mockContext.createBiquadFilter).toHaveBeenCalled();
      expect(eventBus.emit).toHaveBeenCalledWith(EventTypes.AUDIO.UPDATE, expect.any(Object));
    });
    
    it('should update filter parameters even if filter type stays the same', () => {
      // Start with lowpass
      whiteNoiseGenerator.filterType = 'lowpass';
      whiteNoiseGenerator.filter = mockFilter;
      
      // Update stress within same filter type range
      whiteNoiseGenerator.update(3);
      
      // Should update parameters without changing type
      expect(whiteNoiseGenerator.filterType).toBe('lowpass');
      expect(mockFilter.frequency.value).toBe(850); // 1000 - (3 * 50)
    });
    
    it('should update audio effects when enabled', () => {
      whiteNoiseGenerator.effectsEnabled = true;
      
      whiteNoiseGenerator.update(8);
      
      expect(audioEffects.updateEffect).toHaveBeenCalledWith('reverb', expect.any(Object));
      expect(audioEffects.updateEffect).toHaveBeenCalledWith('delay', expect.any(Object));
    });
    
    it('should not update when not playing', () => {
      whiteNoiseGenerator.stop();
      
      // Clear mocks after stop
      mockContext.createBiquadFilter.mockClear();
      eventBus.emit.mockClear();
      
      whiteNoiseGenerator.update(8);
      
      expect(mockContext.createBiquadFilter).not.toHaveBeenCalled();
      expect(eventBus.emit).not.toHaveBeenCalled();
    });
  });
  
  describe('volume control', () => {
    beforeEach(() => {
      whiteNoiseGenerator.initialize();
    });
    
    it('should set volume correctly', () => {
      whiteNoiseGenerator.setVolume(0.5);
      
      expect(whiteNoiseGenerator.gainNode.gain.value).toBe(0.5);
      expect(eventBus.emit).toHaveBeenCalledWith(EventTypes.AUDIO.VOLUME_CHANGE, expect.any(Object));
    });
    
    it('should clamp volume values to 0-1 range', () => {
      whiteNoiseGenerator.setVolume(-0.5);
      expect(whiteNoiseGenerator.gainNode.gain.value).toBe(0);
      
      whiteNoiseGenerator.setVolume(1.5);
      expect(whiteNoiseGenerator.gainNode.gain.value).toBe(1);
    });
  });
  
  describe('effects management', () => {
    beforeEach(() => {
      whiteNoiseGenerator.initialize();
    });
    
    it('should toggle effects correctly', () => {
      whiteNoiseGenerator.toggleEffects(true);
      
      expect(whiteNoiseGenerator.effectsEnabled).toBe(true);
      expect(eventBus.emit).toHaveBeenCalledWith(EventTypes.AUDIO.EFFECTS_TOGGLE, expect.any(Object));
    });
    
    it('should reinitialize when toggling effects while playing', () => {
      jest.useFakeTimers();
      mockContext.currentTime = 0;
      
      whiteNoiseGenerator.start(10);
      mockContext.currentTime = 2; // 2 seconds elapsed
      
      // Clear mocks after start
      mockContext.createBuffer.mockClear();
      mockContext.createBufferSource.mockClear();
      
      whiteNoiseGenerator.toggleEffects(true);
      
      // Should reinitialize
      expect(mockContext.createBuffer).toHaveBeenCalled();
      expect(mockContext.createBufferSource).toHaveBeenCalled();
      
      // Should resume playback with remaining time (~8 seconds)
      expect(whiteNoiseGenerator.isPlaying).toBe(true);
    });
  });
  
  describe('resource management', () => {
    it('should clean up resources properly', () => {
      whiteNoiseGenerator.initialize();
      whiteNoiseGenerator.cleanup();
      
      expect(whiteNoiseGenerator.noiseNode).toBeNull();
      expect(whiteNoiseGenerator.gainNode).toBeNull();
      expect(whiteNoiseGenerator.filter).toBeNull();
    });
  });
}); 