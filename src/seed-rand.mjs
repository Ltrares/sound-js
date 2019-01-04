export default class SeedRand {
    constructor(seed) {
        this.m = 0x80000000; // 2**31;
        this.a = 1103515245;
        this.c = 12345;

        this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
    }

    next() {
        return this.nextInt() / (this.m - 1);
    }

    nextInt() {
        this.state = (this.a * this.state + this.c) % this.m;
        return this.state;
    } //

    nextRange(start,end) {
        var rangeSize = end - start;
        var randomUnder1 = this.nextInt() / this.m;
        return start + Math.floor(randomUnder1 * rangeSize);
    }
}