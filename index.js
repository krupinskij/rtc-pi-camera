const config = require('./config.json');
const io = require('socket.io-client');
const { spawn } = require('child_process');
const { RTCPeerConnection, nonstandard } = require('wrtc');
const { RTCVideoSink, RTCVideoSource } = nonstandard;

const SERVER_URI = 'https://rtc-pi-server.herokuapp.com';

const child = spawn('/opt/vc/bin/raspivid', [
  '-hf',
  '-w',
  '1280',
  '-h',
  '1024',
  '-t',
  '999999999',
  '-fps',
  '20',
  '-b',
  '5000000',
  '-o',
  '-',
]);

const map = new Map();

const socket = io(SERVER_URI);

socket.on('connect', () => {
  console.log('Camera connected');
  console.log(socket.id);

  socket.emit('save-code', config.code);
});

socket.on('get-offer-from-camera', userId => {
  console.log('get-offer-from-camera', userId);
  const connection = new RTCPeerConnection();
  map.set(userId, connection);

  const source = new RTCVideoSource();
  const track = source.createTrack();
  const transceiver = peerConnection.addTransceiver(track);
  const sink = new RTCVideoSink(transceiver.receiver.track);

  child.stdout.on('data', chunk => {
    source.onFrame(chunk);
  });

  let localDescription;
  connection.addEventListener('icecandidate', event => {
    console.log('new ice candidate');
    if (!localDescription) {
      localDescription = connection.localDescription;

      socket.emit('send-offer-to-server', userId, localDescription);
      console.log('send-offer-to-server', userId, localDescription);
    }
  });
  const sendChannel = connection.createDataChannel('sendChannel');
  sendChannel.onmessage = e => console.log('messsage received!!!' + e.data);
  sendChannel.onopen = e => console.log('open!!!!');
  sendChannel.onclose = e => console.log('closed!!!!!!');

  connection.createOffer().then(o => connection.setLocalDescription(o));
});

socket.on('send-answer-to-camera', (userId, answer) => {
  console.log('send-answer-to-camera', userId, answer);
  const connection = map.get(userId);
  connection.setRemoteDescription(answer).then(() => console.log('WebRTC: Connection established'));
});
