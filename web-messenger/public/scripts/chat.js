$(document).ready (function() {
  var socket = io();
  var $users = $('#users');
  var currentUser = $('#username').text();
  var currentRoom = 'lobby';
  
  $('#footerForm').submit(function(e){
    e.preventDefault();
    let message_text = $('#m').val();
    let message_string = "<p><span id='nameColor'>" + currentUser + "</span>: " + message_text + "</p>";
    $('#messages').append(message_string);
    socket.emit('send message', {message: message_text, room: currentRoom});
    $('#m').val('');
  });

  socket.emit('logged in', {user: currentUser});

  socket.on("room", function(data) {
    $('#messages').html('');
    $('#messages').append("<p>You joined " + currentRoom + "!</p>");
    if ('room' in data) {
      $('#usersList').text("Users in " + data.room);
    }
    $('#users').html('');
    for (let user of data.users) {
      $('#users').append("<li>" + user.name + "</li>");
    }
    if ('rooms' in data) {
      for (let key in data.rooms) {
        $('#rooms').append("<span><a href='#' class='room' data-room='" + key + "'>" + data.rooms[key].name + "</a></span>");
      }
    }
  });

  // New user
  socket.on('new user', function(data, callback){
    $('#messages').append("<p>" + data.user.name + " joined the room!</li>");
    $('#users').append("<li>" + data.user.name + "</li>");
  });

  // New message
  socket.on('chat message', function(data){
    $('#messages').append('<p><span id="name">'+data.user.name+'</span>: '+data.message+'</p>');
  });

  socket.on("user left", function(data) {
    $('#messages').append("<p>" + data.user + " left!</li>");
    let userName = "";
    for (let user of data.users) {
        userName += "<li>" + user.name + "</li>";
    }
    $('#users').html(userName);
  });

  $('#btn1').click(function (){
    socket.emit('url', $("#m1").val());
    return false;
  });

  socket.on('url', function(msg){
    $("#browser").attr('src', msg);
  });

  socket.on("new room", (data) => {
    $('#rooms').append("<span><a href='#' class='room' data-room='" + data.key + "'>" + data.name + "</a></span>");
  });

  $('form#newRoom').submit(function(e) {
    e.preventDefault();
    let roomName = $('#roomName').val();
    socket.emit("create room", {room: roomName});
    $('#roomName').val('');
  });

  $('#rooms').on('click', 'a.room', function(e) {
    e.preventDefault();
    currentRoom = $(this).data('room');
    socket.emit("joined room", {room: currentRoom});
});

});