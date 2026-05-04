/**
 * @class EventBus
 * @description Manages application-wide events with proper error handling and logging
 */
class EventBus {
    constructor() {
        if (EventBus.instance) {
            return EventBus.instance;
        }
        
        this.events = new Map();
        this.logging = true;
        
        EventBus.instance = this;
    }
    
    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        
        this.events.get(event).add(callback);
        
        return () => {
            this.off(event, callback);
        };
    }
    
    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     */
    off(event, callback) {
        if (this.events.has(event)) {
            this.events.get(event).delete(callback);
        }
    }
    
    /**
     * Emit an event with data
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (this.logging) {
            console.log(`Event emitted: ${event}`, data);
        }
        
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }
    
    /**
     * Enable or disable event logging
     * @param {boolean} enabled - Logging state
     */
    setLogging(enabled) {
        this.logging = enabled;
    }
    
    /**
     * Clear all event listeners
     */
    clear() {
        this.events.clear();
    }
    
    /**
     * Get all registered events
     * @returns {string[]} Event names
     */
    getEvents() {
        return Array.from(this.events.keys());
    }
    
    /**
     * Get listener count for an event
     * @param {string} event - Event name
     * @returns {number} Listener count
     */
    getListenerCount(event) {
        return this.events.has(event) ? this.events.get(event).size : 0;
    }
}

// Export singleton instance
export const eventBus = new EventBus();

// Define common event types
export const EventTypes = {
    AUDIO: {
        PLAY: 'audio:play',
        PAUSE: 'audio:pause',
        STOP: 'audio:stop',
        VOLUME_CHANGE: 'audio:volume-change',
        TRACK_CHANGE: 'audio:track-change'
    },
    VISUALIZATION: {
        TYPE_CHANGE: 'visualization:type-change',
        THEME_CHANGE: 'visualization:theme-change',
        TOGGLE: 'visualization:toggle'
    },
    SETTINGS: {
        STRESS_LEVEL_CHANGE: 'settings:stress-level-change',
        DURATION_CHANGE: 'settings:duration-change',
        AMBIENT_SOUND_CHANGE: 'settings:ambient-sound-change'
    },
    SYSTEM: {
        ERROR: 'system:error',
        WARNING: 'system:warning',
        INFO: 'system:info'
    }
}; 