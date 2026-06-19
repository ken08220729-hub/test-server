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

let players = {};

io.on("connection", (socket) => {

    socket.on("choice", (choice) => {

        players[socket.id] = choice;

        let ids = Object.keys(players);

        if (ids.length >= 2) {

            let p1 = players[ids[0]];
            let p2 = players[ids[1]];

            let result = "";

            if (p1 === p2) {
                result = "平手";
            }
            else if (
                (p1 === "石頭" && p2 === "剪刀") ||
                (p1 === "剪刀" && p2 === "布") ||
                (p1 === "布" && p2 === "石頭")
            ) {
                result = "玩家1獲勝";
            }
            else {
                result = "玩家2獲勝";
            }

            io.emit("result", {
                p1,
                p2,
                result
            });

            players = {};
        }
    });

});

server.listen(process.env.PORT || 3000);
