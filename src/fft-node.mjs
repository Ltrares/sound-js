import SoundNode from "./sound-node.mjs";
import * as SoundConstants from "./sound-constants.mjs";
import SoundFft from "./sound-fft.mjs";

export default class FftNode extends SoundNode {
    constructor(name,duration) {
        super("FFT Node",name);
        this.duration = duration ? duration : 1.0;
        this.audio = [];
        this.frequencies = {};
        this.frequencies[440] = 1;
        this.position = 0;
        this.initAudio();
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
                output.set(j, index0, this.getAudio(this.position) * this.effectiveVolume);
            }  //for channel

            this.nextPosition();

            if ( this.position >= this.duration || this.position < 0) {
                console.log( "done" );
                this.done = true;
                break;
            } //if

        }

    } //processAudio

    getAudio(position) {
        let index = this.timePositionToIndex(position) % this.audio.length;

        if ( index < 0 || index >= this.audio.length) return 0.0;

        return this.audio[index];

    }

    initAudio() {
        this.position = 0;
        let fft = new SoundFft();
        let imag = fft.newArrayOfZeros(SoundConstants.FFT_SIZE);
        let real = fft.newArrayOfZeros(SoundConstants.FFT_SIZE);

        let binSize = 1.0/(SoundConstants.FFT_SIZE * this.timePerSample);
        console.log( "frequencies", binSize, this.frequencies );

        Object.keys(this.frequencies).forEach(frequency=>{
            var bin = Math.floor(frequency/binSize);
            real[bin] = this.frequencies[frequency];
            //real[SoundConstants.FFT_SIZE-1-bin] = this.frequencies[frequency];
        });

        fft.inverseTransform(real,imag);

        var maxValue = Math.max.apply(null, real.map(Math.abs));
        if ( maxValue > 0 ) real = real.map( value => value/maxValue);
        console.log( "max value", maxValue );
        this.audio = real;
        console.log( "audio", this.audio );

    }


}