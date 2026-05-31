/**
 * AudioVisualizer.js
 * Base visualization class for audio data
 */

/**
 * Class for visualizing audio data on a canvas
 */
export class AudioVisualizer {
    /**
     * Create a new audio visualizer
     * @param {HTMLCanvasElement} canvas - The canvas to render on
     * @param {Object} options - Visualization options
     */
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.options = {
            fftSize: options.fftSize || 2048,
            minDecibels: options.minDecibels || -90,
            maxDecibels: options.maxDecibels || -10,
            smoothing: options.smoothing || 0.85,
            barWidth: options.barWidth || 2,
            barSpacing: options.barSpacing || 1,
            barColor: options.barColor || '#00CCFF',
            backgroundColor: options.backgroundColor || '#000000',
            lineColor: options.lineColor || '#39FF14',
            lineWidth: options.lineWidth || 2,
            showBars: options.showBars !== undefined ? options.showBars : true,
            showWaveform: options.showWaveform !== undefined ? options.showWaveform : true,
            showFrequencyLines: options.showFrequencyLines !== undefined ? options.showFrequencyLines : true,
            mode: options.mode || 'spectrum', // 'spectrum', 'waveform', 'combined'
            responsive: options.responsive !== undefined ? options.responsive : true,
            fps: options.fps || 30,
            peakHold: options.peakHold || 2000, // ms
        };

        // Setup canvas
        this._setupCanvas();
        
        // Data buffers
        this.frequencyData = null;
        this.timeData = null;
        this.energyData = null;
        
        // Animation
        this.animationId = null;
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / this.options.fps;
        
        // Peak tracking
        this.peaks = [];
        this.lastPeakTime = 0;
        
        // Resize handling
        if (this.options.responsive) {
            window.addEventListener('resize', this._handleResize.bind(this));
        }
        
        // Initialize
        this._reset();
    }
    
    /**
     * Set up canvas dimensions
     * @private
     */
    _setupCanvas() {
        if (this.options.responsive) {
            this.canvas.width = this.canvas.parentElement.clientWidth;
            this.canvas.height = this.canvas.parentElement.clientHeight;
        } else if (!this.canvas.width || !this.canvas.height) {
            this.canvas.width = 640;
            this.canvas.height = 240;
        }
        
        // Set default canvas styles
        this.ctx.fillStyle = this.options.backgroundColor;
        this.ctx.strokeStyle = this.options.lineColor;
        this.ctx.lineWidth = this.options.lineWidth;
    }
    
    /**
     * Handle window resize
     * @private
     */
    _handleResize() {
        if (this.options.responsive) {
            const oldWidth = this.canvas.width;
            const oldHeight = this.canvas.height;
            
            this.canvas.width = this.canvas.parentElement.clientWidth;
            this.canvas.height = this.canvas.parentElement.clientHeight;
            
            // Re-draw if not animating
            if (!this.animationId && this.frequencyData) {
                this.draw(this.frequencyData, this.timeData, this.energyData);
            }
        }
    }
    
    /**
     * Reset internal state
     * @private
     */
    _reset() {
        const bufferLength = this.options.fftSize / 2;
        this.frequencyData = new Uint8Array(bufferLength);
        this.timeData = new Uint8Array(this.options.fftSize);
        this.energyData = new Array(6).fill(0);
        this.peaks = new Array(bufferLength).fill(0);
    }
    
    /**
     * Update the visualizer with audio data
     * @param {Object} audioData - Audio data object
     */
    update(audioData) {
        if (!audioData) return;
        
        // Store data for redrawing if needed
        if (audioData.frequencyData) {
            this.frequencyData = audioData.frequencyData;
        }
        
        if (audioData.timeData) {
            this.timeData = audioData.timeData;
        }
        
        if (audioData.energyByBands) {
            this.energyData = audioData.energyByBands;
        }
        
        // Draw the data
        this.draw(this.frequencyData, this.timeData, this.energyData);
    }
    
    /**
     * Draw visualization
     * @param {Uint8Array} frequencyData - Frequency domain data (0-255)
     * @param {Uint8Array} timeData - Time domain data (0-255)
     * @param {Array<number>} energyData - Energy by bands (0-1)
     */
    draw(frequencyData, timeData, energyData) {
        const now = performance.now();
        
        // Throttle rendering based on FPS setting
        if (now - this.lastFrameTime < this.frameInterval) {
            return;
        }
        
        this.lastFrameTime = now;
        
        // Clear canvas
        this.ctx.fillStyle = this.options.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!frequencyData && !timeData) {
            return;
        }
        
        // Choose visualization mode
        switch (this.options.mode) {
            case 'spectrum':
                this._drawSpectrum(frequencyData, energyData);
                break;
            case 'waveform':
                this._drawWaveform(timeData);
                break;
            case 'combined':
                this._drawCombined(frequencyData, timeData, energyData);
                break;
            default:
                this._drawSpectrum(frequencyData, energyData);
        }
    }
    
    /**
     * Draw frequency spectrum visualization
     * @param {Uint8Array} frequencyData - Frequency domain data
     * @param {Array<number>} energyData - Energy by bands
     * @private
     */
    _drawSpectrum(frequencyData, energyData) {
        if (!frequencyData) return;
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        const bufferLength = frequencyData.length;
        const barWidth = this.options.barWidth;
        const barSpacing = this.options.barSpacing;
        const totalBarWidth = barWidth + barSpacing;
        
        // Calculate how many bars fit on the canvas
        const numBars = Math.min(Math.floor(width / totalBarWidth), bufferLength);
        
        // Draw frequency bars
        if (this.options.showBars) {
            this.ctx.fillStyle = this.options.barColor;
            
            for (let i = 0; i < numBars; i++) {
                // Use logarithmic scaling for frequency bins
                const index = Math.floor(Math.pow(i / numBars, 2) * bufferLength);
                const value = frequencyData[index] / 255;
                
                const x = i * totalBarWidth;
                const barHeight = value * height;
                const y = height - barHeight;
                
                this.ctx.fillRect(x, y, barWidth, barHeight);
                
                // Update peaks
                if (this.options.peakHold > 0) {
                    const currentPeak = height - this.peaks[i];
                    if (barHeight > this.peaks[i] || now - this.lastPeakTime > this.options.peakHold) {
                        this.peaks[i] = barHeight;
                        this.lastPeakTime = now;
                    }
                    
                    // Draw peak line
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    this.ctx.fillRect(x, height - this.peaks[i], barWidth, 2);
                    this.ctx.fillStyle = this.options.barColor;
                }
            }
        }
        
        // Draw frequency lines
        if (this.options.showFrequencyLines) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.options.lineColor;
            this.ctx.lineWidth = this.options.lineWidth;
            
            const sliceWidth = width / numBars;
            
            for (let i = 0; i < numBars; i++) {
                // Use logarithmic scaling for frequency bins
                const index = Math.floor(Math.pow(i / numBars, 2) * bufferLength);
                const value = frequencyData[index] / 255;
                
                const x = i * sliceWidth;
                const y = height - (value * height);
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            
            this.ctx.stroke();
        }
        
        // Draw energy bands if available
        if (energyData && energyData.length > 0) {
            const bandWidth = width / energyData.length;
            const bandColors = [
                'rgba(255, 0, 0, 0.5)',   // Sub-bass
                'rgba(255, 128, 0, 0.5)', // Bass
                'rgba(255, 255, 0, 0.5)', // Low mids
                'rgba(0, 255, 0, 0.5)',   // Mids
                'rgba(0, 255, 255, 0.5)', // High mids
                'rgba(0, 128, 255, 0.5)'  // Highs
            ];
            
            for (let i = 0; i < energyData.length; i++) {
                const x = i * bandWidth;
                const bandHeight = energyData[i] * height;
                const y = height - bandHeight;
                
                this.ctx.fillStyle = bandColors[i % bandColors.length];
                this.ctx.fillRect(x, y, bandWidth, bandHeight);
                
                // Draw band label
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                const labels = ['Sub', 'Bass', 'Low', 'Mid', 'High', 'Treble'];
                this.ctx.fillText(labels[i], x + bandWidth / 2, height - 5);
            }
        }
    }
    
    /**
     * Draw waveform visualization
     * @param {Uint8Array} timeData - Time domain data
     * @private
     */
    _drawWaveform(timeData) {
        if (!timeData) return;
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        const bufferLength = timeData.length;
        const sliceWidth = width / bufferLength;
        const centerLine = height / 2;
        
        // Draw waveform
        if (this.options.showWaveform) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.options.lineColor;
            this.ctx.lineWidth = this.options.lineWidth;
            
            for (let i = 0; i < bufferLength; i++) {
                const value = (timeData[i] / 128) - 1; // Convert to range -1 to 1
                const y = centerLine + (value * centerLine);
                const x = i * sliceWidth;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            
            this.ctx.stroke();
        }
        
        // Draw center line
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.moveTo(0, centerLine);
        this.ctx.lineTo(width, centerLine);
        this.ctx.stroke();
    }
    
    /**
     * Draw combined visualization (spectrum and waveform)
     * @param {Uint8Array} frequencyData - Frequency domain data
     * @param {Uint8Array} timeData - Time domain data
     * @param {Array<number>} energyData - Energy by bands
     * @private
     */
    _drawCombined(frequencyData, timeData, energyData) {
        const height = this.canvas.height;
        const halfHeight = height / 2;
        
        // Draw spectrum in bottom half
        this.ctx.save();
        this.ctx.translate(0, halfHeight);
        this.ctx.scale(1, 0.5);
        this._drawSpectrum(frequencyData, energyData);
        this.ctx.restore();
        
        // Draw waveform in top half
        this.ctx.save();
        this.ctx.translate(0, 0);
        this.ctx.scale(1, 0.5);
        this._drawWaveform(timeData);
        this.ctx.restore();
        
        // Draw divider line
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.moveTo(0, halfHeight);
        this.ctx.lineTo(this.canvas.width, halfHeight);
        this.ctx.stroke();
    }
    
    /**
     * Start animation loop
     * @param {Function} dataCallback - Function that returns audio data
     */
    start(dataCallback) {
        if (this.animationId) {
            this.stop();
        }
        
        const animate = () => {
            const audioData = dataCallback ? dataCallback() : null;
            if (audioData) {
                this.update(audioData);
            }
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);
    }
    
    /**
     * Stop animation loop
     */
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    /**
     * Set visualization mode
     * @param {string} mode - 'spectrum', 'waveform', or 'combined'
     */
    setMode(mode) {
        if (['spectrum', 'waveform', 'combined'].includes(mode)) {
            this.options.mode = mode;
            
            // Redraw if we have data
            if (this.frequencyData || this.timeData) {
                this.draw(this.frequencyData, this.timeData, this.energyData);
            }
        }
    }
    
    /**
     * Set visualization options
     * @param {Object} options - Options to update
     */
    setOptions(options) {
        this.options = { ...this.options, ...options };
        
        // Redraw if we have data
        if (this.frequencyData || this.timeData) {
            this.draw(this.frequencyData, this.timeData, this.energyData);
        }
    }
    
    /**
     * Resize the canvas
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Redraw if we have data
        if (this.frequencyData || this.timeData) {
            this.draw(this.frequencyData, this.timeData, this.energyData);
        }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        this.stop();
        
        if (this.options.responsive) {
            window.removeEventListener('resize', this._handleResize.bind(this));
        }
        
        this.canvas = null;
        this.ctx = null;
        this.frequencyData = null;
        this.timeData = null;
        this.energyData = null;
    }
}

export default AudioVisualizer; 