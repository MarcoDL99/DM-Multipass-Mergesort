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
let maxPerColumn = 5
let counter = 0
let maxRunLength = 0
let relation, frames, runs, currentFrames, currentFramesObject, currentRunsObject;
let currentRun = 0;
let currentRuns = []
runs = [[]];
let newruns = []

let started = false;
let tweenGroup = new TWEEN.Group();
const size = 1.0

init();
render();

function start() {
    if (!started) {
        started = true
        createFrames()
        createRelation()
    }
    else {
        movePagesToFrame(function () {
            setupStep0()
        })

    }

}

// INITIAL SETUP OF FRAMES AND RELATION \\
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
    }
    scene.add(frames);
}
function createRelation() {
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
    relation.name = "relation"
    scene.add(relation);

    let tweens1 = []
    let maxtime = 0
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
}



// STEP 0 \\

function setupStep0() { //Step 0
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
    readRelation()
}
function readRelation() {         //STEP 0
    setTimeout(function () {   //  call a 0.15s setTimeout when the loop is called
        let index = Math.floor(Math.random() * (options.frames));
        let fullFrames = 0;
        for (let i = 0; i < options.frames; i++) {
            if (currentFrames[i] > 0.95) {
                fullFrames++
            }
        }
        if (fullFrames == options.frames || fullFrames - options.pages == 0) {
            for (let i = 0; i < options.frames; i++) {

                if (i >= options.frames - options.pages) {
                    currentFrames[i] = 1.0
                    currentFramesObject.children[i].scale.set(1, currentFrames[i], 1)
                    currentFramesObject.children[i].position.set(0.0, (currentFrames[i] - 1.0) / 2, 2 + 1.5 * size * i);
                }
            }
            options.pages = options.pages - options.frames
            if (options.pages <= 0) {
                scene.remove(relation)

                if (runs.length > 1) {

                    //Go to next step

                    currentFrames = []
                    options.pages = guiHandler.pagesSlider.value
                    let tweens = []
                    for (let i = 0; i < runs.length; i++) {
                        for (let j = 0; j < runs[i].length; j++) {
                            tweens.push(new TWEEN.Tween(runs[i][j].position, tweenGroup).to(new THREE.Vector3(runs[i][j].position.x, runs[i][j].position.y, runs[i][j].position.z - 18 + 2 * size), 500))
                        }
                    }
                    tweens[tweens.length - 1].onComplete(() => {

                        for (let i = 0; i < runs.length; i++) {

                            if (runs[i].length == 0) {
                                runs.pop() //This is necessary as the last element of the runs array wil be empty when completing the step 0
                            }
                        }
                        newruns.push([])
                        currentFrames = []      //This is the The setupStepI function
                        for (let i = 0; i < options.frames; i++) {
                            currentFrames.push(0)
                        }

                        frames.children[frames.children.length - 1].material = new THREE.MeshPhongMaterial({
                            color: 0x9b32a8,
                            side: THREE.DoubleSide,
                        })
                        for (let i = 0; i < currentFramesObject.children.length; i++) {
                            currentFramesObject.children[i].scale.set(1, 0, 1)
                            currentFramesObject.children[i].position.set(0.0, -0.5, 2 + 1.5 * size * i);
                        }
                        currentFramesObject.children[currentFramesObject.children.length - 1].material = new THREE.MeshPhongMaterial({
                            color: 0xff3030,
                            side: THREE.DoubleSide,

                        })
                        moveRunsToFrame(function () {       //The setupStepI() has explicitly been done 
                            sortRuns()
                        })
                    })
                    for (let i = 0; i < tweens.length; i++) {
                        tweens[i].start()
                    }
                }
                else {
                    console.log("Animation is fully completed")
                    started = false
                }
            }
            else {
                for (let i = 0; i < options.frames; i++) {
                    relation.remove(relation.children[relation.children.length - 1])
                }

                scene.remove(currentFramesObject)
                movePagesToFrame(function () {
                    setupStep0()
                })
            }
        }
        else {
            while (currentFrames[index] > 0.95 || index < (options.frames - options.pages)) {
                index = Math.floor(Math.random() * (options.frames));
            }
            currentRun++
            currentFrames[index] += 0.1
            currentFramesObject.children[index].scale.set(1, currentFrames[index], 1)
            currentFramesObject.children[index].position.set(0.0, (currentFrames[index] - 1.0) / 2, 2 + 1.5 * size * index);

            let time = 1000
            let finalX = 2 + 1.1 * size * (options.frames - (runs[runs.length - 1]).length)
            let finalY = 7 + 1.25 * size
            let finalZ = 18 + 1.25 * size


            for (let i = 0; i < runs.length; i++) {
                if (i % maxPerColumn == 0) {
                    finalZ += - 1.25 * size
                    finalY = 7 + 1.25 * size
                }
                finalY += -1.25 * size
            }
            if (currentRun == 1) {
                counter++

                if (counter > 1) {
                    counter = 0;
                    var material = new THREE.MeshPhongMaterial({
                        color: 0xffff00,
                        side: THREE.DoubleSide,
                    })
                }
                else {
                    var material = new THREE.MeshPhongMaterial({
                        color: 0xffffff,
                        side: THREE.DoubleSide,
                    })
                }

                const geometry = new THREE.BoxGeometry(size, size, size);
                const mesh = new THREE.Mesh(geometry, material);
                const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.MeshPhongMaterial({
                    color: 0x000000,
                    emissive: 0x000000,
                    side: THREE.DoubleSide,

                }));
                mesh.add(edges)
                mesh.position.set(finalX - 1.0 / 2, finalY, finalZ);
                mesh.scale.set(0.1, 1.0, 1)
                runs[runs.length - 1].push(mesh)
                scene.add(mesh)
            }
            else if (currentRun == 10) {
                runs[runs.length - 1][runs[runs.length - 1].length - 1].scale.set(1.0, 1.0, 1.0)
                runs[runs.length - 1][runs[runs.length - 1].length - 1].position.set(finalX, finalY, finalZ)
                currentRun = 0

                if (runs[runs.length - 1].length == options.frames) {
                    runs.push([])
                }
            }
            else {
                runs[runs.length - 1][runs[runs.length - 1].length - 1].scale.set(0.1 * currentRun, 1.0, 1.0)
                runs[runs.length - 1][runs[runs.length - 1].length - 1].position.set(runs[runs.length - 1][runs[runs.length - 1].length - 1].position.x - 0.05, finalY, finalZ)
            }
            readRelation()
        }
    }, 100)
}
function movePagesToFrame(callback) {
    let tweens = []
    let time = 10
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






// // STEP I \\






function setupStepI() {
    currentFrames = []      //This is the The setupStepI function
    newruns.push([])
    for (let i = 0; i < options.frames; i++) {
        currentFrames.push(0)
    }
    for (let i = 0; i < runs.length; i++) {

        if (runs[i].length == 0) {
            runs.pop() //This is necessary as the last element of the runs array wil be empty when completing the step 0
        }
    }
    for (let i = 0; i < currentFramesObject.children.length; i++) {
        currentFramesObject.children[i].scale.set(1, 0, 1)
        currentFramesObject.children[i].position.set(0.0, -0.5, 2 + 1.5 * size * i);
    }
    if (counter > 1) {
        counter = 0

        currentFramesObject.children[currentFramesObject.children.length - 1].material = new THREE.MeshPhongMaterial({
            color: 0xff3030,
            side: THREE.DoubleSide,
        })
    }
    else {
        currentFramesObject.children[currentFramesObject.children.length - 1].material = new THREE.MeshPhongMaterial({
            color: 0xff9900,
            side: THREE.DoubleSide,

        })
    }
    // currentFramesObject.children[currentFramesObject.children.length - 1].material = new THREE.MeshPhongMaterial({
    //     color: 0xff3030,
    //     side: THREE.DoubleSide,
    // })
    //sortRuns()
}

function sortRuns() {
    setTimeout(function () {   //  call a 0.15s setTimeout when the loop is called
        // Analyze the current set of runs: This is simulated by choosing at random one of the runs in the frames
        let index = Math.floor(Math.random() * (options.frames - 1));           //Find a valid index frame associated to a non completely analyzed run.
        while (index < (options.frames - runs.length - 1) || currentFrames[index] > 0.95) {    //  Value is only > 0.95 if the frame is associated to a fully analyzed run
            index = Math.floor(Math.random() * (options.frames - 1));
        }
        currentRun++            //Increase all the various counters
        currentFrames[index] += 0.1
        currentFrames[currentFrames.length - 1] += 0.1
        currentFramesObject.children[index].scale.set(1, currentFrames[index], 1)
        currentFramesObject.children[index].position.set(-0.1, (currentFrames[index] - 1.0) / 2, 2 + 1.5 * size * index);

        currentFramesObject.children[options.frames - 1].scale.set(1, currentFrames[currentFrames.length - 1], 1)
        currentFramesObject.children[options.frames - 1].position.set(-0.1, (currentFrames[currentFrames.length - 1] - 1.0) / 2, 2 + 1.5 * size * (options.frames - 1));

        let fullFrames = 0;
        for (let i = 0; i < options.frames; i++) {
            if (currentFrames[i] > 0.95) {
                fullFrames++
            }
        }
        console.log(fullFrames, currentFrames, runs)
        if ((fullFrames == options.frames || fullFrames > runs.length)) { // If all frames (or the frames containing a run) are full then it means the new run has been completed. Now we need to see if..
            for (let i = 0; i < options.frames; i++) {                    //We're done, if we need to iterate again on the current runs or if we need to iterate again on the new runs

                if (i >= options.frames - runs.length - 1) {
                    currentFrames[i] = 1.0
                    currentFramesObject.children[i].scale.set(1, currentFrames[i], 1)
                    currentFramesObject.children[i].position.set(0.0, (currentFrames[i] - 1.0) / 2, 2 + 1.5 * size * i);
                }
            }
            for (let i = fullFrames - 2; i >= 0; i--) {
                if (runs[i][0]) {
                    console.log("Shouldn't we have removed these already?", runs[i])

                    if (runs[i].length == 1) {
                        scene.remove(runs[i][0])  //Since they're all full, there is only one block in each run, which we now remove from the scene
                        runs.splice(i, 1)

                    }
                }
            }
            moveOutput(function () {      //Move the last block of output
                console.log(runs)

                //runs.slice(Math.min(runs.length - 1, options.frames - runs.length - 1)) //Slice the runs array. If it is longer than the # of frames, we'll iterate again, otherwise, we're done for the current runs.
                console.log(runs)
                if (runs.length == 0) {     //It means all the current runs have been analyzed and we're done for the current runs

                    if (newruns.length > 1) { //If we're done AND we've created more than one new run, we need to repeat the step I
                        console.log(newruns)
                        // for (let i=0;i<runs.length; i++){
                        //     scene.remove(runs[i][0])
                        // }
                        runs = []
                        const materials = [new THREE.MeshPhongMaterial({
                            color: 0xffffff,
                            side: THREE.DoubleSide,
                        }), new THREE.MeshPhongMaterial({
                            color: 0xffff00,
                            side: THREE.DoubleSide,
                        })]
                        for (let i = 0; i < newruns.length; i++) {   //Setup the newruns for the next iteration of step I
                            runs.push([])
                            for (let j = newruns[i].length - 1; j >= 0; j--) {    //We need to flip them on the X axis
                                newruns[i][j].material = materials[j%2]
                                runs[i].push(newruns[i][j])
                            }
                        }

                        newruns = [];
                        console.log(runs, newruns)
                        let tweens = []             //Move the newruns to the left side of the screen
                        for (let i = 0; i < runs.length; i++) {
                            for (let j = 0; j < runs[i].length; j++) {
                                tweens.push(new TWEEN.Tween(runs[i][j].position, tweenGroup).to(new THREE.Vector3(runs[i][j].position.x, runs[i][j].position.y, runs[i][j].position.z - 18 + 2 * size), 500))
                            }
                        }
                        tweens[tweens.length - 1].onComplete(() => {
                            if (runs[runs.length - 1].length == 0) {
                                runs.pop() //This is necessary as the last element of the runs array wil be empty when completing the step I
                            }

                            currentFrames = []      //Reset the counters
                            for (let i = 0; i < options.frames; i++) {
                                currentFrames.push(0)
                            }

                            frames.children[frames.children.length - 1].material = new THREE.MeshPhongMaterial({
                                color: 0x9b32a8,
                                side: THREE.DoubleSide,
                            })
                            setupStepI()
                            moveRunsToFrame(function () {           //Iterate step I
                                sortRuns()
                            })
                        })
                        for (let i = 0; i < tweens.length; i++) {       // Actual command which starts the next iteration
                            tweens[i].start()
                        }
                    }
                    else { //If newruns has length 1 then we're done
                        scene.remove(currentFramesObject)
                        for (let i = 0; i < runs.length; i++) {
                            for (let j = 0; j < runs[i].length; j++) {
                                scene.remove(runs[i][j])
                            }
                        }
                        console.log("Animation is fully completed")
                    }
                }
                else {  //If runs length is still more than 0, it means we have more runs to analyze in the current iteration, so we restart the analysis but without moving newruns to runs
                    counter = 0 //Just so the new run starts with a red bloc
                    setupStepI()
                    moveRunsToFrame(function () {           //Iterate step I
                        sortRuns()
                    })
                }
            })
        }
        else {  //If at least one frame is not full yet, we need to check if there is any full one, and we also need to check if the last one is full
            if (currentFrames[currentFrames.length - 1] > 0.95) {   //If the output frame is full, we need to copy it and move it

                moveOutput(function () {
                    currentFrames[currentFrames.length - 1] = 0
                    currentFramesObject.children[currentFramesObject.children.length - 1].scale.set(1, 0, 1)
                    currentFramesObject.children[currentFramesObject.children.length - 1].position.set(0.0, - 0.5, 2 + 1.5 * size * (currentFramesObject.children.length - 1));
                    counter++
                    if (counter > 1) {
                        counter = 0
                        currentFramesObject.children[currentFramesObject.children.length - 1].material = new THREE.MeshPhongMaterial({
                            color: 0xff3030,
                            side: THREE.DoubleSide,

                        })
                    }
                    else {
                        currentFramesObject.children[currentFramesObject.children.length - 1].material = new THREE.MeshPhongMaterial({
                            color: 0xff9900,
                            side: THREE.DoubleSide,

                        })
                    }

                    let runIndex
                    let fullFrameIndex = findFullFrameIndex()   //Check if there is a full "reading" frame
                    if (fullFrameIndex >= 0) {              //If we find a full frame
                        runIndex = fullFrameIndex - (options.frames - 1 - Math.min(runs.length, options.frames - 1))

                        console.log(runs, runIndex, frames, fullFrameIndex)
                        if (currentFrames[fullFrameIndex] > 0.95) {
                            if (runs[runIndex.length == 0]) {
                                // If the full corresponds to a run we've completely analyzed, we do nothing 
                            }
                            if (runs[runIndex.length == 1]) { // If the block we've just finished analyzing is the last one of the run, we don't have another block to load, so we just clean up
                                scene.remove(runs[runIndex][runs[runIndex].length - 1]); //Remove the block from the scene
                                runs[runIndex].pop()            //Remove the block from the runs array. This will make runs[runIndex] an empty array.
                            }

                            if (runs[runIndex].length > 1) {      //If there are still blocks to analyze from this run, we clean the current one and then load another one
                                scene.remove(runs[runIndex][runs[runIndex].length - 1]); //Remove the block from the scene
                                runs[runIndex].pop()            //Clean the current block
                                currentFramesObject.children[fullFrameIndex].scale.set(1, 0, 1)     //Reset the counter related to the frame
                                currentFrames[fullFrameIndex] = 0                                   //Reset the counter related to the frame

                                let time = 1000                      //Load a new block from the run
                                let tween = new TWEEN.Tween(runs[runIndex][runs[runIndex].length - 1].position, tweenGroup).to(new THREE.Vector3(frames.children[fullFrameIndex].position.x, runs[runIndex][runs[runIndex].length - 1].position.y, 0), time)
                                let tween2 = new TWEEN.Tween(runs[runIndex][runs[runIndex].length - 1].position, tweenGroup).to(new THREE.Vector3(frames.children[fullFrameIndex].position.x, runs[runIndex][runs[runIndex].length - 1].position.y, frames.children[fullFrameIndex].position.z), time)
                                let tween3 = new TWEEN.Tween(runs[runIndex][runs[runIndex].length - 1].position, tweenGroup).to(frames.children[fullFrameIndex].position, time)
                                tween3.onComplete(function () {
                                    sortRuns()
                                })
                                tween.chain(tween2)
                                tween2.chain(tween3)
                                tween.start()
                            }
                        }
                    }
                    else {
                        sortRuns()      //recall the function
                    }
                })
            }
            else { //If the output frame is not full
                let runIndex

                let fullFrameIndex = findFullFrameIndex()   //Check if there is a full "reading" frame associated to a non completely analyzed run
                if (fullFrameIndex >= 0) {              //If we find a full frame

                    runIndex = fullFrameIndex - (options.frames - 1 - Math.min(runs.length, options.frames - 1))

                    console.log(runs, runIndex, frames, fullFrameIndex)
                    if (currentFrames[fullFrameIndex] > 0.95) {
                        if (runs[runIndex.length == 0]) {
                            // If the full corresponds to a run we've completely analyzed, we do nothing 
                        }
                        if (runs[runIndex.length == 1]) { // If the block we've just finished analyzing is the last one of the run, we don't have another block to load, so we just clean up
                            scene.remove(runs[runIndex][runs[runIndex].length - 1]); //Remove the block from the scene
                            runs[runIndex].pop()            //Remove the block from the runs array. This will make runs[runIndex] an empty array.
                        }

                        if (runs[runIndex].length > 1) {      //If there are still blocks to analyze from this run, we clean the current one and then load another one
                            scene.remove(runs[runIndex][runs[runIndex].length - 1]); //Remove the block from the scene
                            runs[runIndex].pop()            //Clean the current block
                            currentFramesObject.children[fullFrameIndex].scale.set(1, 0, 1)     //Reset the counter related to the frame
                            currentFrames[fullFrameIndex] = 0                                   //Reset the counter related to the frame

                            let time = 1000                      //Load a new block from the run
                            let tween = new TWEEN.Tween(runs[runIndex][runs[runIndex].length - 1].position, tweenGroup).to(new THREE.Vector3(frames.children[fullFrameIndex].position.x, runs[runIndex][runs[runIndex].length - 1].position.y, 0), time)
                            let tween2 = new TWEEN.Tween(runs[runIndex][runs[runIndex].length - 1].position, tweenGroup).to(new THREE.Vector3(frames.children[fullFrameIndex].position.x, runs[runIndex][runs[runIndex].length - 1].position.y, frames.children[fullFrameIndex].position.z), time)
                            let tween3 = new TWEEN.Tween(runs[runIndex][runs[runIndex].length - 1].position, tweenGroup).to(frames.children[fullFrameIndex].position, time)
                            tween3.onComplete(function () {
                                sortRuns()
                            })
                            tween.chain(tween2)
                            tween2.chain(tween3)
                            tween.start()
                        }
                    }
                }
                else {
                    sortRuns()      //recall the function

                }
            }

        }
    }
        , 100)
}
function findFullFrameIndex() {
    for (let i = options.frames - 1 - runs.length; i < options.frames - 1; i++) { //Check if there is a full "reading" frame
        if (currentFrames[i] > 0.95 && runs[i - (options.frames - 1 - Math.min(runs.length, options.frames - 1))].length > 1) {

            return i
        }
    }
    return -1
}

function checkIfRunsStillLongerThanOne() {
    for (let i = 0; i < runs.length; i++) {
        if (runs[i].length > 1) {
            return true
        }
    }
    return false
}


function moveRunsToFrame(callback) {
    let tweens = []
    let time = 500

    for (let i = 0; i < options.frames - 1 && i < runs.length; i++) {
        tweens.push(new TWEEN.Tween(runs[i][runs[i].length - 1].position, tweenGroup).to(new THREE.Vector3(frames.children[i].position.x, runs[i][runs[i].length - 1].position.y, 0), time))
    }
    for (let i = 0; i < options.frames - 1 && i < runs.length; i++) {
        currentRuns.push(false)
        if (i < tweens.length - 1) {
            tweens[i].chain(tweens[i + 1])
        }
        tweens[i].onComplete(() => {
            let tween = new TWEEN.Tween(runs[i][runs[i].length - 1].position, tweenGroup).to(new THREE.Vector3(frames.children[(options.frames - Math.min(runs.length, options.frames - 1) - 1) + i].position.x, runs[i][runs[i].length - 1].position.y, frames.children[(options.frames - Math.min(runs.length, options.frames - 1) - 1) + i].position.z), time)
            tween.onComplete(() => {
                let tween2 = new TWEEN.Tween(runs[i][runs[i].length - 1].position, tweenGroup).to(frames.children[(options.frames - Math.min(runs.length, options.frames - 1) - 1) + i].position, time)
                if (!((i + 1) < options.frames - 1 && (i + 1) < runs.length)) {
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
    console.log("moveOutput")
    let time = 500
    let finalX = 1.1 * size * (newruns[newruns.length - 1].length)
    let finalY = 7 + 1.25 * size
    let finalZ = 17


    for (let i = 0; i < newruns.length; i++) {
        if (i % maxPerColumn == 0) {
            finalZ += - 1.25 * size
            finalY = 7 + 1.25 * size
        }
        finalY += -1.25 * size

    }
    newruns[newruns.length - 1].push(currentFramesObject.children[currentFramesObject.children.length - 1].clone())
    scene.add(newruns[newruns.length - 1][(newruns[newruns.length - 1]).length - 1])
    let tween = new TWEEN.Tween(newruns[newruns.length - 1][(newruns[newruns.length - 1]).length - 1].position, tweenGroup).to(new THREE.Vector3(newruns[newruns.length - 1][(newruns[newruns.length - 1]).length - 1].position.x, finalY, newruns[newruns.length - 1][(newruns[newruns.length - 1]).length - 1].position.z), time)


    let tween2 = new TWEEN.Tween(newruns[newruns.length - 1][(newruns[newruns.length - 1]).length - 1].position, tweenGroup).to(new THREE.Vector3(finalX, finalY, newruns[newruns.length - 1][(newruns[newruns.length - 1]).length - 1].position.z), time)

    let tween3 = new TWEEN.Tween(newruns[newruns.length - 1][(newruns[newruns.length - 1]).length - 1].position, tweenGroup).to(new THREE.Vector3(finalX, finalY, finalZ), time)
    tween.chain(tween2)
    tween2.chain(tween3)
    tween3.onComplete(() => {
        //currentFrames[currentFrames.length - 1] = 0
        //currentFramesObject.children[currentFramesObject.children.length - 1].scale.set(1, 0, 1)
        callback()
    })
    tween.start()
}

function onWindowResize() {
    width = canvas.clientWidth * pixelRatio | 0;
    height = canvas.clientHeight * pixelRatio | 0;
    canvas = renderer.domElement;
    renderer.setSize(width, height, false);
    cameraMover.windowResize(window.innerWidth / window.innerHeight)

}

function setOptions(frames, pages) {
    options.frames = frames
    options.pages = pages
}

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
        color: 0x50ff50,
        side: THREE.DoubleSide
    });
    let cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);

    cylinder.position.set(0, 0, 0)
    cylinder.name = "Cylinder"
    scene.add(cylinder);
    const axesHelper = new THREE.AxesHelper(15);
    scene.add(axesHelper);
    window.addEventListener('resize', onWindowResize);


}
function render() {
    renderer.render(scene, camera);
    requestAnimationFrame(render);
    stats.update();
    cameraMover.update();
    tweenGroup.update()
}
