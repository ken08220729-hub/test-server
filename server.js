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

let count = 0;

io.on("connection", (socket) => {
    console.log("玩家連線:", socket.id);

    // 進來先送目前數字
    socket.emit("update", count);

    // 玩家按 +1
    socket.on("add", () => {
        count++;
        io.emit("update", count); // 全部同步
    });

    socket.on("disconnect", () => {
        console.log("離開:", socket.id);
    });
});

server.listen(process.env.PORT || 3000, () => {
    console.log("Server running");
});
