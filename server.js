const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.static("public"));

let onlinePlayers = 0;
let waitingPlayer = null;
let rooms = {};

function nextTurn(roomId) {

    const room = rooms[roomId];
    if (!room) return;

    room.turnIndex++;

    if (room.turnIndex >= room.players.length) {
        room.turnIndex = 0;
        room.round++;
    }

    if (room.round > 10) {

        io.to(roomId).emit("gameOver", room.scores);
        return;
    }

    const currentPlayer = room.players[room.turnIndex];

    room.timer = 20;

    io.to(roomId).emit("nextTurn", {
        player: currentPlayer,
        round: room.round,
        scores: room.scores,
        timer: room.timer
    });

    const interval = setInterval(() => {

        room.timer--;

        io.to(roomId).emit("timer", room.timer);

        if (room.timer <= 0) {

            clearInterval(interval);

            room.scores[currentPlayer] += 0;

            nextTurn(roomId);
        }

    }, 1000);
}

function createRoom(p1, p2) {

    const roomId = "room_" + Date.now();

    rooms[roomId] = {
        players: [p1.id, p2.id],
        scores: {
            [p1.id]: 0,
            [p2.id]: 0
        },
        round: 1,
        turnIndex: 0
    };

    p1.join(roomId);
    p2.join(roomId);

    let count = 3;

    const t = setInterval(() => {

        io.to(roomId).emit("countdown", count);

        count--;

        if (count < 0) {

            clearInterval(t);

            nextTurn(roomId);
        }

    }, 1000);
}

io.on("connection", (socket) => {

    onlinePlayers++;
    io.emit("onlineCount", onlinePlayers);

    socket.on("match", () => {

        if (!waitingPlayer) {
            waitingPlayer = socket;
            socket.emit("waiting");
        } else {
            createRoom(waitingPlayer, socket);
            waitingPlayer = null;
        }
    });

    // 球結果（由前端算簡化碰撞）
    socket.on("ballResult", ({ pinsDown, power }) => {

        const roomId = Array.from(socket.rooms)[1];
        if (!roomId) return;

        const room = rooms[roomId];
        if (!room) return;

        room.scores[socket.id] += pinsDown;

        io.to(roomId).emit("scoreUpdate", room.scores);

        nextTurn(roomId);
    });

    socket.on("disconnect", () => {

        onlinePlayers--;
        io.emit("onlineCount", onlinePlayers);

        if (waitingPlayer === socket) {
            waitingPlayer = null;
        }
    });
});

server.listen(process.env.PORT || 3000);
