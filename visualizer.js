// Remove or comment out the duplicate analyser declaration
// let analyser; // Remove this line if it exists at the top

// Check if Three.js is loaded immediately
(function checkThreeJsLoaded() {
    if (typeof THREE === 'undefined') {
        console.error('Three.js library not detected at initialization time');
    } else {
        console.log('Three.js library detected, version:', THREE.REVISION);
    }
})();

let canvas;
let audioAnalyser; // Add this to make it available throughout the file
let isVisualizerActive = false;
let animationFrameId = null; // To store the requestAnimationFrame ID
let lastFrameTime = 0;
const FRAME_RATE_LIMIT = 30; // Limit to 30 FPS

// Three.js variables
let scene, camera, renderer;
let particles = []; // Array to hold particle objects { mesh, baseX, ... }
let waveMesh = null; // To hold the mesh wave object
let currentVizType = 'particles'; // Track the active visualizer type
let visualizerGroup = null; // Group to hold visualizer objects for easy clearing

// Add a visualizer state object to track complex visualizations
let visualizerState = {
    wavePatterns: [],
    resonancePoints: []
};

// Exposed function to set up the visualizer
// Called from app.js when generating a track or changing type
window.setupVisualizer = function(canvasElement, analyser, vizType = 'particles') {
    console.log(`Setting up visualizer: ${vizType}`);
    
    // Always get the canvas by ID to ensure we have the correct element
    canvasElement = document.getElementById('visualizerCanvas');
    if (!canvasElement) {
        console.error("Visualizer setup failed: Canvas element with ID 'visualizerCanvas' not found.");
        
        // Try to debug canvas issues
        const visualizerContainer = document.getElementById('visualizerContainer');
        console.log("Visualizer container exists:", !!visualizerContainer);
        
        if (visualizerContainer) {
            // If container exists but canvas doesn't, create a canvas
            console.log("Creating canvas element since it doesn't exist");
            canvasElement = document.createElement('canvas');
            canvasElement.id = 'visualizerCanvas';
            canvasElement.width = visualizerContainer.clientWidth;
            canvasElement.height = visualizerContainer.clientHeight;
            canvasElement.style.width = '100%';
            canvasElement.style.height = '100%';
            visualizerContainer.appendChild(canvasElement);
        } else {
            console.error("Visualizer container not found, cannot proceed with setup");
            return;
        }
    }
    
    canvas = canvasElement;
    console.log("Canvas element ready:", {
        id: canvas.id,
        width: canvas.width,
        clientWidth: canvas.clientWidth,
        height: canvas.height,
        clientHeight: canvas.clientHeight,
        offsetWidth: canvas.offsetWidth,
        offsetHeight: canvas.offsetHeight
    });
    
    // Ensure canvas has proper dimensions
    if (canvas.width === 0 || canvas.height === 0) {
        canvas.width = canvas.clientWidth || 400;
        canvas.height = canvas.clientHeight || 300;
        console.log("Adjusted canvas dimensions:", canvas.width, "x", canvas.height);
    }
    
    // Use the existing analyser from audio.js or get it if not provided
    if (analyser) {
        audioAnalyser = analyser;
    } else if (window.getAnalyser) {
        console.log("Getting analyser from audio.js");
        audioAnalyser = window.getAnalyser();
    }
    
    if (!audioAnalyser) {
        console.error("Visualizer setup failed: Audio Analyser not available");
        // Try to create a fallback analyser
        try {
            if (window.getAudioContext && window.getAudioContext()) {
                const audioCtx = window.getAudioContext();
                audioAnalyser = audioCtx.createAnalyser();
                audioAnalyser.fftSize = 512;
                console.log("Created fallback analyser");
            }
        } catch (e) {
            console.error("Failed to create fallback analyser:", e);
        }
    } else {
        console.log("Audio analyser ready:", {
            fftSize: audioAnalyser.fftSize,
            frequencyBinCount: audioAnalyser.frequencyBinCount
        });
    }
    
    currentVizType = vizType;
    
    // Check for Three.js
    if (typeof THREE === 'undefined') {
        console.error('Three.js library not available. Attempting to load it dynamically.');
        // Add fallback to load Three.js
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = () => {
            console.log("Three.js loaded dynamically");
            initializeThreeJS();
        };
        script.onerror = () => {
            console.error("Failed to load Three.js dynamically");
            renderFallbackMessage("Could not load Three.js library");
        };
        document.head.appendChild(script);
        return;
    } else {
        initializeThreeJS();
    }
    
    function initializeThreeJS() {
        // Clean up any existing renderer
        if (renderer) {
            console.log("Disposing existing renderer");
            renderer.dispose();
            renderer = null;
        }
        
        try {
            console.log("Initializing Three.js scene");
            
            // Create scene
            scene = new THREE.Scene();
            
            // Set camera with proper aspect ratio
            const aspectRatio = canvas.width / canvas.height;
            camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
            camera.position.z = 50;
            window.camera = camera;
            
            // Create renderer
            renderer = new THREE.WebGLRenderer({ 
                canvas: canvas, 
                antialias: true, 
                alpha: true
            });
            
            renderer.setSize(canvas.width, canvas.height);
            renderer.setPixelRatio(window.devicePixelRatio);
            
            // Create group for visualization objects
            visualizerGroup = new THREE.Group();
            scene.add(visualizerGroup);
            
            // Handle window resize (single listener; remove before re-add)
            window.removeEventListener('resize', onWindowResize, false);
            window.addEventListener('resize', onWindowResize, false);
            
            console.log("Three.js initialization successful", {
                scene: !!scene,
                camera: !!camera,
                renderer: !!renderer,
                canvas: canvas.id,
                dimensions: `${canvas.width}x${canvas.height}`
            });
            
            // Initialize selected visualizer
            cleanupVisualizer();
            
            if (currentVizType === 'particles') {
                initParticleVisualizer();
            } else if (currentVizType === 'meshWave') {
                initMeshWaveVisualizer();
            } else {
                console.warn(`Unknown visualizer type: ${currentVizType}. Using particles.`);
                initParticleVisualizer();
                currentVizType = 'particles';
            }
            
            // Start visualization if active
            if (isVisualizerActive) {
                startDrawing();
            }
            
        } catch (error) {
            console.error("Error initializing Three.js:", error);
            renderFallbackMessage("WebGL initialization failed: " + error.message);
        }
    }
    
    function renderFallbackMessage(message) {
        if (canvas && canvas.getContext) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = "#14172B";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "white";
                ctx.font = "16px Arial";
                ctx.textAlign = "center";
                ctx.fillText(message, canvas.width/2, canvas.height/2);
                ctx.fillText("Please check console for details", canvas.width/2, canvas.height/2 + 30);
            }
        }
    }
}

// Remove previous visualizer objects from the scene
function cleanupVisualizer() {
    console.log("Cleaning up previous visualizer objects");
    if (!visualizerGroup) {
        visualizerGroup = new THREE.Group();
        if (scene) scene.add(visualizerGroup);
        return;
    }
    
    // Remove all children from the group
    while (visualizerGroup.children.length > 0) {
        const object = visualizerGroup.children[0];
        visualizerGroup.remove(object);
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
            } else {
                object.material.dispose();
            }
        }
    }
    
    // Reset visualization variables
    particles = [];
    waveMesh = null;
}

// Initialize the Particle System Visualizer
function initParticleVisualizer() {
    console.log("Initializing Particle Visualizer");
    const PARTICLE_COUNT = 150;
    const soundType = document.getElementById('soundType')?.value || 'binauralRelax';
    const particleConfig = getParticleConfigForSoundType(soundType);
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const geometry = new THREE.SphereGeometry(particleConfig.size || 0.5, 8, 8);
        
        let color;
        if (particleConfig.useGradient) {
            color = new THREE.Color(`hsl(${particleConfig.baseHue + (i / PARTICLE_COUNT) * particleConfig.hueRange}, 80%, 60%)`);
        } else {
            const palette = particleConfig.palette || ['#ffffff'];
            color = new THREE.Color(palette[i % palette.length]);
        }
        
        const material = new THREE.MeshBasicMaterial({
            color: color, 
            transparent: true, 
            opacity: 0.8 
        });
        
        const mesh = new THREE.Mesh(geometry, material);

        // Position particles based on config or use random positioning
        mesh.position.x = (Math.random() - 0.5) * 80;
        mesh.position.y = (Math.random() - 0.5) * 80;
        mesh.position.z = (Math.random() - 0.5) * 80;
        
        // Store original position for animation reference
        const particle = {
            mesh: mesh,
            baseX: mesh.position.x,
            baseY: mesh.position.y,
            baseZ: mesh.position.z,
            // Add randomness to make particles move differently
            pulseSpeed: 0.1 + Math.random() * 0.2,
            rotationSpeed: 0.01 + Math.random() * 0.02
        };
        
        particles.push(particle);
        visualizerGroup.add(mesh);
    }
    
    console.log(`Particle visualizer initialized with ${particles.length} particles`);
}

// Initialize Mesh Wave Visualizer
function initMeshWaveVisualizer() {
    console.log("Initializing Mesh Wave Visualizer");
    
    const geometry = new THREE.PlaneGeometry(60, 60, 32, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00EFFF,
        wireframe: true,
        transparent: true,
        opacity: 0.8
    });
    
    waveMesh = new THREE.Mesh(geometry, material);
    waveMesh.rotation.x = -Math.PI / 6; // Tilt the wave
    
    visualizerGroup.add(waveMesh);
    console.log("Mesh Wave visualizer initialized");
}

// Update the particle visualizer based on audio data
function updateParticleVisualizer(dataArray, averageAmplitude, timestamp) {
    if (!particles.length) return;
    
    const bassFactor = getFrequencyRangeValue(dataArray, 0, 10) / 255.0;
    const midFactor = getFrequencyRangeValue(dataArray, 10, 100) / 255.0;
    const trebleFactor = getFrequencyRangeValue(dataArray, 100, 255) / 255.0;
    
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        const { mesh, baseX, baseY, baseZ, pulseSpeed, rotationSpeed } = particle;
        
        // Calculate new position based on audio data
        const scale = 1 + averageAmplitude * 0.2;
        mesh.scale.set(scale, scale, scale);
        
        // Apply different frequency bands to different axes
        mesh.position.x = baseX + (bassFactor * 20) * Math.sin(timestamp * 0.001 * pulseSpeed);
        mesh.position.y = baseY + (midFactor * 15) * Math.cos(timestamp * 0.001 * pulseSpeed);
        mesh.position.z = baseZ + (trebleFactor * 10);
        
        // Apply rotation
        mesh.rotation.x += rotationSpeed * bassFactor;
        mesh.rotation.y += rotationSpeed * midFactor;
        mesh.rotation.z += rotationSpeed * trebleFactor;
    }
    
    // Update the visualization state for more complex patterns
    visualizerState.resonancePoints = [bassFactor, midFactor, trebleFactor];
}

// Update the mesh wave visualizer based on audio data
function updateMeshWaveVisualizer(dataArray) {
    if (!waveMesh || !waveMesh.geometry) return;
    
    const positions = waveMesh.geometry.attributes.position;
    const count = positions.count;
    
    // Apply audio data to vertex heights
    for (let i = 0; i < count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        
        // Get the corresponding frequency bin value
        const freqIndex = Math.min(Math.floor(i / count * dataArray.length), dataArray.length - 1);
        const height = (dataArray[freqIndex] / 512) * 15;
        
        // Calculate Z based on distance from center and audio data
        const distance = Math.sqrt(x * x + y * y);
        const amplitude = Math.max(0, 1 - distance / 30);
        const z = height * amplitude * Math.sin(distance * 0.1 + Date.now() * 0.001);
        
        positions.setZ(i, z);
    }
    
    positions.needsUpdate = true;
}

// Helper to get average value in a frequency range
function getFrequencyRangeValue(dataArray, startIndex, endIndex) {
    let total = 0;
    const length = Math.min(endIndex, dataArray.length) - startIndex;
    
    if (length <= 0) return 0;
    
    for (let i = startIndex; i < endIndex && i < dataArray.length; i++) {
        total += dataArray[i];
    }
    
    return total / length;
}

// Main render loop
function drawVisualizer(timestamp) {
    // Use RAF for smooth animation
    animationFrameId = requestAnimationFrame(drawVisualizer);
    
    // Limit frame rate
    const elapsed = timestamp - lastFrameTime;
    if (elapsed < 1000 / FRAME_RATE_LIMIT) return;
    lastFrameTime = timestamp;
    
    // Check dependencies are available
    if (!canvas || !scene || !camera || !renderer) {
        console.error("Three.js renderer not initialized, stopping visualizer");
        console.log("Component state:", {
            canvasExists: !!canvas,
            threeJsExists: typeof THREE !== 'undefined',
            sceneExists: !!scene,
            cameraExists: !!camera
        });
        stopDrawing();
        return;
    }
    
    // Check for analyser availability
    if (!audioAnalyser) {
        console.warn("Audio analyser not available in draw loop, attempting to get it");
        if (window.getAnalyser) {
            audioAnalyser = window.getAnalyser();
            if (!audioAnalyser) {
                console.error("Could not retrieve audio analyser");
                if (canvas.getContext('2d')) {
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = "#14172B";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = "white";
                    ctx.font = "16px Arial";
                    ctx.textAlign = "center";
                    ctx.fillText("Audio not connected", canvas.width/2, canvas.height/2);
                }
                return;
            }
        }
    }
    
    // Get audio data
    const bufferLength = audioAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    audioAnalyser.getByteFrequencyData(dataArray);
    
    // Calculate average amplitude
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
    }
    const averageAmplitude = sum / bufferLength / 255.0;
    
    // Update the active visualizer
    if (currentVizType === 'particles') {
        updateParticleVisualizer(dataArray, averageAmplitude, timestamp);
    } else if (currentVizType === 'meshWave') {
        updateMeshWaveVisualizer(dataArray);
    }
    
    // Render scene
    renderer.render(scene, camera);
}

// Start the visualization
function startDrawing() {
    console.log("Starting visualizer animation loop.");
    if (!animationFrameId) {
        lastFrameTime = 0;
        animationFrameId = requestAnimationFrame(drawVisualizer);
    }
}

// Stop the visualization
function stopDrawing() {
    console.log("Stopping visualizer animation loop.");
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// Visualizer play/pause — called from audio.js via window.__vizSetPlayingState only
window.__vizSetPlayingState = function(isPlaying) {
    console.log("Setting visualizer active state:", isPlaying);
    isVisualizerActive = isPlaying;
    
    if (isPlaying) {
        if (!canvas) {
            canvas = document.getElementById('visualizerCanvas');
            if (!canvas) {
                console.error("Cannot start visualizer: Canvas not found");
                return;
            }
        }
        
        if (!audioAnalyser && window.getAnalyser) {
            audioAnalyser = window.getAnalyser();
        }
        
        if (!scene || !camera || !renderer) {
            console.log("Reinitializing Three.js components");
            window.setupVisualizer(canvas, audioAnalyser, currentVizType);
        } else {
            startDrawing();
        }
    } else {
        stopDrawing();
    }
};

window.changeVisualizerType = function (type) {
    const el = document.getElementById('visualizerCanvas');
    const analyser = window.getAnalyser && window.getAnalyser();
    if (!el || !analyser) {
        console.warn('changeVisualizerType: missing canvas or analyser');
        return;
    }
    currentVizType = type === 'meshWave' || type === 'particles' ? type : 'particles';
    window.setupVisualizer(el, analyser, currentVizType);
};

// Handle window resize
let resizeDebounceTimer = null;
function onWindowResize() {
    clearTimeout(resizeDebounceTimer);
    resizeDebounceTimer = setTimeout(() => {
        if (!canvas || !camera || !renderer) return;
    
    // Get actual container dimensions for proper sizing
    const container = canvas.parentElement;
    const width = container ? container.clientWidth : window.innerWidth;
    const height = container ? container.clientHeight : 300;
    
    // Update canvas dimensions if needed
    if (canvas.width !== width || canvas.height !== height) {
        console.log(`Resizing canvas to ${width}x${height}`);
        canvas.width = width;
        canvas.height = height;
    }
    
    // Update camera and renderer
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    
    console.log("Visualizer resized:", {
        width: width,
        height: height,
        aspect: camera.aspect
    });
    }, 120);
}

// Configuration based on sound type
function getParticleConfigForSoundType(type) {
    // Default configuration
    const defaultConfig = {
        size: 0.5,
        useGradient: true,
        baseHue: 220,
        hueRange: 60,
        motionIntensity: 1.0,
        positioning: 'random',
        palette: ['#7668f8', '#6c8bef', '#5856d6']
    };
    
    // Sound-specific configurations
    const configs = {
        binauralRelax: {
            baseHue: 240, // Blue hues
            motionIntensity: 0.8,
            positioning: 'circular'
        },
        binauralFocus: {
            baseHue: 120, // Green hues
            motionIntensity: 1.2,
            positioning: 'grid'
        },
        binauralSleep: {
            baseHue: 280, // Purple hues
            motionIntensity: 0.5,
            positioning: 'wave'
        },
        pinkNoise: {
            baseHue: 0, // Red hues
            useGradient: false,
            palette: ['#ff6b6b', '#ff8e8e', '#ffb3b3'],
            positioning: 'noise'
        },
        isochronic: {
            baseHue: 60, // Yellow hues
            motionIntensity: 1.5,
            positioning: 'pulse'
        }
    };
    
    return { ...defaultConfig, ...(configs[type] || {}) };
}

console.log("visualizer.js loaded and refactored."); 