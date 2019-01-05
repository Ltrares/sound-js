import SoundNode from "./sound-node.mjs";
import SeedRand from "./seed-rand.mjs";

export default class DarkBell extends SoundNode {
    constructor(name,depth,seed) {
        super("DarkBell",name);
        this.depth = depth ? depth : 11;
        this.currentPos = 0;
        let rand = new SeedRand(seed); //
        this.parameters = [];

        for ( let i = 0; i < 5; i++) {
            let cparms = [];
            for ( let j = 0; j < this.depth; j++ ) {
                cparms.push( rand.next()*255);
            } //for
            console.log( cparms );
            this.parameters.push(cparms);
        }
    }


    generateOwnOutputFromIndex(output,startIndex) {
        //for ( let outputChannel = 0; outputChannel < output.channelCount; outputChannel ++ ) {

            for ( let i = 0; i < output.length; i++ ) {
                if ( i < startIndex ) {
                    output.add( 0, i, 0 );
                    output.add( 1, i , 0);
                    continue;
                } //if
                //let value = this.darkBellSound();
                //let val = this.darkBellSound();
                for ( let channel = 0; channel < output.channelCount; channel ++ ) {
                    output.add(channel, i, this.darkBellSound(channel*Math.PI*0.99));
                }
                this.currentPos += this.timePerSample;
            } //for i
        //} //channel
    } //

    darkBellSound(phase) {
        let value = 0;
        let pos = this.currentPos;

        let twoPi = 2.0*Math.PI;
        for (let j = 0; j < this.depth; j++) {
            let v1 = this.parameters[0][j];
            let v2 = this.parameters[1][j];
            let v3 = this.parameters[2][j];
            let v4 = this.parameters[3][j];

            let v0 = 1.0 + j;
            let angle3 = twoPi * (v2 / (v3 !== 0.0 ? v3 : 1)) * 0.001 * (pos); // + 0.00005*noise();
            let angle2 = twoPi * (v2 / (v3 !== 0.0 ? v3 : 1)) * 0.1 * (pos); // + 0.005*noise();
            let angle = twoPi * (v1 / (v4 !== 0.0 ? v4 : 1)) * 200.0 * (pos); // + 50.0*noise();

            let a3val = Math.max(0.001, (1.0 + Math.sin(angle3+phase)*Math.sin(angle)) / 3.0);

            value += Math.sin(angle+phase) * Math.sin(angle2*angle3+a3val) * a3val / v0;

        }



        return value;

    } //


}