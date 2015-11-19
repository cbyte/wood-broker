var users = []
var sessions = []

/** WebRTC Connection Broker Server **/
var PeerServer = require('peer').PeerServer;
var server = PeerServer({
  port: 9000,
  path: '/peer'
});
console.log("Listening")
server.on('connection', function(id) {
  console.log('peerjs client', id, 'connected')
  users.push(id)
  sendConnectedClientsToAll();
})

server.on('disconnect', function(id) {
  console.log('peerjs client', id, 'disconnected')
  users.splice(users.indexOf(id), 1);
  sendConnectedClientsToAll();
})

/** Session Managing Server via Socket.IO **/
var app = require('http').createServer();
var io = require('socket.io')(app);
app.listen(80);

var id = 'main'

function Session(id, ownerId, password) {
  this.id = id;
  this.owner = ownerId;
  var password = password;
}

Session.prototype.getPassword = function() {
  return password;
}

io.on('connection', function(socket) {
  sendSessionsToAll();

  socket.on('create-session', function(peerId, password, callback) {
    var sessionId = peerId + Math.floor(100 * Math.random());
    sessions.push(new Session(sessionId, peerId, password))
    sendSessionsToAll();
    callback(sessionId);
  });

  // ***delete this method?*** and remove an inactive session automatically if there has been no users for awhile
  socket.on('remove-session', function(peerId, sessionId, password) {
    for (var i = 0; i < sessions.length; i++) {
      var session = sessions[i];

      if (session.id == sessionId && session.owner == peerId && password == session.getPassword()) {
        sessions.splice(i, 1);
        sendSessionsToAll();
        return;
      }
    }
  });

  // delete session if owner disconnects
  socket.on('disconnect', function() {

  })
});

function sendConnectedClientsToAll() {
  io.emit('info-connected-clients', users);
}

function sendSessionsToAll() {
  io.emit('info-open-sessions', sessions);
}
