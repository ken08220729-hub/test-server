const socket = io();

let scene, camera, renderer;
let ball;
let pins = [];
let canThrow = false;
let roomScores = {};
let myScore = 0;

// --- 3D ---
function init() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1320);

    camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
    camera.position.set(0,5,10);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(renderer.domElement);

    // 球
    ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.5),
        new THREE.MeshBasicMaterial({ color: "red" })
    );
    ball.position.set(0,0.5,5);
    scene.add(ball);

    // 球瓶
    for(let i=0;i<5;i++){
        let pin = new THREE.Mesh(
            new THREE.BoxGeometry(0.3,1,0.3),
            new THREE.MeshBasicMaterial({ color:"white" })
        );
        pin.position.set((i-2)*0.6,0.5,-5);
        pins.push(pin);
        scene.add(pin);
    }

    animate();
}

function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene,camera);
}

// --- 手指丟球 ---
let startX=0,startY=0;

window.addEventListener("touchstart",(e)=>{
    if(!canThrow) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
});

window.addEventListener("touchend",(e)=>{
    if(!canThrow) return;

    let dx = e.changedTouches[0].clientX - startX;
    let dy = e.changedTouches[0].clientY - startY;

    let power = Math.sqrt(dx*dx + dy*dy) * 0.01;

    ball.position.z -= power * 2;

    // 👉 簡化倒瓶算法
    let pinsDown = Math.floor(Math.random()*5);

    socket.emit("ballResult",{ pinsDown, power });

    canThrow = false;
});

// --- socket ---
socket.on("onlineCount",v=>{
    document.getElementById("online").innerText = v;
});

socket.on("waiting",()=>{
    document.getElementById("status").innerText="等待玩家";
});

socket.on("countdown",(n)=>{
    document.getElementById("status").innerText="開始："+n;
});

socket.on("nextTurn",(data)=>{
    canThrow = socket.id === data.player;

    document.getElementById("timer").innerText = data.timer;
    document.getElementById("score").innerText = data.scores[socket.id]||0;
});

socket.on("scoreUpdate",(s)=>{
    roomScores = s;
});

socket.on("gameOver",(s)=>{
    alert("遊戲結束");
});

function match(){
    socket.emit("match");
    init();
}
