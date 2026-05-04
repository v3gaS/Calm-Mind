import { EventBus, EventTypes } from './EventBus';

export class PerformanceMonitor {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.metrics = {
      fps: 0,
      memoryUsage: 0,
      audioLatency: 0,
      loadTime: 0,
      bufferPoolEfficiency: 0
    };
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.isMonitoring = false;
  }

  start() {
    this.isMonitoring = true;
    this.monitorFrameRate();
    this.monitorMemory();
    this.monitorAudioLatency();
  }

  stop() {
    this.isMonitoring = false;
  }

  monitorFrameRate() {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.frameCount++;

    if (deltaTime >= 1000) {
      this.metrics.fps = Math.round((this.frameCount * 1000) / deltaTime);
      this.frameCount = 0;
      this.lastFrameTime = currentTime;
      
      this.eventBus.emit(EventTypes.PERFORMANCE.FPS_UPDATE, this.metrics.fps);
    }

    requestAnimationFrame(() => this.monitorFrameRate());
  }

  monitorMemory() {
    if (!this.isMonitoring) return;

    if (performance.memory) {
      this.metrics.memoryUsage = performance.memory.usedJSHeapSize / 1048576; // Convert to MB
      this.eventBus.emit(EventTypes.PERFORMANCE.MEMORY_UPDATE, this.metrics.memoryUsage);
    }

    setTimeout(() => this.monitorMemory(), 5000);
  }

  monitorAudioLatency() {
    if (!this.isMonitoring) return;

    // Measure audio processing latency
    const startTime = performance.now();
    this.eventBus.emit(EventTypes.AUDIO.LATENCY_CHECK, startTime);
    
    setTimeout(() => this.monitorAudioLatency(), 1000);
  }

  updateBufferPoolEfficiency(available, total) {
    this.metrics.bufferPoolEfficiency = (available / total) * 100;
    this.eventBus.emit(EventTypes.PERFORMANCE.BUFFER_POOL_UPDATE, this.metrics.bufferPoolEfficiency);
  }

  getMetrics() {
    return { ...this.metrics };
  }
} 