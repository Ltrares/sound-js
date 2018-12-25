import SoundNode from "./sound-node.mjs";
import Grain from "./grain.mjs";
//import SoundBuffer from "./sound-buffer.mjs";

export default class GrainNode extends SoundNode {
    constructor(audioBuffer, name) {
        super("Grain Node", name);
        if (!GrainNode.window) GrainNode.window = [];

        console.log("new grain node", this, audioBuffer);
        this.audioBuffer = audioBuffer;
        this.length = audioBuffer.length;
        this.grainInterval = 150;
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
        if ( this.effectiveRate < 0 ) {
            this.position = this.audioBuffer.length * this.msPerSample;
        } else {
            this.position = 0;
        }
        this.starting = true;
        this.timeSinceLastGrain = 0;
        this.done = false;
        this.grains.forEach( value=>this.freeGrains.push(value));
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
        grain.age = this.grainSize / 4.0;
        grain.size = this.grainSize;
        grain.index = 0;
        this.grains.push(grain);
        this.timeSinceLastGrain = this.grainInterval / 2.0;
    }

    resetGrain(grain) {
        grain.position = (this.position + this.grainSize * this.randomness * (Math.random() * 2.0 - 1.0));
        grain.age = 0.0;
        grain.size = this.grainSize;
    }

    nextPosition() {
        this.position += this.msPerSample * this.effectiveRate;
    }

    nextGrainPosition(grain) {
        var direction = (this.effectiveRate > 0.0) ? 1 : -1;
        grain.age += this.msPerSample; // * this.rate;
        grain.position += direction * this.msPerSample * this.effectivePitch;
    }

    window(value) {
        var iValue = Math.trunc(value * 1000);

        if (GrainNode.window[iValue] === undefined) {
            var result = Math.sin(Math.PI * value);
            result *= result;
            // var result = 1.0;
            // var cutoff = 200;
            // if ( iValue < cutoff ) {
            //     result = iValue/cutoff;
            // } else if ( iValue > (1000-cutoff) ) {
            //     result = (1000-iValue)/cutoff;
            // }
            GrainNode.window[iValue] = result;
        } //
        return GrainNode.window[iValue];
    }

    generateOwnOutputFromIndex(output,startIndex) {
    //processAudioFromIndex(audioProcessingEvent, startIndex) {
        //var outputBuffer = this.outputBuffer; //audioProcessingEvent.outputBuffer;
    //    var outputBuffer = audioProcessingEvent.outputBuffer;
    //    var inputBuffer = audioProcessingEvent.inputBuffer;

        this.firstGrain();

        for (var index0 = startIndex; index0 < output.length; index0++) {
            //if ( index0 < startIndex ) continue;

            if (this.timeSinceLastGrain >= this.grainInterval) {
                var grain = null;
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
            //var grain = null;

            var scale = this.grainSize/this.grainInterval;

            for (var j = 0; j < output.channelCount; j++) {
                var audioData = this.audioBuffer.getChannelData(j % this.audioBuffer.numberOfChannels);
                //var outputData = outputBuffer.getChannelData(j);
                //outputData[index0] = inputBuffer.getChannelData(j)[index0];
                for (var k = 0; k < this.grains.length; k++) {
                    var grain = this.grains[k];
                    if (grain.age >= grain.size) continue;
                    var windowValue = this.window(grain.age / grain.size);
                    var pos = Math.trunc(grain.position / this.msPerSample);
                    if (pos < audioData.length && pos >= 0) {
                        output.add(j, index0, windowValue * audioData[pos] * this.effectiveVolume*scale);
                    } //if
                } //for grain
            }  //for channel

            this.nextPosition();

            this.timeSinceLastGrain += this.msPerSample;

            for (var j = 0; j < this.grains.length; j++) {
                var grain = this.grains[j];
                this.nextGrainPosition(grain);
                if (grain.age >= grain.size) {
                    this.freeGrains.push(grain);
                } //
            } //

            if (this.position > this.audioBuffer.length * this.msPerSample || this.position < 0) {
                console.log("grain node playback ended", this);
                this.done = true;
                break;
            } //if

        }

    } //processAudio

}