const config = require('./config.json');
const io = require('socket.io-client');
const { spawn } = require('child_process');
const { RTCPeerConnection, nonstandard } = require('wrtc');
const { RTCVideoSink, RTCVideoSource } = nonstandard;

const SERVER_URI = 'https://rtc-pi-server.herokuapp.com';

const raspivid = spawn('/opt/vc/bin/raspivid', [
  '-o',
  '-',
  '-t',
  '0',
  '-rot',
  '180',
  '-w',
  '1920',
  '-h',
  '1080',
  '-fps',
  '30',
  '-b',
  '2000000'
]);

const ffmpeg = spawn("ffmpeg",[ 
  '-i', 'pipe:0',
  '-s', '1920x1080',
  '-c:v','h264', 
  '-f', 'mp4',
  "-frag_duration","3600",
  'pipe:1'
]);

raspivid.stdout.on('data', (data) => {
  console.log(data);
  ffmpeg.stdin.write(data);
})

//ffmpeg.stderr.on('data', (data) => {
//  console.log('dsads', data);
//});

const map = new Map();

const socket = io(SERVER_URI);

socket.on('connect', () => {
//  console.log('Camera connected');
//  console.log(socket.id);

  socket.emit('save-code', config.code);
});

let sendChannel;

socket.on('get-offer-from-camera', userId => {
//  console.log('get-offer-from-camera', userId);
  const connection = new RTCPeerConnection();
  map.set(userId, connection);
  // const source = new RTCVideoSource();
  // const track = source.createTrack();
  // const transceiver = peerConnection.addTransceiver(track);
  // const sink = new RTCVideoSink(transceiver.receiver.track);

//  child.stdout.on('data', chunk => {
  // console.log(chunk);
    //dc.sendChannel(chunk);
//  });

  let localDescription;
  connection.addEventListener('icecandidate', event => {
  //  console.log('new ice candidate');
    if (!localDescription) {
	console.log(localDescription);
 localDescription = connection.localDescription;

      socket.emit('send-offer-to-server', userId, localDescription);
//      console.log('send-offer-to-server', userId, localDescription);
    }
  });
  sendChannel = connection.createDataChannel('sendChannel');
 // child.stdout.on('data', chunk => {
 //   console.log(chunk);
 ///   sendChannel.send(chunk);
 // })

  sendChannel.onmessage = e => console.log('messsage received!!!' + e.data);
  sendChannel.onopen = e => {
    console.log('open!!!!');
    ffmpeg.stdout.on('data', chunk => {
      console.log(chunk);
      sendChannel.send(chunk);
    });
    ffmpeg.stderr.on('data', data => {
      console.log('error', data);
      sendChannel.send(data);
    });
  }
  sendChannel.onclose = e => console.log('closed!!!!!!');

  connection.createOffer().then(o => connection.setLocalDescription(o));
});

socket.on('send-answer-to-camera', (userId, answer) => {
  //console.log('send-answer-to-camera', userId, answer);
  const connection = map.get(userId);
  connection.setRemoteDescription(answer).then(() => {
    console.log('WebRTC: Connection established')
    //sendChannel.on('open', () => {
      //child.stdout.on('data', chunk => {
        //console.log(chunk);
        //sendChannel.send(chunk);
      //});
    //});
  });


});
