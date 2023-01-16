const config = require("./config");
const WebSocket = require("ws");
const mediasoup = require("mediasoup_prebuilt");
const mediasoupSdp = require("mediasoup-sdp-bridge");

let signalServer = null;
let mediasoupRouter;
let streamer = null;
let peers = new Map();

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

  // ストリーマーからのメッセージ
  if (msg.type == 'offer') {
    onStreamerOffer(msg.sdp);
  }
  else if (msg.type == 'streamerDisconnected') {
    onStreamerDisconnected();
  }
  // プレイヤー関連のメッセージ
  else if (msg.type == 'playerConnected') {
    onPlayerConnected(msg.playerId);
  }
  else if (msg.type == 'playerDisConnected') { // TODO いる？

  }

}

// プレイヤー接続時
async function onPlayerConnected(playerId) {
  // 新しいSFUサーバを起動すべきか判定
  if (needNewSFUServer() === true) {
    // 新しくSFUサーバを起動
    const newChildSFU = await startSFUServer();
    // Streamerから受け取っている映像を新しく起動したSFUに流すように設定
    await pipeToRemoteRouter(newChildSFU);
    // 新しく起動したSFUサーバに新規プレイヤーの情報を渡す
    newChildSFU.addNewPlayer(playerId);
  }
  else
  {
    // 新規プレイヤーを受け入れ可能なサーバを取得
    const childSFU = GetAcceptableChildSFU();
    // 新規プレイヤーの情報を渡す
    childSFU.addNewPlayer(playerId);
  }
}

// 新しくSFUサーバを起動
async function startSFUServer() {

}



// 新しいSFUサーバを起動すべきかを判定
function needNewSFUServer() {

}

// 対象のSFUサーバに対してStreamerからの映像を流すようにする
async function pipeToRemoteRouter(childSFU) {
  // Router.pipeToRouterと同じようなものを実装する必要がある？
  // https://github.com/versatica/mediasoup/blob/c0d3b70930fab571c0bfe26128d701f740c0c195/node/src/Router.ts
}

async function main() {
  console.log("Starting Mediasoup...");
  console.log("Config = ");
  console.log(config);

  mediasoupRouter = await startMediasoup();

  // シグナリングサーバと接続
  connectSignalling(config.signallingURL);
}

main();
