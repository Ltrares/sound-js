import GrainNode from "./grain-node.mjs";

export default class QuickMath {
    constructor() {
    }

    static init() {
        if (QuickMath.sineTable.length <= 0) {
            for (var i = 0; i < 2000; i++) {
                var result = Math.sin(2.0*Math.PI * i / 1000.0);
                QuickMath.sineTable[i] = result;
                QuickMath.cosineTable[i] = Math.cos(2.0*Math.PI * i / 1000.0);
            } //for
        } //if
    }

    static sin(value) {
        let iValue = Math.trunc(value * 1000) % 1000;
        return QuickMath.sineTable[iValue];
    }

    static cos(value) {
        let iValue = Math.trunc(value * 1000) % 1000;
        return QuickMath.cosineTable[iValue];
    }

}

QuickMath.sineTable = [];
QuickMath.cosineTable = [];
