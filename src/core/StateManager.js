/**
 * @class StateManager
 * @description Manages application state with event handling and persistence
 */
class StateManager {
    constructor() {
        if (StateManager.instance) {
            return StateManager.instance;
        }
        
        this.state = {
            audio: {
                isPlaying: false,
                currentTrack: null,
                volume: 0.7,
                soundType: 'binauralRelax'
            },
            visualization: {
                type: 'particles',
                theme: 'dark',
                isActive: false
            },
            settings: {
                stressLevel: 5,
                duration: 10,
                ambientSound: 'none'
            }
        };
        
        this.listeners = new Set();
        this.loadState();
        
        StateManager.instance = this;
    }
    
    /**
     * Subscribe to state changes
     * @param {Function} listener - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    
    /**
     * Update state and notify listeners
     * @param {Object} newState - Partial state update
     */
    setState(newState) {
        this.state = {
            ...this.state,
            ...newState
        };
        
        this.saveState();
        this.notifyListeners();
    }
    
    /**
     * Notify all listeners of state change
     */
    notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.state);
            } catch (error) {
                console.error('Error in state listener:', error);
            }
        });
    }
    
    /**
     * Save state to localStorage
     */
    saveState() {
        try {
            localStorage.setItem('calmMindState', JSON.stringify(this.state));
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }
    
    /**
     * Load state from localStorage
     */
    loadState() {
        try {
            const savedState = localStorage.getItem('calmMindState');
            if (savedState) {
                this.state = {
                    ...this.state,
                    ...JSON.parse(savedState)
                };
            }
        } catch (error) {
            console.error('Failed to load state:', error);
        }
    }
    
    /**
     * Reset state to defaults
     */
    resetState() {
        this.state = {
            audio: {
                isPlaying: false,
                currentTrack: null,
                volume: 0.7,
                soundType: 'binauralRelax'
            },
            visualization: {
                type: 'particles',
                theme: 'dark',
                isActive: false
            },
            settings: {
                stressLevel: 5,
                duration: 10,
                ambientSound: 'none'
            }
        };
        this.saveState();
        this.notifyListeners();
    }
    
    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return this.state;
    }
}

// Export singleton instance
export const stateManager = new StateManager(); 