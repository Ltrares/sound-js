import SoundNode from "./sound-node.mjs";
import SeedRand from "./seed-rand.mjs";

export default class DarkBell extends SoundNode {
    constructor(name,depth,seed) {
        super("DarkBell",name);
        this.depth = depth ? depth : 11;
        this.currentPos = 0;
        var rand = new SeedRand(seed); //
        this.parameters = [];

        for ( var i = 0; i < 5; i++) {
            var cparms = [];
            for ( var j = 0; j < this.depth; j++ ) {
                cparms.push( rand.next()*255)
            } //for
            console.log( cparms );
            this.parameters.push(cparms);
        }
    }


    generateOwnOutputFromIndex(output,startIndex) {
        //for ( var outputChannel = 0; outputChannel < output.channelCount; outputChannel ++ ) {

            var value = 0;
            for ( var i = 0; i < output.length; i++ ) {
                if ( i < startIndex ) {
                    output.add( 0, i, 0 );
                    output.add( 1, i , 0);
                    continue;
                } //if
                //var value = this.darkBellSound();
                //var val = this.darkBellSound();
                for ( var channel = 0; channel < output.channelCount; channel ++ ) {
                    output.add(channel, i, this.darkBellSound(channel*Math.PI*0.99));
                }
                this.currentPos += this.timePerSample;
            } //for i
        //} //channel
    } //

    darkBellSound(phase) {
        var value = 0;
        var pos = this.currentPos;

        var twoPi = 2.0*Math.PI;
        for (var j = 0; j < this.depth; j++) {
            var v1 = this.parameters[0][j];
            var v2 = this.parameters[1][j];
            var v3 = this.parameters[2][j];
            var v4 = this.parameters[3][j];
            var v5 = this.parameters[4][j];

            var v0 = 1.0 + j;
            var angle3 = twoPi * (v2 / (v3 != 0 ? v3 : 1)) * 0.001 * (pos); // + 0.00005*noise();
            var angle2 = twoPi * (v2 / (v3 != 0 ? v3 : 1)) * 0.1 * (pos); // + 0.005*noise();
            var angle = twoPi * (v1 / (v4 != 0 ? v4 : 1)) * 200.0 * (pos); // + 50.0*noise();

            var a3val = Math.max(0.001, (1.0 + Math.sin(angle3+phase)*Math.sin(angle)) / 3.0);

            var jvalue = Math.sin(angle+phase) * Math.sin(angle2*angle3+a3val) * a3val / v0;
            //var jvalue = 1.0 * Math.sin(angle2) * a3val / v0;

            value += jvalue;
        }



        return value;

    } //


}