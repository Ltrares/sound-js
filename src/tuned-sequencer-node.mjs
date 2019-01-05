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
        this.resetTrackBeatIndex();
    }

    resetTrackBeatIndex() {
        this.tracks.forEach(track => track.beatIndex = 0);
    }

    generateOwnOutputFromIndex(output, startIndex) {

        var beatEnd = this.beat + this.effectiveRate * (this.bufferSize - startIndex) * this.timePerSample / this.beatTime;

        if (beatEnd === this.beat) return;

        this.checkTracks(this.beat, beatEnd, startIndex * this.timePerSample);

        if (this.loop) {
            if (beatEnd >= this.sequenceLength) {
                console.log( this.describe() + " loop completed" );
                this.beat = 0;
                this.resetTrackBeatIndex();
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
        if (beatStart > beatEnd) beatStart = beatEnd;

        this.tracks.forEach(track => {
            if (!track.beatIndex) track.beatIndex = 0;

            if (track.beatIndex >= track.beats.length) return;

            var beatInfo = track.beats[track.beatIndex];

            if (beatInfo.start > beatStart) return;

            if (beatInfo.start <= beatStart) {
                 track.beatIndex++;

                var sample = this.getGrainNode(track);
                var delay = (beatInfo.start - beatStart) * this.beatTime;
                sample.setPitch(this.calcPitch(track, beatInfo));
                sample.setRate(beatInfo.rate ? beatInfo.rate : 1.0);
                sample.setVolume(beatInfo.volume ? beatInfo.volume : 1.0);
                this.addChild(sample, extraDelay + delay);
            } //if
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
        return new GrainNode(track.soundBuffer, name);
    }

    calcPitch(track, beatInfo) {
        var base = track.soundBuffer.primaryFrequency;
        var target = base;
        var multiplier = beatInfo.pitchMultiplier ? beatInfo.pitchMultiplier : 1.0;
        if (typeof(beatInfo.note) === "number") {
            target = this.notes.get(this.notes.cMajor(beatInfo.note));
        } else if (typeof(beatInfo.pitch === "number")) {
            return beatInfo.pitch * multiplier;
        } else {
            target = this.notes.get(beatInfo.pitch);
        }
        return multiplier * target / base;

    }
}