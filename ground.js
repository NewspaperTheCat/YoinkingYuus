// Handles defining and drawing ground
// called by user.js to change ground
// referenced by spline generation to get bounds
// ========================================================

let groundPoints;
let groundColors;

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