import { EventBus, EventTypes } from './EventBus';

export class Analytics {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.sessionStartTime = Date.now();
    this.events = [];
    this.metrics = {
      totalSessions: 0,
      averageSessionDuration: 0,
      mostUsedVisualizer: '',
      mostUsedSoundType: '',
      errorRate: 0
    };
    this.isTracking = false;
  }

  startTracking() {
    this.isTracking = true;
    this.setupEventListeners();
  }

  stopTracking() {
    this.isTracking = false;
    this.removeEventListeners();
  }

  setupEventListeners() {
    // Track user interactions
    this.eventBus.on(EventTypes.USER.INTERACTION, this.trackUserInteraction.bind(this));
    
    // Track system events
    this.eventBus.on(EventTypes.SYSTEM.ERROR, this.trackError.bind(this));
    this.eventBus.on(EventTypes.SYSTEM.RECOVERY_START, this.trackRecovery.bind(this));
    
    // Track performance metrics
    this.eventBus.on(EventTypes.PERFORMANCE.FPS_UPDATE, this.trackFPS.bind(this));
    this.eventBus.on(EventTypes.PERFORMANCE.MEMORY_UPDATE, this.trackMemory.bind(this));
  }

  removeEventListeners() {
    // Remove all event listeners
    this.eventBus.off(EventTypes.USER.INTERACTION);
    this.eventBus.off(EventTypes.SYSTEM.ERROR);
    this.eventBus.off(EventTypes.SYSTEM.RECOVERY_START);
    this.eventBus.off(EventTypes.PERFORMANCE.FPS_UPDATE);
    this.eventBus.off(EventTypes.PERFORMANCE.MEMORY_UPDATE);
  }

  trackUserInteraction(data) {
    if (!this.isTracking) return;

    this.events.push({
      type: 'user_interaction',
      data,
      timestamp: Date.now()
    });

    this.updateMetrics();
  }

  trackError(error) {
    if (!this.isTracking) return;

    this.events.push({
      type: 'error',
      data: error,
      timestamp: Date.now()
    });

    this.updateMetrics();
  }

  trackRecovery(data) {
    if (!this.isTracking) return;

    this.events.push({
      type: 'recovery',
      data,
      timestamp: Date.now()
    });

    this.updateMetrics();
  }

  trackFPS(fps) {
    if (!this.isTracking) return;

    this.events.push({
      type: 'performance',
      metric: 'fps',
      value: fps,
      timestamp: Date.now()
    });

    this.updateMetrics();
  }

  trackMemory(usage) {
    if (!this.isTracking) return;

    this.events.push({
      type: 'performance',
      metric: 'memory',
      value: usage,
      timestamp: Date.now()
    });

    this.updateMetrics();
  }

  updateMetrics() {
    // Calculate session duration
    const sessionDuration = Date.now() - this.sessionStartTime;
    
    // Update metrics based on events
    this.metrics.totalSessions++;
    this.metrics.averageSessionDuration = 
      (this.metrics.averageSessionDuration * (this.metrics.totalSessions - 1) + sessionDuration) 
      / this.metrics.totalSessions;
    
    // Calculate error rate
    const errorEvents = this.events.filter(e => e.type === 'error');
    this.metrics.errorRate = (errorEvents.length / this.events.length) * 100;
  }

  getAnalytics() {
    return {
      metrics: { ...this.metrics },
      events: [...this.events],
      sessionDuration: Date.now() - this.sessionStartTime
    };
  }
} 