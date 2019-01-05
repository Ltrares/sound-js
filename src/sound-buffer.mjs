import SoundFft from "./sound-fft.mjs";
import * as SoundConstants from "./sound-constants.mjs";

export default class SoundBuffer {
    constructor(name, url) {
        this.name = name;
        this.url = url;
        this.buffer = null; //buffer;
        this.primaryFrequency = null;
        this.frequencies = [];
        this.overallFrequencies = null;
        this.ready = false;
        this.binSize = 0;
        this.averageSound = [];
        this.fft = new SoundFft();
        //this.avgMag = this.fft.newArrayOfZeros(SoundConstants.FFT_SIZE);
    };

    async analyzeAudio(buffer) {
        this.buffer = buffer;
        this.binSize = this.buffer.sampleRate / SoundConstants.FFT_SIZE;
        console.log("decoded audio", buffer);
        var fftMagScale = SoundConstants.FFT_STEP_SIZE/(this.buffer.length*SoundConstants.FFT_SIZE);
        var promise = new Promise(resolve=>{
            var cp = 0;
            var dataReal = this.fft.newArrayOfZeros(SoundConstants.FFT_SIZE);
            var dataImag = this.fft.newArrayOfZeros(SoundConstants.FFT_SIZE);
            var overall = this.fft.newArrayOfZeros(SoundConstants.FFT_SIZE);
            var channelData = this.buffer.getChannelData(0);
            while (cp < (this.buffer.length-SoundConstants.FFT_SIZE)) {
                for (var i = 0; i < SoundConstants.FFT_SIZE; i++) {
                    var cv = i + cp < this.buffer.length ? channelData[i + cp] : 0;
                    dataReal[i] = cv;
                    dataImag[i] = 0;
                } //
                this.fft.transform(dataReal, dataImag);

                // for ( var i = 0; i < SoundConstants.FFT_SIZE; i++ ) {
                //     var mag2 = dataReal[i]*dataReal[i] + dataImag[i]*dataImag[i];
                //     this.avgMag[i] += Math.sqrt(mag2)*fftMagScale; //*Math.sign(dataImag[i]);
                // } //

                cp += SoundConstants.FFT_STEP_SIZE;

                var cmags = [];
                for (var i = 0; i < SoundConstants.FFT_SIZE / 2; i++) {
                    var mag = isNaN(dataReal[i]) ? 0.0 : dataReal[i] * dataReal[i];
                    mag += isNaN(dataImag[i]) ? 0.0 : dataImag[i] * dataImag[i];
                    mag = Math.sqrt(mag);
                    cmags[i] = mag;
                    overall[i] += mag*fftMagScale;
                } //for var i - total

                var freqSort = this.topValues(cmags,10);

                // var freqSort = $.map(cmags, (value, index) => {
                //     return {value, frequency: index * this.binSize};
                // }).filter((a) => {
                //     return a ? (a.value > 0 && a.frequency > 0) : null;
                // }).sort((a, b) => {
                //     return a.value > b.value ? -1 : a.value < b.value ? 1 : 0;
                // }).filter((a, i) => {
                //     return (i < 10) ? a : null;
                // });

                this.frequencies.push( freqSort );

            } //while

            var freqSort = this.topValues(overall,256);

            //console.log("frequency map", freqSort);
            this.overallFrequencies = freqSort;
            this.primaryFrequency = freqSort[0].frequency;
            this.averageSound = this.generateAverageSound();
            console.log("analyzed", this );
            this.ready = true;

            resolve(this);
        });
        return promise;
    };

    topValues(data,count) {
        return $.map(data, (value, index) => {
            return {value, frequency: index * this.binSize};
        }).filter((a) => {
            return a ? (a.value > 0 && a.frequency > 0) : null;
        }).sort((a, b) => {
            return a.value > b.value ? -1 : a.value < b.value ? 1 : 0;
        }).filter((a, i) => {
            return (i < count) ? a : null;
        });
    }

    generateAverageSound() {
        var zero = this.fft.newArrayOfZeros(SoundConstants.FFT_SIZE);
        var real = this.fft.newArrayOfZeros(SoundConstants.FFT_SIZE);

        // this.averageSound = this.avgMag;
        this.overallFrequencies.forEach( data =>{
            var index = data.frequency/this.binSize;
            real[index] = data.value;
        });

        this.fft.inverseTransform(real,zero);

        var maxValue = Math.max.apply(null, real.map(Math.abs));
        console.log( "max value", maxValue );

        if ( maxValue > 0 ) real = real.map( value => value/maxValue);

        return real;





        //

    }
};
