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
let cube;
let sceneNode;
let yuu_vels;
let yuu_states; // 0 = wander, 1 = grabbed, 2 = freefall
const GRAVITY = 1

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
    let num_yuus = 3;
    yuus = [];
    yuu_vels = [];
    yuu_states = [];
    for (let i = 0; i < num_yuus; ++i) {
        yuus.push(vec4(i, 0, 0, 1));
        yuu_vels.push(vec4(0, 0, 0, 0));
        yuu_states.push(0);
    }

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

    // update yuus
    updateYuus();

    drawGround();
    drawYuus();

    requestAnimationFrame(render);
}

// =====================================
// WebGL Interfacing

/**
 * Pushes a uniform to the shader.
 * Can provide a uniform memory location,
 * otherwise initializes its own one-time-use location using location as the name
 * @param {string} type The type of value being passed in
 * @param {*} value The value to push to the shader uniform
 * @param {string|WebGLUniformLocation} location The location of 
 */
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

/**
 * Pushes an array provided data, size, and location to the vertex shader
 * @param {float[]} array The array of values that represent the vectors being pushed
 * @param {string | GLint} name The shader location to push to. Must be exactly the same as the name in the vertex shader
 * @param {int} size The size of each vertex to interpret array as
 */
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


/*************
 * HIERARCHY *
 *************/

/**
 * Represents a node in scene tree that can be drawn, containing object information, a model matrix, and children nodes
 * @param {Vec4[]} points The verticies of the object
 * @param {Vec4[]} colors The colors of the verticies
 * @param {glDrawType} glDrawType The draw type of the object e.g. gl.LINES, gl.TRIANGLES
 * @param {Vec3} pos The position of the object
 * @param {Vec4} rot Quaternion representing rotation
 * @param {Vec3} scale How much each axis should be scaled
 * @param {Vec3} pivot The pivot point of rot
 * @returns {SceneNode}
 */
function SceneNode(points, colors, glDrawType, pos, rot, scale, pivot) {
    return { points: points, colors: colors, glDrawType: glDrawType, pos: pos, rot: rot, pivot: pivot, scale: scale, children: [] };
}
let stack = [];
let mvMatrix = translate(0, 0, 0);

/**
 * Draw the passed in node and draw its children transformed relative to this node
 * @param {SceneNode} node 
 */
function drawNode(node) {
    stack.push(mvMatrix);
    let modelMatrix = transform(node.pos, node.rot, node.scale, node.pivot);

    mvMatrix = mult(mvMatrix, modelMatrix);

    pushUniform("mat4", mvMatrix, "vModel");

    pushArrayData(node.points, "vPosition", 4);
    pushArrayData(node.colors, "vColor", 4);

    gl.drawArrays(node.glDrawType, 0, node.points.length);

    for (var child of node.children)
        drawNode(child);

    mvMatrix = stack.pop();
}

// ======================================================


// Temporary Yuu Drawing
function drawYuus() {
    for (let i = 0; i < yuus.length; i++) {
        drawTriangle(yuus[i]);
    }
}
/**
 * Create a humanoid figure to do animations with
 * @returns An object containing all the parts of the humanoid
 */
function Yuu() {
    //A unit cube to scale around to for the humanoid 
    // (stored to only calculate once for the whole model)
    let cube = Cube();

    let forearm1 = SceneNode(cube, oneColorArray(cube, YELLOW), gl.TRIANGLES, vec3(0, -2, 0), vec4(0, 0, 0, 1), vec3(1 / 2, 1, 1 / 2), vec3(0, 1, 0));
    let arm1 = SceneNode(cube, oneColorArray(cube, PURPLE), gl.TRIANGLES, vec3(4 / 3, 1 / 2, 0), vec4(0, 0, 0, 1), vec3(1 / 3, 1 / 2, 1 / 2), vec3(0, .5, 0));
    arm1.children.push(forearm1);

    let forearm2 = SceneNode(cube, oneColorArray(cube, YELLOW), gl.TRIANGLES, vec3(0, -2, 0), vec4(0, 0, 0, 1), vec3(1 / 2, 1, 1 / 2), vec3(0, 1, 0));
    let arm2 = SceneNode(cube, oneColorArray(cube, PURPLE), gl.TRIANGLES, vec3(-4 / 3, 1 / 2, 0), vec4(0, 0, 0, 1), vec3(1 / 3, 1 / 2, 1 / 2), vec3(0, .5, 0));
    arm2.children.push(forearm2);

    let leg1 = SceneNode(cube, oneColorArray(cube, RED), gl.TRIANGLES, vec3(2 / 3, -6 / 3, 0), vec4(0, 0, 0, 1), vec3(1 / 3, 1, 1 / 2), vec3(0, 1, 0));
    let leg2 = SceneNode(cube, oneColorArray(cube, RED), gl.TRIANGLES, vec3(-2 / 3, -6 / 3, 0), vec4(0, 0, 0, 1), vec3(1 / 3, 1, 1 / 2), vec3(0, 1, 0));

    let head = SceneNode(cube, oneColorArray(cube, GREEN), gl.TRIANGLES, vec3(0, 1.5, 0), vec4(0, 0, 0, 1), vec3(1, 1 / 2, 1));

    let body = SceneNode(cube, oneColorArray(cube, BLUE), gl.TRIANGLES, vec3(0, 0, 0), vec4(0, 0, 0, 1), vec3(2, 4, 2));
    body.children.push(head);
    body.children.push(arm1);
    body.children.push(arm2);
    body.children.push(leg1);
    body.children.push(leg2);

    return { head: head, body: body, arms: [arm1, arm2], forearms: [forearm1, forearm2], legs: [leg1, leg2] };
}

function drawTriangle(pos) {
    let model = translate(pos[0], pos[1], pos[2]);
    let points = [
        vec4(-.75, 0, 0, 1.0),
        vec4(.75, 0, 0, 1.0),
        vec4(0, 1.5, 0, 1.0)
    ]
    let colors = [
        vec4(1, 1, 1, 1), vec4(1, 1, 1, 1), vec4(1, 1, 1, 1)
    ]

    pushArrayData(points, 4, posLoc);
    pushArrayData(colors, 4, colLoc);
    pushUniform("mat4", model, modelLoc);
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
}

/**
 * Create a list of vertecies to push to the vertex shader to make a quadrilateral
 * @param {Vec4} a The first vertex
 * @param {Vec4} b The second vertex
 * @param {Vec4} c The third vertex
 * @param {Vec4} d The fourth vertex
 * @returns A list of points representing a quadrilateral
 */
function quad(a, b, c, d) {
    let t1 = [a, b, c];
    let t2 = [c, b, d];
    let points = t1.concat(t2);
    return points;
}

/**
 * Create a list of vertecies to push to the vertex shader to make a cube
 * @returns A list of points representing a cube
 */
function Cube() {
    let vertecies = [
        vec4(1, 1, 1, 1),
        vec4(1, 1, -1, 1),
        vec4(1, -1, 1, 1),
        vec4(1, -1, -1, 1),
        vec4(-1, 1, 1, 1),
        vec4(-1, 1, -1, 1),
        vec4(-1, -1, 1, 1),
        vec4(-1, -1, -1, 1),
    ];
    let front = quad(vertecies[1], vertecies[3], vertecies[5], vertecies[7]);
    let back = quad(vertecies[0], vertecies[2], vertecies[4], vertecies[6]);
    let top = quad(vertecies[0], vertecies[1], vertecies[4], vertecies[5]);
    let bottom = quad(vertecies[2], vertecies[6], vertecies[3], vertecies[7]);
    let right = quad(vertecies[4], vertecies[5], vertecies[6], vertecies[7]);
    let left = quad(vertecies[0], vertecies[1], vertecies[2], vertecies[3]);

    let points = front.concat(back, top, bottom, right, left);


    return points;
}


/**
 * Creates a list of colors that will correspond to the vetecies of Cube() in order to make the faces the designated colors
 * @param {Vec4} front The color of the front face
 * @param {Vec4} back The color of the back face
 * @param {Vec4} top The color of the top face
 * @param {Vec4} bottom The color of the bottom face
 * @param {Vec4} right The color of the right face
 * @param {Vec4} left The color of the left face
 * @returns {Vec4[]}A list of colors
 */
function cubeColorsArray(front, back, top, bottom, right, left) {
    let faces = [front, back, top, bottom, right, left]
    let colors = [];
    for (var i = 0; i < 36; i++) {
        colors.push(faces[Math.floor(i / 6)]);
    }
    return colors;
}
/**
 * Creates a list of colors that will correspond to the passed set of points
 * @param {Vec4[]} points The set of points of the object to color (only length is used)
 * @param {Vec4} color The color to apply to all points
 * @returns {Vec4[]} A list of colors
 */
function oneColorArray(points, color) {
    let clrs = [];
    for (let _ of points) {
        clrs.push(color);
    }
    return clrs;
}


/**
 * Initializes the node for the scene, creating and adding the humanoid to the tree
 * Update this to add things to the starting world
 */
function initScene() {

    sceneNode = SceneNode([], [], gl.LINES, scale(-1, eye), vec4(0.3826834, 0, 0, 0.9238795), 1, eye);

    humanoid = Humanoid();
    sceneNode.children.push(humanoid.body);

    floor = SceneNode(cube, oneColorArray(cube, vec4(0.5, 0.5, 0.5, 1)),
        gl.TRIANGLES, vec3(0, -10, 0), vec4(0, 0, 0, 1), vec3(100, 0, 100), vec3(0, 0, 0));

    sceneNode.children.push(floor);
}

/****************
 * HELPFUL MATH *
 ****************/
/**
 * A spherical linear interpolation between two unit quaternions
 * @param {Vec4} q1 Starting unit quaternion
 * @param {Vec4} q2 Ending unit quaternion
 * @param {float} t The degree of interpolation between q1 and q2 (a value between 0 and 1)
 * @returns A unit quaternion interpolated between q1 and q2, q1 if t=0, q2 if t=1
 */
function slerp(q1, q2, t) {
    let d = dot(q1, q2);
    if (d < 0)
        q2 = scale(-1, q2);
    let theta = Math.acos(Math.abs(d));
    let c1 = Math.sin((1 - t) * theta) / Math.sin(theta);
    let c2 = Math.sin(t * theta) / Math.sin(theta);
    return add(scale(c1, q1), scale(c2, q2));
}
/**
 * Calculates a matrix the rotates, then scales, then translates all in the specified ways
 * @param {Vec3} pos The x y and z translations to apply
 * @param {Vec4} rot The quaternion representing the rotation to apply
 * @param {float[]} s The scaling factor to apply to each axis
 * @param {Vec3} pivot The point to pivot the rotation around
 * @returns {Mat4} The resulting matrix
 */
function transform(pos, rot, s, pivot) {
    if (pivot == null) {
        pivot = vec3(0, 0, 0)
    }
    let scal = s;
    if (!Array.isArray(s))
        scal = vec3(s, s, s);
    let trt = mult(mult(translate(...pivot), quatToMat(rot)), translate(...scale(-1, pivot)));
    return mult(mult(translate(...pos), trt), scalem(scal[0], scal[1], scal[2]));
}

/************************
 * ROTATION TRANSLATION *
*************************/
/** 
 * Turns Euler Angles into a quaternion
 * @param {float} x The x rotation
 * @param {float} y The y rotation
 * @param {float} z The z rotation
 * @returns {Vec4} The quaternion that represents the rotation   
 */
function eulerToQuat(x, y, z) {
    return matToQuat(eulerToMat(x, y, z));
}
/**
 * Turns Euler Angles into a rotation matrix
 * @param {float} x The x rotation
 * @param {float} y The y rotation
 * @param {float} z The z rotation
 * @returns {Mat4} The matrix that represents the rotation
 */
function eulerToMat(x, y, z) {
    let rotx = rotateX(x);
    let roty = rotateY(y);
    let rotz = rotateZ(z);

    return mult(mult(rotz, roty), rotx);
}
/**
 * Turns a rotation matrix into a quaternion
 * @param {Mat4} rotMat The rotation matrix
 * @returns {Vec4} The quaternion that represents the rotation
 */
function matToQuat(rotMat) {
    let s = Math.sqrt(rotMat[0][0] + rotMat[1][1] + rotMat[2][2] + rotMat[3][3]) / 2.0;
    let x, y, z;
    if (s == 0) {
        x = Math.sqrt((rotMat[0][0] + 1) / 2);
        y = Math.sqrt((rotMat[1][1] + 1) / 2);
        z = Math.sqrt((rotMat[2][2] + 1) / 2);
    } else {
        x = (rotMat[2][1] - rotMat[1][2]) / (4 * s);
        y = (rotMat[0][2] - rotMat[2][0]) / (4 * s);
        z = (rotMat[1][0] - rotMat[0][1]) / (4 * s);

    }
    let q = vec4(x, y, z, s);

    return normalize(q, false);
}
/**
 * Turns quaternions into a rotation matrix
 * @param {Vec4} q The quaternion
 * @returns {Mat4} The matrix that represents the rotation
 */
function quatToMat(q) {
    let x = q[0];
    let y = q[1];
    let z = q[2];
    let s = q[3];
    let rot = mat4();
    rot[0][0] = 1.0 - 2 * (y * y + z * z);
    rot[0][1] = 2 * (x * y - s * z);
    rot[0][2] = 2 * (s * y + x * z);
    rot[1][0] = 2 * (x * y + s * z);
    rot[1][1] = 1.0 - 2 * (x * x + z * z);
    rot[1][2] = 2 * (y * z - s * x);
    rot[2][0] = 2 * (x * z - s * y);
    rot[2][1] = 2 * (s * x + y * z);
    rot[2][2] = 1.0 - 2 * (x * x + y * y);
    return rot;
}
function updateYuus() {
    let delta = .04
    for (let i = 0; i < yuus.length; i++) {
        if (yuu_states[i] !== 2) continue;


        yuu_vels[i][1] -= GRAVITY * delta;
        yuus[i] = add(yuus[i], scale(delta, yuu_vels[i]));

        // see if we reached the ground
        if (yuus[i][1] <= 0) {
            yuus[i][1] = 0;
            yuu_states[i] = 0;
        }
    }
}
