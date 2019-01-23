import Notes from "./notes.mjs";
import Rhythm from "./rhythm.mjs";
import SeedRand from "./seed-rand.mjs";

export default class SongGenerator {

    constructor(seed) {
        this.rand = new SeedRand(seed);
        this.rhythm = new Rhythm(seed);
        this.notes = new Notes();
    }

    cantusFirmus(size, beatSize) {
        var base = this.rhythm.makeBaseRhythm(size, beatSize ? beatSize : 1);

        let first = this.rand.next() < 0.75 ? 0 : 7;
        let last = this.rand.next() < 0.5 ? 0 : 7;
        let penult = this.rand.next() < 0.75 ? last + 1 : last - 1;

        let peak = null;

        base[0].note = first;
        base[base.length - 1].note = last;
        base[base.length - 2].note = penult;

        let previous = 0;
        for (let ni = 1; ni < base.length - 2; ni++) {


        }


        //start and end on doh
        base[0].note = 0;

        base[base.length - 1].note = 0;
        base[base.length - 2].note = this.rand.next() < 0.75 ? 1 : -1;
        //

    }


    motif(size, beatSize) {
        var base = this.rhythm.makeBaseRhythm(size, beatSize ? beatSize : 1);

        var motif = this.rhythm.mix(base, 0.2, 0.1);

        let notes = [];
        let prevNote = 0;
        for (let ni = 0; ni < motif.length; ni++) {
            let event = motif[ni];
            prevNote = prevNote + this.nextConsonance(notes);
            motif[ni].note = prevNote;
            console.log( "next note in motif", motif[ni].note );
            motif[ni].volume = Math.min(1.0, 0.5 + 0.25 * event.duration / 2.0);
            notes.push(prevNote);
        } //for

        return motif;

    }

    varyRhythm(events, splitProbability, joinProbability) {
        var result = this.rhythm.mix(events, splitProbability, joinProbability);
        result.duration = events.duration;
        return result;
    }


    varyMelody(events, probability) {
        probability = probability ? probability : 0.4;
        var newEvents = [];


        var ctime = 0;
        var currentEvents = [];


        events.forEach(event => {
            let newEvent = JSON.parse(JSON.stringify(event));

            ctime = newEvent.start;
            currentEvents = currentEvents.filter(cevt => {
                return (cevt.start + cevt.duration) < ctime;
            });

            currentEvents.push(newEvent);
            newEvents.push(newEvent);
            let triggerLevel = probability / (currentEvents.length);

            var rand = this.rand.next();

            if (rand > triggerLevel) return;

            var r2 = this.rand.next();

            var r3 = Math.sign(this.rand.next() - 0.5);

            if (r2 < 0.5) {
                newEvent.note += r3 * 2;
            } else if (r2 < 0.75) {
                newEvent.note += r3 * 4;
            } else if (r2 < 0.9) {
                newEvent.note += r3 * 5;
            // } else {
            //     newEvent.note += r3 * 3;
            } //else

            if (r3 < 0 && this.rand.next() < 0.5) newEvent.note -= 1;
        });

        newEvents.duration = events.duration;
        return newEvents;
    }

    concat(eventLists) {
        var newEvents = [];

        var duration = 0;
        eventLists.forEach(eventList => {
            eventList.forEach(event => {
                var newEvent = JSON.parse(JSON.stringify(event));
                newEvent.start += duration;
                newEvents.push(newEvent);
            });
            duration += eventList.duration;
        });

        console.log("concat duration", duration);
        newEvents.duration = duration;
        return newEvents;
    }


    overlay(events0, events1) {
        var duration = Math.max(events0.duration, events1.duration);
        var newEvents = [];

        events0.forEach(event => {
            var newEvent = JSON.parse(JSON.stringify(event));
            //newEvent.start = this.modBeatTime(event.start, events0.duration);
            newEvents.push(newEvent);
        });

        events1.forEach(event => {
            var newEvent = JSON.parse(JSON.stringify(event));
            //newEvent.start = this.modBeatTime(event.start, events1.duration);
            newEvents.push(newEvent);
        });

        newEvents.sort((a, b) => {
            return a.start - b.start;
        });


        var filtered = new Set();
        newEvents = newEvents.filter(function (item) {
            var index = JSON.stringify(item, ["start", "note", "pitch"]);

            if (!filtered.has(index)) {
                filtered.add(index);
                return true;
            } //if
            return false;
        });

        newEvents.duration = duration;
        return newEvents;
    }

    nextConsonance(notes) {
        let prevNote = notes.length > 0 ? notes[notes.length - 1] : null;
        let prevPrevNote = notes.length > 1 ? notes[notes.length - 2] : null;
        let prevPrevPrevNote = notes.length > 2 ? notes[notes.length - 3] : null;

        if (prevNote === null) return 0;

        let pi = null;
        let ppi = null;
        if (prevPrevNote !== null) {
            pi = prevNote - prevPrevNote;
        }
        if (prevPrevPrevNote !== null ) {
            ppi = prevPrevNote - prevPrevPrevNote;
        }

        //console.log( "consonance", pi, ppi );

        if ( pi === null ) {
            let result = this.getConsonance(prevNote,8,1);
            return result;
        } //

        if ( ppi === null ) {
            if ( Math.abs(pi) > 1 ) {
                let result = this.getConsonance(prevNote,3,1);
                return result;
            } else {
                let result = this.getConsonance(prevNote,5,1);
                return result;
            }
        }

        let size = 1;

        if ( Math.abs(pi) > 1 && Math.abs(ppi) > 1 ) {
            size = 1;
        } else if ( Math.abs(pi) > 1 || Math.abs(ppi) > 1 ) {
            size = 5;
        } else {
            size = 8;
        }

        let totalGap = Math.abs(pi + ppi);

        let direction = 1;
        if ( Math.abs(totalGap) > 5 ) {
            direction = -Math.sign(totalGap);
        } else if ( Math.abs(totalGap) > 2 ) {
            direction = this.rand.next() < 0.75 ? -Math.sign(totalGap) : Math.sign(totalGap);
        } else {
            direction = this.rand.next() < 0.5 ? -1 : 1;
        }

        return this.getConsonance(prevNote,size,direction);
    }

    getConsonance(prevNote,size,direction) {
        let result = this.rand.nextRange( 1, size );
        if ( result === 7 ) {
            if ( this.rand.next() < 0.5 ) {
                result = 6;
            } else {
                result = 8;
            }
        } //if

        return result*direction;

    }

    slowHarmony(events,startTime) {
        let newEvents = [];
        let prevEvent = null;
        let currentEvents = [];
        let ctime = 0;

        events.forEach(event=>{
            if (newEvents.length > 0) prevEvent = newEvents[newEvents.length-1];

            let newEvent = JSON.parse(JSON.stringify(event));
            ctime = newEvent.start;

            currentEvents = currentEvents.filter(cevt => {
                return (cevt.start + cevt.duration) < ctime;
            });

            if ( startTime && (ctime < startTime) ) return;

            currentEvents.push(newEvent);

            if ( !prevEvent ) {
                newEvents.push(newEvent);
                return;
            } //if

            if ( this.isHarmonious( prevEvent, currentEvents) ) {
                prevEvent.duration += newEvent.duration;
                return;
            } //

            newEvents.push(newEvent);

        });

        newEvents.duration = events.duration;

        return newEvents;


    }

    isHarmonious(event,events) {
        if ( !events ) return true;

        let harmony = true;
        events.forEach( cevt =>{
            if ( !harmony ) return;
            let interval = Math.abs(Math.max(event.note,cevt.note) - Math.min(event.note,cevt.note)) % this.notes.cMajorScale.length;
            if ( interval === 0 || interval === 2 || interval === 4 ) return;
            harmony = false;
        });

        return harmony;

    }

}