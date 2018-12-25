import SoundNode from "./sound-node.mjs";
import SoundBuffer from "./sound-buffer.mjs";
import SequencerNode from "./sequencer-node.mjs";
import TunedSequencerNode from "./tuned-sequencer-node.mjs";
import WebkitPlayer from "./webkit-player.mjs";
import Rhythm from "./rhythm.mjs";

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

                this.addChild(this.createNodeFromConfig(key, nodeConfig));
            });
        } //if

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
        let promise = new Promise((resolve, reject) => {
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
        this.audioRenderer.pumpAudio();
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



