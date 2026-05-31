import { BaseEffect } from './BaseEffect.js';

export class SpatialAudioEffect extends BaseEffect {
    constructor(options = {}) {
        super(options);
        this.type = 'SpatialAudio';
        this.defaultOptions = {
            x: 0,
            y: 0,
            z: 0,
            distanceModel: 'inverse',
            maxDistance: 10000,
            refDistance: 1,
            rolloffFactor: 1,
            coneInnerAngle: 360,
            coneOuterAngle: 360,
            coneOuterGain: 0
        };
        this.options = { ...this.defaultOptions, ...options };
    }

    async initialize() {
        await super.initialize();
        
        // Create panner node
        this.panner = this.audioContext.createPanner();
        
        // Configure panner
        this.panner.panningModel = 'HRTF';
        this.panner.distanceModel = this.options.distanceModel;
        this.panner.maxDistance = this.options.maxDistance;
        this.panner.refDistance = this.options.refDistance;
        this.panner.rolloffFactor = this.options.rolloffFactor;
        this.panner.coneInnerAngle = this.options.coneInnerAngle;
        this.panner.coneOuterAngle = this.options.coneOuterAngle;
        this.panner.coneOuterGain = this.options.coneOuterGain;

        // Set initial position
        this.setPosition(this.options.x, this.options.y, this.options.z);

        // Connect nodes
        this.input.connect(this.panner);
        this.panner.connect(this.output);
    }

    setPosition(x, y, z) {
        this.options.x = x;
        this.options.y = y;
        this.options.z = z;
        
        if (this.panner) {
            this.panner.setPosition(x, y, z);
        }
    }

    setOrientation(x, y, z) {
        if (this.panner) {
            this.panner.setOrientation(x, y, z);
        }
    }

    setVelocity(x, y, z) {
        if (this.panner) {
            this.panner.setVelocity(x, y, z);
        }
    }

    dispose() {
        if (this.panner) {
            this.panner.disconnect();
        }
        super.dispose();
    }
} 