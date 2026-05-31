/**
 * Advanced audio analyzer with FFT and wavelet transform capabilities
 */
export class AudioAnalyzer {
    constructor(audioContext, options = {}) {
        this.audioContext = audioContext;
        this.options = {
            fftSize: 2048,
            smoothingTimeConstant: 0.8,
            minDecibels: -100,
            maxDecibels: -30,
            ...options
        };

        // Create analyzer node
        this.analyzer = this.audioContext.createAnalyser();
        this.analyzer.fftSize = this.options.fftSize;
        this.analyzer.smoothingTimeConstant = this.options.smoothingTimeConstant;
        this.analyzer.minDecibels = this.options.minDecibels;
        this.analyzer.maxDecibels = this.options.maxDecibels;

        // Create buffers for analysis
        this.frequencyData = new Float32Array(this.analyzer.frequencyBinCount);
        this.timeData = new Float32Array(this.analyzer.fftSize);
        this.waveletData = new Float32Array(this.analyzer.frequencyBinCount);
        
        // Create buffer pool for memory optimization
        this.bufferPool = [];
        this.maxBufferPoolSize = 10;
        this.initBufferPool();
    }

    initBufferPool() {
        // Initialize buffer pool
        for (let i = 0; i < this.maxBufferPoolSize; i++) {
            this.bufferPool.push(new Float32Array(this.analyzer.frequencyBinCount));
        }
    }

    getBuffer() {
        // Get a buffer from the pool or create a new one if pool is empty
        if (this.bufferPool.length > 0) {
            return this.bufferPool.pop();
        }
        return new Float32Array(this.analyzer.frequencyBinCount);
    }

    releaseBuffer(buffer) {
        // Release a buffer back to the pool if pool is not full
        if (this.bufferPool.length < this.maxBufferPoolSize) {
            this.bufferPool.push(buffer);
        }
    }

    connect(source) {
        // Connect source to analyzer
        source.connect(this.analyzer);
        return this.analyzer;
    }

    disconnect() {
        // Disconnect analyzer
        this.analyzer.disconnect();
    }

    getFrequencyData() {
        // Get frequency data
        this.analyzer.getFloatFrequencyData(this.frequencyData);
        return this.frequencyData;
    }

    getTimeData() {
        // Get time domain data
        this.analyzer.getFloatTimeDomainData(this.timeData);
        return this.timeData;
    }

    getWaveletData() {
        // Perform wavelet transform on frequency data
        this.performWaveletTransform(this.frequencyData, this.waveletData);
        return this.waveletData;
    }

    getAudioFeatures() {
        // Get comprehensive audio features
        const frequencyData = this.getFrequencyData();
        const timeData = this.getTimeData();
        const waveletData = this.getWaveletData();

        // Calculate audio features
        const features = {
            // Frequency features
            frequencyCentroid: this.calculateFrequencyCentroid(frequencyData),
            frequencySpread: this.calculateFrequencySpread(frequencyData),
            spectralFlux: this.calculateSpectralFlux(frequencyData),
            spectralRolloff: this.calculateSpectralRolloff(frequencyData),
            
            // Time features
            rms: this.calculateRMS(timeData),
            zeroCrossings: this.calculateZeroCrossings(timeData),
            crestFactor: this.calculateCrestFactor(timeData),
            
            // Wavelet features
            waveletEnergy: this.calculateWaveletEnergy(waveletData),
            waveletEntropy: this.calculateWaveletEntropy(waveletData)
        };

        return features;
    }

    performWaveletTransform(input, output) {
        // Simple Haar wavelet transform
        const n = input.length;
        const temp = new Float32Array(n);
        
        // Copy input to temp
        for (let i = 0; i < n; i++) {
            temp[i] = input[i];
        }
        
        // Perform Haar wavelet transform
        for (let step = 1; step < n; step *= 2) {
            for (let i = 0; i < n - step; i += step * 2) {
                const avg = (temp[i] + temp[i + step]) / Math.sqrt(2);
                const diff = (temp[i] - temp[i + step]) / Math.sqrt(2);
                
                temp[i] = avg;
                temp[i + step] = diff;
            }
        }
        
        // Copy result to output
        for (let i = 0; i < n; i++) {
            output[i] = temp[i];
        }
    }

    calculateFrequencyCentroid(frequencyData) {
        let numerator = 0;
        let denominator = 0;
        
        for (let i = 0; i < frequencyData.length; i++) {
            const magnitude = Math.pow(10, frequencyData[i] / 20);
            numerator += i * magnitude;
            denominator += magnitude;
        }
        
        return denominator > 0 ? numerator / denominator : 0;
    }

    calculateFrequencySpread(frequencyData) {
        const centroid = this.calculateFrequencyCentroid(frequencyData);
        let numerator = 0;
        let denominator = 0;
        
        for (let i = 0; i < frequencyData.length; i++) {
            const magnitude = Math.pow(10, frequencyData[i] / 20);
            numerator += Math.pow(i - centroid, 2) * magnitude;
            denominator += magnitude;
        }
        
        return denominator > 0 ? Math.sqrt(numerator / denominator) : 0;
    }

    calculateSpectralFlux(frequencyData) {
        // Get a buffer from the pool
        const previousData = this.getBuffer();
        
        // Calculate spectral flux
        let flux = 0;
        for (let i = 0; i < frequencyData.length; i++) {
            const diff = Math.pow(10, frequencyData[i] / 20) - Math.pow(10, previousData[i] / 20);
            flux += diff * diff;
        }
        
        // Copy current data to previous data
        for (let i = 0; i < frequencyData.length; i++) {
            previousData[i] = frequencyData[i];
        }
        
        return Math.sqrt(flux);
    }

    calculateSpectralRolloff(frequencyData) {
        // Calculate total energy
        let totalEnergy = 0;
        for (let i = 0; i < frequencyData.length; i++) {
            totalEnergy += Math.pow(10, frequencyData[i] / 20);
        }
        
        // Find frequency bin where cumulative energy exceeds 85% of total energy
        let cumulativeEnergy = 0;
        for (let i = 0; i < frequencyData.length; i++) {
            cumulativeEnergy += Math.pow(10, frequencyData[i] / 20);
            if (cumulativeEnergy >= 0.85 * totalEnergy) {
                return i;
            }
        }
        
        return frequencyData.length - 1;
    }

    calculateRMS(timeData) {
        let sum = 0;
        for (let i = 0; i < timeData.length; i++) {
            sum += timeData[i] * timeData[i];
        }
        return Math.sqrt(sum / timeData.length);
    }

    calculateZeroCrossings(timeData) {
        let crossings = 0;
        for (let i = 1; i < timeData.length; i++) {
            if ((timeData[i] >= 0 && timeData[i - 1] < 0) || (timeData[i] < 0 && timeData[i - 1] >= 0)) {
                crossings++;
            }
        }
        return crossings;
    }

    calculateCrestFactor(timeData) {
        const rms = this.calculateRMS(timeData);
        if (rms === 0) return 0;
        
        let peak = 0;
        for (let i = 0; i < timeData.length; i++) {
            peak = Math.max(peak, Math.abs(timeData[i]));
        }
        
        return peak / rms;
    }

    calculateWaveletEnergy(waveletData) {
        let energy = 0;
        for (let i = 0; i < waveletData.length; i++) {
            energy += waveletData[i] * waveletData[i];
        }
        return energy;
    }

    calculateWaveletEntropy(waveletData) {
        // Calculate total energy
        const totalEnergy = this.calculateWaveletEnergy(waveletData);
        if (totalEnergy === 0) return 0;
        
        // Calculate entropy
        let entropy = 0;
        for (let i = 0; i < waveletData.length; i++) {
            const p = (waveletData[i] * waveletData[i]) / totalEnergy;
            if (p > 0) {
                entropy -= p * Math.log2(p);
            }
        }
        
        return entropy;
    }

    dispose() {
        // Disconnect analyzer
        this.disconnect();
        
        // Clear buffer pool
        this.bufferPool = [];
    }
} 