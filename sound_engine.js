// Neon Galaxy - Generative Sound Engine
// Translates simulation state into ambient soundscapes.

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.oscillators = [];
        this.filter = null;
        this.isMuted = true;
        this.baseFreq = 110; // A2
        this.chord = [1, 1.5, 1.2, 2]; // Simple intervals
    }

    async init() {
        if (this.ctx) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        // Master Chain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3;

        // Lowpass Filter (controlled by life density)
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 200; // Start dark
        this.filter.Q.value = 1;

        // Reverb (Convolver)
        const reverb = await this.createReverb();

        // Connect: Filter -> Reverb -> Master -> Out
        this.filter.connect(reverb);
        reverb.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.startDrone();
    }

    async createReverb() {
        // Generate a simple impulse response for reverb
        const duration = 3;
        const decay = 2;
        const rate = this.ctx.sampleRate;
        const length = rate * duration;
        const impulse = this.ctx.createBuffer(2, length, rate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const n = i / length;
            left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
            right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
        }

        const convolver = this.ctx.createConvolver();
        convolver.buffer = impulse;
        return convolver;
    }

    startDrone() {
        // Create 3 detuned oscillators for a thick texture
        const freqs = [this.baseFreq, this.baseFreq + 2, this.baseFreq * 1.5]; // Root, Detune, Fifth

        freqs.forEach(f => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = f;

            const gain = this.ctx.createGain();
            gain.gain.value = 0.1;

            osc.connect(gain);
            gain.connect(this.filter);
            osc.start();

            this.oscillators.push({ osc, gain, base: f });
        });
    }

    update(activity) {
        if (!this.ctx || this.isMuted) return;

        // Map activity (0.0 - 1.0) to sound parameters

        // Filter opens up as life grows (Brightens the sound)
        // Range: 200Hz to 4000Hz
        const targetFreq = 200 + (activity * 3800);
        this.filter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.5);

        // Amplitude modulation based on activity (breathing)
        this.masterGain.gain.setTargetAtTime(0.2 + (activity * 0.2), this.ctx.currentTime, 0.5);
    }

    triggerChime() {
        if (!this.ctx || this.isMuted) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Random note from chord
        const interval = this.chord[Math.floor(Math.random() * this.chord.length)];
        osc.frequency.value = this.baseFreq * 2 * interval; // Higher octave
        osc.type = 'sine';

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2);

        osc.connect(gain);
        gain.connect(this.masterGain); // Skip reverb for clarity? No, put in reverb
        gain.disconnect(); gain.connect(this.filter); // Go through filter/reverb chain

        osc.start();
        osc.stop(this.ctx.currentTime + 2.1);
    }

    toggleMute(muted) {
        this.isMuted = muted;
        if (this.ctx) {
            if (muted) {
                this.ctx.suspend();
            } else {
                this.ctx.resume();
            }
        } else if (!muted) {
            this.init();
            this.isMuted = false;
        }
    }
}

export const soundEngine = new SoundEngine();
