const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static("public"));

let onlinePlayers = 0;
let waiting = null;
let rooms = {};

// 計算球瓶倒數（簡化物理）
function calculatePins(power, offsetX) {

    let base = Math.floor(power * 5);
    let bias = Math.abs(offsetX) * 3;

    let result = Math.max(0, Math.min(10, base - bias));

    return result;
}

// 下一回合
function nextTurn(roomId) {

    const room = rooms[roomId];

    if (!room) return;

    room.turn++;

    if (room.turn >= room.players.length) {
        room.turn = 0;
        room.frame++;
    }

    if (room.frame > 10) {

        io.to(roomId).emit("gameOver", room.scores);
        return;
    }

    const pid = room.players[room.turn];

    room.timer = 20;
    room.rollCount = 0;

    io.to(roomId).emit("turn", {
        player: pid,
        frame: room.frame,
        scores: room.scores,
        timer: room.timer
    });

    const interval = setInterval(() => {

        room.timer--;

        io.to(roomId).emit("timer", room.timer);

        if (room.timer <= 0) {

            clearInterval(interval);

            room.scores[pid] += 0;

            nextTurn(roomId);
        }

    }, 1000);
}

// 建立房間
function createRoom(a, b) {

    const id = "room_" + Date.now();

    rooms[id] = {
        players: [a.id, b.id],
        scores: {
            [a.id]: 0,
            [b.id]: 0
        },
        frame: 1,
        turn: 0,
        rollCount: 0
    };

    a.join(id);
    b.join(id);

    let count = 3;

    const t = setInterval(() => {

        io.to(id).emit("countdown", count);

        count--;

        if (count < 0) {

            clearInterval(t);

            nextTurn(id);
        }

    }, 1000);
}

io.on("connection", (socket) => {

    onlinePlayers++;
    io.emit("onlineCount", onlinePlayers);

    socket.on("match", () => {

        if (!waiting) {
            waiting = socket;
            socket.emit("waiting");
        } else {
            createRoom(waiting, socket);
            waiting = null;
        }
    });

    // 丟球結果
    socket.on("roll", ({ power, offsetX }) => {

        const roomId = Array.from(socket.rooms)[1];
        if (!roomId) return;

        const room = rooms[roomId];
        if (!room) return;

        const pins = calculatePins(power, offsetX);

        room.scores[socket.id] += pins;

        let msg = "投球 " + pins + " 瓶";

        if (pins === 10) msg = "STRIKE！🔥";

        io.to(roomId).emit("rollResult", {
            player: socket.id,
            pins,
            scores: room.scores,
            msg
        });

        if (pins === 10) {
            nextTurn(roomId);
        }
    });

    socket.on("disconnect", () => {

        onlinePlayers--;
        io.emit("onlineCount", onlinePlayers);

        if (waiting === socket) waiting = null;
    });

});

server.listen(process.env.PORT || 3000);
