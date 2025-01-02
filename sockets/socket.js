// socket.js
const Message = require('../models/Message');
const User = require('../models/users'); // Make sure this path is correct

const connectedUsers = new Map();
const users = {}; 

function initializeSockets(io) {
  io.on('connection', async (socket) => {
    console.log('New client connected:', socket.id);

    // Handle user joining for video calls
    socket.on('join-user', (username) => {
      users[socket.id] = { username };
      io.emit('joined', users);
    });

    socket.on('join call', async ({ username }) => {
      try {
        // 1. Update user's socketId in the database
        const user = await User.findOneAndUpdate({ username }, { socketId: socket.id }, { new: true });
        if (!user) {
          console.error('User not found for socket update:', username);
          return;
        }

        // 2. Update connectedUsers map
        connectedUsers.set(user._id.toString(), { 
          socketId: socket.id,
          online: true,
        });

        // 3. Emit 'users update' for video calls
        const users = await User.find({}, 'username _id');
        const usersList = users.map(user => ({
          userId: user._id.toString(),
          username: user.username,
          online: connectedUsers.has(user._id.toString()),
        }));
        io.emit('users update', usersList);

      } catch (error) {
        console.error('Error in join call:', error);
      }
    });

    // Handle WebRTC signaling for video/audio calls
    socket.on('offer', (data) => {
      socket.to(data.to).emit('offer', {
        offer: data.offer,
        from: socket.id
      });
    });

    socket.on('answer', (data) => {
      socket.to(data.to).emit('answer', {
        answer: data.answer,
        from: socket.id
      });
    });

    socket.on('ice-candidate', (data) => {
      socket.to(data.to).emit('ice-candidate', {
        candidate: data.candidate,
        from: socket.id
      });
    });

    socket.on('call-declined', (data) => {
      socket.to(data.to).emit('call-declined');
    });

    socket.on('call-ended', (data) => {
      socket.to(data.to).emit('call-ended');
    });

    socket.on('busy', (data) => {
      socket.to(data.to).emit('busy');
    });

    // Handle user joining the chat
    socket.on('join chat', async ({ userId }) => {
      try {
        // Update user's socketId in the database 
        await User.findByIdAndUpdate(userId, { socketId: socket.id }); 

        connectedUsers.set(userId, {
          socketId: socket.id,
          online: true,
        });

        const usersForChat = await User.find({}, 'username _id'); 
        const usersList = usersForChat.map(user => ({
          userId: user._id.toString(),
          username: user.username,
          online: connectedUsers.has(user._id.toString()),
        }));

        // Notify all users about the updated user list for chat
        io.emit('users update', usersList); 

      } catch (error) {
        console.error('Error in join chat:', error);
      }
    });

    // Handle chat messages 
    socket.on('chat message', async (data) => {
      try {
        const newMessage = new Message({
          from: data.from,
          to: data.to,
          message: data.message, 
        });

        const savedMessage = await newMessage.save();

        const messageData = {
          _id: savedMessage._id, 
          from: savedMessage.from,
          to: savedMessage.to,
          message: savedMessage.message,
          timestamp: savedMessage.timestamp
        };

        // Emit to both sender and recipient
        io.to(data.from).emit('chat message', messageData); 
        io.to(data.to).emit('chat message', messageData); 

      } catch (error) {
        console.error('Error saving message:', error);
      }
    });


    // Handle user disconnection
    socket.on('disconnect', async () => {
      try {
        delete users[socket.id];
        io.emit('joined', users); 

        let disconnectedUserId = null;
        for (const [userId, data] of connectedUsers.entries()) {
          if (data.socketId === socket.id) {
            disconnectedUserId = userId;
            break;
          }
        }

        if (disconnectedUserId) {
          // Update user's socketId to null in the database
          await User.findByIdAndUpdate(disconnectedUserId, { socketId: null }); 

          connectedUsers.delete(disconnectedUserId);

          const usersAfterDisconnect = await User.find({}, 'username _id');
          const usersList = usersAfterDisconnect.map(user => ({
            userId: user._id.toString(),
            username: user.username,
            online: connectedUsers.has(user._id.toString()),
          }));

          // Notify all users about the updated user list
          io.emit('users update', usersList); 
        }
      } catch (error) {
        console.error('Error in disconnect:', error);
      }
    }); 
  });
}

module.exports = initializeSockets;
