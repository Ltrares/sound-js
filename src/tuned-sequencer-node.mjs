import SoundNode from "./sound-node.mjs";
import GrainNode from "./grain-node.mjs";
import Notes from "./notes.mjs";

export default class TunedSequencerNode extends SoundNode {

    constructor(name) {
        super("Tuned Sequencer Node", name);
        this.beatTime = 60 / 120;
        this.tracks = {};
        this.loop = true;
        this.sequenceLength = 4;
        this.beat = 0;
        this.stepSize = Math.pow(2, 1 / 12);
        this.inverseStepSize = 1 / this.stepSize;
        this.notes = new Notes();
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
        if (beatStart > beatEnd) {
            var tmp = beatStart;
            beatStart = beatEnd;
            beatEnd = tmp;
        } //if

        this.tracks.forEach(track => {
            track.beats.forEach(beatInfo => {
                if (beatInfo.beat >= beatStart && beatInfo.beat < beatEnd) {
                    var sample = this.getGrainNode(track);
                    var delay = (beatInfo.beat - beatStart) * this.beatTime;
                    sample.setPitch(beatInfo.pitch ? this.calcPitch(track, beatInfo.pitch) : 1.0);
                    sample.setRate(beatInfo.rate ? beatInfo.rate : 1.0);
                    sample.setVolume(beatInfo.volume ? beatInfo.volume : 1.0)
                    this.addChild(sample, extraDelay + delay);
                }
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

    getGrainNode(track) {
        var name = track.name ? track.name : track.sound;
        var nodes = this.freeNodes[name];
        var result = nodes ? nodes.shift() : null;
        if (result) {
            result.reset();
            return result;
        }
        return new GrainNode(track.soundBuffer.buffer, name);
    }

    calcPitch(track, pitch) {
        if (typeof(pitch) === "number") return pitch;

        var base = track.soundBuffer.primaryFrequency;
        var target = this.notes.get(pitch);

        return target / base;

    }
}