import SoundDemo from "./src/sound-demo.mjs";


let soundDemo;
let P5;
let counter = 0;
let shader1;
let images = [];
let imagesIndex = 0;
let font;
let lastTimestamp = 0;
let messages = [];
let demoLoaded = false;

window.addMessage = (msg,duration,color)=>{
    messages.push({age: duration, text: msg})
};

$(document).ready(function () {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    window.audioContext = new AudioContext();

    soundDemo = new SoundDemo("./sound.config");
    soundDemo.startLoading()
        .then(()=>window.demoLoaded=true);

    //window.requestAnimationFrame(step);
    P5 = new p5(drawing);


});

let drawing = function (sketch) {
    sketch.preload = (arg) => {
        console.log("preload", sketch);
        font = sketch.loadFont("Roboto-Black.ttf");
    };

    sketch.setup = () => {
        sketch.createCanvas(sketch.windowWidth, sketch.windowHeight);
        sketch.background(0);
        sketch.textFont(font);
    };

    sketch.draw = () => {
        var g = sketch;
        var w = sketch.windowWidth;
        var h = sketch.windowHeight;
        var mx = w / 2;
        var my = h / 2;
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
        if ( soundDemo.isReady() ) {
            g.text("ready", mx, my);
        } else {
            g.text("loading", mx, my);
        }

        //drawConsole(g);

    };

    sketch.windowResized = (arg) => {
        console.log("resize", sketch, arg);
        sketch.resizeCanvas(sketch.windowWidth, sketch.windowHeight);
        sketch.background(0);
    };

    sketch.mousePressed = (evt) => {
        console.log("mouse pressed", evt);
    }

};

function drawSound(g) {
    if ( !soundDemo.ready ) return;

    var channelCount = soundDemo.getOutputChannelCount();

    var angle = 2 * Math.PI / channelCount;
    var offset = 0; //lastTimestamp*0.0001;
    //g.fill(g.color(204, 153, 0));
    g.stroke(g.color(0, 153, 204));

    var w2 = g.windowWidth / 2;
    var h2 = g.windowHeight / 2;

    var dAng = angle/soundDemo.getOutputBufferSize();

    var outputBuffer = soundDemo.getCurrentOutput();

    for (var ci = 0; ci < channelCount; ci++) {
        g.stroke(g.color((ci*128)%255, (153-ci*64)%255, (204-ci*32)%255));
        //var values = soundDemo.output[ci];
        for (var i = 0; i < soundDemo.getOutputBufferSize(); i+=4) {
            var myAngle = offset + ci *(dAng + angle) + 2*i * dAng;


            var v = outputBuffer ? outputBuffer.get(ci,i) : 0.0;
            //var v = soundDemo.output[ci][i];
            v *= 100;
            v += 200;
            if ( i%4 == 0 ) {
                var x = Math.cos(myAngle) * v;
                var y = Math.sin(myAngle) * v;
                g.point( w2 + x, h2 + y);
            } //if
        } //for
    } //for


}

function drawConsole(g) {
    var height = 11;
    g.textSize(height);
    g.textAlign(g.LEFT, g.CENTER);
    g.stroke(32);
    g.fill(255);
    var spacing = 0.075;

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
