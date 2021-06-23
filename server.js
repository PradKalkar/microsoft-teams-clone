const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, './client/build')));

const rooms = {}; // rooms[i] - users in room i
const socketToRoom = {}; // socketToRoom[s] - room in which s resides

io.on('connection', socket => {
    socket.on("join room", roomID => {
        if (rooms[roomID]) {
            const length = rooms[roomID].length;
            if (length === 4) {
                socket.emit("room full");
                return;
            }
            rooms[roomID].push(socket.id);
        } else {
            rooms[roomID] = [socket.id];
        }
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = rooms[roomID].filter(id => id !== socket.id);

        socket.emit("all other users", usersInThisRoom); // emiting all users except the one who is joining
    });

    socket.on("offer", payload => {
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("answer", payload => {
        io.to(payload.callerID).emit("answer", { signal: payload.signal, id: socket.id });
    });

    socket.on('disconnect', () => {
        const roomID = socketToRoom[socket.id];
        let room = rooms[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id); // remove this user(socket) from the room
            rooms[roomID] = room;
        }
        delete socketToRoom[socket.id]; // remove this socket id from socketToRoom collection

        // emit event to all other users (? within the same room)
        socket.broadcast.emit("user left", socket.id);
    });

});

// All other GET requests not handled before will return our React app
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, './client/build', 'index.html'));
});

server.listen(process.env.PORT || 8000);