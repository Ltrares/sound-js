import SeedRand from "./seed-rand.mjs";

export default class Rhythm {
    constructor(seed) {
        this.rand = new SeedRand(seed);
    }

    makeRoot(complexity) {
        var root = [1,1,1,1];

        while ( complexity > 0 ) {
            root = this.mix(root);
            complexity --;
        } //while

        console.log( "root", root );
        return root;
    }

    mix(base) {
        var mixed = [];

        var prev = 0;
        //subdivide
        for ( var i = 0; i < base.length; i++ ) {
            if ( this.rand() < 0.5 || mixed.length == 0 ) {
                mixed.push(base[i]);
                continue;
            } //

            mixed[ mixed.length-1] /= 2;
            mixed.push[ mixed.length-1];
        }

        //combine
        for ( var i = 0; i < base.length; i++ ) {
            if ( this.rand() < 0.5 || mixed.length == 0 ) {
                mixed.push(base[i]);
                continue;
            } //

            mixed[ mixed.length-1] += base[i];
        }

        return mixed;

    }



}