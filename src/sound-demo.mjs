import SoundNode from "./sound-node.mjs";
import SoundBuffer from "./sound-buffer.mjs";
import SequencerNode from "./sequencer-node.mjs";
import TunedSequencerNode from "./tuned-sequencer-node.mjs";
import WebkitPlayer from "./webkit-player.mjs";
import SongGenerator from "./song-generator.mjs";
import FftNode from "./fft-node.mjs";

export default class SoundDemo extends SoundNode {
    constructor(configFile) {
        super("Sound Demo", "My super cool sound demo");
        //this.startLoading( config); //this.loadConfig(config, this.configLoaded.bind(this));
        this.configFile = configFile;
        this.config = null;
        this.soundBuffers = {};
        this.ready = false;
        this.rhythm = {beatsPerMinute: 120, beatsPerMeasure: 4};
        this.audioRenderer = new WebkitPlayer(window.audioContext, this);
        //var tmp = new Rhythm(1234);
        // var nr = tmp.makeRoot(2);
        // console.log( "rhythm", nr );
        // var v1 = tmp.mix(nr,0.75,0.1);
        // console.log( "v1", v1 );
        // var v2 = tmp.mix(v1,0.25,0.1);
        // console.log( "v2", v2 );
    };

    getCurrentOutput() {
        return this.audioRenderer.currentOutput;
    }

    getOutputBufferSize() {
        return this.audioRenderer.bufferSize;
    }

    getOutputChannelCount() {
        return this.audioRenderer.channelCount;
    }

    isReady() {
        return this.ready;
    }

    async startLoading() {
        return this.fetch(this.configFile)
            .then(result => this.configLoaded(result))
            .then(result => this.loadAudio(result))
            .then(result => this.setUpDemo(result))
            .then(result => this.ready = true);
    }


    configLoaded(data) {
        this.config = JSON.parse(data);
        //console.log("config loaded", data);
        //this.loadAudio(this.audioLoaded.bind(this));
    };

    setUpDemo(config) {
        console.log("setting up demo from configuration");

        if (this.config.rhythm) {
            this.rhythm = this.config.rhythm;
        } //if

        console.log("sound demo rhythm", this.rhythm);

        if (this.config.nodes) {
            Object.keys(this.config.nodes).forEach(key => {
                var nodeConfig = this.config.nodes[key];

               // this.addChild(this.createNodeFromConfig(key, nodeConfig));
            });
        } //if

        var tsn = new TunedSequencerNode( "RhythmTest-1" );
        //tsn.sequenceLength = 16;
        tsn.loop = true;
        tsn.volume = 1.0;
        //tsn.setPitch(0.5);

        //var sound =  "s11";
        var sound =  "s13";
        var track = { sound: sound, beats: [] };

        var songGenerator = new SongGenerator( 193 );

        var motif = songGenerator.motif(8,4);
        var vary1 = songGenerator.varyRhythm(motif,0.5,0.25);
        vary1 = songGenerator.varyMelody(vary1,0.4);
        vary1 = songGenerator.overlay(motif,vary1);

        var verse1 = songGenerator.concat([motif,vary1]);

        var verse2 = songGenerator.varyMelody(verse1,0.4);
        verse2 = songGenerator.overlay(verse1,verse2);

        var vary2 = songGenerator.varyRhythm(vary1,0.5,0.25);
        vary2 = songGenerator.varyMelody(vary2,0.6);
        vary2 = songGenerator.overlay(vary1,vary2);
        var verse3 = songGenerator.concat([vary1,vary2]);

        var vary3 = songGenerator.varyRhythm(vary2,0.5,0.25);
        vary3 = songGenerator.varyMelody(vary3,0.6);
        vary3 = songGenerator.overlay(vary2,vary3);
        var verse4 = songGenerator.concat([vary2,vary3]);

        // var vary2 = songGenerator.varyMelody(motif);
        // vary2 = songGenerator.overlay(motif,vary2);
        // //vary1 = songGenerator.overlay(motif,vary1);
        // var vary3 = songGenerator.varyMelody(vary1);
        // vary3 = songGenerator.varyMelody(vary3);
        // vary3 = songGenerator.overlay(motif,vary3);
        // //vary3 = songGenerator.overlay(vary2,vary3);
        // var verse1 = songGenerator.concat([motif,vary1,vary2,vary3]);
        //
        // var verse2 = songGenerator.varyMelody(verse1);
        // //verse2 = songGenerator.varyMelody(verse2);
        var song = songGenerator.concat([verse1,verse2,verse3,verse4]);



        track.beats = song;
        tsn.sequenceLength = song.duration;


        console.log( "track beats", track.beats );
        // var tr =  new Rhythm(12345);
        // var trr = tr.mix( [1,1,1,1,1,1,1,1,1,1,1,1], 0.75, 0.25 );
        // trr = tr.mix(trr, 0.25, 0.5 );
        // trr = trr.concat( tr.mix(trr,0.5,0.5));
        //
        // console.log( "rhythm test", trr );
        // var cv = 0;
        // for ( var tri in trr ) {
        //     var trv = trr[tri];
        //     cv += trv;
        //     var pitch = tsn.notes.cMajor( Math.floor(Math.random()*17-8))
        //     var beat = { beat: cv, pitch: pitch, volume: 0.7 };
        //
        //     track.beats.push(beat);
        //     console.log( "beat", beat );
        // } //
        track.soundBuffer = this.soundBuffers[ sound ];
        tsn.tracks = [ track ];

        this.addChild(tsn);

        //let fftNode = new FftNode("test fft node", 30 );

        //this.addChild(fftNode);

        this.play();
    }

    createNodeFromConfig(name, config) {
        console.log("node config", config);
        var node = null;

        switch (config.nodeType) {
            case "sequencer":
                node = this.createSequencerNode(config, name);
                console.log("new sequencer node");
                break;
            case "tuned-sequencer":
                node = this.createTunedSequencerNode(config, name);
                console.log("new tuned sequencer node");
                break;

        } //switch

        return node;
    }

    async loadAudio() {
        //jQuery.ajax doesn't play nice with ArrayBuffer - work around: don't use it
        var sounds = this.config.sounds;
        //this.audioFilesToLoad = Object.keys(sounds).length;

        var audioRequests = [];


        var audioRequests = $.map(sounds, (file, name) => {
            return this.fetchAudio(name, file)
                .then((audio) => this.audioRenderer.decodeAudio(audio.data))
                .then((buffer)=>{
                    var soundBuffer = new SoundBuffer(name,file);
                    this.soundBuffers[name] = soundBuffer;
                    return soundBuffer.analyzeAudio(buffer);
                });
        });

        return Promise.all(audioRequests)
            .then((values) => {
                console.log("audio loaded", values);
                return this.config;
            });

    };

    async fetchAudio(name, file) {
         let promise = new Promise((resolve) => {
            var audioRequest = new XMLHttpRequest();
            var url = "./sounds/" + file;
            audioRequest.open("GET", encodeURIComponent(url), true);
            audioRequest.responseType = "arraybuffer";
            audioRequest.onload = (event) => {
                resolve({name, url, data: audioRequest.response});
            };
            audioRequest.send();
        });

        return promise;

    }

    async fetch(url) {
        let promise = new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                success: function (data) {
                    resolve(data);
                }
            })
        });

        return promise;
    };

    play() {
        super.play(5);
        this.audioRenderer.start();
    }

    update(timeStamp, delta) {
        //var brc = this.checkLoading();
        //if (!brc) return;
        //this.audioRenderer.render(this);
    };

    createSequencerNode(config, name) {
        var node = new SequencerNode(name);
        node.setBpm(this.rhythm.beatsPerMinute);
        node.setSequenceLength(config.lengthInBeats);
        node.setLoop(config.loop);
        node.setVolume(config.volume ? config.volume : 1.0);
        if (config.pitch) node.setPitch(config.pitch);
        config.tracks.forEach(track => {
            track.soundBuffer = this.soundBuffers[track.sound];
        });
        node.setTracks(config.tracks);
        return node;
    }

    createTunedSequencerNode(config, name) {
        var node = new TunedSequencerNode(name);
        node.setBpm(this.rhythm.beatsPerMinute);
        node.setSequenceLength(config.lengthInBeats);
        node.setLoop(config.loop);
        node.setVolume(config.volume ? config.volume : 1.0);
        if (config.pitch) node.setPitch(config.pitch);
        if (config.rate) node.setRate(config.rate);
        config.tracks.forEach(track => {
            track.soundBuffer = this.soundBuffers[track.sound];
        });
        node.setTracks(config.tracks);
        return node;
    }

};



