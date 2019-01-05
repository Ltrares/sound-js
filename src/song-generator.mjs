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

        var motif = this.rhythm.mix(base, 0.5, 0.5);

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

        var map = new Map();
        events.forEach(event => {
            var newEvent = JSON.parse(JSON.stringify(event));

            var r = this.rand.next();

            var currentEvents = map.get(newEvent.start);

            if (!currentEvents) {
                currentEvents = [];
                map.set(newEvent.start, currentEvents);
            } //
            currentEvents.push(newEvent);
        });

        map.forEach(currentEvents => {
            var triggerLevel = probability / (currentEvents.length);

            currentEvents.forEach(newEvent => {
                var rand = this.rand.next();

                if (rand > triggerLevel) {
                    newEvents.push(newEvent);
                    return;
                }
                ;

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

                // if (r2 < 0.3) {
                //     newEvent.note += 2;
                // } else if (r2 < 0.3) {
                //     newEvent.note += 4;
                // } else if (r2 < 0.5) {
                //     newEvent.note += 3;
                // } else if (r2 < 0.7) {
                //     newEvent.note -= 4;
                // } else if (r2 < 0.8 ) {
                //     newEvent.note += 7;
                // } else if ( r2 < 0.9 ) {
                //     newEvent.note += 3;
                // } else if ( r2 < 0.95 ) {
                //     newEvent.note += 1;
                // } else {
                //     newEvent.note -= 1;
                // }

                newEvents.push(newEvent);
            });
        });

        newEvents.duration = events.duration;
        return newEvents;
    }

    concat(eventLists) {
        var newEvents = [];

        var duration = 0;
        eventLists.forEach(eventList => {
            console.log("concat", eventList);
            eventList.forEach(event => {
                var newEvent = JSON.parse(JSON.stringify(event));
                newEvent.start += duration;
                newEvents.push(newEvent);
            });
            duration += eventList.duration;
        });

        newEvents.duration = duration;
        return newEvents;
    }


    overlay(events0, events1) {
        var duration = Math.max(events0.duration, events1.duration);
        var newEvents = [];

        events0.forEach(event => {
            var newEvent = JSON.parse(JSON.stringify(event));
            newEvent.start = this.modBeatTime(event.start, events0.duration);
            newEvents.push(newEvent);
        });

        events1.forEach(event => {
            var newEvent = JSON.parse(JSON.stringify(event));
            newEvent.start = this.modBeatTime(event.start, events1.duration);
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