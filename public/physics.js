import * as CANNON from "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js";

export function createWorld() {

    const world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -9.82, 0)
    });

    world.broadphase = new CANNON.SAPBroadphase(world);
    world.allowSleep = true;

    return world;
}

export function createBall(world) {

    const ball = new CANNON.Body({
        mass: 5,
        shape: new CANNON.Sphere(0.5),
        material: new CANNON.Material()
    });

    ball.position.set(0, 1, 5);

    world.addBody(ball);

    return ball;
}

export function createPins(world) {

    const pins = [];

    for (let i = 0; i < 10; i++) {

        const pin = new CANNON.Body({
            mass: 1,
            shape: new CANNON.Box(new CANNON.Vec3(0.15,0.5,0.15))
        });

        pin.position.set((i%5)-2, 0.5, -6-(Math.floor(i/5)));

        world.addBody(pin);
        pins.push(pin);
    }

    return pins;
}
