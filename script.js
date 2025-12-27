/**
 * Neon Galaxy - Particle Engine
 * A lightweight, high-performance particle system.
 */

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// State
let particles = [];
const mouse = { x: null, y: null, active: false };
const config = {
    count: 500,
    speed: 3,
    interactionRadius: 150,
    connectLines: true,
    colors: ['#00f2ff', '#bd00ff', '#ffffff']
};

let currentMode = 'particles';
let isParticleRunning = true;
let modeParticles, modeLife, modeArchitect, controlsParticles, controlsLife, canvasParticles, canvasRD;

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * config.speed;
        this.speedY = (Math.random() - 0.5) * config.speed;
        this.color = config.colors[Math.floor(Math.random() * config.colors.length)];
        this.life = 0; // For pulse effect?
    }

    update() {
        // Base movement
        this.x += this.speedX * (config.speed / 3);
        this.y += this.speedY * (config.speed / 3);

        // Mouse interaction
        if (mouse.active) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < config.interactionRadius) {
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const force = (config.interactionRadius - distance) / config.interactionRadius;
                const directionMultiplier = -2; // Repel

                this.speedX += forceDirectionX * force * directionMultiplier * 0.5;
                this.speedY += forceDirectionY * force * directionMultiplier * 0.5;
            }
        }

        // Screen Wrap
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function init() {
    resize();
    createParticles();
    animate();
}

function createParticles() {
    particles = [];
    for (let i = 0; i < config.count; i++) {
        particles.push(new Particle());
    }
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function animate() {
    // Initial loop starter, effectively replaced by our custom loop control
    particleLoop();
}

function connectParticles(currentIndex) {
    const pA = particles[currentIndex];
    const linkDistance = 100;

    for (let j = currentIndex; j < particles.length; j++) {
        const pB = particles[j];
        const dx = pA.x - pB.x;
        const dy = pA.y - pB.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < linkDistance) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(189, 0, 255, ${1 - dist / linkDistance})`; // Purple tint
            ctx.lineWidth = 0.5;
            ctx.moveTo(pA.x, pA.y);
            ctx.lineTo(pB.x, pB.y);
            ctx.stroke();
        }
    }

    // Connect to mouse
    if (mouse.active) {
        const dx = pA.x - mouse.x;
        const dy = pA.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < config.interactionRadius) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 242, 255, ${1 - dist / config.interactionRadius})`; // Cyan tint
            ctx.lineWidth = 1;
            ctx.moveTo(pA.x, pA.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
        }
    }
}

// Event Listeners
window.addEventListener('resize', resize);

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
});

window.addEventListener('mouseleave', () => {
    mouse.active = false;
});

window.addEventListener('click', () => {
    // Explode effect only in particle mode
    if (currentMode !== 'particles') return;

    particles.forEach(p => {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 300) {
            const angle = Math.atan2(dy, dx);
            const force = (300 - distance) / 10;
            p.speedX += Math.cos(angle) * force;
            p.speedY += Math.sin(angle) * force;
        }
    });
});

// UI Controls
document.getElementById('particle-count').addEventListener('input', (e) => {
    config.count = +e.target.value;
    document.getElementById('count-display').innerText = config.count;
    createParticles();
});

document.getElementById('base-speed').addEventListener('input', (e) => {
    config.speed = +e.target.value;
    document.getElementById('speed-display').innerText = config.speed;
});

document.getElementById('interaction-radius').addEventListener('input', (e) => {
    config.interactionRadius = +e.target.value;
    document.getElementById('radius-display').innerText = config.interactionRadius;
});

const connectCbox = document.getElementById('connect-lines');
connectCbox.addEventListener('change', (e) => {
    config.connectLines = connectCbox.checked;
});
// Toggle switch handling (UI click to checkbox)
document.querySelector('.control-group-toggle').addEventListener('click', (e) => {
    if (e.target !== connectCbox) {
        connectCbox.checked = !connectCbox.checked;
        connectCbox.dispatchEvent(new Event('change'));
    }
});


import { startRD, stopRD, setParams, injectLife, checkActivity, resetRD } from './rd_simulation.js';
import { soundEngine } from './sound_engine.js';

// Boot
init();

// Mode Switching Logic
// Mode Switching Logic
function initUI() {
    modeParticles = document.getElementById('mode-particles');
    modeLife = document.getElementById('mode-life');
    modeArchitect = document.getElementById('mode-architect');
    controlsParticles = document.getElementById('controls-particles');
    controlsLife = document.getElementById('controls-life');
    canvasParticles = document.getElementById('canvas');
    canvasRD = document.getElementById('rd-canvas');

    if (modeParticles) modeParticles.addEventListener('click', () => switchMode('particles'));
    if (modeLife) modeLife.addEventListener('click', () => switchMode('life'));
    if (modeArchitect) modeArchitect.addEventListener('click', () => switchMode('architect'));

    // Ensure correct initial state
    if (controlsLife) controlsLife.style.display = 'none';
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
} else {
    initUI();
}

function switchMode(mode) {
    if (currentMode === mode) return;
    currentMode = mode;

    if (!modeParticles) initUI(); // Late bind check

    // Reset All State
    modeParticles.classList.remove('active');
    modeLife.classList.remove('active');
    if (modeArchitect) modeArchitect.classList.remove('active');

    controlsParticles.style.display = 'none';
    controlsLife.style.display = 'none';

    canvasParticles.style.display = 'none';
    canvasRD.style.display = 'none';

    isParticleRunning = false;
    stopRD();

    // Activate Selected Mode
    if (mode === 'particles') {
        modeParticles.classList.add('active');
        controlsParticles.style.display = 'flex';
        canvasParticles.style.display = 'block';
        isParticleRunning = true;
        particleLoop();
    } else if (mode === 'life') {
        modeLife.classList.add('active');
        controlsLife.style.display = 'flex';
        canvasRD.style.display = 'block';
        startRD();
    } else if (mode === 'architect') {
        if (modeArchitect) modeArchitect.classList.add('active');
        canvasParticles.style.display = 'block'; // Use main canvas
        try {
            initArchitectSync();
            requestAnimationFrame(architectLoop);
        } catch (err) {
            console.error('Architect mode failed:', err);
        }
    }
}

function particleLoop() {
    if (!isParticleRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        if (config.connectLines) {
            connectParticles(i);
        }
    }

    requestAnimationFrame(particleLoop);
}

// RD Controls
document.getElementById('rd-feed').addEventListener('input', (e) => {
    document.getElementById('feed-display').innerText = e.target.value;
    updateRDParams();
});
document.getElementById('rd-kill').addEventListener('input', (e) => {
    document.getElementById('kill-display').innerText = e.target.value;
    updateRDParams();
});

function updateRDParams() {
    const f = parseFloat(document.getElementById('rd-feed').value);
    const k = parseFloat(document.getElementById('rd-kill').value);
    setParams(f, k);
}

// Autonomy Interaction
let autonomyEnabled = false;
let lastCheck = 0;
const autonomyCheckbox = document.getElementById('rd-autonomy');

if (autonomyCheckbox) {
    autonomyCheckbox.addEventListener('change', (e) => {
        autonomyEnabled = e.target.checked;
        if (autonomyEnabled) requestAnimationFrame(autonomyLoop);
    });

    // UI toggle handler for the new checkbox container
    const toggleContainer = autonomyCheckbox.parentElement;
    if (toggleContainer && toggleContainer.classList.contains('control-group-toggle')) {
        toggleContainer.addEventListener('click', (e) => {
            if (e.target !== autonomyCheckbox) {
                autonomyCheckbox.checked = !autonomyCheckbox.checked;
                autonomyCheckbox.dispatchEvent(new Event('change'));
            }
        });
    }
}

// AI Logging
const logEl = document.getElementById('ai-log');
let logTimeout;
function logAI(msg) {
    if (!logEl) return;
    logEl.innerText = `> SYSTEM: ${msg}`;
    logEl.style.opacity = 1;
    clearTimeout(logTimeout);
    logTimeout = setTimeout(() => {
        logEl.style.opacity = 0.5;
    }, 2000);
}

function autonomyLoop(timestamp) {
    if (!autonomyEnabled || currentMode !== 'life') {
        if (logEl) logEl.style.opacity = 0;
        return;
    }

    // Drift Parameters (Perlin-ish random walk)
    // We get the current values from DOM to ensure we stay in sync
    let feed = parseFloat(document.getElementById('rd-feed').value);
    let kill = parseFloat(document.getElementById('rd-kill').value);

    // Small random walk
    if (Math.random() < 0.1) {
        feed += (Math.random() - 0.5) * 0.0005;
        kill += (Math.random() - 0.5) * 0.0005;

        // Clamp to interesting range
        if (feed < 0.01) feed = 0.01;
        if (feed > 0.1) feed = 0.1;
        if (kill < 0.045) kill = 0.045;
        if (kill > 0.07) kill = 0.07;

        // Update DOM and Sim
        document.getElementById('rd-feed').value = feed;
        document.getElementById('rd-kill').value = kill;
        document.getElementById('feed-display').innerText = feed.toFixed(3);
        document.getElementById('kill-display').innerText = kill.toFixed(3);
        updateRDParams();

        if (Math.random() < 0.02) logAI(`Drifting... F:${feed.toFixed(4)} K:${kill.toFixed(4)}`);
    }

    // Check Life State every 2 seconds
    if (timestamp - lastCheck > 2000) {
        const activity = checkActivity();

        soundEngine.update(activity);

        // If dead (activity low), inject life
        if (activity < 0.005) {
            logAI(`CRITICAL: Life levels low (${(activity * 100).toFixed(1)}%). Initiating Genesis.`);
            injectLife();
            injectLife();
            soundEngine.triggerChime();
        }

        // If overcrowding (activity high), raise kill rate slightly to thin it out
        if (activity > 0.4) {
            const newKill = Math.min(0.07, parseFloat(document.getElementById('rd-kill').value) + 0.001);
            document.getElementById('rd-kill').value = newKill;
            document.getElementById('kill-display').innerText = newKill.toFixed(3);
            updateRDParams();
            logAI(`WARNING: Overpopulation (${(activity * 100).toFixed(1)}%). Increasing Entropy.`);
        } else if (activity > 0.01) {
            if (Math.random() < 0.2) logAI(`Observation: Stable ecosystem. Activity: ${(activity * 100).toFixed(1)}%`);
        }

        lastCheck = timestamp;
    }

    requestAnimationFrame(autonomyLoop);
}

// Audio Pulse
let audioEnabled = false;
let audioContext, analyser, dataArray;
const audioCheckbox = document.getElementById('rd-audio');

if (audioCheckbox) {
    audioCheckbox.addEventListener('change', async (e) => {
        audioEnabled = e.target.checked;
        if (audioEnabled) {
            if (!audioContext) await initAudio();
            if (audioContext && audioContext.state === 'suspended') await audioContext.resume();
            requestAnimationFrame(audioProcess);
        }
    });

    const toggleContainer = audioCheckbox.parentElement;
    if (toggleContainer && toggleContainer.classList.contains('control-group-toggle')) {
        toggleContainer.addEventListener('click', (e) => {
            if (e.target !== audioCheckbox) {
                audioCheckbox.checked = !audioCheckbox.checked;
                audioCheckbox.dispatchEvent(new Event('change'));
            }
        });
    }
}

async function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const microphone = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        microphone.connect(analyser);
        dataArray = new Uint8Array(analyser.frequencyBinCount);
    } catch (err) {
        console.error('Audio init failed', err);
        audioEnabled = false;
        audioCheckbox.checked = false;
        alert("Microphone access needed for Pulse.");
    }
}

function audioProcess() {
    if (!audioEnabled || currentMode !== 'life') return;

    analyser.getByteFrequencyData(dataArray);

    // Low frequencies (Bass) - bins 0-10
    let bass = 0;
    for (let i = 0; i < 10; i++) bass += dataArray[i];
    bass = bass / 10 / 255;

    // High frequencies (Treble) - bins 50-100
    // Note: bin count is 128 (fftSize/2). 50-100 is mid-high.
    let treble = 0;
    let count = 0;
    for (let i = 50; i < 100 && i < dataArray.length; i++) {
        treble += dataArray[i];
        count++;
    }
    if (count > 0) treble = treble / count / 255;

    const baseFeed = parseFloat(document.getElementById('rd-feed').value);
    const baseKill = parseFloat(document.getElementById('rd-kill').value);

    // Modulation
    // Bass expands (more feed)
    // Treble contracts (more kill)
    const modFeed = baseFeed + (bass * 0.02);
    const modKill = baseKill + (treble * 0.01);

    setParams(modFeed, modKill);

    requestAnimationFrame(audioProcess);
}

// Reset Simulation Button
const btnReset = document.getElementById('btn-reset-rd');
if (btnReset) {
    btnReset.addEventListener('click', () => {
        resetRD();
        logAI("Simulation reset. New patterns seeded.");
    });
}

// Memory / Fossil System
const btnSave = document.getElementById('btn-save-species');
const listSpecies = document.getElementById('species-list');
let speciesGallery = [];
try {
    speciesGallery = JSON.parse(localStorage.getItem('neon_species') || '[]');
} catch (e) { }

function renderSpecies() {
    if (!listSpecies) return;
    listSpecies.innerHTML = '';
    speciesGallery.forEach((s, index) => {
        const div = document.createElement('div');
        div.className = 'species-item';
        // Add a delete button or just simple click to load
        div.innerHTML = `<span>Species ${index + 1}</span> <span>${s.f.toFixed(3)} / ${s.k.toFixed(3)}</span>`;
        div.title = "Click to Load";
        div.addEventListener('click', () => {
            // Load params
            document.getElementById('rd-feed').value = s.f;
            document.getElementById('rd-kill').value = s.k;
            document.getElementById('feed-display').innerText = s.f.toFixed(3);
            document.getElementById('kill-display').innerText = s.k.toFixed(3);
            updateRDParams();

            // Visual feedback
            div.style.background = 'rgba(0, 242, 255, 0.3)';
            setTimeout(() => div.style.background = '', 300);
        });
        listSpecies.appendChild(div);
    });
}

if (btnSave) {
    btnSave.addEventListener('click', () => {
        const f = parseFloat(document.getElementById('rd-feed').value);
        const k = parseFloat(document.getElementById('rd-kill').value);
        speciesGallery.push({ f, k, date: Date.now() });
        if (speciesGallery.length > 5) speciesGallery.shift(); // Keep last 5 to avoid clutter
        localStorage.setItem('neon_species', JSON.stringify(speciesGallery));
        renderSpecies();
    });

    renderSpecies();
}

// ** The Architect Mode **
let architectNodes = [];
let architectLinks = [];

function initArchitectSync() {
    // Hardcoded nodes representing the code structure
    const nodes = [
        { id: 'User', type: 'origin' },
        { id: 'script.js', type: 'file' },
        { id: 'init', type: 'func' },
        { id: 'animate', type: 'loop' },
        { id: 'autonomyLoop', type: 'brain' },
        { id: 'ParticleSystem', type: 'class' },
        { id: 'RD_Simulation', type: 'class' },
        { id: 'SoundEngine', type: 'class' },
        { id: 'update', type: 'func' },
        { id: 'draw', type: 'func' },
        { id: 'checkActivity', type: 'sensor' },
        { id: 'injectLife', type: 'action' },
        { id: 'triggerChime', type: 'action' }
    ];

    const links = [
        { source: 'User', target: 'script.js' },
        { source: 'script.js', target: 'init' },
        { source: 'init', target: 'animate' },
        { source: 'init', target: 'ParticleSystem' },
        { source: 'init', target: 'autonomyLoop' },
        { source: 'animate', target: 'ParticleSystem' },
        { source: 'ParticleSystem', target: 'update' },
        { source: 'ParticleSystem', target: 'draw' },
        { source: 'autonomyLoop', target: 'checkActivity' },
        { source: 'autonomyLoop', target: 'RD_Simulation' },
        { source: 'autonomyLoop', target: 'injectLife' },
        { source: 'injectLife', target: 'SoundEngine' },
        { source: 'SoundEngine', target: 'triggerChime' },
        { source: 'RD_Simulation', target: 'SoundEngine' }
    ];

    // Map to screen space
    architectNodes = nodes.map(n => ({
        ...n,
        x: canvas.width / 2 + (Math.random() - 0.5) * 100,
        y: canvas.height / 2 + (Math.random() - 0.5) * 100,
        vx: 0,
        vy: 0
    }));

    architectLinks = links.map(l => {
        const source = architectNodes.find(n => n.id === l.source);
        const target = architectNodes.find(n => n.id === l.target);
        return { source, target };
    });
}

function architectLoop() {
    if (currentMode !== 'architect') return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Force Simulation
    for (let i = 0; i < architectNodes.length; i++) {
        for (let j = i + 1; j < architectNodes.length; j++) {
            const a = architectNodes[i];
            const b = architectNodes[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
            const force = 1000 / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.vx += fx;
            a.vy += fy;
            b.vx -= fx;
            b.vy -= fy;
        }
    }

    architectLinks.forEach(l => {
        if (!l.source || !l.target) return;
        const dx = l.target.x - l.source.x;
        const dy = l.target.y - l.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
        const force = (dist - 150) * 0.05;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        l.source.vx += fx;
        l.source.vy += fy;
        l.target.vx -= fx;
        l.target.vy -= fy;
    });

    architectNodes.forEach(n => {
        // Mouse Repulsion
        if (mouse.active) {
            const mdx = mouse.x - n.x;
            const mdy = mouse.y - n.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mdist < 250) {
                const force = (250 - mdist) * 0.08; // Stronger push
                const angle = Math.atan2(mdy, mdx);
                n.vx -= Math.cos(angle) * force;
                n.vy -= Math.sin(angle) * force;
            }
        }

        const dx = canvas.width / 2 - n.x;
        const dy = canvas.height / 2 - n.y;
        n.vx += dx * 0.01;
        n.vy += dy * 0.01;
        n.vx *= 0.9;
        n.vy *= 0.9;
        n.x += n.vx;
        n.y += n.vy;
    });

    ctx.lineWidth = 1;
    architectLinks.forEach(l => {
        if (!l.source || !l.target) return;
        ctx.strokeStyle = 'rgba(189, 0, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(l.source.x, l.source.y);
        ctx.lineTo(l.target.x, l.target.y);
        ctx.stroke();
    });

    architectNodes.forEach(n => {
        ctx.fillStyle = n.type === 'origin' ? '#ffffff' : '#00f2ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        if (n.type === 'class') ctx.rect(n.x - 6, n.y - 6, 12, 12);
        else ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '10px "Courier New"';
        ctx.fillText(n.id, n.x + 12, n.y + 4);
    });

    requestAnimationFrame(architectLoop);
}

// Sound Engine Control
const voiceCheckbox = document.getElementById('rd-voice');
if (voiceCheckbox) {
    voiceCheckbox.addEventListener('change', async (e) => {
        if (e.target.checked) {
            await soundEngine.init();
            soundEngine.toggleMute(false);
            logAI("Voice Module: Online");
        } else {
            soundEngine.toggleMute(true);
            logAI("Voice Module: Offline");
        }
    });

    const toggleContainer = voiceCheckbox.parentElement;
    if (toggleContainer && toggleContainer.classList.contains('control-group-toggle')) {
        toggleContainer.addEventListener('click', (e) => {
            if (e.target !== voiceCheckbox) {
                voiceCheckbox.checked = !voiceCheckbox.checked;
                voiceCheckbox.dispatchEvent(new Event('change'));
            }
        });
    }
}
