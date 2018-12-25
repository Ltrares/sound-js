import OutputBuffer from "./output-buffer.mjs";

export default class WebkitPlayer {

    constructor(context,soundNode) {
        this.bufferSize = 2048;
        this.channelCount = 2;
        //this.node = context.createScriptProcessor(this.bufferSize, this.channelCount, this.channelCount);
        //this.node.onaudioprocess = this.processAudio.bind(this);
        this.context = context;
        this.outputBuffers = [];
        this.freeOutputBuffers = [];
        this.playTime = context.currentTime;
        this.soundNode = soundNode;
    }

    start() {
        this.pumpAudio();
    }

    async decodeAudio(buffer) {
        return this.context.decodeAudioData(buffer);
    }

    pumpAudio() {

        var bufferTime = this.bufferSize / this.context.sampleRate;

        if ( this.playTime - this.context.currentTime > 5*bufferTime ) return;

        while ( this.playTime - this.context.currentTime < 10*bufferTime ) {
            //console.log("pump audio", this.playTime, this.context.currentTime );
            var outputBuffer = this.outputBuffers.shift();
            //console.log( outputBuffer );
            const buffer = this.context.createBuffer(this.channelCount, this.bufferSize, this.context.sampleRate);
            console.log( this.channelCount );
            for (var channel = 0; channel < this.channelCount; channel++) {
                const samples = buffer.getChannelData(channel);


                var dt = 1 / this.context.sampleRate;
                for (var i = 0; i < this.bufferSize; i++) {


                   //if (outputBuffer) samples[i] = 1.3 * Math.cos(770 * (this.playTime + i * dt)); //Math.random()-0.5; //Math.sin(440.0*cct); // + channel*0.1);
                   //if (!outputBuffer) samples[i] = 1.1 * Math.cos(440 * (this.playTime + i * dt)); //Math.random()-0.5; //Math.sin(440.0*cct); // + channel*0.1);
                   if ( outputBuffer ) samples[i] =  Math.tanh(0.25*outputBuffer.get(channel,i));
                    //cct += 1/this.context.sampleRate;
                } //sample
            } //channels

            const bsn = this.context.createBufferSource();
            bsn.buffer = buffer;
            bsn.connect(this.context.destination);
            // When a buffer is done playing, try to queue up
            // some more audio.
            bsn.onended = function(it) {
                it.currentTarget.disconnect();
                this.pumpAudio();
            }.bind(this);

            bsn.start(this.playTime);
            this.playTime += bufferTime;

            if ( outputBuffer ) this.freeOutputBuffers.push(outputBuffer.clear());
            outputBuffer = this.getOutputBuffer(this.bufferSize,this.channelCount);
            this.soundNode.updateAudio(outputBuffer);
            if ( outputBuffer ) this.outputBuffers.push(outputBuffer);

        } //while


        //
        // if (this.playTime - this.context.currentTime > 3*bufferTime) {
        //     //console.log("no need to pump audio");
        //     return;
        // }
        //
        // //while (this.playTime - this.context.currentTime < bufferTime ) {
        // //var outputBuffer = this.outputBuffers.shift();
        //
        // const buffer = this.context.createBuffer(this.channelCount, this.bufferSize, this.context.sampleRate);
        //
        // if (outputBuffer) {
        //     for (var channel = 0; channel < this.channelCount; channel++) {
        //         const samples = buffer.getChannelData(channel);
        //
        //         var dt = 1/this.context.sampleRate;
        //         for (var i = 0; i < this.bufferSize; i++) {
        //
        //             samples[i] = Math.sin(440*(this.playTime + i*dt)); //Math.random()-0.5; //Math.sin(440.0*cct); // + channel*0.1);
        //            //samples[i] =  Math.tanh(outputBuffer.get(channel,i))*0.5;
        //             //cct += 1/this.context.sampleRate;
        //         } //sample
        //     } //channels
        //
        //     //this.ct += bufferTime;
        //
        //     this.freeOutputBuffers.push(outputBuffer.clear());
        // } else {
        //     console.log("out of audio data");
        // }
        //

        // Play the buffer at some time in the future.
        // Advance our expected time.
        // (samples) / (samples per second) = seconds

        //} //while
    }

    // processAudio(audioProcessingEvent) {
    //     if ( this.outputBuffers.length <= 0 ) {
    //         return;
    //     }
    //
    //     var currentOutput = [];
    //     //var start = this.getAvailableOutputCount();
    //
    //     var audioBuffer = audioProcessingEvent.outputBuffer;
    //
    //     var remaining = this.bufferSize;
    //
    //     while ( this.outputBuffers.length > 0 && remaining > 0 ) {
    //         var outputBuffer = this.outputBuffers.shift();
    //
    //         if ( remaining < outputBuffer.length ) {
    //             console.log( "split", remaining );
    //             var newOutputBuffer = outputBuffer.split(remaining);
    //             this.outputBuffers.unshift(newOutputBuffer);
    //         } //
    //
    //         this.writeOutputToAudioBuffer( this.bufferSize - remaining, outputBuffer, audioBuffer);
    //         remaining -= outputBuffer.length;
    //     } //while
    //
    //
    // }

    getAvailableOutputCount() {
        return this.outputBuffers.reduce((prev, cur) => {
            if (cur && cur.length) return prev + cur.length;
            return prev;
        }, 0);
    }

    // writeOutputToAudioBuffer(startIndex, outputBuffer, audioBuffer) {
    //     for ( var channel = 0; channel < audioBuffer.numberOfChannels; channel ++ ) {
    //         var audioData = audioBuffer.getChannelData(channel);
    //
    //         for ( var i = 0; i < outputBuffer.length; i++ ) {
    //             audioData[startIndex +i] = Math.tanh(outputBuffer.get(channel,i) );
    //             //audioData[startIndex +i] = outputBuffer.get(channel,i);
    //         } //for
    //     } //for
    // }

    // render(soundNode) {
    //
    //     //this.pumpAudio();
    //
    //     if ( this.outputBuffers.length >= 10 ) return;
    //
    //     console.log( "audio output data needed", 5 - this.outputBuffers.length );
    //     while (this.outputBuffers.length < 10 ) {
    //         //console.log( "making an output buffer" );
    //         var outputBuffer = this.getOutputBuffer(this.bufferSize,this.channelCount);
    //         //soundNode.updateAudio(outputBuffer);
    //         this.outputBuffers.push(outputBuffer);
    //         //this.pumpAudio();
    //     } //
    //
    // }

    getOutputBuffer(bufferSize,channelCount) {
        if ( this.freeOutputBuffers.length <= 0 ) return new OutputBuffer(this.bufferSize, this.channelCount);

        return this.freeOutputBuffers.shift();
    }
}