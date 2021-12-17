const config = require('./config.json');
const io = require('socket.io-client');

const SERVER_URI = 'http://localhost:3030/';

const map = new Map();

const socket = io(SERVER_URI);

socket.on('connect', () => {
  console.log('Camera connected');

  socket.emit('save-code', config.code);
});

socket.on('get-offer-from-camera', userId => {
  const connection = new RTCPeerConnection();
  map.set(userId, connection);
  let localDescription;
  connection.addEventListener('icecandidate', event => {
    if (!localDescription) {
      localDescription = connection.localDescription;

      socket.emit('send-offer-to-server', userId, localDescription);
    }
  });
  connection.createOffer().then(o => localConnection.setLocalDescription(o));
});

socket.on('send-answer-to-camera', (userId, answer) => {
  const connection = map.get(userId);
  connection.setRemoteDescription(answer).then(() => console.log('WebRTC: Connection established'));
});
