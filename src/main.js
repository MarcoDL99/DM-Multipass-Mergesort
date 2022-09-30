import * as THREE from '../libs/three_js/three.module.js';
import * as TWEEN from '../libs/tweenjs/tween.esm.js';
import { GUI } from '../libs/human_interface/dat.gui.module.js';
import { OrbitControls } from '../libs/human_interface/OrbitControls.js';
import Stats from '../libs/human_interface/stats.module.js';
import { ColorGUIHelper } from './utils/colorGUIHelper.js';
let canvas, camera, scene, renderer, pixelRatio, width, height, stats, gui;

let options =
{
    frames: 100,          //Number of free frames in the buffer
    tuplesPerFrame: 100,  //Number of tuples fitting one frame in the buffer
    pages: 100,           //Number of pages composing the relation
    tuples: 100000       //Number of tuples  of the relation
}

let relation, frames

init();
render();
function init() {
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

    const fov = 45;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 8000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 0, 5000);

    // CONTROLS ------------------------------------------------------------------
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 100, 0);
    controls.update();


    //Stats
    stats = new Stats();
    container.appendChild(stats.dom);
    //Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x505050);

    window.addEventListener('resize', onWindowResize);
    gui = new GUI({
        width: 500,
    });
    let folder = gui.addFolder("Buffer Options")
    folder.add(options, 'frames', 1.0, 100.0, 1.0).name("Number of free frames")
    //    folder.add(options, 'tuplesPerFrame', 1.0, 100.0, 1.0).name("Tuples fiting in one frame")
    folder.open()
    folder = gui.addFolder("Relation Options")

    folder.add(options, 'pages', 1.0, 100.0, 1.0).name("Number of pages")
    folder.add(options, 'tuples', 1.0, 100000.0, 1.0).name("Total number of tuples in the relation")
    folder.open()
    var obj = {
        start: function () {
            start()
        }
    };

    gui.add(obj, 'start').name("CLICK HERE TO START ANIMATION");
    console.log(gui.__folders["Relation Options"])

}
function start() {
    console.log(options)
    //GUI.toggleHide();
    generateRelation()
    createRuns()
}



function generateRelation() {
    relation = []
    frames = []
    let tuples = []
    for (let i = 0; i < options.tuples; i++) {
        tuples[i] = i
    }
    tuples = shuffle(tuples)

    var k = 0, i = 0;
    const tuplesPerPage = Math.ceil(options.tuples / options.pages);
    const remainderFinalPage = options.tuples % options.pages
    while (k < options.pages) {
        relation[k] = []
        while (i < (k + 1) * tuplesPerPage) {

            if (!isNaN(tuples[i])) {
                relation[k].push(tuples[i])
            }
            i++
        }
        k++
    }
    console.log(relation)
}

function createRuns() { //Step 0
    var i = 0, j = 0, k = 0, runs = [], tuples = []

    while (i < options.pages) {
        frames = []
        j = 0
        while (j < options.frames) {
            frames[j] = []
            if (relation[i]) {

                for (var number of relation[i]) {
                    frames[j].push(number)
                }
                //console.log(relation[i], frames[j])            
            }
            i++
            j++
        }
        runs[k] = sortArrays(frames)
        k++
    }
    console.log(runs)
}

function shuffle(array) { //Fisher–Yates Shuffle. Source: https://bost.ocks.org/mike/shuffle/
    var m = array.length, t, i;

    // While there remain elements to shuffle…
    while (m) {

        // Pick a remaining element…
        i = Math.floor(Math.random() * m--);

        // And swap it with the current element.
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }

    return array;
}
function sortArrays(array) {
    var values = []
    for (let i = 0; i < array.length; i++) {
        values = values.concat(array[i])
    }
    console.log(values)
    values = mergeSort(values)
    var k = 1, arrays = []
    while (k * options.tuplesPerFrame < values.length) {
        arrays.push(values.slice(options.tuplesPerFrame * (k-1), options.tuplesPerFrame * k))
        k++
    }
    return arrays
}
function merge(left, right) {
    let arr = []
    // Break out of loop if any one of the array gets empty
    while (left.length && right.length) {
        // Pick the smaller among the smallest element of left and right sub arrays 
        if (left[0] < right[0]) {
            arr.push(left.shift())
        } else {
            arr.push(right.shift())
        }
    }

    // Concatenating the leftover elements
    // (in case we didn't go through the entire left or right array)
    return [...arr, ...left, ...right]
}

function mergeSort(array) {
    const half = array.length / 2

    // Base case or terminating case
    if (array.length < 2) {
        return array
    }

    const left = array.splice(0, half)
    return merge(mergeSort(left), mergeSort(array))
}









function onWindowResize() {
    width = canvas.clientWidth * pixelRatio | 0;
    height = canvas.clientHeight * pixelRatio | 0;
    canvas = renderer.domElement;
    renderer.setSize(width, height, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

}

function render() {
    renderer.render(scene, camera);
    requestAnimationFrame(render);
    stats.update();
}