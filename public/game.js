const socket = io("https://你的Render網址.onrender.com");

// ---------------- UI ----------------
const menu = document.getElementById("menu");
const status = document.getElementById("status");
const onlineText = document.getElementById("online");
const infoText = document.getElementById("info");

// ---------------- 玩家 ----------------
let playerName = "";
let canThrow = false;

// ---------------- Three.js ----------------
let scene, camera, renderer;
let ball;
let velocity = { x: 0, z: 0 };
let isDragging = false;
let startX = 0, startY = 0;

// 初始化3D
function init3D() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1320);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    camera.position.set(0, 5, 10);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 地板（球道）
    const floorGeo = new THREE.PlaneGeometry(10, 50);
    const floorMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // 球
    const ballGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const ballMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    ball = new THREE.Mesh(ballGeo, ballMat);

    ball.position.set(0, 0.5, 20);
    scene.add(ball);

    // 球瓶（簡化）
    for (let i = 0; i < 5; i++) {
        const pinGeo = new THREE.BoxGeometry(0.3, 1, 0.3);
        const pinMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        const pin = new THREE.Mesh(pinGeo, pinMat);
        pin.position.set((i - 2) * 1, 0.5, -10);
        scene.add(pin);
    }

    animate();
}

// 動畫
function animate() {
    requestAnimationFrame(animate);

    // 球移動
    ball.position.x += velocity.x;
    ball.position.z += velocity.z;

    // 摩擦
    velocity.x *= 0.98;
    velocity.z *= 0.98;

    renderer.render(scene, camera);
}

// 滑動控制（手機）
window.addEventListener("touchstart", (e) => {
    if (!canThrow) return;

    isDragging = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
});

window.addEventListener("touchend", (e) => {
    if (!canThrow) return;
    if (!isDragging) return;

    let dx = e.changedTouches[0].clientX - startX;
    let dy = e.changedTouches[0].clientY - startY;

    velocity.x = dx * 0.01;
    velocity.z = -dy * 0.02;

    socket.emit("throwBall", { dx, dy });

    canThrow = false;
});

// ---------------- Socket ----------------
socket.on("connect", () => {
    menu.style.display = "flex";
});

socket.on("onlineCount", (count) => {
    onlineText.innerText = count;
});

socket.on("waiting", () => {
    status.innerText = "等待玩家加入...";
});

socket.on("countdown", (num) => {
    status.innerText = "開始倒數：" + num;
});

socket.on("gameStart", () => {
    menu.style.display = "none";
    canThrow = true;
    init3D();
});

socket.on("roomStart", (data) => {
    infoText.innerText = "房間建立成功";
});

// ---------------- 匹配 ----------------
function startMatch() {

    playerName = document.getElementById("name").value;

    socket.emit("setName", playerName);

    socket.emit("match");

    status.innerText = "匹配中...";
}
