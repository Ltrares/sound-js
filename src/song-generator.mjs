import Notes from "./notes.mjs";
import Rhythm from "./rhythm.mjs";
import SeedRand from "./seed-rand.mjs";

export default class SongGenerator {

    constructor(seed) {
        this.rand = new SeedRand(seed);
        this.rhythm = new Rhythm(seed);
        this.notes = new Notes();
    }

    motif(size, beatSize) {
        var base = this.rhythm.makeBaseRhythm(size, beatSize ? beatSize : 1);

        var motif = this.rhythm.mix(base, 0.6, 0.3);

        motif.forEach(event => {
            var noteNumber = Math.floor(this.rand.next() * 13 - 11);
            event.note = noteNumber;
            event.volume = Math.min(1.0, 0.5 + 0.25 * event.duration / 2.0);
        });

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



        events.forEach(event=>{
           let newEvent = JSON.parse(JSON.stringify(event));

           ctime = newEvent.start;
           currentEvents = currentEvents.filter(cevt=>{
              return (cevt.start + cevt.duration) < ctime;
           });

           currentEvents.push(newEvent);
           newEvents.push(newEvent);
           let triggerLevel = probability / (currentEvents.length);

            var rand = this.rand.next();

            if (rand > triggerLevel) return;

            console.log( "trigger", rand, triggerLevel, currentEvents );

            var r2 = this.rand.next();

            var r3 = Math.sign(this.rand.next() - 0.5);

            if (r2 < 0.5) {
                newEvent.note += r3 * 2;
            } else if (r2 < 0.75) {
                newEvent.note += r3 * 4;
            } else if (r2 < 0.9) {
                newEvent.note += r3 * 3;
            } else if (r2 < 0.975) {
                newEvent.note += r3 * 7;
            } else {
                newEvent.note += r3 * 1;
            } //else

            if ( r3 < 0 && this.rand.next() < 0.5 ) newEvent.note -= 1;
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

        console.log( "concat duration", duration );
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

    modBeatTime(time, duration) {
        var result = time;
        while (result > duration) result -= duration;
        return result;

    }
}