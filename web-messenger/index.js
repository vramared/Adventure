'use strict';

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require("express-session");
const User = require('./models/user');
const Chat = require('./models/chat');
const users = {};
const connections = [];
const rooms = {
  lobby: {
    name: 'Lobby',
    roomUsers: []
  }
};

mongoose.connect("mongodb://forkchat:adventurecorp1@ds059207.mlab.com:59207/forkchat", function(err) {
  if(err) {
    console.log("Not connected to the database " + err);
  } else {
    console.log("Successfully connected to the database");
  }
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.use(session({
    secret: "ehbsvcjfevdgfd4636",
    resave: true,
    saveUninitialized: true
}));

app.set('view engine', 'ejs');

var routes = require('./routes.js');
routes(app);

io.sockets.on('connection', function(socket){
  // User is placed in lobby room when they log in
  socket.on('logged in', function(data) {
    users[socket.id] = {
      name: data.user,
      room: 'lobby'
    };
    rooms.lobby.roomUsers.push(users[socket.id]);
    socket.room = 'lobby';
    socket.join('lobby');
    socket.emit('room', {users: rooms.lobby.roomUsers, rooms: rooms});
    socket.broadcast.to('lobby').emit('new user', {user: users[socket.id]});

  });

  socket.on("joined room", function (data) {
    if (socket.room) {
      for (let i = 0, len = rooms[socket.room].roomUsers.length; i !== len; i++) {
        if (rooms[socket.room].roomUsers[i] === users[socket.id]) {
          rooms[socket.room].roomUsers.splice(i, 1);
          break;
        }
      }
      socket.broadcast.to(socket.room).emit("user left", {user: users[socket.id].name, users: rooms[socket.room].roomUsers});
      socket.leave(socket.room);
    }
    socket.room = data.room;
    socket.join(data.room);
    users[socket.id].room = data.room;
    rooms[data.room].roomUsers.push(users[socket.id]);
    socket.emit("room", {users: rooms[data.room].roomUsers, room: rooms[data.room].name});
    socket.broadcast.to(data.room).emit("new user", {user: users[socket.id]});
  });

  // send message
  socket.on('send message', function(data){
    socket.broadcast.to(data.room).emit('chat message', {message: data.message, user: users[socket.id]});
  });

  // Create room
  socket.on("create room", function(data) {
        const key = data.room.toLowerCase().split(' ').join('');
        rooms[key] = {
            name: data.room,
            roomUsers: []
        };
        io.sockets.emit("new room", {key: key, name: data.room});
    });

  socket.on('url', function(msg){
    io.emit('url', msg);
  });

  // when a user disconnects
  socket.on('disconnect', function(){
    let roomId = users[socket.id].room;
    for (let i = 0, len = rooms[roomId].roomUsers.length; i !== len; i++) {
      if (rooms[roomId].roomUsers[i] === users[socket.id]) {
          rooms[roomId].roomUsers.splice(i, 1);
          break;
      }
    }
    socket.broadcast.to(roomId).emit("user left", {user: users[socket.id].name, users: rooms[roomId].roomUsers});
    delete users[socket.id];
  });
});

var port = (process.env.PORT || 8080);

server.listen(port, function(){
  console.log('listening on *:8080');
});
