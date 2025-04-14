// Particle vertex shader
export const particleVertexShader = `
attribute vec3 position;
attribute vec3 color;
attribute float size;
attribute vec3 offset;
attribute vec3 rotation;

uniform float time;
uniform float audioAmplitude;
uniform vec3 cameraPosition;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec3 vColor;
varying float vAlpha;

void main() {
    // Apply rotation
    float rotX = rotation.x + time * 0.1;
    float rotY = rotation.y + time * 0.05;
    float rotZ = rotation.z + time * 0.15;
    
    mat3 rotMatX = mat3(
        1.0, 0.0, 0.0,
        0.0, cos(rotX), -sin(rotX),
        0.0, sin(rotX), cos(rotX)
    );
    
    mat3 rotMatY = mat3(
        cos(rotY), 0.0, sin(rotY),
        0.0, 1.0, 0.0,
        -sin(rotY), 0.0, cos(rotY)
    );
    
    mat3 rotMatZ = mat3(
        cos(rotZ), -sin(rotZ), 0.0,
        sin(rotZ), cos(rotZ), 0.0,
        0.0, 0.0, 1.0
    );
    
    // Apply rotations
    vec3 rotatedPosition = rotMatZ * rotMatY * rotMatX * position;
    
    // Apply offset
    rotatedPosition += offset;
    
    // Apply audio amplitude
    rotatedPosition *= (1.0 + audioAmplitude * 0.5);
    
    // Calculate distance from camera for size attenuation
    float distance = length(cameraPosition - rotatedPosition);
    float sizeAttenuation = 1.0 / (1.0 + distance * 0.1);
    
    // Calculate final position
    vec4 mvPosition = modelViewMatrix * vec4(rotatedPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Set point size with attenuation
    gl_PointSize = size * sizeAttenuation * (1.0 + audioAmplitude);
    
    // Pass color to fragment shader
    vColor = color;
    
    // Calculate alpha based on distance and audio
    vAlpha = 1.0 - (distance * 0.05) + (audioAmplitude * 0.3);
    vAlpha = clamp(vAlpha, 0.1, 1.0);
}
`;

// Particle fragment shader
export const particleFragmentShader = `
varying vec3 vColor;
varying float vAlpha;

uniform float time;
uniform float audioAmplitude;
uniform bool useTexture;
uniform sampler2D particleTexture;

void main() {
    // Calculate distance from center of point
    float dist = length(gl_PointCoord - vec2(0.5));
    
    // Discard fragments outside the point
    if (dist > 0.5) {
        discard;
    }
    
    // Calculate glow effect
    float glow = 1.0 - (dist * 2.0);
    glow = pow(glow, 2.0);
    
    // Apply audio amplitude to glow
    glow *= (1.0 + audioAmplitude * 0.5);
    
    // Calculate color with glow
    vec3 color = vColor;
    
    // Add pulsing effect based on time and audio
    float pulse = sin(time * 2.0) * 0.1 + 0.9;
    color *= pulse * (1.0 + audioAmplitude * 0.3);
    
    // Apply texture if enabled
    if (useTexture) {
        vec4 texColor = texture2D(particleTexture, gl_PointCoord);
        color = mix(color, texColor.rgb, texColor.a);
    }
    
    // Set final color with alpha
    gl_FragColor = vec4(color, vAlpha * glow);
}
`;

// Create a custom shader material
export function createParticleShaderMaterial(options = {}) {
    const defaults = {
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
        uniforms: {
            time: { value: 0 },
            audioAmplitude: { value: 0 },
            particleTexture: { value: null },
            useTexture: { value: false }
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    };
    
    return new THREE.ShaderMaterial({
        ...defaults,
        ...options,
        uniforms: {
            ...defaults.uniforms,
            ...(options.uniforms || {})
        }
    });
} 