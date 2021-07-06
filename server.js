const path = require("path");
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
const socketToAlias = {}; // socketToAlias[s] - username of the socket s

io.on('connection', socket => {
    // check for the room
    socket.on("check", roomID => {
        if (rooms[roomID] && rooms[roomID].length !== 0){
            socket.emit("yes");
        }
        else{
            socket.emit("no");
        }
    })

    socket.on("join room", payload => {
        const roomID = payload.room;
        const useralias = payload.userIdentity;
        if (rooms[roomID]) {
            rooms[roomID].push(socket.id);
        } else {
            rooms[roomID] = [socket.id];
        }
        socketToRoom[socket.id] = roomID;
        socketToAlias[socket.id] = useralias;
        const usersInThisRoom = rooms[roomID].filter(id => id !== socket.id);

        socket.emit("all other users", usersInThisRoom); // emiting all users except the one who is joining
    });

    socket.on("offer", payload => {
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID, userIdentity: payload.userIdentity });
    });

    socket.on("answer", payload => {
        io.to(payload.callerID).emit("answer", { signal: payload.signal, id: socket.id, userIdentity: payload.userIdentity });
    });

    socket.on('disconnect', () => {
        if (!socketToRoom[socket.id]) return;
        const roomID = socketToRoom[socket.id];
        const useralias = socketToAlias[socket.id];
        let room = rooms[roomID];
        if (room) {
            // remove this user(socket) from the room
            room = room.filter(id => id !== socket.id);
            rooms[roomID] = room;
            if (rooms[roomID].length === 0) delete rooms[roomID];
        }

        // remove this socket id from socketToRoom and socketToAlias collection
        delete socketToRoom[socket.id]; 
        delete socketToAlias[socket.id];

        // emit event to all other users 
        socket.broadcast.emit("user left", {id: socket.id, alias: useralias});
    });
});

// All other GET requests not handled before will return our React app
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, './client/build', 'index.html'));
});

server.listen(process.env.PORT || 8000);