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

// 在線人數
let onlinePlayers = 0;

// 暫存出拳
let players = {};

io.on("connection", (socket) => {

    console.log("玩家連線:", socket.id);

    // 在線人數+1
    onlinePlayers++;

    // 通知所有玩家
    io.emit("onlineCount", onlinePlayers);

    // 收到玩家出拳
    socket.on("choice", (choice) => {

        players[socket.id] = choice;

        console.log(socket.id + " 出了 " + choice);

        const ids = Object.keys(players);

        // 兩人都出拳後判定
        if (ids.length >= 2) {

            const p1 = players[ids[0]];
            const p2 = players[ids[1]];

            let result = "";

            if (p1 === p2) {

                result = "平手";

            } else if (
                (p1 === "石頭" && p2 === "剪刀") ||
                (p1 === "剪刀" && p2 === "布") ||
                (p1 === "布" && p2 === "石頭")
            ) {

                result = "玩家1獲勝";

            } else {

                result = "玩家2獲勝";

            }

            io.emit("result", {
                p1,
                p2,
                result
            });

            // 清空本局資料
            players = {};
        }

    });

    // 玩家離線
    socket.on("disconnect", () => {

        console.log("玩家離線:", socket.id);

        delete players[socket.id];

        onlinePlayers--;

        if (onlinePlayers < 0) {
            onlinePlayers = 0;
        }

        io.emit("onlineCount", onlinePlayers);

    });

});

// Render 使用 PORT
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("伺服器啟動成功 Port:", PORT);
});
