export default class OutputBuffer {
    constructor(size,channels) {
        this.data = [];
        this.length = size;
        this.channelCount = channels;
        for ( var i = 0; i < channels; i++ ) {
            this.data.push( new Array(size).fill(0) );
        } //
    } //


    split(position) {
        if ( position >= this.length ) return null;

        var newOutputBuffer = new OutputBuffer(this.length - position,this.channelCount);

        for ( var i = 0; i < this.channelCount; i++ ) {
            newOutputBuffer.data[i] = this.data[i].slice(position);
            this.data[i] = this.data[i].slice(0,position);
        }

        this.length = position;

        return newOutputBuffer;
    }

    get(channel,index) {
        return this.data[channel][index];
    }

    set(channel,index,value) {
        this.data[channel][index] = value;
    }

    add(channel,index,value) {
        this.data[channel][index] += value;
    }
}