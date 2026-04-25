//=====================================================
// Yoinking Yuus
// James Prendergast, Zack Robinson, Trey Bowen
//=====================================================

let gl;
let program;
let canvas;

let camMatrix;
let projMatrix;

let modelLoc;
let posLoc;
let colLoc;

// TODO Refactor with proper yuus
let yuus;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas, null);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.9, 1.0, 1.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    camMatrix = lookAt(eye, at, up);
    projMatrix = perspective(120, 1, .1, 15);
    pushUniform("mat4", mult(projMatrix, camMatrix), "viewMatrix");

    modelLoc = gl.getUniformLocation(program, "modelMatrix");
    pushUniform("mat4", mat4(), modelLoc);

    posLoc = gl.getAttribLocation(program, "vPosition");
    colLoc = gl.getAttribLocation(program, "vColor");

    // define ground
    defineGroundInitial();

    // place initial yuus
    yuus = [
        vec4(0, 0, 0, 1)
    ];

    // initial listeners
    canvas.addEventListener("mousedown",
        (event) => { handleClick(event) });
    canvas.addEventListener("mousemove",
        (event) => { handleMouseMove(event) });
    canvas.addEventListener("mouseup",
        (event) => { handleRelease(event) });


    render();
};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawGround();
    drawYuus();

    requestAnimationFrame(render);
}

// =====================================
// WebGL Interfacing

// Pushes a uniform to the shader
// can provide a uniform memory location,
// otherwise initializes its own one-time-use location using location as the name
function pushUniform(type, value, location) {
    if (typeof location === 'string') location = gl.getUniformLocation(program, location);
    switch (type) {
        case "bool":
        case "int":
            gl.uniform1i(location, value);
            break;
        case "vec1":
        case "float":
            gl.uniform1fv(location, [value]);
            break;
        case "vec4":
            gl.uniform4fv(location, flatten(value));
            break;
        case "mat4":
            gl.uniformMatrix4fv(location, false, flatten(value));
            break;
    }
}

// pushes an array provided data, size, and location
function pushArrayData(array, size, location) {
    // Position
    // Create Buffer
    let buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(array), gl.STATIC_DRAW);

    // Push Buffer
    if (typeof location === 'string') location = gl.getAttribLocation(program, location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location);
}

// ======================================================


// Temporary Yuu Drawing
function drawYuus() {
    for (let i = 0; i < yuus.length; i++) {
        drawTriangle(yuus[i]);
    }
}

function drawTriangle(pos) {
    let model = translate(pos[0], pos[1], pos[2]);
    let points = [
        vec4(-.75, 0, 0, 1.0),
        vec4(.75, 0, 0, 1.0),
        vec4(0, 1.5, 0, 1.0)
    ]
    let colors = [
        vec4(1,1,1,1), vec4(1,1,1,1), vec4(1,1,1,1)
    ]

    pushArrayData(points, 4, posLoc);
    pushArrayData(colors, 4, colLoc);
    pushUniform("mat4", model, modelLoc);
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
}