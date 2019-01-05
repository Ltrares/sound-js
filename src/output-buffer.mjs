export default class OutputBuffer {
    constructor(size, channels) {
        this.data = [];
        this.length = size;
        this.channelCount = channels;
        for (let i = 0; i < channels; i++) {
            this.data.push(new Array(size).fill(0));
        } //
    } //

    // noinspection JSUnusedGlobalSymbols
    clear() {
        for (let channel = 0; channel < this.channelCount; channel++) {
            this.data[channel].fill(0);
        } //for
        return this;
    }

    split(position) {
        if (position >= this.length) return null;

        let newOutputBuffer = new OutputBuffer(this.length - position, this.channelCount);

        for (let i = 0; i < this.channelCount; i++) {
            newOutputBuffer.data[i] = this.data[i].slice(position);
            this.data[i] = this.data[i].slice(0, position);
        }

        this.length = position;

        return newOutputBuffer;
    }

    get(channel, index) {
        return this.data[channel][index];
    }

    set(channel, index, value) {
        this.data[channel][index] = value;
    }

    add(channel, index, value) {
        this.data[channel][index] += value;
    }
}