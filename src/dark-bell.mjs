import SoundNode from "./sound-node.mjs";
import SeedRand from "./seed-rand.mjs";
import QuickMath from "./quick-math.mjs";


export default class DarkBell extends SoundNode {
    constructor(name, depth, seed) {
        super("DarkBell", name);
        QuickMath.init();
        this.depth = depth ? depth : 11;
        this.currentPos = 0;
        let rand = new SeedRand(seed); //
        this.parameters = [];
        this.duration = 1.5 + rand.next()*23;
        for (let i = 0; i < 5; i++) {
            let cparms = [];
            for (let j = 0; j < this.depth; j++) {
                cparms.push(rand.nextRange(0,256));
            } //for
            this.parameters.push(cparms);
        }
    }

    generateOwnOutputFromIndex(output, startIndex) {
        //for ( let outputChannel = 0; outputChannel < output.channelCount; outputChannel ++ ) {

        for (let i = 0; i < output.length; i++) {
            let env = 1.0;
            if ( this.currentPos < 0.5 ) {
                env = this.currentPos / 0.5;
            } else if ( this.currentPos >= this.duration - 0.5 ) {
                env = (this.duration-this.currentPos)/0.5;
            } //

            if (i < startIndex) {
                output.add(0, i, 0);
                output.add(1, i, 0);
                continue;
            } //if

            //let value = this.darkBellSound();
            //let val = this.darkBellSound();
            for (let channel = 0; channel < output.channelCount; channel++) {
                output.add(channel, i, env*this.darkBellSound(channel * Math.PI * 0.99));
            }
            this.currentPos += this.timePerSample;
        } //for i

        if ( this.currentPos >= this.duration ) {
            this.done = true;
        }

        //} //channel
    } //

    darkBellSound(phase) {
        let value = 0.0;
        let twoPi = Math.PI * 2.0;
        let pos = this.currentPos;
        for (let j = 0; j < this.depth; j++) {
            let v2 = this.parameters[1][j]; // + 128*parameters[300+j];
            let v1 = this.parameters[0][j]; // + j]; // + 128*parameters[100+j];
            let v3 = 1 + this.parameters[2][j];
            let v4 = 1 + this.parameters[3][j];
            //let v5 = 1 + this.parameters[4][ j];
            let v0 = 1.0 + j;
            let angle3 = twoPi * (v2 / (v3 != 0 ? v3 : 1)) * 0.001 * (pos); // + 0.00005*noise();
            let angle2 = twoPi * (v2 / (v3 != 0 ? v3 : 1)) * 0.1 * (pos); // + 0.005*noise();
            let angle = twoPi * (v1 / (v4 != 0 ? v4 : 1)) * 100.0 * (pos); // + 50.0*noise();

            let a3val = Math.max(0.1, (1.0 + Math.sin(angle3)) / 2.0)/256.0;

            // double angle = 2.0 * Math.PI * (parameters[0]*(j+1)) *
            // (ellapsedTime + i * tinc);
            value += Math.sin(angle+phase) * Math.sin(angle2) * a3val * v3 / v0;
        }
        return value;
    }


    darkBellSoundMeh(phase) {
        let value = 0;
        let pos = this.currentPos;

        let twoPi = 2.0 * Math.PI;
        for (let j = 0; j < this.depth; j++) {
            let v1 = this.parameters[0][j];
            let v2 = this.parameters[1][j];
            let v3 = this.parameters[2][j];
            let v4 = this.parameters[3][j];
            let v5 = this.parameters[4][j];

            let v0 = 1.0 + j;
            let angle3 = twoPi * (v2 / (v3 !== 0.0 ? v3 : 1)) * 0.001 * (pos); // + 0.00005*noise();
            let angle2 = twoPi * (v2 / (v3 !== 0.0 ? v3 : 1)) * 0.1 * (pos); // + 0.005*noise();
            let angle = twoPi * (v1 / (v4 !== 0.0 ? v4 : 1)) * 2.0 * (pos); // + 50.0*noise();
            let angle4 = twoPi * (v5 / (v1 !== 0.0 ? v1 : 1)) * (5 + 10 * QuickMath.cos(angle3)) * (pos);

            let a3val = Math.max(0.001, (1.0 + QuickMath.sin(angle3 + phase) * QuickMath.sin(angle + angle4)) / 3.0);

            value += QuickMath.sin(angle4) * QuickMath.sin(angle + phase) * QuickMath.sin(angle2 * angle3 + a3val) * a3val / v0;

        }


        return value;

    } //


}