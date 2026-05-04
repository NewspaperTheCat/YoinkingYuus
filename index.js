//=====================================================
// Yoinking Yuus — Unified Humanoid + Spline Version
// James Prendergast, Zack Robinson, Trey Bowen
//=====================================================

const RED = vec4(1, 0, 0, 1);
const YELLOW = vec4(1, 1, 0, 1);
const GREEN = vec4(0, 1, 0, 1);
const CYAN = vec4(0, 1, 1, 1);
const BLUE = vec4(0, 0, 1, 1);
const PURPLE = vec4(1, 0, 1, 1);
const WHITE = vec4(1, 1, 1, 1);
const BLACK = vec4(0, 0, 0, 1);

let gl;
let program;
let canvas;

let camMatrix;
let projMatrix;

let modelLoc;
let posLoc;
let colLoc;

let sceneNode;
let yuu;
let yuuPos = 0;
let yuuSpeed = 0.002;
let yuuDir = 1; //+1 = forward, -1 = backward

let yuus = [];

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas, null);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.9, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    camMatrix = lookAt(eye, at, up);
    projMatrix = perspective(120, 1, .1, 15);
    pushUniform("mat4", mult(projMatrix, camMatrix), "viewMatrix");

    modelLoc = gl.getUniformLocation(program, "modelMatrix");
    pushUniform("mat4", mat4(), modelLoc);

    posLoc = gl.getAttribLocation(program, "vPosition");
    colLoc = gl.getAttribLocation(program, "vColor");

    defineGroundInitial();
    regenerateSpline();

    initScene();

    canvas.addEventListener("mousedown", (event) => handleClick(event));
    canvas.addEventListener("mousemove", (event) => handleMouseMove(event));
    canvas.addEventListener("mouseup",   (event) => handleRelease(event));

    render();
};



function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    updateYuuPosition();

    drawGround();
    drawSpline();

    drawNode(sceneNode);

    requestAnimationFrame(render);
}



function initScene() {
    sceneNode = SceneNode([], [], gl.LINES, vec3(0,0,0), vec4(0,0,0,1), vec3(1,1,1), vec3(0,0,0));

    let model = Yuu();

    yuu = SceneNode([], [], gl.LINES,
        vec3(0, 3, -3),
        vec4(0, 0, 0, 1),
        vec3(0.1, 0.1, 0.1),
        vec3(0, 0, 0)
    );

    yuu.model = model;
    yuu.children.push(model.body);

    sceneNode.children.push(yuu);
    yuus.push(yuu);
}


function updateYuuPosition() {
    if (!splineSamples || splineSamples.length < 2) return;

    yuuPos += yuuSpeed * yuuDir;

    //switch direction at end
    if (yuuPos >= 1) {
        yuuPos = 1;
        yuuDir = -1;
    }
    if (yuuPos <= 0) {
        yuuPos = 0;
        yuuDir = 1;
    }

    let idx = Math.floor(yuuPos * (splineSamples.length - 1));
    idx = Math.max(0, Math.min(idx, splineSamples.length - 1));

    let p = splineSamples[idx];

    yuu.pos = vec3(p[0], p[1] + 1, p[2]);

    //determine next index based on direction
    let nextIdx = idx + yuuDir;

    //fix NaN error
    if (nextIdx < 0) nextIdx = 1;
    if (nextIdx >= splineSamples.length) nextIdx = splineSamples.length - 2;

    let nextP = splineSamples[nextIdx];

    let dir = subtract(nextP, p);
    dir = normalize(vec3(dir[0], dir[1], dir[2]));

    yuu.rot = directionToQuat(dir);
}


function directionToQuat(dir) {
    let forward = vec3(0, 0, 1);

    let d = normalize(dir);
    let dotp = dot(forward, d);

    if (Math.abs(dotp - 1) < 0.0001)
        return vec4(0, 0, 0, 1);
    if (Math.abs(dotp + 1) < 0.0001)
        return vec4(0, 1, 0, 0);

    let axis = normalize(cross(forward, d));
    let angle = Math.acos(dotp);

    let s = Math.sin(angle / 2);
    return normalize(vec4(axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(angle / 2)));
}

function pushUniform(type, value, location) {
    if (typeof location === 'string') location = gl.getUniformLocation(program, location);
    switch (type) {
        case "bool":
        case "int":   gl.uniform1i(location, value); break;
        case "vec1":
        case "float": gl.uniform1fv(location, [value]); break;
        case "vec4":  gl.uniform4fv(location, flatten(value)); break;
        case "mat4":  gl.uniformMatrix4fv(location, false, flatten(value)); break;
    }
}

function pushArrayData(array, size, location) {
    let buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(array), gl.STATIC_DRAW);

    if (typeof location === 'string') location = gl.getAttribLocation(program, location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location);
}


function SceneNode(points, colors, glDrawType, pos, rot, scale, pivot) {
    return {
        points: points,
        colors: colors,
        glDrawType: glDrawType,
        pos: pos,
        rot: rot,
        scale: scale,
        pivot: pivot,
        children: []
    };
}

let mvStack = [];
let mvMatrix = mat4();

function drawNode(node) {
    mvStack.push(mvMatrix);

    let modelMatrix = transform(node.pos, node.rot, node.scale, node.pivot);
    mvMatrix = mult(mvMatrix, modelMatrix);

    pushUniform("mat4", mvMatrix, modelLoc);

    if (node.points.length > 0) {
        pushArrayData(node.points, 4, posLoc);
        pushArrayData(node.colors, 4, colLoc);
        gl.drawArrays(node.glDrawType, 0, node.points.length);
    }

    for (let child of node.children)
        drawNode(child);

    mvMatrix = mvStack.pop();
}

function Yuu() {
    let cube = Cube();

    let forearm1 = SceneNode(cube, oneColorArray(cube, YELLOW), gl.TRIANGLES,
        vec3(0, -2, 0), vec4(0,0,0,1), vec3(0.5,1,0.5), vec3(0,1,0));

    let arm1 = SceneNode(cube, oneColorArray(cube, PURPLE), gl.TRIANGLES,
        vec3(4/3, 0.5, 0), vec4(0,0,0,1), vec3(1/3,0.5,0.5), vec3(0,0.5,0));
    arm1.children.push(forearm1);

    let forearm2 = SceneNode(cube, oneColorArray(cube, YELLOW), gl.TRIANGLES,
        vec3(0, -2, 0), vec4(0,0,0,1), vec3(0.5,1,0.5), vec3(0,1,0));

    let arm2 = SceneNode(cube, oneColorArray(cube, PURPLE), gl.TRIANGLES,
        vec3(-4/3, 0.5, 0), vec4(0,0,0,1), vec3(1/3,0.5,0.5), vec3(0,0.5,0));
    arm2.children.push(forearm2);

    let leg1 = SceneNode(cube, oneColorArray(cube, RED), gl.TRIANGLES,
        vec3(2/3, -2, 0), vec4(0,0,0,1), vec3(1/3,1,0.5), vec3(0,1,0));

    let leg2 = SceneNode(cube, oneColorArray(cube, RED), gl.TRIANGLES,
        vec3(-2/3, -2, 0), vec4(0,0,0,1), vec3(1/3,1,0.5), vec3(0,1,0));

    let head = SceneNode(cube, oneColorArray(cube, GREEN), gl.TRIANGLES,
        vec3(0, 1.5, 0), vec4(0,0,0,1), vec3(1,0.5,1));

    let body = SceneNode(cube, oneColorArray(cube, BLUE), gl.TRIANGLES,
        vec3(0, 0, 0), vec4(0,0,0,1), vec3(2,4,2));
    body.children.push(head, arm1, arm2, leg1, leg2);

    return { body };
}

function quad(a, b, c, d) {
    return [a,b,c, c,b,d];
}

function Cube() {
    let v = [
        vec4(1,1,1,1), vec4(1,1,-1,1), vec4(1,-1,1,1), vec4(1,-1,-1,1),
        vec4(-1,1,1,1), vec4(-1,1,-1,1), vec4(-1,-1,1,1), vec4(-1,-1,-1,1)
    ];
    return [].concat(
        quad(v[1],v[3],v[5],v[7]),
        quad(v[0],v[2],v[4],v[6]),
        quad(v[0],v[1],v[4],v[5]),
        quad(v[2],v[6],v[3],v[7]),
        quad(v[4],v[5],v[6],v[7]),
        quad(v[0],v[1],v[2],v[3])
    );
}

function oneColorArray(points, color) {
    return points.map(() => color);
}

function transform(pos, rot, s, pivot) {
    if (!pivot) pivot = vec3(0,0,0);
    if (!Array.isArray(s)) s = vec3(s,s,s);

    let T1 = translate(pivot[0], pivot[1], pivot[2]);
    let R  = quatToMat(rot);
    let T2 = translate(-pivot[0], -pivot[1], -pivot[2]);
    let S  = scalem(s[0], s[1], s[2]);

    return mult(translate(pos[0], pos[1], pos[2]), mult(mult(T1, R), mult(T2, S)));
}

function quatToMat(q) {
    let x=q[0], y=q[1], z=q[2], s=q[3];
    let m = mat4();

    m[0][0] = 1 - 2*(y*y + z*z);
    m[0][1] = 2*(x*y - s*z);
    m[0][2] = 2*(x*z + s*y);

    m[1][0] = 2*(x*y + s*z);
    m[1][1] = 1 - 2*(x*x + z*z);
    m[1][2] = 2*(y*z - s*x);

    m[2][0] = 2*(x*z - s*y);
    m[2][1] = 2*(y*z + s*x);
    m[2][2] = 1 - 2*(x*x + y*y);

    return m;
}
