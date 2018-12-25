export default class SeedRand {
    constructor(seed) {
        //this.rand = this.sfc32( seed, ~seed, (seed+1)/2, ~((seed+1)/2) );
        this.rand = this.sfc32( seed, seed, seed, seed );
    }

    next() {
        return this.rand();
    }

    sfc32(a, b, c, d) {
        return function() {
            a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
            var t = (a + b) | 0;
            a = b ^ b >>> 9;
            b = c + (c << 3) | 0;
            c = (c << 21 | c >>> 11);
            d = d + 1 | 0;
            t = t + d | 0;
            c = c + t | 0;
            return (t >>> 0) / 4294967296;
        }
    }

}