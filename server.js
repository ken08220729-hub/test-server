const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let drawingHistory = [];
let onlineCount = 0;

app.use(express.static('public'));

io.on('connection', (socket) => {
    onlineCount++;
    io.emit('update-room-info', { onlineCount });
    
    // 同步歷史紀錄給新進玩家
    socket.emit('sync-history', drawingHistory);

    socket.on('draw-stroke', (strokeData) => {
        drawingHistory.push(strokeData);
        socket.broadcast.emit('server-draw', strokeData);
    });

    socket.on('clear-canvas', () => {
        drawingHistory = [];
        io.emit('server-clear');
    });

    socket.on('disconnect', () => {
        onlineCount = Math.max(0, onlineCount - 1);
        io.emit('update-room-info', { onlineCount });
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`伺服器運行於 port ${PORT}`));
