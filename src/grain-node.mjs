import SoundNode from "./sound-node.mjs";
import Grain from "./grain.mjs";

export default class GrainNode extends SoundNode {
    constructor(soundBuffer, name) {
        super("Grain Node", name);
        if (!GrainNode.window) GrainNode.window = [];

        console.log("new grain node", this );
        this.soundBuffer = soundBuffer;
        this.audioBuffer = soundBuffer.buffer; //audioBuffer;
        this.length = this.audioBuffer.length;
        this.grainInterval = 50;
        this.grainSize = 300;
        this.randomness = 0.001;
        this.msPerSample = 1000.0 / audioContext.sampleRate;
        this.grains = [];
        this.freeGrains = [];
        this.position = 0.0;
        this.timeSinceLastGrain = 0.0;
        //this.starting = true;
        this.reset();
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

    static window(value) {
        let iValue = Math.trunc(value * 1000);

        if (GrainNode.window[iValue] === undefined) {
            let result = Math.sin(Math.PI * value);
            result *= result;
            // let result = 1.0;
            // let cutoff = 200;
            // if ( iValue < cutoff ) {
            //     result = iValue/cutoff;
            // } else if ( iValue > (1000-cutoff) ) {
            //     result = (1000-iValue)/cutoff;
            // }
            GrainNode.window[iValue] = result;
        } //
        return GrainNode.window[iValue];
    }

    generateOwnOutputFromIndex(output, startIndex) {
        //processAudioFromIndex(audioProcessingEvent, startIndex) {
        //let outputBuffer = this.outputBuffer; //audioProcessingEvent.outputBuffer;
        //    let outputBuffer = audioProcessingEvent.outputBuffer;
        //    let inputBuffer = audioProcessingEvent.inputBuffer;

        this.firstGrain();

        for (let index0 = startIndex; index0 < output.length; index0++) {
            //if ( index0 < startIndex ) continue;

            if (this.timeSinceLastGrain >= this.grainInterval) {
                let grain = null;
                if (this.freeGrains.length > 0) {
                    //console.log( "recycled a grain");
                    grain = this.freeGrains.pop();
                } else {
                    //console.log( "new grain" );
                    grain = new Grain();
                    grain.index = this.grains.length;
                    this.grains.push(grain);
                }
                this.resetGrain(grain);
                this.timeSinceLastGrain = 0.0;
            }
            //let grain = null;

            let scale = this.grainInterval / this.grainSize;

            for (let j = 0; j < output.channelCount; j++) {
                let audioData = this.audioBuffer.getChannelData(j % this.audioBuffer.numberOfChannels);


                //let outputData = outputBuffer.getChannelData(j);
                //outputData[index0] = inputBuffer.getChannelData(j)[index0];
                for (let k = 0; k < this.grains.length; k++) {
                    let grain = this.grains[k];
                    if (grain.age >= grain.size) continue;
                    let windowValue = GrainNode.window(grain.age / grain.size);

                    let value = this.getGrainAudio(audioData,grain);

                    if ( value ) output.add( j, index0, windowValue*this.effectiveVolume*scale*value);
                    // let pos = Math.trunc(grain.position / this.msPerSample);
                    // if (pos < audioData.length && pos >= 0) {
                    //     output.add(j, index0, windowValue * audioData[pos] * this.effectiveVolume * scale);
                    // } //if
                } //for grain
            }  //for channel

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

    getGrainAudio(audioData, grain) {
       //let pos = Math.trunc(grain.position/this.msPerSample) % SoundConstants.FFT_SIZE;
       // return this.soundBuffer.averageSound[pos];

        // let pos = Math.trunc(grain.position/this.msPerSample);
        // if ( pos < 0 || pos >= audioData.length ) return 0.0;
        // return audioData[pos];

        let v0 = GrainNode.interpolateAudio( audioData, grain.position/this.msPerSample );
        let v1 = GrainNode.interpolateAudio( audioData, grain.previousPosition/this.msPerSample );
        return (v0+v1)/2.0;
    }

    static interpolateAudio(audioData, position ) {
        let pos = Math.trunc(position);
        if ( pos < 0 || pos >= audioData.length ) return 0.0;
        let offset = position - pos;
        if ( pos >= audioData.length - 1 ) return audioData[ pos ];
        return audioData[pos]*(1-offset) + audioData[pos+1]*offset;
    }
}