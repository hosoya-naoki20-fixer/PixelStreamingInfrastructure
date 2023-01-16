const config = require('./config');
const WebSocket = require('ws');
const mediasoup = require('mediasoup_prebuilt');
const mediasoupSdp = require('mediasoup-sdp-bridge');

let signalServer = null;
let mediasoupRouter;
let streamer = null;
let peers = new Map();

async function startMediasoup() {
  let worker = await mediasoup.createWorker({
    logLevel: config.mediasoup.worker.logLevel,
    logTags: config.mediasoup.worker.logTags,
    rtcMinPort: config.mediasoup.worker.rtcMinPort,
    rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
  });

  worker.on('died', () => {
    console.error('mediasoup worker died (this should never happen)');
    process.exit(1);
  });

  const mediaCodecs = config.mediasoup.router.mediaCodecs;
  const mediasoupRouter = await worker.createRouter({ mediaCodecs });

  return mediasoupRouter;
}

function connectSignalling(server) {
  console.log("Connecting to Signalling Server at %s", server);
  signalServer = new WebSocket(server);
  signalServer.addEventListener("open", _ => { console.log(`Connected to signalling server`); });
  signalServer.addEventListener("error", result => { console.log(`Error: ${result.message}`); });
  signalServer.addEventListener("message", result => onSignallingMessage(result.data));
  signalServer.addEventListener("close", result => { 
    console.log(`Disconnected from signalling server: ${result.code} ${result.reason}`);
    console.log("Attempting reconnect to signalling server...");
    setTimeout(()=> { 
      connectSignalling(server);
    }, 2000); 
  });
}

async function onSignallingMessage(message) {
	console.log(`Got MSG: ${message}`);
  const msg = JSON.parse(message);

  // RootSFUからのメッセージ
  if (msg.type == 'playerConnected') {
    onPeerConnected(msg.playerId);
  }
  else if (msg.type == 'playerDisconnected') {
    onPeerDisconnected(msg.playerId);
  }
  // Playerからのメッセージ
  else if (msg.type == 'answer') {
    onPeerAnswer(msg.playerId, msg.sdp);
  }
  else if (msg.type == 'dataChannelRequest') {
    setupPeerDataChannels(msg.playerId);
  }
  else if (msg.type == 'peerDataChannelsReady') {
    setupStreamerDataChannelsForPeer(msg.playerId);
  }
}

// 
function onPeerConnected(peerId) {

}

// 
function onPeerDisconnected(peerId) {

}

function onPeerAnswer(peerId, sdp) {

}

function setupPeerDataChannels(peerId) {

}

function setupStreamerDataChannelsForPeer(peerId) {

}


async function main() {
  console.log('Starting Mediasoup...');
  console.log("Config = ");
  console.log(config);
  // Routerを生成
  mediasoupRouter = await startMediasoup();

  // シグナリングサーバと接続
  connectSignalling(config.signallingURL);
}

main();