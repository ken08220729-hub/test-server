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

// 在線玩家數
let onlinePlayers = 0;

// 本局出拳資料
let players = {};

// 更新遊戲狀態
function updateStatus() {

    if (onlinePlayers < 2) {

        io.emit("status", "等待玩家加入...");

    } else {

        io.emit("status", "請出拳");

    }

}

io.on("connection", (socket) => {

    console.log("玩家連線:", socket.id);

    onlinePlayers++;

    io.emit("onlineCount", onlinePlayers);

    updateStatus();

    // 玩家出拳
    socket.on("choice", (choice) => {

        players[socket.id] = choice;

        console.log(socket.id + " 出了 " + choice);

        const ids = Object.keys(players);

        // 兩人都出拳
        if (ids.length >= 2) {

            const p1 = players[ids[0]];
            const p2 = players[ids[1]];

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

            // 清空資料準備下一局
            players = {};

            setTimeout(() => {

                updateStatus();

            }, 3000);

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

        updateStatus();

    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

    console.log("伺服器啟動成功 Port:", PORT);

});
