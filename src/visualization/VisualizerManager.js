import { eventBus, EventTypes } from '../core/EventBus.js';
import { stateManager } from '../core/StateManager.js';

/**
 * @class VisualizerManager
 * @description Manages different visualization types and their lifecycle
 */
export class VisualizerManager {
    constructor() {
        this.canvas = null;
        this.context = null;
        this.currentVisualizer = null;
        this.visualizers = new Map();
        this.isActive = false;
        this.animationFrameId = null;
        this.lastFrameTime = 0;
        this.FRAME_RATE_LIMIT = 30;
    }
    
    /**
     * Initialize the visualizer manager
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @returns {boolean} Success status
     */
    initialize(canvas) {
        try {
            this.canvas = canvas;
            this.context = canvas.getContext('webgl2') || canvas.getContext('webgl');
            
            if (!this.context) {
                throw new Error('WebGL not supported');
            }
            
            // Set up canvas size
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
            
            // Initialize visualizers
            this.initializeVisualizers();
            
            return true;
        } catch (error) {
            console.error('Failed to initialize visualizer:', error);
            eventBus.emit(EventTypes.SYSTEM.ERROR, {
                message: 'Failed to initialize visualizer',
                error: error
            });
            return false;
        }
    }
    
    /**
     * Initialize available visualizers
     */
    initializeVisualizers() {
        // Register visualizer types
        this.registerVisualizer('particles', new ParticleVisualizer(this.context));
        this.registerVisualizer('meshWave', new MeshWaveVisualizer(this.context));
    }
    
    /**
     * Register a new visualizer type
     * @param {string} type - Visualizer type
     * @param {Visualizer} visualizer - Visualizer instance
     */
    registerVisualizer(type, visualizer) {
        this.visualizers.set(type, visualizer);
    }
    
    /**
     * Set the current visualizer type
     * @param {string} type - Visualizer type
     */
    setVisualizerType(type) {
        if (!this.visualizers.has(type)) {
            console.error(`Visualizer type ${type} not found`);
            return;
        }
        
        this.currentVisualizer = this.visualizers.get(type);
        this.currentVisualizer.initialize();
        
        eventBus.emit(EventTypes.VISUALIZATION.TYPE_CHANGE, {
            type: type
        });
    }
    
    /**
     * Start visualization
     */
    start() {
        if (!this.isActive) {
            this.isActive = true;
            this.animate();
            
            eventBus.emit(EventTypes.VISUALIZATION.TOGGLE, {
                active: true
            });
        }
    }
    
    /**
     * Stop visualization
     */
    stop() {
        this.isActive = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        eventBus.emit(EventTypes.VISUALIZATION.TOGGLE, {
            active: false
        });
    }
    
    /**
     * Animation loop
     * @param {number} timestamp - Current timestamp
     */
    animate(timestamp) {
        if (!this.isActive) return;
        
        // Limit frame rate
        if (timestamp - this.lastFrameTime < 1000 / this.FRAME_RATE_LIMIT) {
            this.animationFrameId = requestAnimationFrame((t) => this.animate(t));
            return;
        }
        
        this.lastFrameTime = timestamp;
        
        // Update current visualizer
        if (this.currentVisualizer) {
            this.currentVisualizer.update();
        }
        
        this.animationFrameId = requestAnimationFrame((t) => this.animate(t));
    }
    
    /**
     * Resize canvas to match display size
     */
    resizeCanvas() {
        if (!this.canvas) return;
        
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;
        
        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            
            if (this.currentVisualizer) {
                this.currentVisualizer.resize(displayWidth, displayHeight);
            }
        }
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        this.stop();
        this.visualizers.forEach(visualizer => visualizer.cleanup());
        this.visualizers.clear();
    }
}

/**
 * @class Visualizer
 * @description Base class for visualizers
 */
class Visualizer {
    constructor(context) {
        this.context = context;
        this.isInitialized = false;
    }
    
    /**
     * Initialize the visualizer
     */
    initialize() {
        this.isInitialized = true;
    }
    
    /**
     * Update the visualizer
     */
    update() {
        // To be implemented by subclasses
    }
    
    /**
     * Resize the visualizer
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        // To be implemented by subclasses
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        this.isInitialized = false;
    }
}

/**
 * @class ParticleVisualizer
 * @description Particle-based visualization
 * @extends Visualizer
 */
class ParticleVisualizer extends Visualizer {
    constructor(context) {
        super(context);
        this.particles = [];
        this.particleCount = 150;
    }
    
    initialize() {
        super.initialize();
        this.createParticles();
    }
    
    createParticles() {
        this.particles = [];
        
        // Get canvas dimensions
        const width = this.context.canvas.width;
        const height = this.context.canvas.height;
        
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 5 + 1,
                speedX: Math.random() * 3 - 1.5,
                speedY: Math.random() * 3 - 1.5,
                color: `hsla(${Math.random() * 360}, 100%, 50%, 0.7)`
            });
        }
    }
    
    update() {
        if (!this.isInitialized) return;
        
        const ctx = this.context;
        const canvas = ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearColor(0.0, 0.0, 0.0, 0.1);
        ctx.clear(ctx.COLOR_BUFFER_BIT);
        
        // Get audio data if available
        const audioData = stateManager.get('audioAnalyser');
        const stressLevel = stateManager.get('stressLevel') || 50;
        
        // Update and draw particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // Apply audio influence if available
            if (audioData && audioData.getByteFrequencyData) {
                const frequencyData = new Uint8Array(audioData.frequencyBinCount);
                audioData.getByteFrequencyData(frequencyData);
                
                // Use audio data to influence particle speed
                const audioIndex = Math.floor(i / this.particles.length * frequencyData.length);
                const audioValue = frequencyData[audioIndex] / 255;
                
                p.speedX += (Math.random() * 2 - 1) * audioValue * 0.2;
                p.speedY += (Math.random() * 2 - 1) * audioValue * 0.2;
            }
            
            // Apply stress level influence
            const stressInfluence = stressLevel / 50; // 0 to 2 range
            p.speedX *= 0.98 + (stressInfluence * 0.01);
            p.speedY *= 0.98 + (stressInfluence * 0.01);
            
            // Update position
            p.x += p.speedX;
            p.y += p.speedY;
            
            // Boundary checking
            if (p.x < 0 || p.x > width) p.speedX *= -1;
            if (p.y < 0 || p.y > height) p.speedY *= -1;
            
            // Draw particle using WebGL
            // This is a simplified version - in a real implementation,
            // you would create shader programs and use proper WebGL drawing methods
            this.drawParticle(p);
        }
    }
    
    drawParticle(_particle) {
        // Placeholder for WebGL drawing — shaders would render particles here.
    }
    
    resize(width, height) {
        // Adjust particle positions to new canvas dimensions
        const scaleX = width / this.context.canvas.width;
        const scaleY = height / this.context.canvas.height;
        
        this.particles.forEach(p => {
            p.x *= scaleX;
            p.y *= scaleY;
        });
    }
    
    cleanup() {
        this.particles = [];
        super.cleanup();
    }
}

/**
 * @class MeshWaveVisualizer
 * @description 3D mesh wave visualization
 * @extends Visualizer
 */
class MeshWaveVisualizer extends Visualizer {
    constructor(context) {
        super(context);
        this.gridSize = 20;
        this.vertices = [];
        this.vertexBuffer = null;
        this.program = null;
    }
    
    initialize() {
        super.initialize();
        
        try {
            // Create shader program
            this.program = this.createShaderProgram();
            
            // Create mesh geometry
            this.createMesh();
            
            // Create buffers
            this.createBuffers();
        } catch (error) {
            console.error('Failed to initialize MeshWaveVisualizer:', error);
            this.isInitialized = false;
        }
    }
    
    createShaderProgram() {
        const gl = this.context;
        
        // Vertex shader source
        const vsSource = `
            attribute vec3 position;
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            varying vec3 vPosition;
            
            void main() {
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        // Fragment shader source
        const fsSource = `
            precision mediump float;
            varying vec3 vPosition;
            uniform float time;
            uniform float stressLevel;
            
            void main() {
                float intensity = sin(vPosition.x * 10.0 + time) * cos(vPosition.y * 10.0 + time) * 0.5 + 0.5;
                float red = intensity * stressLevel / 100.0;
                float green = intensity * (1.0 - stressLevel / 100.0);
                float blue = intensity * 0.5;
                gl_FragColor = vec4(red, green, blue, 1.0);
            }
        `;
        
        // Create shaders
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vsSource);
        gl.compileShader(vertexShader);
        
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fsSource);
        gl.compileShader(fragmentShader);
        
        // Create program
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        // Check for compilation errors
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(vertexShader));
            gl.deleteShader(vertexShader);
        }
        
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(fragmentShader));
            gl.deleteShader(fragmentShader);
        }
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
        }
        
        return program;
    }
    
    createMesh() {
        // Create a grid of vertices
        this.vertices = [];
        
        const size = 2.0; // Grid spans from -1 to 1 in normalized device coordinates
        const step = size / this.gridSize;
        
        for (let i = 0; i <= this.gridSize; i++) {
            for (let j = 0; j <= this.gridSize; j++) {
                const x = (i / this.gridSize) * size - size / 2;
                const y = (j / this.gridSize) * size - size / 2;
                const z = 0;
                
                this.vertices.push(x, y, z);
            }
        }
    }
    
    createBuffers() {
        const gl = this.context;
        
        // Create vertex buffer
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    
    update() {
        if (!this.isInitialized || !this.program) return;
        
        const gl = this.context;
        const canvas = gl.canvas;
        
        // Clear canvas
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.0, 0.0, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Use shader program
        gl.useProgram(this.program);
        
        // Get audio data if available
        const audioData = stateManager.get('audioAnalyser');
        const stressLevel = stateManager.get('stressLevel') || 50;
        
        // Set uniforms
        gl.uniform1f(gl.getUniformLocation(this.program, 'time'), performance.now() / 1000.0);
        gl.uniform1f(gl.getUniformLocation(this.program, 'stressLevel'), stressLevel);
        
        // Set vertex attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        const positionLocation = gl.getAttribLocation(this.program, 'position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
        
        // Draw mesh
        gl.drawArrays(gl.POINTS, 0, this.vertices.length / 3);
        
        // Clean up
        gl.disableVertexAttribArray(positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.useProgram(null);
    }
    
    resize(width, height) {
        // Update projection matrix or other size-dependent parameters
        // This is a placeholder - in a real implementation, you would update your projection matrix
    }
    
    cleanup() {
        if (this.program) {
            this.context.deleteProgram(this.program);
            this.program = null;
        }
        
        if (this.vertexBuffer) {
            this.context.deleteBuffer(this.vertexBuffer);
            this.vertexBuffer = null;
        }
        
        this.vertices = [];
        super.cleanup();
    }
} 