require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const connectDb = require('./config/db');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');


const indexRoutes = require('./routes/indexRoutes');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat'); // Add chat routes
const initializeSockets = require('./sockets/socket');
const { checkAuth } = require('./middleware/auth');
const { requestLogger, bodyParserMiddleware, validateFormData, errorHandler } = require('./middleware/middleware');
const sslcommerzRoutes = require('./routes/sslcommerzRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
//const reminderRoutes = require('./routes/reminderRoutes');
const emailRoutes = require('./routes/emailRoutes');

//new
const complaintRouter = require("./routes/complaint");
const postAndCommentRouter = require("./routes/postAndComment");
const resourceRouter = require("./routes/resource");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

bodyParserMiddleware(app);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// Make io accessible to routes
app.set('io', io);

// Connect to the database
connectDb();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));


const methodOverride = require('method-override');
app.use(methodOverride('_method')); // Using `_method` as the query parameter

// Static files
app.use(express.static('public'));

// Use checkAuth middleware on all routes
app.use(checkAuth);

// In server.js


// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', './views');
// Routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/payment', sslcommerzRoutes);
app.use('/sessions', sessionRoutes);

app.use('/email', emailRoutes);
app.use('/api/chat', chatRoutes); // Add chat API routes
////
app.use("/api/v1", complaintRouter);
app.use("/api/v1", postAndCommentRouter);
app.use("/api/v1", resourceRouter);

app.use(errorHandler);

// Initialize sockets with enhanced message handling
const enhancedSocketInit = (io) => {
    const connectedUsers = new Map();

    io.on('connection', async (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('join chat', async ({ userId }) => {
            try {
                socket.join(userId); // Join the user's own room
                io.emit('user connected', userId);
                connectedUsers.set(userId, {
                    socketId: socket.id,
                    online: true
                });

                const User = require('./models/User');
                const users = await User.find({}, 'username _id');
                const usersList = users.map(user => ({
                    userId: user._id.toString(),
                    username: user.username,
                    online: connectedUsers.has(user._id.toString())
                }));

                io.emit('users update', usersList);
            } catch (error) {
                console.error('Error in join chat:', error);
            }
        });

        socket.on('chat message', async (data) => {
            try {
                const Message = require('./models/Message');
                const newMessage = new Message({
                    from: data.from,
                    to: data.to,
                    message: data.message
                });

                const savedMessage = await newMessage.save();
                
                const messageData = {
                    ...data,
                    _id: savedMessage._id,
                    timestamp: savedMessage.timestamp,
                    isEdited: false
                };

                // Send to recipient if online
                const recipientSocketData = connectedUsers.get(data.to);
                if (recipientSocketData) {
                    io.to(recipientSocketData.socketId).emit('chat message', messageData);
                }

                // Confirm message saved to sender
                socket.emit('message saved', messageData);

            } catch (error) {
                console.error('Error saving message:', error);
                socket.emit('message error', { error: 'Failed to save message' });
            }
        });

        socket.on('disconnect', async () => {
            try {
                let disconnectedUserId = null;
                for (const [userId, data] of connectedUsers.entries()) {
                    if (data.socketId === socket.id) {
                        disconnectedUserId = userId;
                        break;
                    }
                }

                if (disconnectedUserId) {
                    connectedUsers.delete(disconnectedUserId);
                    
                    const User = require('./models/User');
                    const users = await User.find({}, 'username _id');
                    const usersList = users.map(user => ({
                        userId: user._id.toString(),
                        username: user.username,
                        online: connectedUsers.has(user._id.toString())
                    }));

                    io.emit('users update', usersList);
                }
            } catch (error) {
                console.error('Error in disconnect:', error);
            }
        });
    });
};

// Initialize sockets with enhanced functionality
initializeSockets(io);

// Error handling middleware
// Error handling middleware - add this before any routes
app.use((req, res, next) => {
    res.locals.error = null;
    next();
});

// 404 handler - add this after all your routes
app.use((req, res) => {
    res.status(404).render('error', { 
        error: 'Page not found' 
    });
});

// Error handler - add this at the very end of your server.js
app.use((err, req, res, next) => {
    console.error(err.stack);
    const errorMessage = process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'Internal Server Error';
    
    res.status(err.status || 500).render('error', { 
        error: errorMessage 
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', { error: 'Page not found' });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});