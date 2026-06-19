const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

// 提供 public 靜態檔案（很重要）
app.use(express.static("public"));

let onlinePlayers = 0;

// 等待配對隊列
let waitingPlayer = null;

// 房間資料
let rooms = {};

function createRoom(p1, p2) {

    const roomId = "room_" + Date.now();

    rooms[roomId] = {
        players: [p1.id, p2.id],
        names: {},
        scores: {
            [p1.id]: 0,
            [p2.id]: 0
        },
        round: 1,
        maxRounds: 10
    };

    p1.join(roomId);
    p2.join(roomId);

    io.to(roomId).emit("roomStart", {
        roomId,
        players: [p1.id, p2.id],
        round: 1
    });

    // 3秒倒數開始
    let count = 3;

    const timer = setInterval(() => {

        io.to(roomId).emit("countdown", count);

        count--;

        if (count < 0) {

            clearInterval(timer);

            io.to(roomId).emit("gameStart", {
                firstPlayer: Math.random() > 0.5 ? p1.id : p2.id
            });

        }

    }, 1000);
}

io.on("connection", (socket) => {

    onlinePlayers++;
    io.emit("onlineCount", onlinePlayers);

    // 玩家設定名稱
    socket.on("setName", (name) => {
        socket.data.name = name;
    });

    // 配對
    socket.on("match", () => {

        if (waitingPlayer === null) {

            waitingPlayer = socket;
            socket.emit("waiting");

        } else {

            const opponent = waitingPlayer;
            waitingPlayer = null;

            createRoom(opponent, socket);
        }
    });

    // 投球（之後3D會用）
    socket.on("throwBall", (data) => {

        const roomId = Array.from(socket.rooms)[1];

        if (!roomId) return;

        io.to(roomId).emit("ballUpdate", {
            id: socket.id,
            data
        });
    });

    // 離線
    socket.on("disconnect", () => {

        onlinePlayers--;
        io.emit("onlineCount", onlinePlayers);

        if (waitingPlayer === socket) {
            waitingPlayer = null;
        }
    });

});

server.listen(process.env.PORT || 3000, () => {
    console.log("Server running");
});
