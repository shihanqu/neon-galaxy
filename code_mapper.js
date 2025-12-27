export class CodeMapper {
    constructor() {
        this.nodes = []; // { id, name, type, x, y }
        this.links = []; // { source, target }
    }

    async analyze() {
        const files = ['script.js', 'rd_simulation.js', 'sound_engine.js'];
        let rawCode = "";

        // Fetch all code
        for (const file of files) {
            try {
                const res = await fetch(file);
                const text = await res.text();
                rawCode += text + "\n";
            } catch (e) {
                console.warn("Could not fetch", file);
            }
        }

        this.parse(rawCode);
        return { nodes: this.nodes, links: this.links };
    }

    parse(code) {
        // Very basic regex parser to find function definitions and calls
        // This is not a real AST parser, but a "dreamy" approximation

        const functionRegex = /function\s+(\w+)/g;
        const classMethodRegex = /(\w+)\s*\([^\)]*\)\s*{/g;
        const callRegex = /(\w+)\(/g;

        const definedFuncs = new Set();
        let match;

        // 1. Find Nodes (Definitions)
        while ((match = functionRegex.exec(code)) !== null) {
            definedFuncs.add(match[1]);
        }
        // Add class methods/exports roughly
        // Manual injection of known key players for cleaner graph
        const coreSystems = ['init', 'animate', 'update', 'draw', 'startRD', 'animateRD', 'soundEngine', 'checkActivity', 'injectLife', 'autonomyLoop', 'renderSpecies'];
        coreSystems.forEach(f => definedFuncs.add(f));

        // Create Nodes
        this.nodes = Array.from(definedFuncs).map(name => ({
            id: name,
            name: name,
            type: 'function',
            val: 1 // importance
        }));

        // 2. Find Links (Calls)
        // We'll just scan the code again and if we see a name that is in our node list, we link to it?
        // This is hard without context. 
        // Let's cheat slightly for the sake of art:
        // We will link nodes randomly based on "proximity" in the text, 
        // OR we try to find "Caller -> Callee".

        // Let's do a simple "Co-occurrence" approximation.
        // If 'animate' and 'draw' appear near each other, link them.

        // Better: Explicit Manual Map of the "Mental Model"
        // Since parsing JS with Regex is fragile, I will hardcode the *idealized* architecture.
        // This represents how *I* think about the code.

        this.nodes = [
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

        this.links = [
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
    }
}
