"use strict";

var canvas;
var gl;
var program;

var projectionMatrix;
var modelViewMatrix;

var instanceMatrix;
var normMatrix;
var vBuffer;
var modelViewLoc;

var pointsArray = [];
var normalsArray = [];
var tangentsArray = [];
//View and Projection variables. 
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
var near = 2.0;
var far = 250.0;
var radius = 80.0;
var theta_view = -2.420;
var phi = -2.420;
var dr = 5.0 * Math.PI / 180.0;
var fovy = 60.0;  // Field-of-view in Y direction angle (in degrees)
var aspect;       // Viewport aspect ratio, initially canvas.width / canvas.height but then it can be modified using the UI

var lightPos = vec4(0.0, 50.0, 0.0, 1.0);


var modelViewMatrixLoc;
var normalMatrixLoc;
var currentFlagLocation;

//Vertices of each cube

var vertices = [

    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0)
];


//    ********** Texture *********

var textureFur;
var textureGrass;
var textureFace;
var texCoordsArray = [];
var image1; //Texture for the fur
var image2; //Texture for the grass
var image3; //Texture for the face
var texSize = 256; //Used for the bump map
var nRows = 50;
var nColumns = 50;
// TEXTURE COORDINATES 

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

//IDs for the kangaroo's body

var torsoId = 0;
var headId = 1;
var leftUpperArmId = 2;
var leftLowerArmId = 3;
var rightUpperArmId = 4;
var rightLowerArmId = 5;
var leftUpperLegId = 6;
var leftLowerLegId = 7;
var rightUpperLegId = 8;
var rightLowerLegId = 9;
var upperTailId = 10;
var middleTailId = 11;
var lowerTailId = 12;

var numNodes = 13;
//Dimensions of kangaroo's body parts

var torsoHeight = 6.0;
var torsoWidth = 2.5;

var upperArmHeight = 2.75;
var lowerArmHeight = 1.55;

var upperArmWidth = 0.75;
var lowerArmWidth = 0.75;

var upperLegWidth = 0.75;
var lowerLegWidth = 1.25;

var upperLegHeight = 5.75;
var lowerLegHeight = 2.5;

var upperTailWidth = 1.0;
var middleTailWidth = 0.75;
var lowerTailWidth = 0.5;

var upperTailHeight = 4.25;
var middleTailHeight = 3.25;
var lowerTailHeight = 3.25;

var headHeight = 1.75;
var headWidth = 1.25;

//Dimension of grass field
var grassHeight = 1.0;
var grassWidth = 75.0;

//Flags
var flagDirt = 0;
var flagGrass = 1;
var flagKangarooSides = 2;
var flagKangarooHead = 3;

var stack = [];

var figure = [];

for (var i = 0; i < numNodes; i++) figure[i] = createNode(null, null, null, null);

//Initial State (position and orientation of each body part) of the kangaroo
var translation = [25.0, 4.8, 0.0]; //Translation of the kangaroo, the initial Y translation is needed to avoid having the cangaroo's feet below the ground
var torsoRotation = [80.0, 0.0, -60.0];
var headRotation = [15.0, 0.0, 0.0];
var upperArmRotation = [60.0, 0.0, 0.0];
var lowerArmRotation = [90.0, 0.0, 0.0];
var upperLegRotation = [100.0, 0.0, 0.0];
var lowerLegRotation = [-90.0, 0.0, 0.0];
var upperTailRotation = [150.0, 0.0, 0.0];
var middleTailRotation = [0.0, 0.0, 0.0];
var lowerTailRotation = [210.0, 0.0, 0.0];

//Animation variables
var animationToggle = false;

var theta = 0; //Rotation around hill
//variables for the animation of the body
var jumpheight = 0.0;
var drHeight;
var drLeg;
var drArm;
var drUpperTail;
var upTailRotation = 165.0;
var lowTailRotation = 210.0;
var armRotation = 60.0;
var legRotation = 100.0;
var time = 0;
init();

//-------------------------------------------

function scale4(a, b, c) {
    var result = mat4();
    result[0] = a;
    result[5] = b;
    result[10] = c;
    return result;
}

//--------------------------------------------


function createNode(transform, render, sibling, child) {
    var node = {
        transform: transform,
        render: render,
        sibling: sibling,
        child: child,
    }
    return node;
}


function initNodes(Id) {

    var m = mat4();

    switch (Id) {

        case torsoId:
            m = mult(m, translate(0.5 * torsoWidth, 0.5 * torsoHeight, 0.5 * torsoWidth));
            m = mult(m, rotate(torsoRotation[0], vec3(1, 0, 0)));
            m = mult(m, rotate(torsoRotation[1], vec3(0, 1, 0)));
            m = mult(m, rotate(torsoRotation[2], vec3(0, 0, 1)));
            m = mult(m, translate(-0.5 * torsoWidth, -0.5 * torsoHeight, -0.5 * torsoWidth));
            figure[torsoId] = createNode(m, torso, null, headId);
            break;

        case headId:
            m = translate(0.0, torsoHeight + 0.25 * headHeight, 0.0);
            m = mult(m, rotate(headRotation[0], vec3(1, 0, 0)));
            m = mult(m, rotate(headRotation[1], vec3(0, 1, 0)));
            m = mult(m, rotate(headRotation[2], vec3(0, 0, 1)));

            m = mult(m, translate(0.0, -0.5 * headHeight, 0.0));
            figure[headId] = createNode(m, head, leftUpperArmId, null);
            break;


        case leftUpperArmId:

            m = translate(-(0.2 * torsoWidth + upperArmWidth), 0.8 * torsoHeight, 0.0);
            m = mult(m, rotate(upperArmRotation[0], vec3(1, 0, 0)));
            m = mult(m, rotate(upperArmRotation[1], vec3(0, 1, 0)));
            m = mult(m, rotate(upperArmRotation[2], vec3(0, 0, 1)));
            figure[leftUpperArmId] = createNode(m, leftUpperArm, rightUpperArmId, leftLowerArmId);
            break;

        case rightUpperArmId:

            m = translate(0.2 * torsoWidth + upperArmWidth, 0.8 * torsoHeight, 0.0);
            m = mult(m, rotate(upperArmRotation[0], vec3(1, 0, 0)));
            m = mult(m, rotate(upperArmRotation[1], vec3(0, 1, 0)));
            m = mult(m, rotate(upperArmRotation[2], vec3(0, 0, 1)));
            figure[rightUpperArmId] = createNode(m, rightUpperArm, leftUpperLegId, rightLowerArmId);
            break;

        case leftUpperLegId:

            m = translate(-(0.2 * torsoWidth + upperLegWidth), 0.3 * upperLegHeight, 0.0);
            m = mult(m, rotate(upperLegRotation[0], vec3(1, 0, 0)));
            m = mult(m, rotate(upperLegRotation[1], vec3(0, 1, 0)));
            m = mult(m, rotate(upperLegRotation[2], vec3(0, 0, 1)));
            figure[leftUpperLegId] = createNode(m, leftUpperLeg, rightUpperLegId, leftLowerLegId);
            break;

        case rightUpperLegId:

            m = translate(0.2 * torsoWidth + upperLegWidth, 0.3 * upperLegHeight, 0.0);
            m = mult(m, rotate(upperLegRotation[0], vec3(1, 0, 0)));
            m = mult(m, rotate(upperLegRotation[1], vec3(0, 1, 0)));
            m = mult(m, rotate(upperLegRotation[2], vec3(0, 0, 1)));
            figure[rightUpperLegId] = createNode(m, rightUpperLeg, upperTailId, rightLowerLegId);
            break;

        case leftLowerArmId:

            m = translate(0.0, upperArmHeight, 0.0);
            m = mult(m, rotate(lowerArmRotation[0], vec3(1, 0, 0)));
            m = mult(m, rotate(lowerArmRotation[1], vec3(0, 1, 0)));
            m = mult(m, rotate(lowerArmRotation[2], vec3(0, 0, 1)));
            figure[leftLowerArmId] = createNode(m, leftLowerArm, null, null);
            break;

        case rightLowerArmId:

            m = translate(0.0, upperArmHeight, 0.0);
            m = mult(m, rotate(lowerArmRotation[0], vec3(1, 0, 0)));
            m = mult(m, rotate(lowerArmRotation[1], vec3(0, 1, 0)));
            m = mult(m, rotate(lowerArmRotation[2], vec3(0, 0, 1)));
            figure[rightLowerArmId] = createNode(m, rightLowerArm, null, null);
            break;

        case leftLowerLegId:

            m = translate(0.0, upperLegHeight, 0.0);
            m = mult(m, rotate(lowerLegRotation[0], vec3(1, 0, 0)));
            m = mult(m, rotate(lowerLegRotation[1], vec3(0, 1, 0)));
            m = mult(m, rotate(lowerLegRotation[2], vec3(0, 0, 1)));
            figure[leftLowerLegId] = createNode(m, leftLowerLeg, null, null);
            break;

        case rightLowerLegId:

            m = translate(0.0, upperLegHeight, 0.0);
            m = mult(m, rotate(lowerLegRotation[0], vec3(1, 0, 0)));
            m = mult(m, rotate(lowerLegRotation[1], vec3(0, 1, 0)));
            m = mult(m, rotate(lowerLegRotation[2], vec3(0, 0, 1)));
            figure[rightLowerLegId] = createNode(m, rightLowerLeg, null, null);

        case upperTailId:

            m = translate(0.0, 0.0, 0.0);
            m = mult(m, rotate(upperTailRotation[0], vec3(1, 0, 0)));
            m = mult(m, rotate(upperTailRotation[1], vec3(0, 1, 0)));
            m = mult(m, rotate(upperTailRotation[2], vec3(0, 0, 1)));
            figure[upperTailId] = createNode(m, upperTail, null, middleTailId);

        case middleTailId:

            m = translate(0.0, upperTailHeight, 0.0);
            m = mult(m, rotate(middleTailRotation[0], vec3(1, 0, 0)));
            m = mult(m, rotate(middleTailRotation[1], vec3(0, 1, 0)));
            m = mult(m, rotate(middleTailRotation[2], vec3(0, 0, 1)));
            figure[middleTailId] = createNode(m, middleTail, null, lowerTailId);
        case lowerTailId:

            m = translate(0.0, middleTailHeight, 0.0);
            m = mult(m, rotate(lowerTailRotation[0], vec3(1, 0, 0)));
            m = mult(m, rotate(lowerTailRotation[1], vec3(0, 1, 0)));
            m = mult(m, rotate(lowerTailRotation[2], vec3(0, 0, 1)));
            figure[lowerTailId] = createNode(m, lowerTail, null, null);
            break;

    }

}

function traverse(Id) {

    if (Id == null) return;
    stack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
    figure[Id].render();
    if (figure[Id].child != null) traverse(figure[Id].child);
    modelViewMatrix = stack.pop();
    if (figure[Id].sibling != null) traverse(figure[Id].sibling);
}

function torso() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * torsoHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale(torsoWidth, torsoHeight, torsoWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    normMatrix = normalMatrix(instanceMatrix, true);
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normMatrix));


    gl.uniform1i(currentFlagLocation, flagKangarooSides);

    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function head() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * torsoWidth, 0.0 * headWidth));
    instanceMatrix = mult(instanceMatrix, scale(headWidth, headHeight, 0.75 * headWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    normMatrix = normalMatrix(instanceMatrix, true);
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normMatrix));

    gl.uniform1i(currentFlagLocation, flagKangarooSides);

    for (var i = 0; i < 6; i++) {
        if (i == 3) {
            gl.uniform1i(currentFlagLocation, flagKangarooHead);
            gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
            gl.uniform1i(currentFlagLocation, flagKangarooSides);
        }
        else {
            gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
        }
    }

    for (var i = 2; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);

}

function leftUpperArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale(upperArmWidth, upperArmHeight, upperArmWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    normMatrix = normalMatrix(instanceMatrix, true);
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normMatrix));

    gl.uniform1i(currentFlagLocation, flagKangarooSides);
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftLowerArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.25 * lowerArmHeight, -0.25 * lowerArmWidth));
    instanceMatrix = mult(instanceMatrix, scale(lowerArmWidth, lowerArmHeight, lowerArmWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    normMatrix = normalMatrix(instanceMatrix, true);
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normMatrix));

    gl.uniform1i(currentFlagLocation, flagKangarooSides);
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightUpperArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale(upperArmWidth, upperArmHeight, upperArmWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    normMatrix = normalMatrix(instanceMatrix, true);
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normMatrix));

    gl.uniform1i(currentFlagLocation, flagKangarooSides);
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightLowerArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale(lowerArmWidth, lowerArmHeight, lowerArmWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    normMatrix = normalMatrix(instanceMatrix, true);
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normMatrix));

    gl.uniform1i(currentFlagLocation, flagKangarooSides);
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftUpperLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale(upperLegWidth, upperLegHeight, upperLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    normMatrix = normalMatrix(instanceMatrix, true);
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normMatrix));

    gl.uniform1i(currentFlagLocation, flagKangarooSides);
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftLowerLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.25 * lowerLegWidth));
    instanceMatrix = mult(instanceMatrix, scale(lowerLegWidth, lowerLegHeight, 0.5 * lowerLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    normMatrix = normalMatrix(instanceMatrix, true);
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normMatrix));

    gl.uniform1i(currentFlagLocation, flagKangarooSides);
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightUpperLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale(upperLegWidth, upperLegHeight, upperLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    normMatrix = normalMatrix(instanceMatrix, true);
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normMatrix));

    gl.uniform1i(currentFlagLocation, flagKangarooSides);
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightLowerLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.25 * lowerLegWidth));
    instanceMatrix = mult(instanceMatrix, scale(lowerLegWidth, lowerLegHeight, 0.5 * lowerLegWidth))
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    normMatrix = normalMatrix(instanceMatrix, true);
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normMatrix));

    gl.uniform1i(currentFlagLocation, flagKangarooSides);
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function upperTail() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.3 * upperTailHeight, 0.5 * upperTailWidth));
    instanceMatrix = mult(instanceMatrix, scale(upperTailWidth, upperTailHeight, upperTailWidth))
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    normMatrix = normalMatrix(instanceMatrix, true);
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normMatrix));

    gl.uniform1i(currentFlagLocation, flagKangarooSides);
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function middleTail() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.0, 0.75 * middleTailWidth));
    instanceMatrix = mult(instanceMatrix, scale(middleTailWidth, middleTailHeight, middleTailWidth))
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    normMatrix = normalMatrix(instanceMatrix, true);
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normMatrix));

    gl.uniform1i(currentFlagLocation, flagKangarooSides);
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function lowerTail() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.0, lowerTailWidth));
    instanceMatrix = mult(instanceMatrix, scale(lowerTailWidth, lowerTailHeight, lowerTailWidth))
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    normMatrix = normalMatrix(instanceMatrix, true);
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normMatrix));

    gl.uniform1i(currentFlagLocation, flagKangarooSides);
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function quad(a, b, c, d) {
    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    normal = vec3(normal);

    var tang = vec3(Math.abs(t1[0]), Math.abs(t1[1]), Math.abs(t1[2]));
    pointsArray.push(vertices[a]);
    texCoordsArray.push(texCoord[0]);
    pointsArray.push(vertices[b]);
    texCoordsArray.push(texCoord[1]);
    pointsArray.push(vertices[c]);
    texCoordsArray.push(texCoord[2]);
    pointsArray.push(vertices[d]);
    texCoordsArray.push(texCoord[3]);
    normalsArray.push(normal);
    normalsArray.push(normal);
    normalsArray.push(normal);
    normalsArray.push(normal);
    tangentsArray.push(tang);
    tangentsArray.push(tang);
    tangentsArray.push(tang);
    tangentsArray.push(tang);
}


function cube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}


function configureTexture() {

    //Fur texture
    image1 = document.getElementById("texImage1");
    textureFur = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureFur);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image1);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(gl.getUniformLocation(program, "uTextureMapFur"), 0);

    //Grass texture
    image2 = document.getElementById("texImage2");
    textureGrass = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureGrass);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image2);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(gl.getUniformLocation(program, "uTextureMapGrass"), 1);

    //Face texture
    image3 = document.getElementById("texImage3");
    textureFace = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureFace);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image3);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(gl.getUniformLocation(program, "uTextureMapFace"), 2);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureFur);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textureGrass);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, textureFace);
}
//Bump texture used for the fur. This is mixed with the fur texture (image1)
function configureBump(texNormals) {
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, texSize, texSize, 0, gl.RGB, gl.UNSIGNED_BYTE, texNormals);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.uniform1i(gl.getUniformLocation(program, "uTextureMapBump"), 3);
}

function init() {

    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) { alert("WebGL 2.0 isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");

    gl.useProgram(program);

    instanceMatrix = mat4();

    aspect = canvas.width / canvas.height;
    eye = vec3(radius * Math.sin(theta_view) * Math.cos(phi),
        radius * Math.sin(theta_view) * Math.sin(phi),
        radius * Math.cos(theta_view));

    projectionMatrix = perspective(fovy, aspect, near, far);
    modelViewMatrix = lookAt(eye, at, up);


    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");

    currentFlagLocation = gl.getUniformLocation(program, "uCurrentFlag");

    cube();
    hill();
    // NORMALS
    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
    var normalLoc = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    // TANGENTS
    var tangBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tangBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tangentsArray), gl.STATIC_DRAW);
    var tangentsLoc = gl.getAttribLocation(program, "aTangent");
    gl.vertexAttribPointer(tangentsLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(tangentsLoc);
    /******************* POSITIONS *********************/

    vBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    /******************** TEXTURE *********************/

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);


    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix")

    configureTexture();
    configureBump(bump());

    /********************** UI ***********************/

    document.getElementById("zIncreaseButton").onclick = function () {
        near *= 1.1;
        far *= 1.1;
    };
    document.getElementById("zDecreaseButton").onclick = function () {
        near *= 0.9;
        far *= 0.9;
    };


    document.getElementById("radius").oninput = function (event) {
        radius = event.target.value;
    };
    document.getElementById("theta").oninput = function (event) {
        theta_view = event.target.value * Math.PI / 180.0;
    };
    document.getElementById("phi").oninput = function (event) {
        phi = event.target.value * Math.PI / 180.0;
    };
    document.getElementById("aspect").oninput = function (event) {
        aspect = event.target.value;
    };
    document.getElementById("atX").oninput = function (event) {
        at[0] = event.target.value;
    };
    document.getElementById("atY").oninput = function (event) {
        at[1] = event.target.value;
    };
    document.getElementById("atZ").oninput = function (event) {
        at[2] = event.target.value;
    };
    document.getElementById("upX").oninput = function (event) {
        up[0] = event.target.value;
    };
    document.getElementById("upY").oninput = function (event) {
        up[1] = event.target.value;
    };
    document.getElementById("upZ").oninput = function (event) {
        up[2] = event.target.value;
    };
    document.getElementById("animationButton").onclick = function () {
        animationToggle = true;
    };
    for (i = 0; i < numNodes; i++) initNodes(i);
    render();
}


function render() {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(radius * Math.sin(theta_view) * Math.cos(phi),
        radius * Math.sin(theta_view) * Math.sin(phi),
        radius * Math.cos(theta_view));
    projectionMatrix = perspective(fovy, aspect, near, far);
    modelViewMatrix = lookAt(eye, at, up);

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));
    gl.uniform4fv(gl.getUniformLocation(program, "uLightPosition"), lightPos);


    renderKangaroo();
    renderGrass();
    requestAnimationFrame(render);
}
function renderGrass() {
    stack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix, translate(0.0, 0.0, 0.0));
    modelViewMatrix = mult(modelViewMatrix, scale(grassWidth, grassHeight, grassWidth));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));
    normMatrix = normalMatrix(modelViewMatrix, true);
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normMatrix));

    //Draw 2 lateral sides of the land and the bottom side
    gl.uniform1i(currentFlagLocation, flagDirt);
    for (var i = 0; i < 3; i++) {
        gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
    }
    //Skip the upper side of the cube (gl.drawArrays(gl.TRIANGLE_FAN, 4 * 3, 4))
    //Draw the other 2 lateral sides
    gl.uniform1i(currentFlagLocation, flagDirt);
    for (var i = 4; i < 6; i++) {
        gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
    }
    gl.uniform1i(currentFlagLocation, flagGrass);

    //Draw upper side of the grass land with the hill

    for (var i = 24; i <= pointsArray.length; i += 4) {
        gl.drawArrays(gl.TRIANGLE_FAN, i, 4);
    }

    modelViewMatrix = stack.pop();
}

function bump() {

    // Bump Data

    var data = new Array()
    for (var i = 0; i <= texSize; i++)  data[i] = new Array();
    for (var i = 0; i <= texSize; i++) for (var j = 0; j <= texSize; j++)
        data[i][j] = Math.random() * 5;


    // Bump Map Normals

    var normalst = new Array()
    for (var i = 0; i < texSize; i++)  normalst[i] = new Array();
    for (var i = 0; i < texSize; i++) for (var j = 0; j < texSize; j++)
        normalst[i][j] = new Array();
    for (var i = 0; i < texSize; i++) for (var j = 0; j < texSize; j++) {
        normalst[i][j][0] = data[i][j] - data[i + 1][j];
        normalst[i][j][1] = data[i][j] - data[i][j + 1];
        normalst[i][j][2] = 1;
    }

    // Scale to Texture Coordinates

    for (var i = 0; i < texSize; i++) for (var j = 0; j < texSize; j++) {
        var d = 0;
        for (k = 0; k < 3; k++) d += normalst[i][j][k] * normalst[i][j][k];
        d = Math.sqrt(d);
        for (k = 0; k < 3; k++) normalst[i][j][k] = 0.5 * normalst[i][j][k] / d + 0.5;
    }

    // Normal Texture Array

    var normals = new Uint8Array(3 * texSize * texSize);

    for (var i = 0; i < texSize; i++)
        for (var j = 0; j < texSize; j++)
            for (var k = 0; k < 3; k++)
                normals[3 * texSize * i + 3 * j + k] = 255 * normalst[i][j][k];

    return normals;
}

function hill() {
    var data = new Array();
    for (var i = 0; i <= nRows; i++)  data[i] = new Array();
    for (var i = 0; i <= nRows; i++) for (var j = 0; j <= nColumns; j++) {
        data[i][j] = 0.0;
    }
    for (var i = nRows / 5; i <= 4 * nRows / 5; i++) for (var j = nColumns / 5; j <= 4 * nColumns / 5; j++) {
        var x = Math.PI * (4 * i / nRows - 2.0);
        var y = Math.PI * (4 * j / nRows - 2.0);
        var r = Math.sqrt(x * x + y * y);


        data[i][j] = r ? Math.sin(r) / r : 1.0;
        data[i][j] = data[i][j] * 12.0;
        if (data[i][j] < 0.0) data[i][j] = 0.0;
    }
    for (var i = 0; i < nRows; i++) {
        for (var j = 0; j < nColumns; j++) {
            var a = vec4(i / nRows - 0.5, data[i][j] + 0.5, j / nColumns - 0.5, 1.0);
            var b = vec4((i + 1) / nRows - 0.5, data[i + 1][j] + 0.5, j / nColumns - 0.5, 1.0);
            var c = vec4((i + 1) / nRows - 0.5, data[i + 1][j + 1] + 0.5, (j + 1) / nColumns - 0.5, 1.0);
            var d = vec4(i / nRows - 0.5, data[i][j + 1] + 0.5, (j + 1) / nColumns - 0.5, 1.0);


            var t1 = subtract(b, a);
            var t2 = subtract(c, b);
            var normal = cross(t1, t2);
            normal = normalize(vec3(normal));
            normal[1] = -normal[1];

            pointsArray.push(a);
            pointsArray.push(b);
            pointsArray.push(c);
            pointsArray.push(d);
            texCoordsArray.push(texCoord[0]);
            texCoordsArray.push(texCoord[1]);
            texCoordsArray.push(texCoord[2]);
            texCoordsArray.push(texCoord[3]);
            normalsArray.push(normal);
            normalsArray.push(normal);
            normalsArray.push(normal);
            normalsArray.push(normal);
        }
    }

}

function renderKangaroo() {

    if (!animationToggle && theta == 0) {     //Initialize variables  
        drHeight = 0.06;
        drLeg = 1.0;
        drArm = 0.1;
        drUpperTail = -0.6;

    }
    if (animationToggle) {  //After button has been pressed
        theta -= 0.3;
        time += 1;

        ///When the kangaroo reaches max height in his jump, invert the directions of every movement except the rotation around hill

        if (time % 50 == 0) {
            drHeight = -drHeight;
            drLeg = -drLeg;
            drArm = - drArm;
            drUpperTail = -drUpperTail;
        }

        //Increase the variables
        jumpheight += drHeight;
        legRotation += drLeg;
        armRotation += drArm;
        upTailRotation += drUpperTail;
    }

    setTorso();
    setArms();
    setLegs();
    setTail();
    traverse(torsoId);
    if (theta<=-360 && animationToggle) {
        if (jumpheight <= 0.05) { //Remove the approximations and reset the variables
            jumpheight = 0;
            legRotation = 100;        //For example, this would be 99.999999
            upTailRotation = 165.0;
            lowTailRotation = 210.0;
            armRotation = 60.0;
            animationToggle = false;
            console.log(time);
            theta = 0;
        }


    }
}

function setTorso() {
    //Rotation around the hill
    var m = translate(0.0, 0.5 * torsoHeight, 0.0);
    m = mult(m, rotate(theta, vec3(0, 1, 0)));
    m = mult(m, translate(0.0, -0.5 * torsoHeight, 0.0));


    m = mult(m, translate(translation[0] + 0.5 * torsoWidth, translation[1] + 0.5 * torsoHeight, translation[2] + 0.5 * torsoWidth));
    m = mult(m, rotate(torsoRotation[0], vec3(1, 0, 0)));
    m = mult(m, translate(-(translation[0] + 0.5 * torsoWidth), -(translation[1] + 0.5 * torsoHeight), -(translation[2] + 0.5 * torsoWidth)));

    //Kangaroo's Jump
    m = mult(m, translate(translation[0], translation[1], translation[2] + jumpheight));

    figure[torsoId] = createNode(m, torso, null, headId);
}
function setArms() {
    var m = translate(-(0.2 * torsoWidth + upperArmWidth), 0.8 * torsoHeight, 0.0);
    m = mult(m, rotate(armRotation, vec3(1, 0, 0)));
    figure[leftUpperArmId] = createNode(m, leftUpperArm, rightUpperArmId, leftLowerArmId);

    var m1 = translate(0.2 * torsoWidth + upperArmWidth, 0.8 * torsoHeight, 0.0);
    m1 = mult(m1, rotate(armRotation, vec3(1, 0, 0)));
    figure[rightUpperArmId] = createNode(m1, rightUpperArm, leftUpperLegId, rightLowerArmId);
}
function setLegs() {
    var m = translate(-(0.2 * torsoWidth + upperLegWidth), 0.3 * upperLegHeight, 0.0);
    m = mult(m, rotate(legRotation, vec3(1, 0, 0)));
    var m1 = translate(0.2 * torsoWidth + upperLegWidth, 0.3 * upperLegHeight, 0.0);
    m1 = mult(m1, rotate(legRotation, vec3(1, 0, 0)));
    figure[leftUpperLegId] = createNode(m, leftUpperLeg, rightUpperLegId, leftLowerLegId);
    figure[rightUpperLegId] = createNode(m1, rightUpperLeg, upperTailId, rightLowerLegId);
}
function setTail() {
    var m = translate(0.0, 0.0, 0.0);
    m = mult(m, rotate(upTailRotation, vec3(1, 0, 0)));
    figure[upperTailId] = createNode(m, upperTail, null, middleTailId);
}