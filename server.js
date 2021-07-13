require("dotenv").config();
const path = require("path");
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
const axios = require("axios");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const root = path.join(__dirname, 'client', 'build');
// Have Node serve the files for our built React app
app.use(express.static(root));
// All other GET requests not handled before will return our React app
app.get("*", (req, res) => {
	res.sendFile('index.html', { root });
});

const rooms = {}; // rooms[i] - users in room i
const socketToRoom = {}; // socketToRoom[s] - room in which s resides
const socketToAlias = {}; // socketToAlias[s] - username of the socket s
const chats = {}; // map from roomId to chatId
const adminUsername = {}; // map from chatId to chatAdmins username
const adminSocket = {}; // map from chatId to chatAdmins socket
const allowedUsersInRoom = {}; // list of allowed users in a room
const emails = {}; // email corr to socketRefs

io.on("connection", (socket) => {
	// check for the room

	// we map the email of the admin in this join room
	socket.on("join room", (payload) => {
		const roomID = payload.room;
		const useralias = payload.userIdentity;
		const email = payload.email; // uniquely distinguishes the user
		if (rooms[roomID]) {
			// this socket is not admin
			rooms[roomID].push(socket.id);
		} else {
			// this socket is admin
			rooms[roomID] = [socket.id];
			adminSocket[roomID] = socket.id;
			allowedUsersInRoom[roomID] = [email];
			emails[socket.id] = email;
		}
		socketToRoom[socket.id] = roomID;
		socketToAlias[socket.id] = useralias;
		const usersInThisRoom = rooms[roomID].filter((id) => id !== socket.id);

		socket.emit("all other users", usersInThisRoom); // emiting all users except the one who is joining
	});

	// map the email of other users in permission event
	socket.on("permission", (payload) => {
		const userAlias = payload.user;
		const roomId = payload.room;
		const email = payload.email;
		emails[socket.id] = email;

		const allowedUsers = allowedUsersInRoom[roomId];
		if (allowedUsers.includes(email)) {
			// allow directly
			socket.emit("no permit required");
		} else {
			io.to(adminSocket[roomId]).emit("permit?", {
				id: socket.id,
				userAlias: userAlias,
			});
		}
	});

	socket.on("permit status", (payload) => {
		if (payload.allowed) {
			// allow the user to enter into the meeting
			const roomID = socketToRoom[socket.id];
			// add this user to the list of trusted users
			allowedUsersInRoom[roomID].push(emails[payload.id]);
			io.to(payload.id).emit("allowed", chats[roomID]);
		} else {
			io.to(payload.id).emit("denied");
		}
	});

	socket.on("offer", (payload) => {
		io.to(payload.userToSignal).emit("user joined", {
			signal: payload.signal,
			callerID: payload.callerID,
			userIdentity: payload.userIdentity,
		});
	});

	socket.on("answer", (payload) => {
		io.to(payload.callerID).emit("answer", {
			signal: payload.signal,
			id: socket.id,
			userIdentity: payload.userIdentity,
		});
	});

	socket.on("disconnect", () => {
		if (!socketToRoom[socket.id]) return;
		const roomID = socketToRoom[socket.id];
		const useralias = socketToAlias[socket.id];
		let room = rooms[roomID];
		if (room) {
			// remove this user(socket) from the room
			room = room.filter((id) => id !== socket.id);
			rooms[roomID] = room;
			if (rooms[roomID].length === 0) {
				delete rooms[roomID];
				delete adminUsername[chats[roomID]];
				delete adminSocket[roomID];
				delete chats[roomID];
				delete allowedUsersInRoom[roomID];
			}
		}

		// remove this socket id from socketToRoom and socketToAlias collection
		delete socketToRoom[socket.id];
		delete socketToAlias[socket.id];
		delete emails[socket.id];

		// emit event to all other users
		socket.broadcast.emit("user left", { id: socket.id, alias: useralias });
	});
});

// Chat routes

// create a new user or check if exists
app.post("/create_user", async (req, res) => {
	try {
		let data = req.body;
		data["secret"] = process.env.USER_SECRET;
		const config = {
			method: "put", // get or create user
			url: "https://api.chatengine.io/users/",
			headers: {
				"PRIVATE-KEY": process.env.PROJECT_PRIVATE_KEY,
			},
			data: data,
		};
		const response = await axios(config); // send request using axios
		res.send(response.data);
	} catch (error) {
		res.send(error);
	}
});

// create a new chat
app.post("/create_chat", async (req, res) => {
	try {
		let data = req.body;
		const config = {
			method: "post", // get or create chat
			url: "https://api.chatengine.io/chats/",
			headers: {
				"Project-ID": process.env.PROJECT_ID,
				"User-Name": data.admin_username,
				"User-Secret": process.env.USER_SECRET,
			},
			data: data,
		};
		const response = await axios(config); // send request using axios
		res.send(response.data);
	} catch (error) {
		res.send(error);
	}
});

// delete a particuar chat
app.post("/delete_chat", async (req, res) => {
	try {
		const data = req.body;
		const config = {
			method: "delete", // delete chat
			url: `https://api.chatengine.io/chats/${data.chat_id}`,
			headers: {
				"Project-ID": process.env.PROJECT_ID,
				"User-Name": data.admin_username,
				"User-Secret": process.env.USER_SECRET,
			},
		};
		const response = await axios(config); // send request using axios
		res.send(response.data);
	} catch (error) {
		res.send(error);
	}
});

// add user to chat
app.post("/add_user", async (req, res) => {
	try {
		const data = req.body;
		const config = {
			method: "POST",
			url: `https://api.chatengine.io/chats/${data.chatId}/people/`,
			headers: {
				"Project-ID": process.env.PROJECT_ID,
				"User-Name": adminUsername[data.chatId], // chat admin
				"User-Secret": process.env.USER_SECRET,
			},
			data: {
				username: data.username,
			},
		};
		const response = await axios(config);
		res.send(response.data);
	} catch (error) {
		res.send(error);
	}
});

// fetch chat messages
app.post("/get_chat_msgs", async (req, res) => {
	try {
		const data = req.body;
		const roomId = data.room;
		const chatId = chats[roomId];
		const adminUser = adminUsername[chatId];

		const config = {
			method: "get",
			url: `https://api.chatengine.io/chats/${chatId}/messages/`,
			headers: {
				"Project-ID": process.env.PROJECT_ID,
				"User-Name": adminUser,
				"User-Secret": process.env.USER_SECRET,
			},
		};
		const response = await axios(config);
		res.send(response.data);
	} catch (error) {
		res.send(error);
	}
});

// post a new message to chat
app.post("/post_chat_msg", async (req, res) => {
	try {
		const data = req.body;
		const roomId = data.room;
		const chatId = chats[roomId];
		const sender_username = data.username;

		const config = {
			method: "post",
			url: `https://api.chatengine.io/chats/${chatId}/messages/`,
			headers: {
				"Project-ID": process.env.PROJECT_ID,
				"User-Name": sender_username,
				"User-Secret": process.env.USER_SECRET,
			},
			data: {
				text: data.text,
			},
		};
		response = await axios(config);
		res.send(response.data);
	} catch (error) {
		res.send(error);
	}
});

// validate new meeting creation
app.post("/new_meeting", (req, res) => {
	const data = req.body;
	const roomId = data.room;
	const chatId = data.chat;

	if (rooms[roomId]) {
		// new meeting not possible to create with this roomId
		res.send("failure");
	} else {
		// new meeting success
		chats[roomId] = chatId;
		adminUsername[chatId] = data.admin;
		res.send("success");
	}
});

// validate existing meeting creation
// if success, send a permission request to admin of the meeting
app.post("/existing_meeting", (req, res) => {
	const data = req.body;
	const roomId = data.room;

	if (rooms[roomId]) {
		// possible to join this room
		const data = {
			status: "success",
		};
		res.send(data);
	} else {
		// not possible to join this meet
		const data = {
			status: "failure",
		};
		res.send(data);
	}
});

// get secret keys
app.post("/get_secret", (_, res) => {
	const response = {
		secret: process.env.USER_SECRET,
		project: process.env.PROJECT_ID,
	};
	res.send(response);
});

server.listen(process.env.PORT || 8000);
