// Handles defining and drawing ground
// called by user.js to change ground
// referenced by spline generation to get bounds
// ========================================================

let groundPoints;
let groundColors;

let splinePoints = [];
let splineSamples = [];
let splineColor = [];
let splineResolution = 40;

function defineGroundInitial() {
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

function drawGround() {
    pushUniform("mat4", mat4(), modelLoc);
    pushArrayData(groundPoints, 4, "vPosition");
    pushArrayData(groundColors, 4,"vColor");
    gl.drawArrays(gl.TRIANGLE_FAN, 0, groundPoints.length);

    // Draw pins at corners
    for (let i = 0; i < groundPoints.length; i++) {
        drawPin(groundPoints[i]);
    }
}

// draws a bin at that point such that the head of the pin is above it
function drawPin(point) {
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
    let colors = [];
    for (let i = 0; i < points.length; i++) {
        //colors.push(vec4(.5, .5 + points[i][1] / DETECTION_PLANE_HEIGHT / 2.0, .5, 1.0));
        colors.push(vec4(.8, .8, .8, 1.0));
    }

    pushArrayData(points, 4, posLoc);
    pushArrayData(colors, 4, colLoc);

    // Push translation for this pin
    let model = translate(point[0], point[1], point[2]);
    pushUniform("mat4", model, modelLoc);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, points.length);
}

function getGroundBounds() {
    let xs = groundPoints.map(p => p[0]);
    let zs = groundPoints.map(p => p[2]);

    return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minZ: Math.min(...zs),
        maxZ: Math.max(...zs)
    };
}

function getRandomGroundPoint() {
    let quad = groundPoints;

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
    if (splineSamples.length === 0) return;

    pushUniform("mat4", mat4(), modelLoc);
    pushArrayData(splineSamples, 4, posLoc);
    pushArrayData(splineColor, 4, colLoc);

    gl.drawArrays(gl.LINE_STRIP, 0, splineSamples.length);
}

function regenerateSpline() {
    splinePoints = getRandomGroundPoints(5);
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
