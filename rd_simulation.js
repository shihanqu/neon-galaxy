/**
 * Gray-Scott Reaction-Diffusion Simulation
 * Based on Karl Sims' reference implementation
 * Uses low-resolution simulation (256x256) upscaled to screen
 */

const canvas = document.getElementById('rd-canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    console.error('WebGL not supported');
}

// Simulation resolution - dynamic based on aspect ratio
// Minimum dimension is 512, other dimension scales proportionally
const MIN_RESOLUTION = 512;
let SIM_WIDTH = 512;
let SIM_HEIGHT = 512;

// Calculate simulation resolution based on canvas aspect ratio
function calculateSimResolution() {
    const aspectRatio = window.innerWidth / window.innerHeight;

    if (aspectRatio >= 1) {
        // Landscape or square: height is minimum, width scales
        SIM_HEIGHT = MIN_RESOLUTION;
        SIM_WIDTH = Math.round(MIN_RESOLUTION * aspectRatio);
    } else {
        // Portrait: width is minimum, height scales
        SIM_WIDTH = MIN_RESOLUTION;
        SIM_HEIGHT = Math.round(MIN_RESOLUTION / aspectRatio);
    }

    console.log(`Simulation resolution: ${SIM_WIDTH}x${SIM_HEIGHT} (aspect ratio: ${aspectRatio.toFixed(2)})`);
}

// Vertex shader - simple fullscreen quad
const vsSource = `
    attribute vec2 a_position;
    varying vec2 v_texCoord;
    void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
`;

// Simulation shader - Gray-Scott equations
// Reference: https://www.karlsims.com/rd.html
const simFsSource = `
    precision highp float;
    
    uniform sampler2D u_texture;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform float u_mouseDown;
    uniform float u_feed;
    uniform float u_kill;
    
    varying vec2 v_texCoord;
    
    void main() {
        vec2 texel = 1.0 / u_resolution;
        
        // Current values
        vec4 center = texture2D(u_texture, v_texCoord);
        float a = center.r;
        float b = center.g;
        
        // Laplacian using 5-point stencil
        vec4 n = texture2D(u_texture, v_texCoord + vec2(0.0, texel.y));
        vec4 s = texture2D(u_texture, v_texCoord - vec2(0.0, texel.y));
        vec4 e = texture2D(u_texture, v_texCoord + vec2(texel.x, 0.0));
        vec4 w = texture2D(u_texture, v_texCoord - vec2(texel.x, 0.0));
        
        float laplacianA = n.r + s.r + e.r + w.r - 4.0 * a;
        float laplacianB = n.g + s.g + e.g + w.g - 4.0 * b;
        
        // Gray-Scott parameters - standard values from pmneila implementation
        float f = u_feed;
        float k = u_kill;
        float dA = 0.2097;  // Diffusion rate for A
        float dB = 0.105;   // Diffusion rate for B (half of A)
        float dt = 1.0;     // Time step
        
        // Reaction term
        float abb = a * b * b;
        
        // Gray-Scott equations with explicit time step
        float newA = a + (dA * laplacianA - abb + f * (1.0 - a)) * dt;
        float newB = b + (dB * laplacianB + abb - (k + f) * b) * dt;
        
        // Mouse interaction - seed B chemical
        if (u_mouseDown > 0.5) {
            vec2 mouseUV = u_mouse / u_resolution;
            // Account for aspect ratio to make cursor circular
            vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
            float dist = distance(v_texCoord * aspect, mouseUV * aspect);
            float radius = 0.05 * max(aspect.x, aspect.y);
            if (dist < radius) {
                newB = 1.0;
                newA = 0.0;
            }
        }
        
        // Clamp to valid range
        gl_FragColor = vec4(
            clamp(newA, 0.0, 1.0),
            clamp(newB, 0.0, 1.0),
            0.0, 1.0
        );
    }
`;

// Render shader - maps simulation to visual colors
const renderFsSource = `
    precision highp float;
    
    uniform sampler2D u_texture;
    uniform vec2 u_screenResolution;
    
    varying vec2 v_texCoord;
    
    void main() {
        vec4 data = texture2D(u_texture, v_texCoord);
        float a = data.r;
        float b = data.g;
        
        // Neon Galaxy color palette
        // Background: deep space purple/black
        vec3 bgColor = vec3(0.02, 0.01, 0.05);
        
        // Life color 1: vibrant magenta/pink
        vec3 lifeColor1 = vec3(0.9, 0.1, 0.6);
        
        // Life color 2: electric cyan
        vec3 lifeColor2 = vec3(0.1, 0.9, 0.9);
        
        // Accent glow: soft purple
        vec3 glowColor = vec3(0.5, 0.2, 0.8);
        
        // Map B concentration to colors
        // Low B = background, High B = vibrant life
        float life = smoothstep(0.0, 0.5, b);
        float intensity = smoothstep(0.1, 0.4, b);
        
        // Create color gradient based on B concentration
        vec3 lifeGradient = mix(lifeColor1, lifeColor2, sin(b * 6.28) * 0.5 + 0.5);
        
        // Add glow effect at edges
        float edge = smoothstep(0.15, 0.25, b) - smoothstep(0.35, 0.5, b);
        lifeGradient += glowColor * edge * 0.5;
        
        // Final color mix
        vec3 finalColor = mix(bgColor, lifeGradient, life);
        
        // Add subtle glow/bloom effect
        finalColor += glowColor * intensity * 0.15;
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;


// Shader utilities
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vsSource, fsSource) {
    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program error:', gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}

// Create programs
const simProgram = createProgram(gl, vsSource, simFsSource);
const renderProgram = createProgram(gl, vsSource, renderFsSource);

// Fullscreen quad
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1
]), gl.STATIC_DRAW);

// Ping-pong textures at simulation resolution
let textures = [];
let framebuffers = [];
let currentTexIndex = 0;

function createSimTexture() {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);

    // Try float textures first (better precision)
    const floatExt = gl.getExtension('OES_texture_float');
    const floatLinearExt = gl.getExtension('OES_texture_float_linear');

    let useFloat = false;
    if (floatExt) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SIM_WIDTH, SIM_HEIGHT, 0, gl.RGBA, gl.FLOAT, null);
        useFloat = true;
        console.log('Using FLOAT textures');
    } else {
        console.warn('Float textures not supported, using UNSIGNED_BYTE');
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SIM_WIDTH, SIM_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }

    // Use NEAREST filtering (safer, always works)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

    // Check framebuffer status
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.error('Framebuffer incomplete:', status);
    }

    return { tex, fb };
}

function initSimulation() {
    // Calculate resolution based on aspect ratio
    calculateSimResolution();

    // Resize canvas to screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Clean up old textures/framebuffers if they exist
    textures.forEach(tex => gl.deleteTexture(tex));
    framebuffers.forEach(fb => gl.deleteFramebuffer(fb));

    // Create ping-pong buffers at new resolution
    textures = [];
    framebuffers = [];
    for (let i = 0; i < 2; i++) {
        const { tex, fb } = createSimTexture();
        textures.push(tex);
        framebuffers.push(fb);
    }

    // Initialize with A=1, B=0 everywhere
    seedSimulation();
}

function seedSimulation() {
    // Fill both framebuffers with initial state
    for (let i = 0; i < 2; i++) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[i]);
        gl.viewport(0, 0, SIM_WIDTH, SIM_HEIGHT);

        // Clear to A=1, B=0 (red channel = A, green channel = B)
        gl.clearColor(1.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Add multiple seeds
        gl.enable(gl.SCISSOR_TEST);

        // Center seed - large square
        const cx = SIM_WIDTH / 2;
        const cy = SIM_HEIGHT / 2;
        const size = 20;
        gl.scissor(cx - size / 2, cy - size / 2, size, size);
        gl.clearColor(0.0, 1.0, 0.0, 1.0); // A=0, B=1
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Additional random seeds
        for (let j = 0; j < 6; j++) {
            const x = Math.random() * SIM_WIDTH * 0.6 + SIM_WIDTH * 0.2;
            const y = Math.random() * SIM_HEIGHT * 0.6 + SIM_HEIGHT * 0.2;
            const s = 8 + Math.random() * 12;
            gl.scissor(x - s / 2, y - s / 2, s, s);
            gl.clearColor(0.0, 1.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }

        gl.disable(gl.SCISSOR_TEST);
    }

    currentTexIndex = 0;
}

// Mouse state
let mouse = { x: 0, y: 0, down: false };

// Parameters - "Mitosis" pattern - very active growth
let params = { feed: 0.0367, kill: 0.0649 };

// Event handlers
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    // Convert screen coords to simulation coords
    mouse.x = ((e.clientX - rect.left) / canvas.width) * SIM_WIDTH;
    mouse.y = ((canvas.height - (e.clientY - rect.top)) / canvas.height) * SIM_HEIGHT;
});

canvas.addEventListener('mousedown', () => { mouse.down = true; });
canvas.addEventListener('mouseup', () => { mouse.down = false; });
canvas.addEventListener('mouseleave', () => { mouse.down = false; });

// Animation state
let animationId = null;

function simulate() {
    // Run simulation step
    gl.useProgram(simProgram);
    gl.viewport(0, 0, SIM_WIDTH, SIM_HEIGHT);

    // Bind source texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures[currentTexIndex]);

    // Render to other framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[1 - currentTexIndex]);

    // Set uniforms
    gl.uniform1i(gl.getUniformLocation(simProgram, 'u_texture'), 0);
    gl.uniform2f(gl.getUniformLocation(simProgram, 'u_resolution'), SIM_WIDTH, SIM_HEIGHT);
    gl.uniform2f(gl.getUniformLocation(simProgram, 'u_mouse'), mouse.x, mouse.y);
    gl.uniform1f(gl.getUniformLocation(simProgram, 'u_mouseDown'), mouse.down ? 1.0 : 0.0);
    gl.uniform1f(gl.getUniformLocation(simProgram, 'u_feed'), params.feed);
    gl.uniform1f(gl.getUniformLocation(simProgram, 'u_kill'), params.kill);

    // Draw
    const posLoc = gl.getAttribLocation(simProgram, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Swap buffers
    currentTexIndex = 1 - currentTexIndex;
}

function render() {
    // Render simulation to screen
    gl.useProgram(renderProgram);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures[currentTexIndex]);

    gl.uniform1i(gl.getUniformLocation(renderProgram, 'u_texture'), 0);
    gl.uniform2f(gl.getUniformLocation(renderProgram, 'u_screenResolution'), canvas.width, canvas.height);

    const posLoc = gl.getAttribLocation(renderProgram, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function animate() {
    // Run multiple simulation steps per frame for speed
    for (let i = 0; i < 10; i++) {
        simulate();
    }
    render();
    animationId = requestAnimationFrame(animate);
}

// Public API
export function startRD() {
    if (textures.length === 0) {
        initSimulation();
    }
    animate();
}

export function stopRD() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

export function resetRD() {
    seedSimulation();
}

export function setParams(f, k) {
    params.feed = f;
    params.kill = k;
}

export function injectLife() {
    // Add random seed
    const fb = framebuffers[currentTexIndex];
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.viewport(0, 0, SIM_WIDTH, SIM_HEIGHT);
    gl.enable(gl.SCISSOR_TEST);

    const x = Math.random() * SIM_WIDTH * 0.6 + SIM_WIDTH * 0.2;
    const y = Math.random() * SIM_HEIGHT * 0.6 + SIM_HEIGHT * 0.2;
    const size = 8;
    gl.scissor(x - size / 2, y - size / 2, size, size);
    gl.clearColor(0.0, 1.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.disable(gl.SCISSOR_TEST);
}

export function checkActivity() {
    // Sample pixels to check activity level
    const pixels = new Uint8Array(4 * 10 * 10);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const x = Math.floor(canvas.width / 2 - 5);
    const y = Math.floor(canvas.height / 2 - 5);
    gl.readPixels(x, y, 10, 10, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    let total = 0;
    for (let i = 1; i < pixels.length; i += 4) {
        total += pixels[i]; // Green channel
    }
    return total / (100 * 255);
}

// Handle resize with debouncing
// Wait for resize to settle before reinitializing simulation
let resizeTimeout = null;
let lastWidth = window.innerWidth;
let lastHeight = window.innerHeight;

window.addEventListener('resize', () => {
    // Always update canvas size immediately for smooth visuals
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Check if aspect ratio changed significantly
    const currentAspect = window.innerWidth / window.innerHeight;
    const lastAspect = lastWidth / lastHeight;
    const aspectChanged = Math.abs(currentAspect - lastAspect) > 0.01;

    if (aspectChanged && textures.length > 0) {
        // Clear any pending resize timeout
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }

        // Wait for resize to settle (300ms debounce)
        resizeTimeout = setTimeout(() => {
            console.log('Resize settled, reinitializing simulation...');
            lastWidth = window.innerWidth;
            lastHeight = window.innerHeight;
            initSimulation();
        }, 300);
    }
});
