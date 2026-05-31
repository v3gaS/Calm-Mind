import { EventBus, EventTypes } from './EventBus';

export class ErrorHandler {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.errorCount = 0;
    this.lastErrorTime = 0;
    this.errorThreshold = 5;
    this.recoveryTime = 5000;
    this.isRecovering = false;
  }

  handleError(error, context) {
    this.errorCount++;
    this.lastErrorTime = Date.now();

    // Log error
    console.error(`[${context}] Error:`, error);

    // Emit error event
    this.eventBus.emit(EventTypes.SYSTEM.ERROR, {
      error,
      context,
      timestamp: Date.now()
    });

    // Check if we need to initiate recovery
    if (this.shouldInitiateRecovery()) {
      this.initiateRecovery();
    }
  }

  shouldInitiateRecovery() {
    return (
      this.errorCount >= this.errorThreshold &&
      Date.now() - this.lastErrorTime < this.recoveryTime &&
      !this.isRecovering
    );
  }

  async initiateRecovery() {
    this.isRecovering = true;
    
    try {
      // Emit recovery start event
      this.eventBus.emit(EventTypes.SYSTEM.RECOVERY_START);

      // Attempt to recover audio context
      await this.recoverAudioContext();

      // Reset visualizer
      await this.recoverVisualizer();

      // Reset error count
      this.errorCount = 0;
      
      // Emit recovery complete event
      this.eventBus.emit(EventTypes.SYSTEM.RECOVERY_COMPLETE);
    } catch (error) {
      // If recovery fails, emit fatal error
      this.eventBus.emit(EventTypes.SYSTEM.FATAL_ERROR, error);
    } finally {
      this.isRecovering = false;
    }
  }

  async recoverAudioContext() {
    // Implement audio context recovery logic
    this.eventBus.emit(EventTypes.AUDIO.CONTEXT_RECOVERY);
  }

  async recoverVisualizer() {
    // Implement visualizer recovery logic
    this.eventBus.emit(EventTypes.VISUALIZER.RECOVERY);
  }

  reset() {
    this.errorCount = 0;
    this.lastErrorTime = 0;
    this.isRecovering = false;
  }
} 