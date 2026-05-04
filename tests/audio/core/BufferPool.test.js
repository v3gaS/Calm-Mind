import { BufferPool } from '../../../src/audio/core/BufferPool.js';

describe('BufferPool', () => {
  let bufferPool;
  
  beforeEach(() => {
    // Create instance with custom options
    bufferPool = new BufferPool({
      poolSize: 5,
      bufferSize: 1024,
      channels: 1,
      sampleRate: 22050
    });
  });
  
  afterEach(() => {
    // Clean up
    bufferPool.clear();
  });
  
  describe('initialize', () => {
    it('should initialize the buffer pool', () => {
      // Act
      const result = bufferPool.initialize();
      
      // Assert
      expect(result).toBe(true);
      expect(bufferPool.initialized).toBe(true);
      expect(bufferPool.pool.size).toBe(5);
      expect(bufferPool.available.size).toBe(5);
    });
    
    it('should not initialize twice', () => {
      // Arrange
      bufferPool.initialize();
      
      // Act
      const result = bufferPool.initialize();
      
      // Assert
      expect(result).toBe(true);
      expect(bufferPool.pool.size).toBe(5);
    });
    
    it('should handle initialization errors', () => {
      // Arrange
      const mockError = new Error('Test error');
      jest.spyOn(bufferPool, 'createBuffer').mockImplementation(() => {
        throw mockError;
      });
      
      // Act
      const result = bufferPool.initialize();
      
      // Assert
      expect(result).toBe(false);
    });
  });
  
  describe('createBuffer', () => {
    it('should create a buffer with correct properties', () => {
      // Act
      const buffer = bufferPool.createBuffer();
      
      // Assert
      expect(buffer).toBeDefined();
      expect(buffer.length).toBe(1024);
      expect(buffer.numberOfChannels).toBe(1);
      expect(buffer.sampleRate).toBe(22050);
    });
  });
  
  describe('acquire', () => {
    it('should acquire a buffer from the pool', () => {
      // Arrange
      bufferPool.initialize();
      
      // Act
      const buffer = bufferPool.acquire();
      
      // Assert
      expect(buffer).toBeDefined();
      expect(bufferPool.available.size).toBe(4);
    });
    
    it('should initialize if not already initialized', () => {
      // Act
      const buffer = bufferPool.acquire();
      
      // Assert
      expect(buffer).toBeDefined();
      expect(bufferPool.initialized).toBe(true);
    });
    
    it('should return null if pool is exhausted', () => {
      // Arrange
      bufferPool.initialize();
      
      // Act
      for (let i = 0; i < 5; i++) {
        bufferPool.acquire();
      }
      const buffer = bufferPool.acquire();
      
      // Assert
      expect(buffer).toBeNull();
    });
  });
  
  describe('release', () => {
    it('should release a buffer back to the pool', () => {
      // Arrange
      bufferPool.initialize();
      const buffer = bufferPool.acquire();
      
      // Act
      bufferPool.release(buffer);
      
      // Assert
      expect(bufferPool.available.size).toBe(5);
    });
    
    it('should not release if not initialized', () => {
      // Arrange
      const buffer = { length: 1024 };
      
      // Act
      bufferPool.release(buffer);
      
      // Assert
      expect(bufferPool.available.size).toBe(0);
    });
    
    it('should not release if buffer is not in the pool', () => {
      // Arrange
      bufferPool.initialize();
      const buffer = { length: 1024 };
      
      // Act
      bufferPool.release(buffer);
      
      // Assert
      expect(bufferPool.available.size).toBe(5);
    });
  });
  
  describe('clear', () => {
    it('should clear all buffers in the pool', () => {
      // Arrange
      bufferPool.initialize();
      
      // Act
      bufferPool.clear();
      
      // Assert
      expect(bufferPool.pool.size).toBe(0);
      expect(bufferPool.available.size).toBe(0);
      expect(bufferPool.initialized).toBe(false);
    });
  });
  
  describe('getAvailableCount', () => {
    it('should return the number of available buffers', () => {
      // Arrange
      bufferPool.initialize();
      bufferPool.acquire();
      bufferPool.acquire();
      
      // Act
      const count = bufferPool.getAvailableCount();
      
      // Assert
      expect(count).toBe(3);
    });
  });
  
  describe('getPoolSize', () => {
    it('should return the total pool size', () => {
      // Act
      const size = bufferPool.getPoolSize();
      
      // Assert
      expect(size).toBe(5);
    });
  });
}); 