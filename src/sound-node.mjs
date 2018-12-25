import Notes from "./notes.mjs";

export default class SoundNode {
    constructor(type, name ) {
        this.name = name;
        this.time = 0;
        this.children = [];
        this.rate = 1.0;
        this.effectiveRate = this.rate;
        this.pitch = 1.0;
        this.effectivePitch = this.pitch;
        this.volume = 1.0;
        this.effectiveVolume = this.volume;
        this.delay = 0;
        this.paused = true;
        this.done = false;
        this.bufferSize = 2048;
        this.channelCount = 2;
        //TODO remove this dependency on window.audioContext
        this.sampleRate = window.audioContext.sampleRate;
        this.type = type ? type : "SoundNode";
        this.timePerSample = 1.0 / this.sampleRate;
        this.output = [];
        this.parent = this;
        for (var i = 0; i < this.channelCount; i++) {
            this.output[i] = [];
            for (var j = 0; j < this.bufferSize; j++) {
                this.output[i].push(0);
            }
        }
        //window.addMessage(this.describe(), 5.0);

    }

    setOutput(i, j, v) {
        //var channel = i % this.output.length;
        //this.output[channel][j] *= 0.975;
        this.output[i][j] += v;
    }

    reduceOutput(dt) {
        for (var i = 0; i < this.output.length; i++) {
            for (var j = 0; j < this.output[i].length; j++) {
                this.output[i][j] -= this.output[i][j] * dt * 0.85;
            } //for
        } //for
    } //


    describe() {
        return this.type + " '" + this.name + "' (" + this.pitch + "," + this.rate + "," + this.volume + ")";
    }

    addChild(demoNode, delay) {
        if (!demoNode) {
            console.log("can't add null/undefined child node");
            return;
        } //if

        this.children.push(demoNode);
        demoNode.setParent(this);

        if (!this.paused) demoNode.play(this.delay + (delay ? delay : 0));
    }

    setParent(demoNode) {
        this.parent = demoNode;
        this.updateEffectiveRate();
        this.updateEffectiveVolume();
        this.updateEffectivePitch();
        //console.log(this.describe() + " parent set", this);
    }

    play(delay) {

        //window.addMessage("playing " + this.describe(), 5.0);
        //console.log("starting " + this.describe(), this);
        this.paused = false;
        this.delay = delay;

        this.children.forEach( child => {
            child.play(delay);
        });
    }

    pause() {
        this.paused = true;
        $.each(this.children, (index, child) => {
            child.pause();
        });

    }

    resume() {
        this.paused = false;
        $.each(this.children, (index, child) => {
            child.resume();
        });
    }


    setRate(rate) {
        this.rate = rate;
        this.updateEffectiveRate();
    }

    updateEffectiveRate() {
        if (this.parent !== this) {
            this.effectiveRate = this.parent.effectiveRate * this.rate;
        } else {
            this.effectiveRate = this.rate;
        }
        this.children.forEach(child => child.updateEffectiveRate());
    } //

    setPitch(pitch) {
        this.pitch = pitch;
        this.updateEffectivePitch();
    }

    updateEffectivePitch() {
        if (this.parent !== this) {
            this.effectivePitch = this.parent.effectivePitch * this.pitch;
        } else {
            this.effectivePitch = this.pitch;
        }
        this.children.forEach(child => child.updateEffectivePitch());
    }

    setVolume(volume) {
        this.volume = volume;
        this.updateEffectiveVolume();
    }

    updateEffectiveVolume() {
        if (this.parent !== this) {
            this.effectiveVolume = this.parent.effectiveVolume * this.volume;
        } else {
            this.effectiveVolume = this.volume;
        }
        this.children.forEach(child => child.updateEffectiveVolume());
    }


    updateAudio(output) {
        if ( !output ) return;

        this.children.forEach( child => {
            child.updateAudio(output);
        });

        this.generateOwnOutput(output);

        this.checkForFinishedChildren();
    }

    generateOwnOutput(output) {
        var startIndex = this.canPlay(output);
        if ( startIndex < 0 ) return;
        this.generateOwnOutputFromIndex(output,startIndex);
    }

    generateOwnOutputFromIndex(output,startIndex) {
        for ( var outputChannel = 0; outputChannel < output.channelCount; outputChannel ++ ) {
            var myChannel = outputChannel % this.channelCount;
            for ( var i = 0; i < output.length; i++ ) {
                if ( i < startIndex ) {
                    output.add( outputChannel, i, 0 );
                    continue;
                } //if

                output.add( outputChannel, i, 0 );
            } //for i
        } //channel
    }

    // processAudio(audioProcessingEvent) {
    //     var outputBuffer = audioProcessingEvent.outputBuffer;
    //     // for (var ci = 0; ci < outputBuffer.numberOfChannels; ci++) {
    //     //     for (var i = 0; i < this.bufferSize; i++) {
    //     //         this.output[ci][i] = 0;
    //     //     } //for
    //     // }
    //     var startIndex = this.canPlay();
    //     if (startIndex < 0) return;
    //
    //     this.processAudioFromIndex(audioProcessingEvent, startIndex);
    //
    //     for (var ci = 0; ci < outputBuffer.numberOfChannels; ci++) {
    //         var op = outputBuffer.getChannelData(ci).slice(0);
    //
    //         for (var i = 0; i < op.length; i++) {
    //             this.setOutput(ci, i, op[i]);
    //             if (this.parent !== this) this.parent.setOutput(ci, i, op[i]);
    //         } //for
    //
    //     } //for
    //
    //     var dt = this.bufferSize * this.timePerSample;
    //
    //     this.time += dt;
    //
    //     this.reduceOutput(dt);
    //
    //     this.checkForFinishedChildren();
    // }

    checkForFinishedChildren() {
        this.children = this.children.filter(child => {
            if (child.isDone()) {
                child.stop();
                return false;
            }
            return true;
        });
    }

    // processAudioFromIndex(audioProcessingEvent, startIndex) {
    //     var outputBuffer = audioProcessingEvent.outputBuffer;
    //
    //
    //     for (var i = startIndex; i < this.bufferSize; i++) {
    //         if (this.delay > 0) {
    //             this.delay -= this.timePerSample;
    //             continue;
    //         } //if
    //
    //         for (var j = 0; j < outputBuffer.numberOfChannels; j++) {
    //             //var inputChannelNumber = j % inputBuffer.numberOfChannels;
    //             //var rnd = 1 - 0.5 * Math.random();
    //             //outputBuffer.getChannelData(j)[i] = this.output[j][i]*this.getVolume(); //inputBuffer.getChannelData(inputChannelNumber)[i] * this.getVolume();
    //             //outputBuffer.getChannelData(j)[i] = Math.sin(this.pitch*447*(this.time+ i*this.timePerSample))*3.0; //this.getVolume(); //this.output[i][j]*this.getVolume(); //inputBuffer.getChannelData(inputChannelNumber)[i] * this.getVolume();
    //             //var val = outputBuffer.getChannelData(j)[i] + this.output[j][i];
    //             //this.setOutput(ci,i,val,val>0);
    //
    //             //console.log( "default", total );
    //         } //for var j
    //
    //     } //var i
    //
    //
    // }

    canPlay(output) {
        if ( !output ) return -1;
        if (this.paused || this.done) return -1;
        var startIndex = 0;
        var bufferTime = this.timePerSample * output.length;
        if (this.delay >= bufferTime) {
            this.delay -= bufferTime;
            return -1;
        } else if (this.delay > 0) {
            startIndex = Math.floor(this.delay / this.timePerSample);
            this.delay = 0;
        }
        return startIndex;
    }

    isDone() {
        return this.done;
    }

    stop() {
        this.done = true;
        $.each(this.children, (index, child) => {
            child.stop();
        });
        //this.node.disconnect();
        //window.addMessage(this.describe() + " is done", 5);
    } //


}
