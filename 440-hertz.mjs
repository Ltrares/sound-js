import WebkitPlayer from "./src/webkit-player.mjs";

$(document).ready(function () {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    window.audioContext = new AudioContext();

    console.log( "ready" );

    let player = new WebkitPlayer(window.audioContext);
    player.start();
});