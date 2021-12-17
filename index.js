const config = require('./config.json');
const io = require('socket.io-client');

const SERVER_URI = 'http://localhost:3030/';

const socket = io(SERVER_URI);

socket.on('connect', () => {
  console.log('Camera connected');

  socket.emit('save-code', config.code);
});
