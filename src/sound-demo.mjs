import SoundNode from "./sound-node.mjs";
import SoundBuffer from "./sound-buffer.mjs";
import GrainNode from "./grain-node.mjs";
import SequencerNode from "./sequencer-node.mjs";
import WebkitPlayer from "./webkit-player.mjs";
import OutputBuffer from "./output-buffer.mjs";
//import * as SoundConstants from "./sound-constants.mjs";

export default class SoundDemo extends SoundNode {
    constructor(config) {
        super( "Sound Demo", "My super cool sound demo" );
        this.loadConfig(config, this.configLoaded.bind(this));
        this.config = null;
        this.audioFilesToLoad = 0;
        this.audioFilesLoaded = 0;
        this.soundBuffers = {};
        this.ready = false;
        this.rhythm =  { beatsPerMinute: 120, beatsPerMeasure: 4 };
        this.audioRenderer = new WebkitPlayer(window.audioContext);
    };

    configLoaded(data) {
        this.config = JSON.parse(data);
        console.log("config loaded", data);
        this.loadAudio(this.audioLoaded.bind(this));
    };

    setUpDemo() {
        console.log( "setting up demo from configuration" );

        if ( this.config.rhythm ) {
            this.rhythm = this.config.rhythm;
        } //if

        console.log( "sound demo rhythm", this.rhythm );

        if ( this.config.nodes ) {
            Object.keys(this.config.nodes).forEach( key=>{
                var nodeConfig = this.config.nodes[key];

                this.addChild( this.createNodeFromConfig( key, nodeConfig ) );
            });
        } //if

    }

    createNodeFromConfig(name, config) {
        console.log( "node config", config );
        var node = null;

        switch( config.nodeType ) {
            case "sequencer":
                node = this.createSequencerNode( config, name );
                console.log( "new sequencer node" );
                break;

        } //switch

        return node;
    }

    audioLoaded(name,url, data) {
        console.log("audio load", name, url, data);
        this.audioFilesLoaded++;
        this.soundBuffers[name] = new SoundBuffer(window.audioContext, url, data);
    };

    loadAudio(callback) {
        //jQuery.ajax doesn't play nice with ArrayBuffer - work around: don't use it
        var sounds = this.config.sounds;
        this.audioFilesToLoad = Object.keys(sounds).length;

        $.each(sounds, (name, file) => {
            var audioRequest = new XMLHttpRequest();
            var url = "./sounds/" + file;
            audioRequest.open("GET", encodeURIComponent(url), true);
            audioRequest.responseType = "arraybuffer";
            audioRequest.onload = (event) => {
                callback(name,url, audioRequest.response);
            };
            audioRequest.send();
        });
    };

    loadConfig(config, callback) {
        $.ajax({
            url: config,
            success: function (data) {
                callback(data);
            }
        });
    };

    checkLoading() {
        if (this.ready) {
            return true;
        }
        if (!this.config) return false;
        if (this.audioFilesToLoad > this.audioFilesLoaded) return false;

        if (this.soundBuffers) {
            let result = Object.values(this.soundBuffers).reduce((total, currentValue) => {
                return currentValue.ready;
            }, true);
            if (!result) return false;
        } //if

        console.log("loading done");

        this.ready = true;
        this.play();
        return true;

    };

    play() {
        this.setUpDemo();
        var b3 = new GrainNode(this.soundBuffers["s4"].buffer, "kick" );
        b3.rate = 1;
        b3.pitch = 1;
        b3.grainInterval = 150;
        b3.grainSize = 300;

        this.addChild(b3);
        //this.setRate(0.5);

        this.audioRenderer.start();
        super.play(0);
    }

    update(timeStamp,delta) {
        if (!this.checkLoading()) return;

        //if ( this.paused ) return;

        this.audioRenderer.render(this);

    };

    createSequencerNode(config, name) {
        var node = new SequencerNode(name);
        node.setBpm(this.rhythm.beatsPerMinute);
        node.setSequenceLength( config.lengthInBeats );
        node.setLoop(config.loop);
        config.tracks.forEach( track =>{
            track.soundBuffer = this.soundBuffers[ track.sound ];
        });
        node.setTracks( config.tracks );
        return node;
    }
};



