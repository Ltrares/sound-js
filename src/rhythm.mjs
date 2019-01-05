import SeedRand from "./seed-rand.mjs";

export default class Rhythm {
    constructor(seed) {
        this.rand = new SeedRand(seed);
    }

    makeBaseRhythm(size,beatSize) {
        var base = [];

        var onset = 0;
        while ( base.length < size ) {
            base.push( { start: onset, duration: beatSize});
            onset += beatSize;
        }

        base.duration = size*beatSize;
        return base;
    }

    mix(base,splitProbability, joinProbability) {
        var split = [];
        base.forEach( event =>{
            var newEvent = JSON.parse(JSON.stringify(event));
            if ( this.rand.next() > splitProbability  ) {
                split.push(newEvent);
                return;
            } //
            var splitEvent = JSON.parse(JSON.stringify(event));

            newEvent.duration /= 2;

            splitEvent.start = newEvent.start + newEvent.duration;
            splitEvent.duration = newEvent.duration;
            split.push(newEvent);
            split.push(splitEvent);


        });

        var join = [];

        split.forEach( event =>{
            var newEvent = JSON.parse(JSON.stringify(event));
            if ( this.rand.next() > joinProbability  || join.length == 0 ) {
                join.push(newEvent);
                return;
            } //

            var oldEvent = join[ join.length - 1 ];

            if ( oldEvent.duration < newEvent.duration ) {
                if ( oldEvent.note && newEvent.note ) oldEvent.note = newEvent.note;
            } //

            oldEvent.duration += newEvent.duration;
        });

        join.duration = base.duration;
        return join;

    }



}