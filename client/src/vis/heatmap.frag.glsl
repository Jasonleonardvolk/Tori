precision mediump float;

// Uniforms
uniform sampler2D u_phaseTexture;   // 1D texture containing phase values
uniform float u_nEffective;         // N_effective metric (coherence)
uniform float u_time;               // Animation time for subtle effects
uniform vec2 u_resolution;          // Canvas resolution
uniform float u_nodeCount;          // Total number of oscillators

// Color parameters
const float MIN_BRIGHTNESS = 0.3;   // Minimum brightness
const float MAX_BRIGHTNESS = 0.95;  // Maximum brightness
const float SATURATION = 0.9;       // Color saturation
const vec3 INACTIVE_COLOR = vec3(0.2, 0.2, 0.2); // Color for inactive nodes

// Convert HSV to RGB
// h: [0, 1], s: [0, 1], v: [0, 1]
vec3 hsv2rgb(vec3 hsv) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(hsv.xxx + K.xyz) * 6.0 - K.www);
    return hsv.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), hsv.y);
}

void main() {
    // Calculate normalized coordinates [0, 1]
    vec2 uv = gl_FragCoord.xy / u_resolution;
    
    // Calculate node index based on x coordinate
    float nodeIndex = floor(uv.x * u_nodeCount);
    float normalizedIndex = nodeIndex / u_nodeCount;
    
    // Sample the phase texture (1D texture)
    float phase = texture2D(u_phaseTexture, vec2(normalizedIndex, 0.5)).r;
    
    // Map phase [0, 1] to hue [0, 1]
    float hue = phase;
    
    // Calculate the visualization brightness based on coherence
    // More coherent = brighter colors
    float brightness = mix(MIN_BRIGHTNESS, MAX_BRIGHTNESS, u_nEffective);
    
    // Add subtle temporal variation if desired
    // brightness += 0.05 * sin(u_time * 0.5 + nodeIndex * 0.1);
    // brightness = clamp(brightness, MIN_BRIGHTNESS, MAX_BRIGHTNESS);
    
    // Create the color
    vec3 rgb = hsv2rgb(vec3(hue, SATURATION, brightness));
    
    // Add a small border/grid effect
    float border = 0.05;
    float borderAlpha = 1.0;
    
    // Check if we're near cell edges
    float cell_x = fract(uv.x * u_nodeCount);
    if (cell_x < border || cell_x > (1.0 - border)) {
        // Apply border effect (darker)
        rgb *= 0.8;
        borderAlpha = 0.9;
    }
    
    // Adjust color based on cell y position (can create bands of cells)
    float cellY = uv.y;
    if (cellY < 0.05 || cellY > 0.95) {
        rgb *= 0.7; // Darker at edges
    }
    
    // Output final color
    gl_FragColor = vec4(rgb, 1.0);
}
