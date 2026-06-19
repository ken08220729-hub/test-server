const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 儲存所有繪畫歷史紀錄，防止新進玩家或重整時畫面不同步
let drawingHistory = [];
let onlineCount = 0;

// 靜態檔案路由（如果未來想放網頁檔案，不影響現有測試）
app.use(express.static('public'));

io.on('connection', (socket) => {
    onlineCount++;
    console.log(`玩家連線，當前在線人數: ${onlineCount}`);
    
    // 1. 發送當前人數給所有人
    io.emit('update-room-info', { onlineCount });

    // 2. 新玩家連線時，立刻將過去所有的畫布紀錄打包發給他
    socket.emit('sync-history', drawingHistory);

    // 3. 監聽繪畫動作並即時廣播給其他玩家，同時存入歷史紀錄
    socket.on('draw-stroke', (strokeData) => {
        drawingHistory.push(strokeData);
        socket.broadcast.emit('server-draw', strokeData);
    });

    // 4. 清除畫布功能（備用）
    socket.on('clear-canvas', () => {
        drawingHistory = [];
        io.emit('server-clear');
    });

    // 5. 處理斷線
    socket.on('disconnect', () => {
        onlineCount = Math.max(0, onlineCount - 1);
        console.log(`玩家斷線，當前在線人數: ${onlineCount}`);
        io.emit('update-room-info', { onlineCount });
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`伺服器已在 Port ${PORT} 啟動`);
});
