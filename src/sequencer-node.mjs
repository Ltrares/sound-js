import SoundNode from "./sound-node.mjs";
import SampleNode from "./sample-node.mjs";

export default class SequencerNode extends SoundNode {

    constructor( name ) {
        super( "Sequencer Node", name );
        this.beatTime = 60/120;
        this.tracks = {};
        this.loop = true;
        this.sequenceLength = 4;
        this.beat = 0;
        this.nextEvent = -1;
    }

    setBpm(bpm) {
        this.beatTime = 60/bpm;
    }

    setSequenceLength(lengthInBeats) {
        this.sequenceLength = lengthInBeats;
    }

    setLoop(loop) {
        this.loop = loop;
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    generateOwnOutputFromIndex(output, startIndex) {

        var beatEnd = this.beat + this.effectiveRate*(this.bufferSize-startIndex)*this.timePerSample/this.beatTime;

        if ( beatEnd === this.beat ) return;

        this.checkTracks( this.beat, beatEnd, startIndex*this.timePerSample );

        if ( this.loop ) {
            if (beatEnd >= this.sequenceLength) {
                this.beat = 0;
                beatEnd = beatEnd - this.sequenceLength;
                this.checkTracks(this.beat, beatEnd, startIndex*this.timePerSample);
            }
        } //if

        this.beat = beatEnd;

        if ( this.beat >= this.sequenceLength ) {
            this.done = true;
        }

    }

    checkTracks(beatStart, beatEnd, extraDelay) {
        this.tracks.forEach( track =>{
            track.beats.forEach( beat =>{
                if ( beat >= beatStart && beat < beatEnd ) {
                    console.log( "start " + track.sound + " at " + beat, beatStart, beatEnd );
                    var sample = new SampleNode( track.soundBuffer.buffer, track.name ? track.name : track.sound );
                    var delay = (beat-beatStart)*this.beatTime;
                    this.addChild(sample,extraDelay+delay);
                };
            });
        });

    }
}