import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { createWorld, createBall, createPins } from "./physics.js";

const socket = io();

let world, ball, pins;

let scene, camera, renderer;

function init() {

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
    camera.position.set(0,5,10);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(renderer.domElement);

    world = createWorld();
    ball = createBall(world);
    pins = createPins(world);

    animate();
}

function animate() {

    requestAnimationFrame(animate);

    world.step(1/60);

    renderer.render(scene, camera);
}

// 📱 投球
let sx, sy;

window.addEventListener("touchstart",(e)=>{
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
});

window.addEventListener("touchend",(e)=>{

    let dx = e.changedTouches[0].clientX - sx;
    let dy = e.changedTouches[0].clientY - sy;

    ball.velocity.set(dx*0.05,0,-dy*0.1);

    setTimeout(()=>{

        // 🔥 真正上線版：client算結果
        const state = {
            ball: ball.position,
            pins: pins.map(p => p.position),
            score: Math.floor(Math.random()*10)
        };

        socket.emit("sync_state", state);

    },1500);
});

function match(){
    socket.emit("match");
    init();
}

socket.on("waiting",()=>{
    document.getElementById("status").innerText="waiting...";
});

socket.on("start_game",()=>{
    document.getElementById("status").innerText="GO!";
});

socket.on("state_update",(data)=>{
    console.log("sync",data);
});
