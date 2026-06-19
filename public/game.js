const socket = io();

let canPlay = false;

// ======================
// ✔ FIX：match 全域掛載
// ======================
function match() {
    socket.emit("match");
    document.getElementById("status").innerText = "匹配中...";
}

window.match = match;

// ======================
// socket events
// ======================

socket.on("online", (n) => {
    document.getElementById("online").innerText = n;
});

socket.on("waiting", () => {
    document.getElementById("status").innerText = "等待玩家...";
});

socket.on("matched", () => {
    document.getElementById("status").innerText = "匹配成功";
    document.getElementById("menu").style.display = "none";
});

socket.on("countdown", (n) => {

    const el = document.getElementById("countdown");
    el.style.display = "flex";
    el.innerText = n;

    if (n <= 0) el.style.display = "none";
});

socket.on("start", () => {
    document.getElementById("state").innerText = "遊戲開始";
    canPlay = true;
});

// ======================
// 🎳 丟球（簡化版）
// ======================

let sx, sy;

window.addEventListener("touchstart", (e) => {
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
});

window.addEventListener("touchend", (e) => {

    if (!canPlay) return;

    let dx = e.changedTouches[0].clientX - sx;
    let dy = e.changedTouches[0].clientY - sy;

    socket.emit("roll", {
        power: Math.sqrt(dx*dx + dy*dy)
    });
});
