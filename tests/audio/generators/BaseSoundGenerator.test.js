import { BaseSoundGenerator } from '../../../src/audio/generators/BaseSoundGenerator.js';
import { eventBus, EventTypes } from '../../../src/core/EventBus.js';
import { audioContextManager } from '../../../src/core/AudioContext.js';

// Mock dependencies
jest.mock('../../../src/core/EventBus.js');
jest.mock('../../../src/core/AudioContext.js');

describe('BaseSoundGenerator', () => {
  let baseSoundGenerator;
  let mockContext;
  let mockGain;
  let mockNode;
  
  beforeEach(() => {
    // Mock audio context and master gain
    mockContext = {
      currentTime: 0,
      createGain: jest.fn()
    };
    
    mockGain = {
      gain: { value: 1 },
      connect: jest.fn(),
      disconnect: jest.fn()
    };
    
    mockNode = {
      connect: jest.fn(),
      disconnect: jest.fn()
    };
    
    // Mock AudioContextManager
    audioContextManager.getContext = jest.fn().mockReturnValue(mockContext);
    audioContextManager.getMasterGain = jest.fn().mockReturnValue(mockGain);
    
    baseSoundGenerator = new BaseSoundGenerator();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('initialization', () => {
    it('should initialize with audio context', () => {
      expect(baseSoundGenerator.context).toBe(mockContext);
      expect(baseSoundGenerator.masterGain).toBe(mockGain);
      expect(baseSoundGenerator.isPlaying).toBe(false);
    });
    
    it('should return true when initialize is called with valid context', () => {
      const result = baseSoundGenerator.initialize();
      expect(result).toBe(true);
    });
    
    it('should return false when context is not available', () => {
      audioContextManager.getContext = jest.fn().mockReturnValue(null);
      baseSoundGenerator = new BaseSoundGenerator();
      
      const result = baseSoundGenerator.initialize();
      
      expect(result).toBe(false);
    });
  });
  
  describe('playback control', () => {
    it('should start playback successfully', () => {
      const duration = 10;
      
      baseSoundGenerator.start(duration);
      
      expect(baseSoundGenerator.isPlaying).toBe(true);
      expect(baseSoundGenerator.duration).toBe(duration);
      expect(baseSoundGenerator.startTime).toBe(mockContext.currentTime);
      expect(eventBus.emit).toHaveBeenCalledWith(EventTypes.AUDIO.PLAY, expect.any(Object));
    });
    
    it('should not start if initialization fails', () => {
      baseSoundGenerator.initialize = jest.fn().mockReturnValue(false);
      
      baseSoundGenerator.start(10);
      
      expect(baseSoundGenerator.isPlaying).toBe(false);
      expect(eventBus.emit).not.toHaveBeenCalled();
    });
    
    it('should stop playback successfully', () => {
      baseSoundGenerator.start(10);
      baseSoundGenerator.stop();
      
      expect(baseSoundGenerator.isPlaying).toBe(false);
      expect(eventBus.emit).toHaveBeenCalledWith(EventTypes.AUDIO.STOP, expect.any(Object));
    });
    
    it('should pause playback successfully', () => {
      baseSoundGenerator.start(10);
      baseSoundGenerator.pause();
      
      expect(baseSoundGenerator.isPlaying).toBe(false);
      expect(eventBus.emit).toHaveBeenCalledWith(EventTypes.AUDIO.PAUSE, expect.any(Object));
    });
    
    it('should resume playback successfully', () => {
      baseSoundGenerator.start(10);
      baseSoundGenerator.pause();
      
      // Advance mock time
      mockContext.currentTime = 2;
      
      baseSoundGenerator.resume();
      
      expect(baseSoundGenerator.isPlaying).toBe(true);
      expect(baseSoundGenerator.startTime).toBe(2);
      expect(eventBus.emit).toHaveBeenCalledWith(EventTypes.AUDIO.PLAY, expect.any(Object));
    });
    
    it('should not resume if initialization fails', () => {
      baseSoundGenerator.start(10);
      baseSoundGenerator.pause();
      baseSoundGenerator.initialize = jest.fn().mockReturnValue(false);
      
      baseSoundGenerator.resume();
      
      expect(baseSoundGenerator.isPlaying).toBe(false);
    });
  });
  
  describe('volume control', () => {
    it('should set volume correctly', () => {
      const volume = 0.5;
      
      baseSoundGenerator.setVolume(volume);
      
      expect(mockGain.gain.value).toBe(volume);
      expect(eventBus.emit).toHaveBeenCalledWith(EventTypes.AUDIO.VOLUME_CHANGE, { volume });
    });
    
    it('should clamp volume to 0-1 range', () => {
      baseSoundGenerator.setVolume(-0.5);
      expect(mockGain.gain.value).toBe(0);
      
      baseSoundGenerator.setVolume(1.5);
      expect(mockGain.gain.value).toBe(1);
    });
  });
  
  describe('node tracking', () => {
    it('should track audio nodes', () => {
      const trackedNode = baseSoundGenerator.trackNode(mockNode);
      
      expect(trackedNode).toBe(mockNode);
      expect(baseSoundGenerator.nodes.size).toBe(1);
      expect(baseSoundGenerator.nodes.has(mockNode)).toBe(true);
    });
  });
  
  describe('resource management', () => {
    it('should clean up resources properly', () => {
      baseSoundGenerator.trackNode(mockNode);
      
      baseSoundGenerator.cleanup();
      
      expect(mockNode.disconnect).toHaveBeenCalled();
      expect(baseSoundGenerator.nodes.size).toBe(0);
    });
    
    it('should handle disconnect errors gracefully', () => {
      const errorNode = {
        disconnect: jest.fn().mockImplementation(() => {
          throw new Error('Disconnect error');
        })
      };
      
      baseSoundGenerator.trackNode(errorNode);
      
      // Should not throw
      expect(() => baseSoundGenerator.cleanup()).not.toThrow();
    });
  });
  
  describe('time tracking', () => {
    it('should calculate current time correctly', () => {
      baseSoundGenerator.start(10);
      
      // Advance mock time
      mockContext.currentTime = 5;
      
      expect(baseSoundGenerator.getCurrentTime()).toBe(5);
    });
    
    it('should detect if sound is still playing based on duration', () => {
      baseSoundGenerator.start(10);
      
      // Before end time
      mockContext.currentTime = 5;
      expect(baseSoundGenerator.isStillPlaying()).toBe(true);
      
      // After end time
      mockContext.currentTime = 15;
      expect(baseSoundGenerator.isStillPlaying()).toBe(false);
    });
    
    it('should return false for isStillPlaying when not playing', () => {
      baseSoundGenerator.start(10);
      baseSoundGenerator.stop();
      
      mockContext.currentTime = 5;
      expect(baseSoundGenerator.isStillPlaying()).toBe(false);
    });
  });
  
  describe('abstract methods', () => {
    it('should have an update method to be overridden', () => {
      expect(typeof baseSoundGenerator.update).toBe('function');
      // Base implementation doesn't do anything
      expect(() => baseSoundGenerator.update()).not.toThrow();
    });
  });
}); 