import SoundNode from "./sound-node.mjs";
import Grain from "./grain.mjs";
//import SoundBuffer from "./sound-buffer.mjs";

export default class SampleNode extends SoundNode {
    constructor(audioBuffer, name) {
        super("Sample Node", name);
        this.audioBuffer = audioBuffer;
        this.position = 0;
        this.reset();
    }

    reset() {
        this.updateEffectivePitch();
        this.updateEffectiveVolume();
        this.updateEffectiveRate();

        if (this.effectiveRate < 0) {
            this.position = this.audioBuffer.length * this.timePerSample;
        } else {
            this.position = 0;
        }
        this.done = false;

    }

    play(delay) {
        super.play(delay);
    }


    nextPosition() {
        this.position += this.timePerSample * this.effectivePitch;
    }

    timePositionToIndex(position) {
        return Math.trunc(position / this.timePerSample);
    }

    generateOwnOutputFromIndex(output, startIndex) {

        for (var index0 = startIndex; index0 < output.length; index0++) {
            for (var j = 0; j < output.channelCount; j++) {
                var audioData = this.audioBuffer.getChannelData(j % this.audioBuffer.numberOfChannels);
                output.set(j, index0, audioData[this.timePositionToIndex(this.position)] * this.effectiveVolume);
            }  //for channel

            this.nextPosition();

            if (this.position >= this.audioBuffer.length * this.timePerSample || this.position < 0) {
                this.done = true;
                break;
            } //if

        }

    } //processAudio

}