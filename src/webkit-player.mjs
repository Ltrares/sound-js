import OutputBuffer from "./output-buffer.mjs";

export default class WebkitPlayer {

    constructor(context) {
        this.bufferSize = 2048;
        this.channelCount = 2;
        this.node = context.createScriptProcessor(this.bufferSize, this.channelCount, this.channelCount);
        this.node.onaudioprocess = this.processAudio.bind(this);
        this.context = context;
        this.outputBuffers = [];

    }

    start() {
        this.node.connect(this.context.destination);
    }

    processAudio(audioProcessingEvent) {
        if ( this.outputBuffers.length <= 0 ) {
            return;
        }

        var start = this.getAvailableOutputCount();

        var audioBuffer = audioProcessingEvent.outputBuffer;

        var remaining = this.bufferSize;

        while ( this.outputBuffers.length > 0 && remaining > 0 ) {
            var outputBuffer = this.outputBuffers.shift();

            if ( remaining < outputBuffer.length ) {
                console.log( "split", remaining );
                var newOutputBuffer = outputBuffer.split(remaining);
                this.outputBuffers.unshift(newOutputBuffer);
            } //

            this.writeOutputToAudioBuffer( this.bufferSize - remaining, outputBuffer, audioBuffer);
            remaining -= outputBuffer.length;
        } //while


    }

    getAvailableOutputCount() {
        return this.outputBuffers.reduce( (prev,cur)=>{
            if ( cur && cur.length ) return prev + cur.length;
            return prev;
        }, 0);
    }

    writeOutputToAudioBuffer(startIndex, outputBuffer, audioBuffer) {
        for ( var channel = 0; channel < audioBuffer.numberOfChannels; channel ++ ) {
            var audioData = audioBuffer.getChannelData(channel);

            for ( var i = 0; i < outputBuffer.length; i++ ) {
                audioData[startIndex +i] = outputBuffer.get(channel,i);
            } //for
        } //for
    }

    render(soundNode) {

        var dataNeeded = 2*this.bufferSize - this.getAvailableOutputCount();

        while ( dataNeeded > 0 ) {
            var outputBuffer = new OutputBuffer(this.bufferSize,this.channelCount);
            soundNode.updateAudio(outputBuffer);
            this.outputBuffers.push(outputBuffer);
            var dataNeeded = 2*this.bufferSize - this.getAvailableOutputCount();

            //
            // var total = outputBuffer.data[0].reduce( (prev, cur) =>{
            //     return prev + Math.abs(cur);
            // }, 0);


        } //


    }
}