const express = require('express');
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 5000;

const app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

  // Priority serve any static files.
  app.use(express.static(path.resolve(__dirname, '../client/build')));

  // Answer API requests.
  app.get('/api', function (req, res) {
    res.set('Content-Type', 'application/json');
    res.send('{"message":"Hello from the custom server!"}');
  });

  // All remaining requests return the React app, so it can handle routing.
  app.get('*', function(request, response) {
    response.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });

server.listen(PORT, function () {
    console.error(`Node ${isDev ? 'dev server' : 'cluster worker '+process.pid}: listening on port ${PORT}`);
  });

var group = [];

io.on('connection', socket => {

  socket.on('join', (data, callback) => {
    socket.join(data.roomId);
    socket.room = data.roomId;
    if (group[data.roomId] === undefined)
      group[data.roomId] = { name:data.roomId, users: []};
    const sockets = io.of('/').in().adapter.rooms[data.roomId];
    callback(group[data.roomId]);
  })

  socket.on('getAllUsers', (data, callback) => {
    const roomId =  data.roomId;
    callback(group[roomId])
  })

  socket.on('addUser', (data, callback) => {
    group[data.roomId].users.push({socketId: socket.id});
    callback(group[data.roomId]);
  })

  socket.on('updateUser', data => {
    const roomId = data.roomId;

    console.log(group);

    let index = group[roomId].users.findIndex(a => {
      return a.socketId === socket.id
    })

    group[roomId].users[index].peer = data.peer;
    group[roomId].users[index].index = data.index;
  })

  socket.on('connectToPeer', data => {
    socket.to(data.socket).emit('connectToPeer', {peer: data.peer, socket: socket.id, index: data.index})
  })

  socket.on('finalHandshake', data => {
    socket.to(data.socket).emit('finalHandshake', {peer: data.peer, index: data.index})
  })

  socket.on('disconnect', () => {
    group.forEach((room, index, object) => {
      if(room.users.length === 0)
        object.splice(index, 1);
    })
  })
})
