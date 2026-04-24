// Contains camera related information
// handles mouse detection and user inputs
// ===============================================

let eye = vec3(0, 6, 3);
let at = vec3(0, 0, 0);
let up = vec3(0, 1, 0);

let selectedType = ""; // string containing the type of selected, "" for none
let selected; // Nebulous depending on type context

const DETECTION_PLANE_HEIGHT = 1.0;

// takes a mouse event
// returns a point at y=0 underneath the intersect at DETECTION_PLANE_HEIGHT
// returns a vec4
function getWorldClick(e) {
    // center the input to canvas coordinates
    let screenX = e.clientX - canvas.getBoundingClientRect().left;
    let screenY = e.clientY - canvas.getBoundingClientRect().top;
    let centeredX = (2.0 * screenX) / canvas.width - 1.0;
    let centeredY = 1.0 - (2.0 * screenY) / canvas.height;
    let screenPos = vec4(centeredX, centeredY, -1.0, 1.0);

    // get the position without the project matrix
    let iprojection = inverse4(projMatrix)
    let eyeRay = mult(iprojection, screenPos);
    eyeRay[2] = -1.0;
    eyeRay[3] = 0.0;

    // get a ray into the world
    let imv = inverse4(camMatrix);
    let worldRay = mult(imv, eyeRay);
    let worldDir = normalize(vec3(worldRay[0], worldRay[1], worldRay[2]));
    // console.log("world dir: " + worldDir);

    // Operating off assumption that camera is above FLOOR PLANE
    // see if this is angled sufficiently downwards
    let downAngle = dot(negate(up), worldDir);
    let acceptableThreshold = .2 // must be greater than
    // console.log("down angle: " + downAngle);

    if (downAngle >= acceptableThreshold) {
        // valid click input, get world position and send findings
        let s = -(eye[1] - DETECTION_PLANE_HEIGHT) / worldDir[1];
        let worldPos = add(scale(s, worldDir), eye);
        return vec4(worldPos[0], 0, worldPos[2], 1.0);
    }
    return null;
}

function handleClick(e) {
    let where = getWorldClick(e);

    let closestDis = 1; // max range
    let closestType = ""
    let closest = -1; // nebulous thing depending on context

    if (where != null) {
        for (let i = 0; i < groundPoints.length; i++) {
            let p = groundPoints[i];

            let dis = length(subtract(p, where));
            if (dis < closestDis) {
                closestDis = dis;
                closestType = "pin";
                closest = i;
            }
        }
    }

    // map to global for on-move use
    selectedType = closestType;
    selected = closest;
}

function handleMouseMove(e) {
    let where = getWorldClick(e)
    if (where == null) return;
    // apply action to closest, whatever it may be
    switch (selectedType) {
        case "pin":
            groundPoints[selected] = where;
            break;
        case "yuu":
            break;
        // ignore if we found nothing
    }
}

function handleRelease(e) {
    selectedType = "";
    selected = -1;
}