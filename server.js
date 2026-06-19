const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waiting = null;
let rooms = {};

// 🎯 建立房間
function createRoom(a, b) {

    const roomId = "room_" + Date.now();

    rooms[roomId] = {
        players: [a.id, b.id],
        state: {
            ball: { x:0, y:0, z:0 },
            pins: [],
            scores: {}
        }
    };

    rooms[roomId].state.scores[a.id] = 0;
    rooms[roomId].state.scores[b.id] = 0;

    a.join(roomId);
    b.join(roomId);

    io.to(roomId).emit("room_ready", { roomId });

    let count = 3;

    const t = setInterval(() => {

        io.to(roomId).emit("countdown", count);

        count--;

        if (count < 0) {
            clearInterval(t);

            io.to(roomId).emit("start_game");
        }

    }, 1000);
}

io.on("connection", (socket) => {

    socket.on("match", () => {

        if (!waiting) {
            waiting = socket;
            socket.emit("waiting");
        } else {
            createRoom(waiting, socket);
            waiting = null;
        }
    });

    // 🎯 同步物理結果（client算完）
    socket.on("sync_state", (data) => {

        const roomId = Array.from(socket.rooms)[1];
        const room = rooms[roomId];

        if (!room) return;

        room.state = data;

        io.to(roomId).emit("state_update", data);
    });

});

server.listen(process.env.PORT || 3000);
