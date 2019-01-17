import SoundNode from "./sound-node.mjs";
import DarkBell from "./dark-bell.mjs";
import SeedRand from "./seed-rand.mjs";


export default class RandomBells extends SoundNode {
    constructor(name, seed) {
        super(name);
        this.rand = new SeedRand(seed);
    }

    generateOwnOutputFromIndex(output, startIndex) {
        if ( this.rand.next() < 0.0035 ) {
            this.addChild( new DarkBell(this.rand.nextInt(),this.rand.nextRange(9,23)));
        }
    } //



}