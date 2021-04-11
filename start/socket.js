'use strict';
const Server = use('Server');
const io = use('socket.io')(Server.getInstance());

io.on('connection', function(socket){ 
  // Join
  socket.on('join', function(roomId){
    socket.join(roomId);
  });

  // Leave
  socket.on('leave', function(roomId){
    socket.leave(roomId);
	});

  socket.on('disconnecting', async () => {
  });
});

module.exports = io;

/*
	Usage
  require('../../../start/socket');
  socket is in ready onConnect state
 */
