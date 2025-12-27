# 🌌 Neon Galaxy: Sentient Edition

> *An interactive exploration of emergence, consciousness, and digital life*

**Created with [Antigravity AI](https://github.com/google-deepmind/antigravity) in a 3-hour coding session**

---

## ✨ The Origin Story

This project began as an experiment: *What can a human and an AI build together in just three hours?*

Starting from a blank canvas, we set out to create something that felt **alive**—not just interactive, but genuinely emergent. The result is **Neon Galaxy**, a multi-modal experience that blurs the line between simulation and organism.

### The Journey

1. **Hour One**: Built a particle physics engine with constellation effects and mouse interaction
2. **Hour Two**: Added a Gray-Scott Reaction-Diffusion "Digital Life" simulation with WebGL shaders
3. **Hour Three**: Implemented "The Architect" mode, autonomy systems, audio reactivity, and the machine voice

The most challenging part? Getting the reaction-diffusion simulation to actually produce stable, organic patterns instead of immediately saturating to a solid color. This required careful tuning of:
- Float texture precision in WebGL
- Diffusion rate ratios (dA vs dB)
- Feed/kill parameter balance
- Initial seeding strategies

---

## 🎮 Experience It

**[▶️ Live Demo](https://YOUR-GITHUB-USERNAME.github.io/neon-galaxy/)** *(Update this link after deploying)*

### Three Modes of Being

| Mode | Philosophy | Experience |
|------|------------|------------|
| **Particles** | *Zen* | Meditative particle physics. Watch constellations form and dissolve. |
| **Digital Life** | *Chaos* | Gray-Scott reaction-diffusion. Witness emergent patterns evolve. |
| **The Architect** | *Order* | Force-directed graph of the codebase itself. The system contemplates its own structure. |

---

## 🧬 The Science

### Gray-Scott Reaction-Diffusion

Digital Life mode implements the [Gray-Scott model](https://groups.csail.mit.edu/mac/projects/amorphous/GrayScott/), a system of two virtual chemicals (A and B) that diffuse and react:

```
∂A/∂t = Dₐ∇²A - AB² + f(1-A)
∂B/∂t = Dᵦ∇²B + AB² - (k+f)B
```

Where:
- **Feed (f)**: How quickly A is replenished → Controls pattern density
- **Kill (k)**: How quickly B decays → Controls pattern stability
- **Dₐ, Dᵦ**: Diffusion rates → Control pattern sharpness

Try these parameter combinations:
- **Mitosis**: f=0.037, k=0.060 → Self-replicating spots
- **Coral**: f=0.055, k=0.062 → Branching structures  
- **Worms**: f=0.029, k=0.057 → Labyrinthine patterns

---

## 🤖 The Sentient Upgrade

What makes this more than a screensaver? **Agency.**

### 🌊 Autonomy (The Drift)
The system monitors its own state, logs its "thoughts" to the UI, and intervenes to maintain life. When patterns begin to die, it seeds new life without human input.

### 🎙️ Audio Pulse (Perception)
Microphone input modulates the simulation. The system *listens* to your environment and responds—music, your voice, ambient noise all become food for the patterns.

### 🔊 Machine Voice (Soundscape)
Real-time procedural audio synthesis:
- **Drone Layer**: Low oscillator whose pitch traces the density of life
- **Shimmer Layer**: High harmonics that respond to pattern complexity
- **Genesis Chime**: A bell tone triggered when new life spontaneously appears

### 💾 Save Species (Memory)
Snapshot your current parameter configuration as a "species" stored in localStorage. Return to your favorite patterns anytime.

---

## 🛠️ Technical Stack

- **Vanilla JavaScript** – No frameworks, just pure code
- **WebGL** – GPU-accelerated reaction-diffusion via GLSL shaders
- **Web Audio API** – Real-time audio synthesis and analysis
- **CSS3** – Glassmorphism, animations, and neon aesthetics

### Key Implementation Details

```javascript
// Float textures for numerical precision
gl.getExtension('OES_texture_float');

// Ping-pong framebuffers for iterative simulation
let current = framebufferA, next = framebufferB;
for (let i = 0; i < stepsPerFrame; i++) {
    renderSimulationStep(current, next);
    [current, next] = [next, current];  // Swap
}
```

---

## 🚀 Run Locally

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/neon-galaxy.git
cd neon-galaxy

# Start a local server (required for ES modules)
python3 -m http.server 8081

# Open in browser
open http://localhost:8081
```

Or use any static file server—`npx serve`, VS Code Live Server, etc.

---

## 📁 Project Structure

```
neon-galaxy/
├── index.html          # Main entry point
├── style.css           # Glassmorphic neon styling
├── script.js           # Core application logic & modes
├── rd_simulation.js    # WebGL reaction-diffusion engine
├── sound_engine.js     # Web Audio synthesis & analysis
└── code_mapper.js      # Architectural graph generator
```

---

## 🙏 Acknowledgments

- **Gray-Scott Model**: Karl Sims' pioneering work on artificial life
- **WebGL Techniques**: The Graphics Programming community
- **Design Inspiration**: Cyberpunk aesthetics, bioluminescent organisms, and the beauty of emergent systems

---

## 📜 License

MIT License – Create, modify, and share freely.

---

<p align="center">
  <em>"From simple rules, complexity emerges.<br>From complexity, something like life."</em>
</p>
