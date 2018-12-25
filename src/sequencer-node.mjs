import SoundNode from "./sound-node.mjs";
import SampleNode from "./sample-node.mjs";
import GrainNode from "./grain-node.mjs";

export default class SequencerNode extends SoundNode {

    constructor(name) {
        super("Sequencer Node", name);
        this.beatTime = 60 / 120;
        this.tracks = {};
        this.loop = true;
        this.sequenceLength = 4;
        this.beat = 0;
        this.freeNodes = {};
    }

    setBpm(bpm) {
        this.beatTime = 60 / bpm;
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

        var beatEnd = this.beat + this.effectiveRate * (this.bufferSize - startIndex) * this.timePerSample / this.beatTime;

        if (beatEnd === this.beat) return;

        this.checkTracks(this.beat, beatEnd, startIndex * this.timePerSample);

        if (this.loop) {
            if (beatEnd >= this.sequenceLength) {
                this.beat = 0;
                beatEnd = beatEnd - this.sequenceLength;
                this.checkTracks(this.beat, beatEnd, startIndex * this.timePerSample);
            }
        } //if

        this.beat = beatEnd;

        if (this.beat >= this.sequenceLength) {
            this.done = true;
        }

    }

    checkTracks(beatStart, beatEnd, extraDelay) {

        this.tracks.forEach(track => {
            if (beatStart > beatEnd) {
                var tmp = beatStart;
                beatStart = beatEnd;
                beatEnd = tmp;
            } //if
            track.beats.forEach(beat => {

                if (beat >= beatStart && beat < beatEnd) {
                    //console.log( "start " + track.sound + " at " + beat, beatStart, beatEnd );
                    var sample = this.getNode(track); //new SampleNode( track.soundBuffer.buffer, track.name ? track.name : track.sound );
                    var delay = (beat - beatStart) * this.beatTime;
                    this.addChild(sample, extraDelay + delay);
                } //
            });
        });

    }

    checkForFinishedChildren() {
        this.children = this.children.filter(child => {
            if (child.isDone()) {
                child.stop();
                if (this.freeNodes[child.name] === undefined) {
                    this.freeNodes[child.name] = [];
                }
                this.freeNodes[child.name].push(child);
                return false;
            }
            return true;
        });
    }

    getNode(track) {
        var name = track.name ? track.name : track.sound;
        var nodes = this.freeNodes[name];
        var result = nodes ? nodes.shift() : null;
        if (result) {
            result.reset();
            return result;
        }
        return new SampleNode(track.soundBuffer.buffer, name);
    }

}