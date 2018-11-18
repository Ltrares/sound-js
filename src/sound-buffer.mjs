import SoundFft from "./sound-fft.mjs";
import * as SoundConstants from "./sound-constants.mjs";

export default class SoundBuffer {
    constructor(context, url, buffer) {
        this.url = url;
        this.buffer = null;
        this.primaryFrequency = null;
        this.frequencies = [];
        this.overallFrequencies = null;
        this.ready = false;
        this.binSize = 0;
        //this.frequencyArray = null;
        console.log("sound buffer", url);
        context.decodeAudioData(buffer, this.audioDecoded.bind(this));
    };

    audioDecoded(buffer) {

        this.buffer = buffer;
        this.binSize = this.buffer.sampleRate / SoundConstants.FFT_SIZE;
        console.log("decoded audio", buffer);


        var fft = new SoundFft();
        var cp = 0;
        var dataReal = fft.newArrayOfZeros(SoundConstants.FFT_SIZE);
        var dataImag = fft.newArrayOfZeros(SoundConstants.FFT_SIZE);
        var overall = fft.newArrayOfZeros(SoundConstants.FFT_SIZE);
        var channelData = this.buffer.getChannelData(0);
        while (cp < (this.buffer.length-SoundConstants.FFT_SIZE)) {
            for (var i = 0; i < SoundConstants.FFT_SIZE; i++) {
                var cv = i + cp < this.buffer.length ? channelData[i + cp] : 0;
                dataReal[i] = cv;
                dataImag[i] = 0;
            } //
            fft.transform(dataReal, dataImag);
            cp += SoundConstants.FFT_STEP_SIZE;

            var cmags = [];
            for (var i = 0; i < SoundConstants.FFT_SIZE / 2; i++) {
                var mag = isNaN(dataReal[i]) ? 0.0 : dataReal[i] * dataReal[i];
                mag += isNaN(dataImag[i]) ? 0.0 : dataImag[i] * dataImag[i];
                mag = Math.sqrt(mag);
                cmags[i] = mag;
                overall[i] += mag;
            } //for var i - total

            var freqSort = $.map(cmags, (value, index) => {
                return {value, frequency: index * this.binSize};
            }).filter((a) => {
                return a ? (a.value > 0 && a.frequency > 0) : null;
            }).sort((a, b) => {
                return a.value > b.value ? -1 : a.value < b.value ? 1 : 0;
            }).filter((a, i) => {
                return (i < 10) ? a : null;
            });

            this.frequencies.push( freqSort );

        } //while

        var freqSort = $.map(overall, (value, index) => {
            return {value, frequency: index * this.binSize};
        }).filter((a) => {
            return a ? (a.value > 0 && a.frequency > 0) : null;
        }).sort((a, b) => {
            return a.value > b.value ? -1 : a.value < b.value ? 1 : 0;
        }).filter((a, i) => {
            return (i < 10) ? a : null;
        });

        //console.log("frequency map", freqSort);
        this.overallFrequencies = freqSort;
        this.primaryFrequency = freqSort[0].frequency;
        //console.log("analyzed " + this.url, this.primaryFrequency, this.frequencies );
        this.ready = true;
    };

};
