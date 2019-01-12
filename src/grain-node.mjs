import SoundNode from "./sound-node.mjs";
import Grain from "./grain.mjs";
import * as SoundConstants from "./sound-constants.mjs";

export default class GrainNode extends SoundNode {
    constructor(soundBuffer, name) {
        super("Grain Node", name);

        console.log("new grain node", this);
        this.soundBuffer = soundBuffer;
        this.audioBuffer = soundBuffer.buffer; //audioBuffer;
        this.length = this.audioBuffer.length;
        this.grainInterval = 50;
        this.grainSize = 300;
        this.randomness = 0.01;
        this.msPerSample = 1000.0 / audioContext.sampleRate;
        this.grains = [];
        this.freeGrains = [];
        this.position = 0.0;
        this.timeSinceLastGrain = 0.0;
        this.currentFrame = new Array(this.channelCount).fill(0);
        this.zeroFrame = new Array(this.channelCount).fill(0);
        //this.starting = true;
        this.reset();

        if (GrainNode.window.length <= 0) {
            for (var i = 0; i < 1000; i++) {
                var result = Math.sin(Math.PI * Math.sin(i / 1000.0));
                result *= result;
                GrainNode.window[i] = result;
            }
        }

    }

    reset() {
        this.updateEffectivePitch();
        this.updateEffectiveVolume();
        this.updateEffectiveRate();

        if (this.effectiveRate < 0) {
            this.position = this.audioBuffer.length * this.msPerSample;
        } else {
            this.position = 0;
        }
        this.starting = true;
        this.timeSinceLastGrain = 0;
        this.done = false;
        this.grains.forEach(value => this.freeGrains.push(value));
        this.grains = [];
    }


    play(delay) {
        super.play(delay);
    }

    firstGrain() {
        if (!this.starting) return;
        //console.log("start time", this.context.currentTime);


        this.starting = false;

        //console.log("first grain: ", this.grains);

        let grain = new Grain();
        grain.position = this.position;
        grain.previousPosition = grain.position;
        grain.age = this.grainSize / 4.0;
        grain.size = this.grainSize;
        grain.index = 0;
        this.grains.push(grain);
        this.timeSinceLastGrain = this.grainInterval / 2.0;
    }

    resetGrain(grain) {
        grain.position = (this.position + this.grainSize * this.randomness * (Math.random() * 2.0 - 1.0));
        grain.previousPosition = grain.position;
        grain.age = 0.0;
        grain.size = this.grainSize;
    }

    nextPosition() {
        this.position += this.msPerSample * this.effectiveRate;
    }

    nextGrainPosition(grain) {
        let direction = (this.effectiveRate > 0.0) ? 1 : -1;
        grain.age += this.msPerSample; // * this.rate;
        grain.previousPosition = grain.position;
        grain.position += direction * this.msPerSample * this.effectivePitch;
    }

    static windowValue(value) {
        let iValue = Math.trunc(value * 1000);
        return GrainNode.window[iValue];
    }

    getGrain() {
        let grain = null;
        if (this.freeGrains.length > 0) {
            grain = this.freeGrains.pop();
        } else {
            grain = new Grain();
            grain.index = this.grains.length;
            this.grains.push(grain);
        }
        this.resetGrain(grain);
        this.timeSinceLastGrain = 0.0;

    }

    generateOwnOutputFromIndex(output, startIndex) {
        this.firstGrain();

        for (let index0 = startIndex; index0 < output.length; index0++) {
            if (this.timeSinceLastGrain >= this.grainInterval) {
                this.getGrain();
            }

            let scale = this.effectiveVolume * this.grainInterval / this.grainSize;

            for (let k = 0; k < this.grains.length; k++) {
                let grain = this.grains[k];
                if (grain.age >= grain.size) continue;
                let windowValue = scale * GrainNode.windowValue(grain.age / grain.size);
                this.getGrainAudio(this.soundBuffer, grain);
                for (let j = 0; j < output.channelCount; j++) {
                    output.add(j, index0, windowValue * this.currentFrame[j % this.currentFrame.length]);
                }
            } //for grain

            this.nextPosition();

            this.timeSinceLastGrain += this.msPerSample;

            for (let j = 0; j < this.grains.length; j++) {
                let grain = this.grains[j];
                this.nextGrainPosition(grain);
                if (grain.age >= grain.size) {
                    this.freeGrains.push(grain);
                } //
            } //

            if (this.position > this.audioBuffer.length * this.msPerSample || this.position < 0) {
                this.done = true;
                break;
            } //if

        }

    } //processAudio

    getGrainAudio(sound, grain) {
        // let pos = Math.trunc(grain.position/this.msPerSample) % SoundConstants.FFT_SIZE;
        // return this.soundBuffer.averageSound[pos];


        // let pos = Math.trunc(10.0*grain.position/this.msPerSample);
        // if ( GrainNode.audio[pos] ) return GrainNode.audio[pos];
        //
        // let v0 = GrainNode.interpolateAudio( audioData, grain.position/this.msPerSample );
        // let v1 = GrainNode.interpolateAudio( audioData, grain.previousPosition/this.msPerSample );
        //
        // GrainNode.audio[pos] = (v0+v1)/2.0;
        // return GrainNode.audio[pos];
        //
        //
        //
        let pos = Math.trunc(grain.position / this.msPerSample);
        if (pos < 0 || pos >= sound.channelData[0].length) return this.zeroFrame;

        for (let ci = 0; ci < this.currentFrame.length; ci++) {

            let cc = ci % sound.channelData.length;
            this.currentFrame[ci] = sound.channelData[cc][pos];
        } //while

        return this.currentFrame;
    }

    static interpolateAudio(audioData, position) {
        let pos = Math.trunc(position);
        if (pos < 0 || pos >= audioData.length) return 0.0;
        let offset = position - pos;
        if (pos >= audioData.length - 1) return audioData[pos];
        return audioData[pos] * (1 - offset) + audioData[pos + 1] * offset;
    }
}

GrainNode.window = [];