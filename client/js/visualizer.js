/**
 * CalmMind Three.js visualizer (particles + mesh wave).
 * Loaded after audio.js; uses window.getAnalyser and window.setupVisualizer.
 */
'use strict';

const DEBUG_VIZ = false;
const FRAME_RATE_LIMIT = 30;

function debugLog(...args) {
    if (DEBUG_VIZ) console.log('[CalmMind viz]', ...args);
}

let canvas;
let audioAnalyser;
let isVisualizerActive = false;
let animationFrameId = null;
let lastFrameTime = 0;

// Three.js scene graph
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
    debugLog(`Setting up visualizer: ${vizType}`);
    
    // Always get the canvas by ID to ensure we have the correct element
    canvasElement = document.getElementById('visualizerCanvas');
    if (!canvasElement) {
        console.error("Visualizer setup failed: Canvas element with ID 'visualizerCanvas' not found.");
        
        // Try to debug canvas issues
        const visualizerContainer = document.getElementById('visualizerContainer');
        debugLog("Visualizer container exists:", !!visualizerContainer);
        
        if (visualizerContainer) {
            // If container exists but canvas doesn't, create a canvas
            debugLog("Creating canvas element since it doesn't exist");
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
    debugLog("Canvas element ready:", {
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
        debugLog("Adjusted canvas dimensions:", canvas.width, "x", canvas.height);
    }
    
    // Use the existing analyser from audio.js or get it if not provided
    if (analyser) {
        audioAnalyser = analyser;
    } else if (window.getAnalyser) {
        debugLog("Getting analyser from audio.js");
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
                debugLog("Created fallback analyser");
            }
        } catch (e) {
            console.error("Failed to create fallback analyser:", e);
        }
    } else {
        debugLog("Audio analyser ready:", {
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
            debugLog("Three.js loaded dynamically");
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
            debugLog("Disposing existing renderer");
            renderer.dispose();
            renderer = null;
        }
        
        try {
            debugLog("Initializing Three.js scene");
            
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
            
            debugLog("Three.js initialization successful", {
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
            } else if (currentVizType === 'spectrum') {
                debugLog('Spectrum mode — 2D frequency bars');
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
    debugLog("Cleaning up previous visualizer objects");
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
function positionParticle(i, count, mode) {
    const spread = 80;
    const t = i / count;
    switch (mode) {
        case 'grid': {
            const cols = Math.ceil(Math.sqrt(count));
            const row = Math.floor(i / cols);
            const col = i % cols;
            return {
                x: (col / cols - 0.5) * spread,
                y: (row / cols - 0.5) * spread,
                z: (Math.random() - 0.5) * 20,
            };
        }
        case 'circular': {
            const angle = t * Math.PI * 2 * 3;
            const radius = 25 + (i % 5) * 4;
            return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, z: (Math.random() - 0.5) * 30 };
        }
        case 'wave':
            return { x: (t - 0.5) * spread, y: Math.sin(t * Math.PI * 4) * 25, z: (Math.random() - 0.5) * 25 };
        case 'pulse':
            return { x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40, z: (Math.random() - 0.5) * 40 };
        default:
            return {
                x: (Math.random() - 0.5) * spread,
                y: (Math.random() - 0.5) * spread,
                z: (Math.random() - 0.5) * spread,
            };
    }
}

function initParticleVisualizer() {
    debugLog("Initializing Particle Visualizer");
    const PARTICLE_COUNT = 150;
    const soundType = document.getElementById('soundType')?.value || 'binauralRelax';
    const particleConfig = getParticleConfigForSoundType(soundType);
    const motionScale = particleConfig.motionIntensity ?? 1;
    
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

        const pos = positionParticle(i, PARTICLE_COUNT, particleConfig.positioning);
        mesh.position.x = pos.x;
        mesh.position.y = pos.y;
        mesh.position.z = pos.z;
        
        // Store original position for animation reference
        const particle = {
            mesh: mesh,
            baseX: mesh.position.x,
            baseY: mesh.position.y,
            baseZ: mesh.position.z,
            motionScale,
            pulseSpeed: (0.1 + Math.random() * 0.2) * motionScale,
            rotationSpeed: (0.01 + Math.random() * 0.02) * motionScale,
        };
        
        particles.push(particle);
        visualizerGroup.add(mesh);
    }
    
    debugLog(`Particle visualizer initialized with ${particles.length} particles`);
}

// Initialize Mesh Wave Visualizer
function initMeshWaveVisualizer() {
    debugLog("Initializing Mesh Wave Visualizer");
    
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
    debugLog("Mesh Wave visualizer initialized");
}

// Update the particle visualizer based on audio data
function updateParticleVisualizer(dataArray, averageAmplitude, timestamp) {
    if (!particles.length) return;
    
    const bassFactor = getFrequencyRangeValue(dataArray, 0, 10) / 255.0;
    const midFactor = getFrequencyRangeValue(dataArray, 10, 100) / 255.0;
    const trebleFactor = getFrequencyRangeValue(dataArray, 100, 255) / 255.0;
    
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        const { mesh, baseX, baseY, baseZ, pulseSpeed, rotationSpeed, motionScale = 1 } = particle;
        
        // Calculate new position based on audio data
        const scale = 1 + averageAmplitude * 0.2 * motionScale;
        mesh.scale.set(scale, scale, scale);
        
        // Apply different frequency bands to different axes
        mesh.position.x = baseX + (bassFactor * 20 * motionScale) * Math.sin(timestamp * 0.001 * pulseSpeed);
        mesh.position.y = baseY + (midFactor * 15 * motionScale) * Math.cos(timestamp * 0.001 * pulseSpeed);
        mesh.position.z = baseZ + (trebleFactor * 10 * motionScale);
        
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

function drawSpectrum2D(dataArray) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#14172B';
    ctx.fillRect(0, 0, w, h);
    const barCount = 64;
    const step = Math.floor(dataArray.length / barCount);
    const barW = w / barCount;
    for (let i = 0; i < barCount; i++) {
        const v = dataArray[i * step] / 255;
        const barH = v * h * 0.85;
        const hue = 200 + v * 80;
        ctx.fillStyle = `hsla(${hue}, 75%, 55%, 0.85)`;
        ctx.fillRect(i * barW + 1, h - barH, barW - 2, barH);
    }
}

// Main render loop
function drawVisualizer(timestamp) {
    animationFrameId = requestAnimationFrame(drawVisualizer);
    
    const elapsed = timestamp - lastFrameTime;
    if (elapsed < 1000 / FRAME_RATE_LIMIT) return;
    lastFrameTime = timestamp;
    
    if (!canvas) {
        stopDrawing();
        return;
    }

    if (!audioAnalyser && window.getAnalyser) {
        audioAnalyser = window.getAnalyser();
    }
    if (!audioAnalyser) return;

    const bufferLength = audioAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    audioAnalyser.getByteFrequencyData(dataArray);

    if (currentVizType === 'spectrum') {
        drawSpectrum2D(dataArray);
        return;
    }

    if (!scene || !camera || !renderer) {
        stopDrawing();
        return;
    }
    
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
    const averageAmplitude = sum / bufferLength / 255.0;
    
    if (currentVizType === 'particles') {
        updateParticleVisualizer(dataArray, averageAmplitude, timestamp);
    } else if (currentVizType === 'meshWave') {
        updateMeshWaveVisualizer(dataArray);
    }
    
    renderer.render(scene, camera);
}

// Start the visualization
function startDrawing() {
    debugLog("Starting visualizer animation loop.");
    if (!animationFrameId) {
        lastFrameTime = 0;
        animationFrameId = requestAnimationFrame(drawVisualizer);
    }
}

// Stop the visualization
function stopDrawing() {
    debugLog("Stopping visualizer animation loop.");
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// Visualizer play/pause — called from audio.js via window.__vizSetPlayingState only
window.__vizSetPlayingState = function(isPlaying) {
    debugLog("Setting visualizer active state:", isPlaying);
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
            debugLog("Reinitializing Three.js components");
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
    if (type === 'meshWave' || type === 'particles' || type === 'spectrum') {
        currentVizType = type;
    } else {
        currentVizType = 'particles';
    }
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
        debugLog(`Resizing canvas to ${width}x${height}`);
        canvas.width = width;
        canvas.height = height;
    }
    
    // Update camera and renderer
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    
    debugLog("Visualizer resized:", {
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
        binauralRelax: { baseHue: 220, motionIntensity: 0.8, positioning: 'random', palette: ['#5b8def', '#7668f8', '#5856d6'] },
        binauralFocus: { baseHue: 120, motionIntensity: 1.2, positioning: 'grid', palette: ['#34d399', '#10b981', '#059669'] },
        binauralSleep: { baseHue: 280, motionIntensity: 0.5, positioning: 'wave', palette: ['#a78bfa', '#8b5cf6', '#6d28d9'] },
        pinkNoise: { baseHue: 280, motionIntensity: 0.4, size: 0.35, palette: ['#c084fc', '#a855f7', '#9333ea'] },
        whiteNoise: { baseHue: 220, motionIntensity: 0.35, size: 0.32, palette: ['#e2e8f0', '#cbd5e1', '#94a3b8'] },
        brownNoise: { baseHue: 25, motionIntensity: 0.3, size: 0.38, palette: ['#d6d3d1', '#a8a29e', '#78716c'] },
        isochronicEnergy: { baseHue: 60, motionIntensity: 1.5, positioning: 'pulse', palette: ['#fbbf24', '#84cc16', '#22c55e'] },
        isochronicMeditate: { baseHue: 140, motionIntensity: 1.0, positioning: 'circular', palette: ['#4ade80', '#22d3ee', '#2dd4bf'] },
        isochronicSleep: { baseHue: 260, motionIntensity: 0.45, positioning: 'wave', palette: ['#a78bfa', '#818cf8', '#6366f1'] },
        nature: { baseHue: 100, motionIntensity: 0.6, size: 0.55, palette: ['#86efac', '#4ade80', '#22c55e'] },
        solfeggio: { baseHue: 45, motionIntensity: 1.0, size: 0.6, palette: ['#fcd34d', '#fbbf24', '#f59e0b'] },
        monaural: { baseHue: 30, motionIntensity: 0.9, positioning: 'circular', palette: ['#fb923c', '#f97316', '#ea580c'] },
        gamma: { baseHue: 270, motionIntensity: 1.8, size: 0.35, positioning: 'grid', palette: ['#c084fc', '#e879f9', '#a855f7'] },
        hrv: { baseHue: 185, motionIntensity: 0.35, size: 0.65, positioning: 'wave', palette: ['#67e8f9', '#22d3ee', '#06b6d4'] },
        soundBath: { baseHue: 35, motionIntensity: 0.7, size: 0.7, palette: ['#fdba74', '#fcd34d', '#fde68a'] },
        psychoacoustic: { baseHue: 300, motionIntensity: 1.1, palette: ['#f0abfc', '#e879f9', '#d946ef'] },
        neuroacoustic: { baseHue: 210, motionIntensity: 1.0, palette: ['#93c5fd', '#60a5fa', '#3b82f6'] },
        emdrBls: { baseHue: 200, motionIntensity: 0.9, positioning: 'pulse', palette: ['#7dd3fc', '#38bdf8', '#0ea5e9'] },
    };
    
    return { ...defaultConfig, ...(configs[type] || {}) };
}
