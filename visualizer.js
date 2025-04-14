let analyser;
let canvas;
let isVisualizerActive = false;
let lastFrameTime = 0;
const FRAME_RATE_LIMIT = 30; // Limit to 30 FPS for performance

// Three.js variables
let scene, camera, renderer, geometry, material, mesh;
let particles = [];
const PARTICLE_COUNT = 100;
let soundType = 'binaural'; // Default sound type

// Add a visualizer state object to track complex visualizations
let visualizerState = {
    wavePatterns: [],
    resonancePoints: []
};

// Setup visualizer
function setupVisualizer(audioContext, masterGain, type = 'binaural') {
    canvas = document.getElementById('visualizer');
    soundType = type || document.getElementById('soundType').value;
    
    // Check if Three.js is available
    if (typeof THREE === 'undefined') {
        console.error('Three.js library not loaded. Cannot setup visualizer.');
        return;
    }
    
    // Initialize Three.js
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    camera = new THREE.PerspectiveCamera(75, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
    camera.position.z = 50;
    
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Clear existing particles if any
    if (particles.length > 0) {
        particles.forEach(particle => {
            if (particle.mesh) {
                scene.remove(particle.mesh);
            }
        });
        particles = [];
    }
    
    // Create particle system for audio visualization with adjustments based on sound type
    const particleConfig = getParticleConfigForSoundType(soundType);
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        geometry = new THREE.SphereGeometry(particleConfig.size, 8, 8);
        
        // Apply different colors based on sound type
        let color;
        if (particleConfig.useGradient) {
            color = new THREE.Color(`hsl(${particleConfig.baseHue + (i / PARTICLE_COUNT) * particleConfig.hueRange}, 80%, 60%)`);
        } else {
            const paletteIndex = i % particleConfig.palette.length;
            color = new THREE.Color(particleConfig.palette[paletteIndex]);
        }
        
        material = new THREE.MeshBasicMaterial({ 
            color: color, 
            transparent: true, 
            opacity: 0.8 
        });
        
        mesh = new THREE.Mesh(geometry, material);
        
        // Apply different positioning strategies based on sound type
        if (particleConfig.positioning === 'bowl') {
            // Create a bowl-like formation
            const bowlCount = 7; // Number of chakra bowls
            const particlesPerBowl = PARTICLE_COUNT / bowlCount;
            const bowlIndex = Math.floor(i / particlesPerBowl);
            const particleInBowl = i % particlesPerBowl;
            
            // Position particles in concentric rings around each bowl point
            const bowlAngle = (bowlIndex / bowlCount) * Math.PI * 2;
            const bowlRadius = 30;
            const bowlX = Math.cos(bowlAngle) * bowlRadius;
            const bowlY = Math.sin(bowlAngle) * bowlRadius;
            
            // Create a small ring of particles around each bowl point
            const ringAngle = (particleInBowl / particlesPerBowl) * Math.PI * 2;
            const ringRadius = 5;
            mesh.position.x = bowlX + Math.cos(ringAngle) * ringRadius;
            mesh.position.y = bowlY + Math.sin(ringAngle) * ringRadius;
            mesh.position.z = (Math.random() - 0.5) * 10;
            
        } else if (particleConfig.positioning === 'circular') {
            // Create a circular pattern
            const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
            const radius = 30 + Math.random() * 10;
            mesh.position.x = Math.cos(angle) * radius;
            mesh.position.y = Math.sin(angle) * radius;
            mesh.position.z = (Math.random() - 0.5) * 10;
        } else if (particleConfig.positioning === 'spiral') {
            // Create a spiral pattern
            const angle = (i / PARTICLE_COUNT) * Math.PI * 10;
            const radius = 5 + (i / PARTICLE_COUNT) * 25;
            mesh.position.x = Math.cos(angle) * radius;
            mesh.position.y = Math.sin(angle) * radius;
            mesh.position.z = (i / PARTICLE_COUNT) * 20 - 10;
        } else if (particleConfig.positioning === 'grid') {
            // Create a grid pattern
            const gridSize = Math.ceil(Math.sqrt(PARTICLE_COUNT));
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            mesh.position.x = (col - gridSize/2) * 8;
            mesh.position.y = (row - gridSize/2) * 8;
            mesh.position.z = (Math.random() - 0.5) * 10;
        } else if (particleConfig.positioning === 'harmonic') {
            // Create harmonic series visualization
            const harmonicLayers = 6; // Number of harmonic layers
            const particlesPerLayer = PARTICLE_COUNT / harmonicLayers;
            const layerIndex = Math.floor(i / particlesPerLayer);
            const particleInLayer = i % particlesPerLayer;
            
            // Position particles in harmonic spiral formation
            const layerAngle = (layerIndex / harmonicLayers) * Math.PI * 2;
            const layerRadius = 10 + layerIndex * 8;
            const particleAngle = (particleInLayer / particlesPerLayer) * Math.PI * 2;
            const particleOffset = (layerIndex % 2) * (Math.PI / particlesPerLayer);
            
            mesh.position.x = Math.cos(layerAngle + particleAngle + particleOffset) * layerRadius;
            mesh.position.y = Math.sin(layerAngle + particleAngle + particleOffset) * layerRadius;
            mesh.position.z = (layerIndex - harmonicLayers/2) * 5;
        } else {
            // Default random positioning
            mesh.position.x = (Math.random() - 0.5) * 80;
            mesh.position.y = (Math.random() - 0.5) * 40;
            mesh.position.z = (Math.random() - 0.5) * 30;
        }
        
        scene.add(mesh);
        particles.push({ 
            mesh, 
            baseX: mesh.position.x,
            baseY: mesh.position.y,
            baseZ: mesh.position.z,
            motionFactor: Math.random() * 0.5 + 0.5 // Randomize motion intensity per particle
        });
    }
    
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512; // Increased for better frequency resolution
    masterGain.connect(analyser);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    if (isVisualizerActive) {
        drawVisualizer(performance.now());
    }
    
    if (type === 'neuroacoustic') {
        // Get configuration for neuroacoustic type
        const config = getParticleConfigForSoundType('neuroacoustic');
        
        // Create neural wave patterns
        const wavePatterns = [];
        const numWaves = 5;
        
        for (let i = 0; i < numWaves; i++) {
            wavePatterns.push({
                frequency: 2 + i * 1.5,
                amplitude: 30 + i * 10,
                phase: 0
            });
        }
        
        // Create resonance points
        const resonancePoints = [];
        const numPoints = 8;
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            resonancePoints.push({
                x: Math.cos(angle) * config.resonanceRadius,
                y: Math.sin(angle) * config.resonanceRadius,
                intensity: 1.0,
                frequency: 4 + i * 0.5
            });
        }
        
        visualizerState.wavePatterns = wavePatterns;
        visualizerState.resonancePoints = resonancePoints;
    }
}

// Return particle configuration based on sound type
function getParticleConfigForSoundType(type) {
    switch(type) {
        case 'binaural':
            return {
                size: 1,
                useGradient: true,
                baseHue: 220, // Blue
                hueRange: 60,
                positioning: 'random',
                rotationSpeed: 0.001,
                motionIntensity: 1.0
            };
        case 'pinkNoise':
            return {
                size: 0.8,
                useGradient: false,
                palette: ['#8A2BE2', '#9370DB', '#6A5ACD', '#483D8B'], // Purple palette
                positioning: 'random',
                rotationSpeed: 0.0005,
                motionIntensity: 0.6
            };
        case 'isochronic':
            return {
                size: 1.2,
                useGradient: true,
                baseHue: 120, // Green
                hueRange: 80,
                positioning: 'circular',
                rotationSpeed: 0.002,
                motionIntensity: 1.5
            };
        case 'nature':
            return {
                size: 1.3,
                useGradient: false,
                palette: ['#228B22', '#32CD32', '#90EE90', '#8FBC8F'], // Green palette
                positioning: 'random',
                rotationSpeed: 0.0008,
                motionIntensity: 0.7
            };
        case 'solfeggio':
            return {
                size: 1.2,
                useGradient: true,
                baseHue: 40, // Gold
                hueRange: 120,
                positioning: 'spiral',
                rotationSpeed: 0.001,
                motionIntensity: 1.2
            };
        case 'monaural':
            return {
                size: 1.0,
                useGradient: false,
                palette: ['#FF4500', '#FF6347', '#FF7F50', '#FFA07A'], // Orange palette
                positioning: 'circular',
                rotationSpeed: 0.0015,
                motionIntensity: 1.1
            };
        case 'gamma':
            return {
                size: 0.7,
                useGradient: true,
                baseHue: 270, // Violet
                hueRange: 50,
                positioning: 'grid',
                rotationSpeed: 0.003,
                motionIntensity: 1.8
            };
        case 'hrv':
            return {
                size: 1.5,
                useGradient: true,
                baseHue: 180, // Cyan/Teal
                hueRange: 100,
                positioning: 'spiral',
                rotationSpeed: 0.0005,
                motionIntensity: 0.9
            };
        case 'soundBath':
            return {
                size: 2.0,
                useGradient: true,
                baseHue: 300, // Purple/Gold
                hueRange: 180, // Wide range for rich colors
                positioning: 'bowl',  // New positioning type
                rotationSpeed: 0.0003,
                motionIntensity: 1.4
            };
        case 'psychoacoustic':
            return {
                size: 1.8,
                useGradient: true,
                baseHue: 280, // Rich purple base
                hueRange: 240, // Full color spectrum for mood
                positioning: 'harmonic', // New positioning type
                rotationSpeed: 0.0008,
                motionIntensity: 1.3
            };
        case 'neuroacoustic':
            return {
                size: 2.0,
                baseHue: 220, // Deep blue base for neural activity
                motionIntensity: 1.5,
                waveComplexity: 3,
                resonanceRadius: 150
            };
        default:
            return {
                size: 1,
                useGradient: true,
                baseHue: 220,
                hueRange: 60,
                positioning: 'random',
                rotationSpeed: 0.001,
                motionIntensity: 1.0
            };
    }
}

// Handle window resize
function onWindowResize() {
    canvas = document.getElementById('visualizer');
    camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
}

// Draw visualizer with frame rate limiting
function drawVisualizer(timestamp) {
    if (!isVisualizerActive) return;
    const elapsed = timestamp - lastFrameTime;
    if (elapsed < 1000 / FRAME_RATE_LIMIT) {
        requestAnimationFrame(drawVisualizer);
        return;
    }
    lastFrameTime = timestamp;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    let avgAmplitude = 0;
    for (let i = 0; i < bufferLength; i++) {
        avgAmplitude += dataArray[i];
    }
    avgAmplitude /= bufferLength;
    
    // Get configuration for current sound type
    const config = getParticleConfigForSoundType(soundType);
    
    // Update particles based on audio data with different patterns for each sound type
    particles.forEach((particle, i) => {
        const index = i % bufferLength;
        const amplitude = dataArray[index] / 255;
        
        // Basic scaling based on amplitude
        particle.mesh.scale.setScalar(0.5 + amplitude * 2 * config.motionIntensity * particle.motionFactor);
        
        // Different movement patterns based on sound type
        if (config.positioning === 'bowl') {
            // Create rippling effect for sound bath
            const time = timestamp / 1000;
            const wave = Math.sin(time * 2 + particle.baseX / 10) * 0.5;
            particle.mesh.position.z = particle.baseZ + (wave + amplitude * 5) * config.motionIntensity;
            
            // Gentle orbital motion
            const orbit = time * 0.1;
            const radius = Math.sqrt(particle.baseX * particle.baseX + particle.baseY * particle.baseY);
            const angle = Math.atan2(particle.baseY, particle.baseX) + orbit * particle.motionFactor;
            particle.mesh.position.x = Math.cos(angle) * radius;
            particle.mesh.position.y = Math.sin(angle) * radius;
            
        } else if (config.positioning === 'circular') {
            // Circular motion with amplitude affecting radius
            const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (timestamp / 10000);
            const radius = 30 + amplitude * 15 * config.motionIntensity;
            particle.mesh.position.x = Math.cos(angle) * radius;
            particle.mesh.position.y = Math.sin(angle) * radius;
            particle.mesh.position.z = particle.baseZ + amplitude * 10 * config.motionIntensity;
        } else if (config.positioning === 'spiral') {
            // Spiral motion with amplitude affecting radius
            const angle = (i / PARTICLE_COUNT) * Math.PI * 10 + (timestamp / 15000);
            const radius = 5 + (i / PARTICLE_COUNT) * 25 + amplitude * 5 * config.motionIntensity;
            particle.mesh.position.x = Math.cos(angle) * radius;
            particle.mesh.position.y = Math.sin(angle) * radius;
            particle.mesh.position.z = particle.baseZ + amplitude * 10 * config.motionIntensity;
        } else if (config.positioning === 'grid') {
            // Grid with vertical motion based on amplitude
            particle.mesh.position.z = particle.baseZ + amplitude * 20 * config.motionIntensity;
        } else if (config.positioning === 'harmonic') {
            // Create flowing harmonic motion
            const time = timestamp / 1000;
            const harmonicMotion = Math.sin(time * 0.5) * 0.5;
            
            // Layer-specific movements
            const layerIndex = Math.floor(i / (PARTICLE_COUNT / 6));
            const layerPhase = layerIndex * Math.PI / 3;
            
            // Radial pulsation
            const radius = Math.sqrt(particle.baseX * particle.baseX + particle.baseY * particle.baseY);
            const angle = Math.atan2(particle.baseY, particle.baseX);
            const radiusOffset = amplitude * 10 * config.motionIntensity * 
                               Math.sin(time + layerPhase);
            
            particle.mesh.position.x = Math.cos(angle) * (radius + radiusOffset);
            particle.mesh.position.y = Math.sin(angle) * (radius + radiusOffset);
            particle.mesh.position.z = particle.baseZ + 
                                     harmonicMotion * 10 * config.motionIntensity +
                                     amplitude * 5;
            
            // Add spiral rotation based on amplitude
            const rotationOffset = amplitude * 0.1 * time;
            particle.mesh.position.x = particle.mesh.position.x * Math.cos(rotationOffset) -
                                     particle.mesh.position.y * Math.sin(rotationOffset);
            particle.mesh.position.y = particle.mesh.position.x * Math.sin(rotationOffset) +
                                     particle.mesh.position.y * Math.cos(rotationOffset);
            
        } else {
            // Default random positioning with amplitude affecting Z position
            particle.mesh.position.z = particle.baseZ + amplitude * 10 * config.motionIntensity;
        }
        
        // Color adjustments based on amplitude and sound type
        if (config.useGradient) {
            if (config.positioning === 'bowl') {
                // Special color handling for sound bath
                const hue = config.baseHue + (i / PARTICLE_COUNT) * config.hueRange;
                const saturation = 0.7 + amplitude * 0.3;
                const lightness = 0.4 + amplitude * 0.6;
                particle.mesh.material.color.setHSL(hue/360, saturation, lightness);
                // Add shimmer effect
                particle.mesh.material.opacity = 0.5 + amplitude * 0.5;
            } else if (config.positioning === 'harmonic') {
                // Create harmonic color transitions
                const layerIndex = Math.floor(i / (PARTICLE_COUNT / 6));
                const hue = config.baseHue + 
                           (i / PARTICLE_COUNT) * config.hueRange + 
                           amplitude * 60 + 
                           layerIndex * 40;
                const saturation = 0.7 + amplitude * 0.3;
                const lightness = 0.3 + amplitude * 0.4 + 
                                Math.sin(timestamp / 1000 + layerIndex) * 0.2;
                particle.mesh.material.color.setHSL(hue/360, saturation, lightness);
                
                // Add shimmer effect
                particle.mesh.material.opacity = 0.6 + 
                                              amplitude * 0.4 + 
                                              Math.sin(timestamp / 500 + layerIndex) * 0.2;
            } else {
                // HSL color adjustments
                const hue = config.baseHue + (i / PARTICLE_COUNT) * config.hueRange + amplitude * 30;
                const saturation = 0.8 + amplitude * 0.2;
                const lightness = 0.5 + amplitude * 0.5;
                particle.mesh.material.color.setHSL(hue/360, saturation, lightness);
            }
        } else {
            // Brightness adjustments for palette colors
            const color = new THREE.Color(config.palette[i % config.palette.length]);
            // Make brighter based on amplitude
            const r = Math.min(1, color.r + amplitude * 0.3);
            const g = Math.min(1, color.g + amplitude * 0.3);
            const b = Math.min(1, color.b + amplitude * 0.3);
            particle.mesh.material.color.setRGB(r, g, b);
        }
        
        // Add slight rotation to particles themselves
        particle.mesh.rotation.x += 0.01 * amplitude;
        particle.mesh.rotation.y += 0.01 * amplitude;
    });
    
    // Apply different scene rotation speeds based on sound type
    scene.rotation.y += config.rotationSpeed;
    scene.rotation.x += config.rotationSpeed * 0.3;
    
    renderer.render(scene, camera);
    
    if (soundType === 'neuroacoustic') {
        // Update and draw neural wave patterns
        const ctx = renderer.getContext();
        ctx.lineWidth = 2;
        
        // Get frequency data from analyser
        const bufferLength = analyser.frequencyBinCount;
        const freqData = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(freqData);
        
        visualizerState.wavePatterns.forEach((wave, index) => {
            wave.phase += wave.frequency * 0.01;
            
            ctx.beginPath();
            ctx.strokeStyle = `hsla(${config.baseHue + index * 15}, 70%, 60%, 0.6)`;
            
            for (let x = 0; x < canvas.width; x += 5) {
                const y = canvas.height / 2 + 
                    Math.sin(x * 0.02 + wave.phase) * wave.amplitude * 
                    (1 + freqData[Math.min(index * 20, bufferLength - 1)] / 256);
                
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        });
        
        // Draw resonance points and their connections
        visualizerState.resonancePoints.forEach((point, i) => {
            const intensity = 0.5 + freqData[Math.min(i * 30, bufferLength - 1)] / 512;
            point.intensity = point.intensity * 0.95 + intensity * 0.05;
            
            // Draw point
            ctx.beginPath();
            ctx.fillStyle = `hsla(${config.baseHue + i * 30}, 80%, 60%, ${point.intensity})`;
            ctx.arc(
                canvas.width/2 + point.x,
                canvas.height/2 + point.y,
                8 * point.intensity,
                0, Math.PI * 2
            );
            ctx.fill();
            
            // Draw connections
            for (let j = i + 1; j < visualizerState.resonancePoints.length; j++) {
                const other = visualizerState.resonancePoints[j];
                const avgIntensity = (point.intensity + other.intensity) / 2;
                
                ctx.beginPath();
                ctx.strokeStyle = `hsla(${config.baseHue + (i + j) * 15}, 70%, 60%, ${avgIntensity * 0.3})`;
                ctx.moveTo(canvas.width/2 + point.x, canvas.height/2 + point.y);
                ctx.lineTo(canvas.width/2 + other.x, canvas.height/2 + other.y);
                ctx.stroke();
            }
        });
        
        // Draw central resonance field
        const gradient = ctx.createRadialGradient(
            canvas.width/2, canvas.height/2, 0,
            canvas.width/2, canvas.height/2, config.resonanceRadius
        );
        gradient.addColorStop(0, `hsla(${config.baseHue}, 70%, 60%, 0.1)`);
        gradient.addColorStop(0.5, `hsla(${config.baseHue + 30}, 70%, 60%, 0.05)`);
        gradient.addColorStop(1, `hsla(${config.baseHue + 60}, 70%, 60%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, config.resonanceRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    requestAnimationFrame(drawVisualizer);
}

// Set playing state
function setPlayingState(state) {
    isVisualizerActive = state;
    
    // Update sound type from the current selection
    if (state && document.getElementById('soundType')) {
        soundType = document.getElementById('soundType').value;
    }
    
    if (state) {
        lastFrameTime = performance.now();
        requestAnimationFrame(drawVisualizer);
    } else if (renderer) {
        // Clear the scene
        renderer.render(scene, camera);
    }
} 