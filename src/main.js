import * as THREE from '../libs/three_js/three.module.js';
import * as TWEEN from '../libs/tweenjs/tween.esm.js';
import { GUI } from '../libs/human_interface/dat.gui.module.js';
import Stats from '../libs/human_interface/stats.module.js';

import { CameraMover } from './cameraMover.js';
import { GUIHandler } from '../GUIHandler.js';
let canvas, camera, scene, renderer, pixelRatio, width, height, stats, guiHandler, cameraMover;

let options =
{
    frames: 3,          //Number of free frames in the buffer
    pages: 10,           //Number of pages composing the relation
}
let maxPerLine = 10

let relation, frames, runs, currentFrames, currentFramesObject, currentRunsObject;
let currentRun = 0;
runs = [[]];
let started = false;
let tweenGroup = new TWEEN.Group();
const size = 1.0

init();
render();

function init() {
    //GUIHandler
    guiHandler = new GUIHandler(setOptions, start)
    //Container
    const container = document.createElement('div');
    document.body.appendChild(container);
    canvas = document.querySelector('#canvas');
    //Renderer
    pixelRatio = window.devicePixelRatio;
    width = canvas.clientWidth * pixelRatio | 0;
    height = canvas.clientHeight * pixelRatio | 0;
    renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(width, height, false);
    renderer.shadowMap.enabled = true;
    //Camera

    const fov = 36;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.25;
    const far = 200;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    cameraMover = new CameraMover(camera, renderer.domElement)

    //Stats
    stats = new Stats();
    container.appendChild(stats.dom);

    //Scene, Lights, Object
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const spotLight = new THREE.SpotLight(0xffffff, 0.6);
    spotLight.angle = Math.PI / 5;
    spotLight.penumbra = 0.2;
    spotLight.position.set(2, 3, 3);
    spotLight.castShadow = true;
    spotLight.shadow.camera.near = 3;
    spotLight.shadow.camera.far = 10;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    //scene.add(spotLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(0, 3, 0);
    dirLight.castShadow = true;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 10;

    dirLight.shadow.camera.right = 1;
    dirLight.shadow.camera.left = - 1;
    dirLight.shadow.camera.top = 1;
    dirLight.shadow.camera.bottom = - 1;

    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    //Secondary storage's cylinder
    const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 2, 32);
    const cylinderMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        side: THREE.DoubleSide
    });
    let cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.position.set(0, 0, 0)
    scene.add(cylinder);

    const axesHelper = new THREE.AxesHelper(15);
    scene.add(axesHelper);
    window.addEventListener('resize', onWindowResize);


}
function start() {
    if (!started) {
        started = true

        //generateRelation()
        //cameraMover.rotateToBuffer()
        createFrames()
        createRelation()
    }
    else {
        movePagesToFrame(function () {
            //setupRelationScan((function () {
            //updateFrames()
            setupCreateRuns()
            //}))

        })

    }

}
function updateFrames() {         //  create a loop function
    setTimeout(function () {   //  call a 1s setTimeout when the loop is called
        let index = Math.floor(Math.random() * (options.frames - 1));
        console.log(options)
        if (options.pages - options.frames < 0) {
            while (index < (options.frames - options.pages - 1)) {
                index = Math.floor(Math.random() * (options.frames - 1));
            }
        }

        currentFrames[index] += 0.1
        currentFrames[currentFrames.length - 1] += 0.1
        updateRuns(index)                  //  increment the counter
        if (!checkRuns()) {           //  if the counter < 10, call the loop function
            updateFrames();             //  ..  again which will trigger another 
        }                      //  ..  setTimeout()
        else {
            if (currentFrames[currentFrames.length - 1] >= 0.95) {
                moveOutput(function () {
                    updateFrames()
                }
                )
            }
            else {
                updateFrames()

                console.log("ELSEE")
            }
        }
    }, 150)
}


function checkRuns() {
    for (let i = 0; i < currentFrames.length; i++) {
        if (currentFrames[i] >= 0.95) {
            return true
        }
    }
    return false
}
function setOptions(frames, pages) {
    options.frames = frames
    options.pages = pages
}
function createFrames() {
    frames = new THREE.Group();

    const material = new THREE.MeshPhongMaterial({
        color: 0x5050ff,
        side: THREE.DoubleSide,
    });

    const geometry = new THREE.BoxGeometry(size, size, size);
    for (let z = 0; z < options.frames; z++) {

        const mesh = new THREE.Mesh(geometry, material);
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.MeshPhongMaterial({
            color: 0x000000,
            emissive: 0x000000,
            side: THREE.DoubleSide,

        }));
        mesh.add(edges)
        mesh.position.set(0.0, 0.0, 2 + 1.5 * size * z);
        
        frames.add(mesh);
    }/*
    let mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
        color: 0xffae00,
        side: THREE.DoubleSide,
    }));
    let edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.MeshPhongMaterial({
        color: 0x000000,
        emissive: 0x000000,
        side: THREE.DoubleSide,

    }));
    mesh.add(edges)
    mesh.position.set(0.0, 0.0, 2 + 1.5 * size * (options.frames - 1));
    
    frames.add(mesh);*/
    scene.add(frames);
}
function createRelation() {
    let oldRelation;
    for (let i = 0; i < scene.children.length; i++) {
        if (scene.children[i].name == "relation") {
            oldRelation = scene.children[i]
        }
    }
    if (oldRelation) {
        scene.remove(oldRelation)

    }

    relation = new THREE.Group();

    const material = new THREE.MeshPhongMaterial({
        color: 0x505050,
        side: THREE.DoubleSide,
    });

    const geometry = new THREE.BoxGeometry(size, size, size);
    let y = 7 + 1.25 * size;
    let x = 0;
    let middlePositions = []
    let finalPositions = []
    for (let count = 0; count < options.pages; count++) {
        if (count % maxPerLine == 0) {
            x = 0
            y += -1.25 * size
        }
        const mesh = new THREE.Mesh(geometry, material);
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.MeshPhongMaterial({
            color: 0x000000,
            emissive: 0x000000,
            side: THREE.DoubleSide,

        }));
        mesh.add(edges)
        middlePositions.push(new THREE.Vector3(0.0, y, 0.0))
        finalPositions.push(new THREE.Vector3(1.1 * size * (maxPerLine - x), y, 0.0))
        // mesh.position.set(2 + 1.1 * size * x, y, 0);
        mesh.position.set(0, 0, 0)
        
        relation.add(mesh);
        x++
    }
    let tweens1 = []
    let maxtime = 0//1000
    let time = maxtime / 2
    for (let i = 0; i < relation.children.length; i++) {
        tweens1.push(new TWEEN.Tween(relation.children[i].position, tweenGroup).to(middlePositions[i], time))
    }
    for (let i = 0; i < tweens1.length; i++) {
        time = maxtime * ((maxPerLine - (i % maxPerLine)) / maxPerLine)
        if (i < tweens1.length - 1) {
            tweens1[i].chain(tweens1[i + 1])
        }
        tweens1[i].onComplete(() => {
            let tween = new TWEEN.Tween(relation.children[i].position, tweenGroup).to(finalPositions[i], time)
            tween.start()
        })
    }
    tweens1[0].start()
    relation.name = "relation"
    scene.add(relation);
}
function setupRelationScan(callback) {  //Step i (?)
    currentFramesObject = new THREE.Group();
    const material = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        side: THREE.DoubleSide,
    });

    const geometry = new THREE.BoxGeometry(size, size, size);
    for (let z = 0; z < options.frames - 1; z++) {
        const mesh = new THREE.Mesh(geometry, material);
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.MeshPhongMaterial({
            color: 0x000000,
            emissive: 0x000000,
            side: THREE.DoubleSide,

        }));
        mesh.add(edges)
        mesh.position.set(0.0, (currentFrames[z] - 1.0) / 2, 2 + 1.5 * size * z);
        mesh.scale.set(1, currentFrames[z], 1)
        
        currentFramesObject.add(mesh);
    }
    let mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
    }))
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.MeshPhongMaterial({
        color: 0x000000,
        emissive: 0x000000,
        side: THREE.DoubleSide,

    }));
    mesh.add(edges)
    mesh.position.set(0.0, 0.0, 2 + 1.5 * size * (options.frames - 1));
    mesh.scale.set(1, currentFrames[currentFrames.length - 1], 1)
    
    currentFramesObject.add(mesh);
    scene.add(currentFramesObject);
    callback()
}
function setupCreateRuns() { //Step 0
    currentFramesObject = new THREE.Group();
    const material = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        side: THREE.DoubleSide,
    });

    const geometry = new THREE.BoxGeometry(size, size, size);
    for (let z = 0; z < options.frames; z++) {
        const mesh = new THREE.Mesh(geometry, material);
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.MeshPhongMaterial({
            color: 0x000000,
            emissive: 0x000000,
            side: THREE.DoubleSide,

        }));
        mesh.add(edges)
        mesh.position.set(0.0, (currentFrames[z] - 1.0) / 2, 2 + 1.5 * size * z);
        mesh.scale.set(1, currentFrames[z], 1)
        
        currentFramesObject.add(mesh);
    }
    scene.add(currentFramesObject);
    currentRunsObject = new THREE.Group();
    for (let i = 0; i < options.pages / options.frames; i++) {
        const mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide
        }))
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.MeshPhongMaterial({
            color: 0x000000,
            emissive: 0x000000,
            side: THREE.DoubleSide,

        }));
    }
    createRuns()
}
function createRuns() {         //STEP 0
    setTimeout(function () {   //  call a 0.15s setTimeout when the loop is called
        let index = Math.floor(Math.random() * (options.frames));
        let fullFrames = 0;
        for (let i = 0; i < options.frames; i++) {
            if (currentFrames[i] > 0.95) {
                fullFrames++
            }
        }
        if (fullFrames == options.frames) {
            console.log("FULL")
            for (let i = 0; i < options.frames; i++) {

                currentFrames[i] = 1.0
                currentFramesObject.children[i].scale.set(1, currentFrames[i], 1)
                currentFramesObject.children[i].position.set(0.0, (currentFrames[i] - 1.0) / 2, 2 + 1.5 * size * i);
            }
            //Load new pages
        }
        else {
            console.log("Not Full")
            while (currentFrames[index] > 0.95) {
                index = Math.floor(Math.random() * (options.frames - 1));
            }
            currentFrames[index] += 0.1
            currentFramesObject.children[index].scale.set(1, currentFrames[index], 1)
            currentFramesObject.children[index].position.set(0.0, (currentFrames[index] - 1.0) / 2, 2 + 1.5 * size * index);
            createRuns()
        }
    }, 150)
}
function updateRuns(index) {
    currentFramesObject.children[index].scale.set(1, currentFrames[index], 1)
    currentFramesObject.children[index].position.set(0.0, (currentFrames[index] - 1.0) / 2, 2 + 1.5 * size * index);

    currentFramesObject.children[options.frames - 1].scale.set(1, currentFrames[currentFrames.length - 1], 1)
    currentFramesObject.children[options.frames - 1].position.set(0.0, (currentFrames[currentFrames.length - 1] - 1.0) / 2, 2 + 1.5 * size * (options.frames - 1));

}
function movePagesToFrame(callback) {
    let tweens = []
    let time = 500
    currentFrames = []
    for (let i = 0; i < options.frames; i++) {
        currentFrames.push(0)
    }
    for (let i = 0; i < options.frames && i < options.pages; i++) {
        tweens.push(new TWEEN.Tween(relation.children[relation.children.length - 1 - i].position, tweenGroup).to(new THREE.Vector3(frames.children[i].position.x, relation.children[relation.children.length - 1 - i].position.y, 0), time))
    }
    for (let i = 0; i < options.frames && i < options.pages; i++) {
        if (i < tweens.length - 1) {
            tweens[i].chain(tweens[i + 1])
        }
        tweens[i].onComplete(() => {
            let tween = new TWEEN.Tween(relation.children[relation.children.length - 1 - i].position, tweenGroup).to(new THREE.Vector3(frames.children[frames.children.length - 1 - i].position.x, relation.children[relation.children.length - 1 - i].position.y, frames.children[frames.children.length - 1 - i].position.z), time)
            tween.onComplete(() => {
                let tween2 = new TWEEN.Tween(relation.children[relation.children.length - 1 - i].position, tweenGroup).to(frames.children[frames.children.length - 1 - i].position, time)
                if (!((i + 1) < options.frames && (i + 1) < options.pages)) {
                    tween2.onComplete(() => {
                        callback()
                    })
                }
                tween2.start()
            })
            tween.start()
        })
    }

    tweens[0].start()
}
function moveOutput(callback) {
    let time = 1000
    if (runs[runs.length - 1].length == options.frames - 1) {
        runs.push([])
    }
    let finalX = 1.1 * size * (maxPerLine - (runs[runs.length - 1]).length)
    let finalY = 7 + 1.25 * size
    let finalZ = 18


    for (let i = 0; i < runs.length; i++) {
        if (runs[i].length == options.frames - 1) {
            console.log(i, runs[i])
            finalY += -1.25 * size
        }
    }
    runs[runs.length - 1].push(currentFramesObject.children[currentFramesObject.children.length - 1].clone())
    scene.add(runs[runs.length - 1][(runs[runs.length - 1]).length - 1])
    let tween = new TWEEN.Tween(runs[runs.length - 1][(runs[runs.length - 1]).length - 1].position, tweenGroup).to(new THREE.Vector3(runs[runs.length - 1][(runs[runs.length - 1]).length - 1].position.x, finalY, runs[runs.length - 1][(runs[runs.length - 1]).length - 1].position.z), time)

    tween.onStart(() => {
        currentFrames[currentFrames.length - 1] = 0
        currentFramesObject.children[currentFramesObject.children.length - 1].scale.set(1, currentFrames[currentFrames.length - 1], 1)
        callback()
    })
    let tween2 = new TWEEN.Tween(runs[runs.length - 1][(runs[runs.length - 1]).length - 1].position, tweenGroup).to(new THREE.Vector3(runs[runs.length - 1][(runs[runs.length - 1]).length - 1].position.x, finalY, finalZ), time)

    let tween3 = new TWEEN.Tween(runs[runs.length - 1][(runs[runs.length - 1]).length - 1].position, tweenGroup).to(new THREE.Vector3(finalX, finalY, finalZ), time)
    tween.chain(tween2)
    tween2.chain(tween3)
    tween.start()
}

function onWindowResize() {
    width = canvas.clientWidth * pixelRatio | 0;
    height = canvas.clientHeight * pixelRatio | 0;
    canvas = renderer.domElement;
    renderer.setSize(width, height, false);
    cameraMover.windowResize(window.innerWidth / window.innerHeight)

}

function render() {
    renderer.render(scene, camera);
    requestAnimationFrame(render);
    stats.update();
    cameraMover.update();
    tweenGroup.update()
}
