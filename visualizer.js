let analyser;
let canvas;
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
window.setupVisualizer = function(canvasElement, audioAnalyser, vizType = 'particles') {
    console.log(`Setting up visualizer: ${vizType}`);
    canvas = canvasElement;
    analyser = audioAnalyser;
    currentVizType = vizType;

    // Basic validation
    if (!canvas) {
        console.error("Visualizer setup failed: Canvas not provided.");
        return;
    }
    
    if (!analyser) {
        console.error("Visualizer setup failed: Audio Analyser not provided.");
        console.log("Available audio context:", window.getAudioContext ? window.getAudioContext() : "None");
        return;
    }
    
    if (typeof THREE === 'undefined') {
        console.error('Three.js library not loaded. Cannot setup visualizer.');
        return;
    }
    
    // --- Initialize Three.js Scene (if not already) ---
    if (!renderer) {
        try {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
            camera.position.z = 50; // Start further back
    
            renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); // alpha: true for transparency
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
            visualizerGroup = new THREE.Group(); // Initialize the group
            scene.add(visualizerGroup); // Add the group to the scene

            // Handle window resize
            window.addEventListener('resize', onWindowResize, false);

        } catch (error) {
            console.error("Error initializing Three.js:", error);
            canvas.getContext('2d').fillText("WebGL failed to initialize.", 10, 50);
            return; // Stop if Three.js setup fails
        }
    } else {
        // Ensure size is updated if canvas dimensions changed
        onWindowResize();
    }

    // --- Cleanup Previous Visualizer ---
    cleanupVisualizer();

    // --- Initialize Selected Visualizer ---
    if (currentVizType === 'particles') {
        camera.position.z = 50; // Position for particles
        initParticleVisualizer();
    } else if (currentVizType === 'meshWave') {
        camera.position.z = 60; // Position further back for wave
        initMeshWaveVisualizer();
    } else {
        console.warn(`Unknown visualizer type: ${currentVizType}. Defaulting to particles.`);
        camera.position.z = 50;
        initParticleVisualizer();
        currentVizType = 'particles';
    }

    // Start drawing if it should be active
    if (isVisualizerActive) {
        startDrawing();
    }
}

// Remove previous visualizer objects from the scene
function cleanupVisualizer() {
    console.log("Cleaning up previous visualizer objects...");
    if (!visualizerGroup) return;
    // Remove all children from the group
    while (visualizerGroup.children.length > 0) {
        const object = visualizerGroup.children[0];
        visualizerGroup.remove(object);
        // Optional: Dispose geometry and material if needed
        if (object.geometry) object.geometry.dispose();
        if (object.material) object.material.dispose();
    }
    // Reset specific visualizer variables
    particles = [];
    waveMesh = null;
}

// Initialize the Particle System Visualizer
function initParticleVisualizer() {
    console.log("Initializing Particle Visualizer");
    const PARTICLE_COUNT = 150;
    const soundType = document.getElementById('soundType')?.value || 'binauralRelax';
    const particleConfig = getParticleConfigForSoundType(soundType); // Use existing config logic
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const geometry = new THREE.SphereGeometry(particleConfig.size || 0.5, 8, 8);
        
        let color;
        // Simplified color logic from previous state - adapt if needed
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

        // Use existing positioning logic or simplified random
            mesh.position.x = (Math.random() - 0.5) * 80;
            mesh.position.y = (Math.random() - 0.5) * 40;
            mesh.position.z = (Math.random() - 0.5) * 30;
         // TODO: Re-integrate complex positioning from getParticleConfigForSoundType if desired
        
        visualizerGroup.add(mesh); // Add particle mesh to the group
        particles.push({ 
            mesh, 
            baseX: mesh.position.x,
            baseY: mesh.position.y,
            baseZ: mesh.position.z,
            motionFactor: Math.random() * 0.5 + 0.5 // Randomize motion intensity
        });
    }
}

// Initialize the 3D Mesh Wave Visualizer
function initMeshWaveVisualizer() {
    console.log("Initializing Mesh Wave Visualizer");
    const planeWidth = 100;
    const planeHeight = 35; // Make it taller
    // Ensure widthSegments aligns somewhat with analyser.fftSize / 2 for mapping
    const widthSegments = analyser.fftSize ? Math.min(128, analyser.fftSize / 4) : 64; // Use portion of FFT data
    const heightSegments = 1;

    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, widthSegments, heightSegments);

    // Material: Basic Cyan Wireframe for now
    const material = new THREE.MeshBasicMaterial({ color: 0x00EFFF, wireframe: true });
    // const material = new THREE.MeshBasicMaterial({ color: 0x8A2BE2, side: THREE.DoubleSide }); // Solid purple

    waveMesh = new THREE.Mesh(geometry, material);
    waveMesh.rotation.x = -Math.PI / 6; // Tilt slightly more
    waveMesh.position.y = -8; // Move down

    visualizerGroup.add(waveMesh); // Add mesh to the group
}

// --- Update Functions (Called by drawVisualizer) ---

function updateParticleVisualizer(dataArray, averageAmplitude, timestamp) {
    if (!particles || particles.length === 0) return;

    const bufferLength = dataArray.length;
    const intensity = averageAmplitude / 128.0;
    const soundType = document.getElementById('soundType')?.value || 'binauralRelax';
    const particleConfig = getParticleConfigForSoundType(soundType);

    particles.forEach((particle, i) => {
        if (!particle.mesh) return;

        const frequencyIndex = Math.floor((i / particles.length) * (bufferLength / 2));
        const amplitude = dataArray[frequencyIndex] / 255.0;
        const motionFactor = (particle.motionFactor || 0.7) * (particleConfig.motionIntensity || 1.0);
        const time = timestamp * 0.001 * (particleConfig.rotationSpeed || 0.001);

        // Apply motion (reuse or adapt existing logic)
        const waveOffset = Math.sin(time + i * 0.1) * amplitude * 5 * motionFactor;
        particle.mesh.position.x = particle.baseX + Math.cos(time + i * 0.05) * intensity * 10 * motionFactor;
        particle.mesh.position.y = particle.baseY + Math.sin(time + i * 0.05) * intensity * 10 * motionFactor + waveOffset;
        particle.mesh.position.z = particle.baseZ + amplitude * 15 * motionFactor;

        const scale = 0.5 + amplitude * 1.5 * motionFactor;
        particle.mesh.scale.set(scale, scale, scale);

        if (particle.mesh.material) {
             particle.mesh.material.opacity = Math.max(0.2, 0.6 + amplitude * 0.4);
        }
    });

    // Optional rotation
    const rotate = particleConfig.positioning === 'spiral' || particleConfig.positioning === 'circular';
    if(rotate) {
        visualizerGroup.rotation.z += particleConfig.rotationSpeed * intensity * 0.5;
    } else {
         // Reset rotation if previous type was rotating
        if(visualizerGroup.rotation.z !== 0) visualizerGroup.rotation.z = 0;
    }
}

function updateMeshWaveVisualizer(dataArray) {
    if (!waveMesh || !waveMesh.geometry || !waveMesh.geometry.attributes.position) {
        console.warn("Wave mesh not ready for update.");
        return;
    }

    const positions = waveMesh.geometry.attributes.position.array;
    const bufferLength = dataArray.length; // frequencyBinCount
    const segmentWidth = waveMesh.geometry.parameters.widthSegments;
    const verticesPerRow = segmentWidth + 1;

    // Keep track of the original Z position if needed (assuming it's 0 for PlaneGeometry)
    const originalZ = 0;
    let maxDisplacement = 0;

    for (let i = 0; i < verticesPerRow; i++) {
        // Map vertex index 'i' to a frequency bin index (logarithmic mapping might be better)
        // Simple linear mapping to lower half of frequency data:
        const freqIndex = Math.min(bufferLength - 1, Math.floor((i / segmentWidth) * (bufferLength * 0.6)));

        // Normalize and scale amplitude
        const amplitude = dataArray[freqIndex] / 128.0; // Normalize 0-2
        const displacement = amplitude * 12; // Scale displacement (adjust this factor)
        maxDisplacement = Math.max(maxDisplacement, displacement);

        // The Z coordinate is at index * 3 + 2
        // Modify the Z position based on amplitude
        positions[i * 3 + 2] = originalZ + displacement;
    }

    // console.log("Max Displacement:", maxDisplacement); // For debugging/tuning scale factor
    waveMesh.geometry.attributes.position.needsUpdate = true;
    waveMesh.geometry.computeVertexNormals(); // Update normals if using lighting
}

// --- Main Draw Loop ---

function drawVisualizer(timestamp) {
    if (!isVisualizerActive) return; // Stop if not active

    animationFrameId = requestAnimationFrame(drawVisualizer);

    // Frame rate limiting
    const elapsed = timestamp - lastFrameTime;
    if (elapsed < 1000 / FRAME_RATE_LIMIT) {
        return;
    }
    lastFrameTime = timestamp;

    // Ensure components are ready
    if (!analyser || !renderer || !scene || !camera) {
        console.warn("Visualizer components not ready in draw loop.");
        stopDrawing();
        return;
    }

    // Get audio data
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    try {
         analyser.getByteFrequencyData(dataArray); // Get frequency data
    } catch (error) {
        console.error("Error getting frequency data:", error);
        stopDrawing(); // Stop if analyser fails
        return;
    }

    // Calculate average amplitude (optional)
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) { sum += dataArray[i]; }
    const averageAmplitude = sum / bufferLength;

    // --- Update the active visualizer ---
    if (currentVizType === 'particles') {
        updateParticleVisualizer(dataArray, averageAmplitude, timestamp);
    } else if (currentVizType === 'meshWave') {
        updateMeshWaveVisualizer(dataArray);
    }

    // Render the scene
    try {
         renderer.render(scene, camera);
    } catch (error) {
        console.error("Error rendering scene:", error);
        stopDrawing(); // Stop if rendering fails
    }
}

// --- Start/Stop Drawing --- //
function startDrawing() {
    if (!isVisualizerActive || animationFrameId !== null) return; // Already running or should not run
    console.log("Starting visualizer animation loop.");
    lastFrameTime = performance.now(); // Reset frame timer
    animationFrameId = requestAnimationFrame(drawVisualizer);
}

function stopDrawing() {
     if (animationFrameId !== null) {
        console.log("Stopping visualizer animation loop.");
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    // Optional: Clear canvas or render static scene
    if (renderer && scene && camera) {
        // renderer.clear();
    }
}

// --- Event Handlers & State Control --- //

// Exposed function to control playback state
// Called from app.js's togglePlay and stopTrack
window.setPlayingState = function(state) {
    console.log("Setting visualizer active state:", state);
    isVisualizerActive = state;
    
    if (isVisualizerActive) {
        startDrawing();
    } else {
        stopDrawing();
    }
}

function onWindowResize() {
    if (!renderer || !camera || !canvas) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (width === 0 || height === 0) return; // Prevent errors if canvas is hidden

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    console.log(`Resized renderer to ${width}x${height}`);
}

// --- Helper Functions (Keep or adapt getParticleConfigForSoundType) ---

// Return particle configuration based on sound type
// !! IMPORTANT: Replace this simplified version with your existing detailed function !!
function getParticleConfigForSoundType(type) {
    console.log("(Simplified) Getting particle config for:", type);
     let baseConfig = {
        size: 1.0,
        useGradient: true,
        baseHue: 220, // Default blue
        hueRange: 60,
        positioning: 'random',
        rotationSpeed: 0.001,
        motionIntensity: 1.0,
        palette: ['#7668f8', '#6c8bef', '#5856d6'] // Default palette
    };
    // Add switches based on 'type' to customize baseConfig as before
    // Example:
    if (type === 'isochronicMeditate') { baseConfig.baseHue = 120; baseConfig.motionIntensity = 1.8; baseConfig.positioning = 'circular'; }
    if (type === 'binauralSleep') { baseConfig.baseHue = 260; baseConfig.motionIntensity = 0.6; baseConfig.palette = ['#483D8B', '#6A5ACD', '#9370DB']; baseConfig.useGradient = false; }

    return baseConfig;
}

// --- Ensure functions needed by app.js are globally accessible ---
// window.setupVisualizer is set above.
// window.setPlayingState is set above.

console.log("visualizer.js loaded and refactored."); 