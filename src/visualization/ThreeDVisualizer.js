/**
 * ThreeDVisualizer.js
 * Advanced 3D visualization for audio data using Three.js
 */

/**
 * Class for creating 3D visualizations of audio data
 * Note: This requires Three.js library to be available
 */
export class ThreeDVisualizer {
    /**
     * Create a new 3D audio visualizer
     * @param {HTMLElement} container - The DOM element to render in
     * @param {Object} options - Visualization options
     */
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            particleCount: options.particleCount || 2048,
            particleSize: options.particleSize || 2,
            particleColor: options.particleColor || 0x00ffff,
            backgroundColor: options.backgroundColor || 0x000000,
            waveformHeight: options.waveformHeight || 100,
            responsiveScale: options.responsiveScale !== undefined ? options.responsiveScale : true,
            autoRotate: options.autoRotate !== undefined ? options.autoRotate : true,
            rotationSpeed: options.rotationSpeed || 0.001,
            mode: options.mode || 'particles', // 'particles', 'waveform', 'frequency', 'combined'
            cameraPosition: options.cameraPosition || { x: 0, y: 0, z: 500 },
            fogDensity: options.fogDensity || 0.001,
            fps: options.fps || 60
        };
        
        // Initialize Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.waveform = null;
        this.frequencyBars = null;
        this.raycaster = null;
        this.mouse = null;
        
        // Animation
        this.animationId = null;
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / this.options.fps;
        
        // Audio data
        this.frequencyData = null;
        this.timeData = null;
        this.energyData = null;
        
        // Initialize
        this._initThree();
        this._initObjects();
        this._initEventListeners();
    }
    
    /**
     * Initialize Three.js scene, camera, and renderer
     * @private
     */
    _initThree() {
        // Create scene
        this.scene = new THREE.Scene();
        
        // Add fog for depth
        this.scene.fog = new THREE.FogExp2(this.options.backgroundColor, this.options.fogDensity);
        this.scene.background = new THREE.Color(this.options.backgroundColor);
        
        // Create camera
        const { width, height } = this.container.getBoundingClientRect();
        const aspectRatio = width / height;
        this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 1, 3000);
        this.camera.position.set(
            this.options.cameraPosition.x,
            this.options.cameraPosition.y,
            this.options.cameraPosition.z
        );
        this.camera.lookAt(0, 0, 0);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Add renderer to DOM
        this.container.appendChild(this.renderer.domElement);
        
        // Add raycaster for mouse interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }
    
    /**
     * Initialize visualization objects
     * @private
     */
    _initObjects() {
        // Create objects based on mode
        this._createParticleSystem();
        
        if (this.options.mode === 'waveform' || this.options.mode === 'combined') {
            this._createWaveform();
        }
        
        if (this.options.mode === 'frequency' || this.options.mode === 'combined') {
            this._createFrequencyBars();
        }
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 1, 1);
        this.scene.add(directionalLight);
    }
    
    /**
     * Create particle system for visualization
     * @private
     */
    _createParticleSystem() {
        const particleCount = this.options.particleCount;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Create particles in a sphere formation
        const color = new THREE.Color(this.options.particleColor);
        
        for (let i = 0; i < particleCount; i++) {
            // Position
            const radius = 200;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            // Color
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            // Size
            sizes[i] = this.options.particleSize * Math.random();
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material
        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                pointTexture: { value: new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAEO0lEQVRYw8WXTWhcVRTHf+e+92YmM5OZJi1JDC2VRkoRibULEVTciAtBpYIIIrpTEF1oaxcK7UKtdKPgByIi6EaxFhUXIgouRBTRRZVS+pVUWpK26ZdpMk1mJvPxXhf3TTJ5mUkm6Wji2bz3zrv3nv/5n3PuPVfZjhURwWLh0XDIBmxVYbuCQQvbFYQCeVBzCs4pOBFyj91/mDiKUsl6KKeUss5YRq9Vz25tCB507UVnufR0Tj1x9hY2A6SU0lt4shA4fDN0+Ehkb0Ph9c6a2u/GnCouzdUTlNYDITKrewMPjnR7x98ZDZ/KGsulHOSNxaS9C1A0FsuTcYczRvk1Amey6pmxYZIJ1cLewKdDRwIe6wnZH9uL9cU7AvDGaBefzTlsFDz0wLB69MwtlACtAN7e5/PaUId5oC8MH+31OzpBaUHgZEZzJG1ja/CNHXNDR8eMU3+DdXnFQHf73xtQMlkDx+YcdEXwVbfHN/t9bvfDtpsGgQ+mc5zOOQ2FZ1VRfzbsVfdcwRFEeGHQ49X+jqvePHg8rXgq6TLrLM8PeLw82HlvEYEPZ1yOzOlG8CQWTu6q8AgigsCBZI7fcs5VbxYcz1q8OZMnY4X9oeBZKnV+3Qj8uGj4eFbXg4cKk0XNKUDg1J8uw7EOI71eTwvOAj/khLdnAmZt87RJaJWvXwFw3lpenny7FNS+AJGGhIgwk3c4PJHljZuylZLSLCeWLL/nVKn6GlRCFa9dqXlhzQrjuQWdLnEQwFjL0YksT97QwerVQIrfz6QNY3mVF9XclsaQLi+DAlKe4tJCgaMTGV6/IdNWeSNVlSjMi+JvazW2wSKUaE+4GG5MZDi0J9PSQTkhWi0Zq0iLPl/pV3IQmwI5Y0hkXT7cm2kbplV9kBZtrxWAUNj0AGSs8PFkltdGMtdsoLQSbAyAxTY8AQbBOuGLZI6n+tKM9rZ2ki+Ng7UcrGmz1q/hhrbCR7MBO8PysrIW5K3l00ReyBnJFwzYEgHf9Nrwc9bVveZdYVN6DRWB7xIWEcXBfq8mDOdSOUbnXKxA4CnuG3I4NGLq1nnSrgwbrZlAM4G6qpCzljvjilujy1TkjOXLRJ5/rao4BrZFir1RTRiuZC3fpQw7fM3u7mp7vCDMNThGZBIhNc0H1hKzSe8KW/Kx5MJCCWS8Z8gQ1SnpLWEEK1I3sD3bHwmxK9HVdZ8Wri7VgAWxTXZVdDPrK56nww2JrFDyYj1p02LHRZ9dCwCnaSYAKG8vb47FRbdv0xHPY6Qv5J6+UH1lQWCrhP7sOPqVPwA2MrF6D8jl9u6LxHpiq9eECCSW8tzx12VsQeqwOvDFmcHLQ1F1DU6u9wGlFAhDmJQbiO6NfMdxXVkHgKp4qFS89h/YZDYf96UvEwAAAABJRU5ErkJggg==') }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                uniform float time;
                varying vec3 vColor;
                void main() {
                    vColor = color;
                    vec3 newPosition = position;
                    gl_PointSize = size;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                void main() {
                    gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true,
            vertexColors: true
        });
        
        // Create particle system
        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(this.particles);
    }
    
    /**
     * Create waveform visualization
     * @private
     */
    _createWaveform() {
        const waveformGeometry = new THREE.BufferGeometry();
        const waveformMaterial = new THREE.LineBasicMaterial({
            color: this.options.particleColor,
            linewidth: 2
        });
        
        // Create points for the line
        const positions = new Float32Array(128 * 3);
        const width = 300;
        const height = this.options.waveformHeight;
        
        for (let i = 0; i < 128; i++) {
            positions[i * 3] = (i / 128) * width - width / 2;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
        }
        
        waveformGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        this.waveform = new THREE.Line(waveformGeometry, waveformMaterial);
        this.waveform.visible = (this.options.mode === 'waveform' || this.options.mode === 'combined');
        this.scene.add(this.waveform);
    }
    
    /**
     * Create frequency bars visualization
     * @private
     */
    _createFrequencyBars() {
        const numBars = 64;
        const barWidth = 4;
        const barSpacing = 1;
        const totalWidth = numBars * (barWidth + barSpacing);
        
        this.frequencyBars = new THREE.Group();
        
        // Create individual bars
        for (let i = 0; i < numBars; i++) {
            const barGeometry = new THREE.BoxGeometry(barWidth, 1, barWidth);
            const barMaterial = new THREE.MeshPhongMaterial({
                color: this.options.particleColor,
                emissive: this.options.particleColor,
                emissiveIntensity: 0.5,
                shininess: 50
            });
            
            const bar = new THREE.Mesh(barGeometry, barMaterial);
            const x = (i * (barWidth + barSpacing)) - totalWidth / 2;
            bar.position.set(x, 0, 0);
            
            this.frequencyBars.add(bar);
        }
        
        this.frequencyBars.visible = (this.options.mode === 'frequency' || this.options.mode === 'combined');
        this.frequencyBars.position.y = -100;
        this.scene.add(this.frequencyBars);
    }
    
    /**
     * Set up event listeners
     * @private
     */
    _initEventListeners() {
        // Resize handler
        window.addEventListener('resize', this._handleResize.bind(this));
        
        // Mouse move handler for interaction
        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });
    }
    
    /**
     * Handle window resize
     * @private
     */
    _handleResize() {
        const { width, height } = this.container.getBoundingClientRect();
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    /**
     * Update visualization with audio data
     * @param {Object} audioData - Object containing audio analysis data
     */
    update(audioData) {
        if (!audioData) return;
        
        // Store data for animation
        if (audioData.frequencyData) {
            this.frequencyData = audioData.frequencyData;
        }
        
        if (audioData.timeData) {
            this.timeData = audioData.timeData;
        }
        
        if (audioData.energyByBands) {
            this.energyData = audioData.energyByBands;
        }
    }
    
    /**
     * Animate the visualization
     * @private
     */
    _animate() {
        const now = performance.now();
        
        // Throttle rendering based on FPS setting
        if (now - this.lastFrameTime < this.frameInterval) {
            this.animationId = requestAnimationFrame(this._animate.bind(this));
            return;
        }
        
        this.lastFrameTime = now;
        
        // Update particles based on audio data
        if (this.particles && this.frequencyData) {
            const positions = this.particles.geometry.attributes.position.array;
            const sizes = this.particles.geometry.attributes.size.array;
            const colors = this.particles.geometry.attributes.color.array;
            
            const particleCount = this.options.particleCount;
            const color = new THREE.Color(this.options.particleColor);
            
            // Update each particle based on audio data
            for (let i = 0; i < particleCount; i++) {
                // Get frequency data bin for this particle
                const dataIndex = Math.floor(i / particleCount * this.frequencyData.length);
                const frequency = this.frequencyData[dataIndex] / 255;
                
                // Update position
                const radius = 200 + frequency * 100;
                const theta = (i / particleCount) * Math.PI * 2;
                const phi = Math.acos(2 * (i / particleCount) - 1);
                
                positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
                positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                positions[i * 3 + 2] = radius * Math.cos(phi);
                
                // Update size based on frequency
                sizes[i] = this.options.particleSize + this.options.particleSize * frequency * 3;
                
                // Update color based on frequency (optional)
                if (this.options.dynamicColors) {
                    const freqColor = new THREE.Color().setHSL(frequency, 1, 0.5);
                    colors[i * 3] = freqColor.r;
                    colors[i * 3 + 1] = freqColor.g;
                    colors[i * 3 + 2] = freqColor.b;
                }
            }
            
            // Update attributes
            this.particles.geometry.attributes.position.needsUpdate = true;
            this.particles.geometry.attributes.size.needsUpdate = true;
            
            if (this.options.dynamicColors) {
                this.particles.geometry.attributes.color.needsUpdate = true;
            }
            
            // Rotate particle system
            if (this.options.autoRotate) {
                this.particles.rotation.y += this.options.rotationSpeed;
            }
        }
        
        // Update waveform visualization
        if (this.waveform && this.timeData) {
            const positions = this.waveform.geometry.attributes.position.array;
            const width = 300;
            const height = this.options.waveformHeight;
            
            for (let i = 0; i < Math.min(128, this.timeData.length); i++) {
                const value = ((this.timeData[i] / 128) - 1) * height;
                positions[i * 3] = (i / 128) * width - width / 2;
                positions[i * 3 + 1] = value;
            }
            
            this.waveform.geometry.attributes.position.needsUpdate = true;
        }
        
        // Update frequency bars
        if (this.frequencyBars && this.frequencyData) {
            const bars = this.frequencyBars.children;
            
            for (let i = 0; i < bars.length; i++) {
                const bar = bars[i];
                
                // Map bar index to frequency data
                const index = Math.floor((i / bars.length) * this.frequencyData.length);
                const value = this.frequencyData[index] / 255;
                
                // Scale the bar height based on frequency value
                const targetHeight = Math.max(1, value * 100);
                bar.scale.y = targetHeight;
                bar.position.y = targetHeight / 2;
                
                // Add subtle rotation for effect
                bar.rotation.y += 0.01 * value;
                
                // Update color based on frequency (optional)
                if (this.options.dynamicColors) {
                    const hue = i / bars.length;
                    const sat = 0.8;
                    const lum = 0.6 + value * 0.4;
                    bar.material.color.setHSL(hue, sat, lum);
                    bar.material.emissive.setHSL(hue, sat, lum * 0.5);
                }
            }
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
        
        // Continue animation loop
        this.animationId = requestAnimationFrame(this._animate.bind(this));
    }
    
    /**
     * Start visualization animation
     */
    start() {
        if (this.animationId) {
            this.stop();
        }
        
        this._animate();
    }
    
    /**
     * Stop visualization animation
     */
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    /**
     * Set visualization mode
     * @param {string} mode - 'particles', 'waveform', 'frequency', or 'combined'
     */
    setMode(mode) {
        if (['particles', 'waveform', 'frequency', 'combined'].includes(mode)) {
            this.options.mode = mode;
            
            // Update visibility
            if (this.waveform) {
                this.waveform.visible = (mode === 'waveform' || mode === 'combined');
            }
            
            if (this.frequencyBars) {
                this.frequencyBars.visible = (mode === 'frequency' || mode === 'combined');
            }
        }
    }
    
    /**
     * Set visualization options
     * @param {Object} options - Options to update
     */
    setOptions(options) {
        this.options = { ...this.options, ...options };
        
        // Update frame interval if fps changed
        if (options.fps) {
            this.frameInterval = 1000 / this.options.fps;
        }
        
        // Update camera position if specified
        if (options.cameraPosition) {
            this.camera.position.set(
                options.cameraPosition.x,
                options.cameraPosition.y,
                options.cameraPosition.z
            );
        }
    }
    
    /**
     * Change camera position
     * @param {Object} position - New camera position {x, y, z}
     */
    setCameraPosition(position) {
        this.camera.position.set(position.x, position.y, position.z);
        this.camera.lookAt(0, 0, 0);
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        this.stop();
        
        // Remove event listeners
        window.removeEventListener('resize', this._handleResize.bind(this));
        
        // Dispose geometries and materials
        if (this.particles) {
            this.particles.geometry.dispose();
            this.particles.material.dispose();
            this.scene.remove(this.particles);
        }
        
        if (this.waveform) {
            this.waveform.geometry.dispose();
            this.waveform.material.dispose();
            this.scene.remove(this.waveform);
        }
        
        if (this.frequencyBars) {
            this.frequencyBars.children.forEach(bar => {
                bar.geometry.dispose();
                bar.material.dispose();
            });
            this.scene.remove(this.frequencyBars);
        }
        
        // Remove renderer from DOM
        if (this.renderer) {
            this.container.removeChild(this.renderer.domElement);
            this.renderer.dispose();
        }
        
        // Clear references
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.waveform = null;
        this.frequencyBars = null;
        this.container = null;
    }
}

export default ThreeDVisualizer; 