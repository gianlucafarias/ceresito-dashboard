const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const PORT = process.env.CHAT_PORT || 3001;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

httpServer.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});