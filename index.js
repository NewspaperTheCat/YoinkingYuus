//=====================================================
// Yoinking Yuus
// James Prendergast, Zack Robinson, Trey Bowen
//=====================================================

let gl;
let program;
let canvas;

let groundPoints;
let groundColors;

let eye = vec3(0, 3, 5);
let at = vec3(0, 0, 0);
let up = vec3(0, 1, 0);

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas, null);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.9, 1.0, 1.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    let cam = lookAt(eye, at, up);
    let proj = perspective(120, 1, .1, 10);
    pushUniform("mat4", mult(proj, cam), "viewMatrix");
    pushUniform("mat4", mat4(), "modelMatrix");

    defineGround();

    render();
};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    pushArrayData(groundPoints, 4, "vPosition");
    pushArrayData(groundColors, 4,"vColor");
    gl.drawArrays(gl.TRIANGLE_FAN, 0, groundPoints.length);

    requestAnimationFrame(render);
}

function defineGround() {
    groundPoints = [
        vec4(-5, 0, 5, 1),
        vec4(5, 0, 5, 1),
        vec4(5, 0, -5, 1),
        vec4(-5, 0, -5, 1)
    ]
    groundColors = [];
    for (let i = 0; i < groundPoints.length; i++) {
        groundColors.push(vec4(.6, .6, .6, 1.0));
    }
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
