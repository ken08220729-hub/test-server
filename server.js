const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waiting = null;
let online = 0;

io.on("connection", (socket) => {

    online++;
    io.emit("online", online);

    // 🎯 匹配
    socket.on("match", () => {

        if (!waiting) {
            waiting = socket;
            socket.emit("waiting");
        } else {

            const room = "room_" + Date.now();

            const p1 = waiting;
            const p2 = socket;

            waiting = null;

            p1.join(room);
            p2.join(room);

            io.to(room).emit("matched", { room });

            let count = 3;

            const t = setInterval(() => {

                io.to(room).emit("countdown", count);

                count--;

                if (count < 0) {
                    clearInterval(t);
                    io.to(room).emit("start");
                }

            }, 1000);
        }
    });

    // 🎳 丟球同步
    socket.on("roll", (data) => {

        const room = Array.from(socket.rooms)[1];
        if (!room) return;

        io.to(room).emit("sync", {
            id: socket.id,
            power: data.power
        });
    });

    socket.on("disconnect", () => {
        online--;
        io.emit("online", online);

        if (waiting === socket) waiting = null;
    });

});

server.listen(process.env.PORT || 3000);
