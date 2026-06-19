const socket = io();

let scene, camera, renderer;
let ball;
let canThrow = false;

function init3D() {

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

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene,camera);
}

// 手機滑動
let sx,sy;

window.addEventListener("touchstart",(e)=>{
    if(!canThrow) return;
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
});

window.addEventListener("touchend",(e)=>{
    if(!canThrow) return;

    let dx = e.changedTouches[0].clientX - sx;
    let dy = e.changedTouches[0].clientY - sy;

    let power = Math.sqrt(dx*dx + dy*dy) * 0.01;

    socket.emit("roll", {
        power,
        offsetX: dx * 0.01
    });

    canThrow = false;
});

// socket
socket.on("turn",(data)=>{
    canThrow = socket.id === data.player;
});

socket.on("rollResult",(data)=>{
    console.log(data.msg);
});

socket.on("gameOver",(scores)=>{
    alert("遊戲結束");
});

// 啟動
init3D();
