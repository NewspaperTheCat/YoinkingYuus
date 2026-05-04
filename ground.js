// Handles defining and drawing ground
// called by user.js to change ground
// referenced by spline generation to get bounds
// ========================================================

let groundNode

let splinePoints = [];
let splineSamples = [];
let splineColor = [];
let splineResolution = 50;

function defineGroundInitial() {
    let groundPoints = [
        vec4(-5, 0, 5, 1),
        vec4(5, 0, 5, 1),
        vec4(5, 0, -5, 1),
        vec4(-5, 0, -5, 1)
    ]
    let groundColors = oneColorArray(groundPoints, vec4(.6, .6, .6, 1.0));
    groundNode = new SceneNode(groundPoints, groundColors, gl.TRIANGLE_FAN, vec3(0, 0, 0), vec4(0, 0, 0, 1));
    for (let i = 0; i < groundPoints.length; i++) {
        let pin = createPin(groundPoints[i]);
        groundNode.children.push(pin);
    }
    sceneNode.children.push(groundNode)
}

// draws a bin at that point such that the head of the pin is above it
function createPin(point) {
    // define shape
    let baseRadius = .5;
    let v = [ // vertices
        vec4(0, 0, 0, 1), // bottom point
        vec4(-baseRadius, DETECTION_PLANE_HEIGHT, baseRadius, 1), // back left
        vec4(baseRadius, DETECTION_PLANE_HEIGHT, baseRadius, 1), // back right
        vec4(baseRadius, DETECTION_PLANE_HEIGHT, -baseRadius, 1), // front right
        vec4(-baseRadius, DETECTION_PLANE_HEIGHT, -baseRadius, 1) // front left
    ];
    let points = [
        v[0], v[2], v[1], // back triangle
        v[0], v[3], v[2], // right triangle
        v[0], v[4], v[3], // front triangle
        v[0], v[1], v[4], // left triangle

        v[1], v[2], v[3], // base half
        v[1], v[3], v[4], // second base half
    ];

    // define colors
    let colors = oneColorArray(points, vec4(.8, .8, .8, 1.0));

    return new SceneNode(points, colors, gl.TRIANGLE_FAN, point, vec4(0, 0, 0, 1));
}

function updateGroundPoint(index, point) {
    groundNode.points[index] = point;
    groundNode.children[index].pos = point;
}

function getGroundBounds() {
    let xs = groundNode.points.map(p => p[0]);
    let zs = groundNode.points.map(p => p[2]);

    return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minZ: Math.min(...zs),
        maxZ: Math.max(...zs)
    };
}

function getRandomGroundPoint() {
    let quad = groundNode.points;

    // bounding box for speed
    let b = getGroundBounds();

    while (true) {
        let x = b.minX + Math.random() * (b.maxX - b.minX);
        let z = b.minZ + Math.random() * (b.maxZ - b.minZ);
        let pt = vec4(x, 0, z, 1);

        if (pointInQuad(pt, quad)) {
            return pt;
        }
    }
}

function getRandomGroundPoints(n = 5) {
    let pts = [];
    for (let i = 0; i < n; i++) pts.push(getRandomGroundPoint());
    return pts;
}

function catmullRom(p0, p1, p2, p3, t) {
    let t2 = t * t;
    let t3 = t2 * t;

    let x = 0.5 * ((2*p1[0]) +
        (-p0[0] + p2[0]) * t +
        (2*p0[0] - 5*p1[0] + 4*p2[0] - p3[0]) * t2 +
        (-p0[0] + 3*p1[0] - 3*p2[0] + p3[0]) * t3);

    let y = 0.5 * ((2*p1[1]) +
        (-p0[1] + p2[1]) * t +
        (2*p0[1] - 5*p1[1] + 4*p2[1] - p3[1]) * t2 +
        (-p0[1] + 3*p1[1] - 3*p2[1] + p3[1]) * t3);

    let z = 0.5 * ((2*p1[2]) +
        (-p0[2] + p2[2]) * t +
        (2*p0[2] - 5*p1[2] + 4*p2[2] - p3[2]) * t2 +
        (-p0[2] + 3*p1[2] - 3*p2[2] + p3[2]) * t3);

    return vec4(x, y, z, 1);
}

function rebuildSpline() {
    if (splinePoints.length < 4) return;

    splineSamples = [];
    splineColor = [];

    for (let i = 0; i < splinePoints.length - 3; i++) {
        let p0 = splinePoints[i];
        let p1 = splinePoints[i+1];
        let p2 = splinePoints[i+2];
        let p3 = splinePoints[i+3];

        for (let t = 0; t <= 1; t += 1 / splineResolution) {
            let pt = catmullRom(p0, p1, p2, p3, t);
            splineSamples.push(pt);
            splineColor.push(vec4(1, 0, 0, 1)); // red spline
        }
    }
}

function drawSpline() {
    return // Unfortunately something I have done while integrating this has broke it
    // for demo day, we can just have the spline not show up visually, as it is working otherwise

    if (splineSamples.length === 0) return;

    pushUniform("mat4", mat4(), modelLoc);
    pushArrayData(splineSamples, 4, posLoc);
    pushArrayData(splineColor, 4, colLoc);

    console.log(splineSamples);

    gl.drawArrays(gl.LINE_STRIP, 0, splineSamples.length);
}

function regenerateSpline() {
    let yuuGrounded = vec4(yuu.pos[0], 0, yuu.pos[2], 1);
    splinePoints = [yuuGrounded, yuuGrounded]; // always start where the yuu is
    yuuPos = 0;
    splinePoints.push(...getRandomGroundPoints(4));
    rebuildSpline();
}

function pointInQuad(pt, quad) {
    // quad = [p0, p1, p2, p3] in order
    function edgeSign(a, b, p) {
        // 2D cross product sign
        return (b[0] - a[0]) * (p[2] - a[2]) - (b[2] - a[2]) * (p[0] - a[0]);
    }

    let p0 = quad[0], p1 = quad[1], p2 = quad[2], p3 = quad[3];

    let s1 = edgeSign(p0, p1, pt);
    let s2 = edgeSign(p1, p2, pt);
    let s3 = edgeSign(p2, p3, pt);
    let s4 = edgeSign(p3, p0, pt);

    // All signs must be >= 0 or all <= 0
    let hasPos = (s1 >= 0) && (s2 >= 0) && (s3 >= 0) && (s4 >= 0);
    let hasNeg = (s1 <= 0) && (s2 <= 0) && (s3 <= 0) && (s4 <= 0);

    return hasPos || hasNeg;
}
