import SoundDemo from "./src/sound-demo.mjs";
import OutputBuffer from "./src/output-buffer.mjs";

let jquery = window.$ ? window.$ : {};
let webkitAudioContext = window.webkitAudioContext ? window.webkitAudioContext : {};
let p5 = window.p5 ? window.p5 : {};
let soundDemo;
let P5;
let font;
let messages = [];
let clock = 0;
let soundGraph;

window.addMessage = (msg, duration) => messages.push({age: duration, text: msg});

jquery(document).ready(function () {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    window.audioContext = new AudioContext();

    soundDemo = new SoundDemo("./sound.config");
    soundDemo.startLoading()
        .then(() => window.demoLoaded = true);

    P5 = new p5(drawing);
    clock = new Date();

});

let drawing = function (sketch) {
    sketch.preload = function () {
        console.log("preload", sketch);
        font = sketch.loadFont("Roboto-Black.ttf");

    };
    sketch.setup = function () {
        sketch.createCanvas(sketch.windowWidth, sketch.windowHeight);
        sketch.background(0);
        sketch.textFont(font);
    };
    sketch.draw = function () {
        let g = sketch;
        let w = sketch.windowWidth;
        let h = sketch.windowHeight;
        let mx = w / 2;
        let my = h / 2;
        g.fill(0, 17); //12);
        g.rect(0, 0, g.width, g.height);
        //g.fill(255);
        //g.noStroke();
        //g.ellipse(g.mouseX, g.mouseY, 60, 60);

        drawSound(g);

        //g.fill(g.color(64,64,128));
        //g.ellipse(mx, my, 80, 80);

        g.fill(192);
        g.textSize(128);
        g.textAlign(g.CENTER, g.CENTER);
        //if (soundDemo.checkLoading()) {
        if (soundDemo.isReady()) {
            g.text("ready", mx, my);
        } else {
            g.text("loading", mx, my);
        }

        //drawConsole(g);

    };

    // noinspection SpellCheckingInspection
    sketch.windowResized = function (arg) {
        console.log("resize", sketch, arg);
        sketch.resizeCanvas(sketch.windowWidth, sketch.windowHeight);
        sketch.background(0);
    };

    sketch.mousePressed = function (evt) {
        console.log("mouse pressed", evt);
    };
};

function drawSound(g) {
    if (!soundDemo.ready) {
        return;
    }

    let channelCount = soundDemo.getOutputChannelCount();

    let angle = 2 * Math.PI / channelCount;
    let offset = 0; //lastTimestamp*0.0001;
    //g.fill(g.color(204, 153, 0));
    g.stroke(g.color(0, 153, 204));

    let w2 = g.windowWidth / 2;
    let h2 = g.windowHeight / 2;

    let dAng = angle / soundDemo.getOutputBufferSize();

    let outputBuffer = soundDemo.getCurrentOutput();

    if (!soundGraph && outputBuffer) {
        soundGraph = new OutputBuffer(outputBuffer.length, outputBuffer.channelCount);
    } //


    //let radDeg = 360.0/2.0*Math.PI;
    let v = g.millis();
    //console.log(v);
    v /= 1000.0;
    //v *= 2.0*Math.PI/360.0;

    let clockX = Math.cos(v);
    let clockY = Math.sin(v);

    g.stroke(255);
    g.line(w2, h2, w2 + clockX * 100, h2 + clockY * 100);


    if ( soundGraph ) {
        for (let ci = 0; ci < channelCount; ci++) {
            //g.stroke(g.color((ci * 128) % 255, (153 - ci * 64) % 255, (204 - ci * 32) % 255));
            //let values = soundDemo.output[ci];
            for (let i = 0; i < soundDemo.getOutputBufferSize(); i += 2) {
                let v = outputBuffer ? outputBuffer.get(ci, i) : 0.0;
                soundGraph.avg(ci, i, v, 0.5);
            } //for
        } //
    } //if


    for (let ci = 0; ci < channelCount; ci++) {
        g.stroke(g.color((ci * 128) % 255, (153 - ci * 64) % 255, (204 - ci * 32) % 255));
        //let values = soundDemo.output[ci];
        for (let i = 0; i < soundDemo.bufferSize; i += 4) {
            let myAngle = offset + ci * (dAng + angle) + 2 * i * dAng;


            let v = soundGraph ? soundGraph.get(ci, i) : 0;
            //let v = soundDemo.output[ci][i];
            v *= 100;
            v += 200;
            //if ( i%4 == 0 ) {
            let x = Math.cos(myAngle) * v;
            let y = Math.sin(myAngle) * v;
            g.point(w2 + x, h2 + y);
            //} //if
        } //for
    } //for


}

function drawConsole(g) {
    let height = 11;
    g.textSize(height);
    g.textAlign(g.LEFT, g.CENTER);
    g.stroke(32);
    g.fill(255);
    let spacing = 0.075;

    messages.reduce((pos, msg) => {
        //console.log( pos, msg );
        g.fill(192, msg.size * 192);
        g.text(msg.text + " - " + messages.length + " - " + msg.age, 10, pos * height);
        pos += msg.size; //*height;
        pos += spacing;
        return pos;
    }, 1);

    // $.each(messages,(msg)=>{
    //
    // });
}

function updateConsole(dt) {
    messages = messages.filter((msg) => {
        msg.age -= dt;
        if (msg.age <= 0) return false;
        msg.size = msg.age > 0.5 ? 1.0 : msg.age / 0.5;
        return true;
    });

}
