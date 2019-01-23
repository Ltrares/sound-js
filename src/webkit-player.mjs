import OutputBuffer from "./output-buffer.mjs";

export default class WebkitPlayer {

    constructor(context, soundNode) {
        this.bufferSize = soundNode.bufferSize;
        this.channelCount = soundNode.channelCount;
        //this.node = context.createScriptProcessor(this.bufferSize, this.channelCount, this.channelCount);
        //this.node.onaudioprocess = this.processAudio.bind(this);
        this.context = context;
        this.outputBuffers = [];
        this.freeOutputBuffers = [];
        this.playTime = context.currentTime;
        this.soundNode = soundNode;
        this.currentOutput = null;
        this.pendingOutput = [];
        this.audioPump = null;

    }

    start() {
        this.playTime = this.context.currentTime;
        this.audioPump = setInterval(this.pumpAudio.bind(this), 10);
    }

    async decodeAudio(buffer) {
        return this.context.decodeAudioData(buffer);
    }

    /**
     * thanks to http://blog.mecheye.net/2017/09/i-dont-know-who-the-web-audio-api-is-designed-for/
     * for improvements in managing the flow of data into webkit audio
     */
    pumpAudio() {
        var bufferTime = this.bufferSize / this.context.sampleRate;

        if (this.playTime - this.context.currentTime > 5*bufferTime ) return;

        var outputBuffer = this.outputBuffers.shift();

        this.pendingOutput.push(outputBuffer);
        const buffer = this.context.createBuffer(this.channelCount, this.bufferSize, this.context.sampleRate);
        for (var channel = 0; channel < this.channelCount; channel++) {
            const samples = buffer.getChannelData(channel);


            var dt = 1 / this.context.sampleRate;
            for (var i = 0; i < this.bufferSize; i++) {
               if (outputBuffer) samples[i] = Math.tanh(outputBuffer.get(channel, i));
            } //sample
        } //channels

        const bsn = this.context.createBufferSource();
        bsn.buffer = buffer;
        bsn.connect(this.context.destination);
        bsn.onended = function (webkitNode) {
            if (this.currentOutput != null) {
                this.freeOutputBuffers.push(this.currentOutput.clear());
            }

            this.currentOutput = this.pendingOutput.shift();
            webkitNode.currentTarget.disconnect();
        }.bind(this);

        if ( this.playTime < this.context.currentTime ) {
            console.log( "playtime is in the past" );
            this.playTime = this.context.currentTime;
        }
        bsn.start(this.playTime);
        this.playTime += bufferTime;

        outputBuffer = this.getFreeOutputBuffer(this.bufferSize, this.channelCount);
        var t0 = new Date();
        this.soundNode.updateAudio(outputBuffer);
        var t1 = (new Date()) - t0;
        if (t1 > 50) console.log("low performance/high demand - audio generation was slow", t1);
        if (outputBuffer) {
            this.outputBuffers.push(outputBuffer);
        }



    }

    getFreeOutputBuffer(bufferSize, channelCount) {
        if (this.freeOutputBuffers.length <= 0) {
            let op = new OutputBuffer(this.bufferSize, this.channelCount);
            return op;
        }

        let op = this.freeOutputBuffers.shift();
        return op;
    }
}