// Contains camera related information
// handles mouse detection and user inputs
// ===============================================

let eye = vec3(0, 6, 3);
let at = vec3(0, 0, 0);
let up = vec3(0, 1, 0);

let selectedType = ""; // string containing the type of selected, "" for none
let selected; // Nebulous depending on type context

const DETECTION_PLANE_HEIGHT = 1.0;
const HOLD_DISTANCE = 2;
const GRAB_DISTANCE = 1;

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
    if (selectedType !== "") return; // still holding something that wasn't properly released
    let where = getWorldClick(e);

    let closestDis = GRAB_DISTANCE; // max range
    let closestType = ""
    let closest = -1; // nebulous thing depending on context

    if (where != null) {
        // check ground pins
        for (let i = 0; i < groundPoints.length; i++) {
            let p = groundPoints[i];
            let dis = length(subtract(p, where));
            if (dis < closestDis) {
                closestDis = dis;
                closestType = "pin";
                closest = i;
            }
        }

        // check Yuus
        for (let i = 0; i < yuus.length; i++) {
            let p = yuus[i];
            let dis = length(subtract(p, where));
            if (dis < closestDis) {
                closestDis = dis;
                closestType = "yuu";
                closest = i;
            }
        }
    }

    // map to global for on-move use
    selectedType = closestType;
    selected = closest;

    // set yuu_state if applicable
    switch (selectedType) {
        case "yuu":
            yuu_states[selected] = 1
            break;
    }

    // Update cursor
    if (selectedType !== "") {
        setCursor("grabbing");
    }
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
            let where3 = vec3(where[0], where[1], where[2])
            let n = subtract(where3, eye);
            let dir = normalize(n);
            let pos = add(scale(HOLD_DISTANCE, dir), eye);
            yuus[selected] = vec4(pos[0], pos[1] - DETECTION_PLANE_HEIGHT, pos[2], 1.0);
            break;
        // ignore if we found nothing
    }

    // on hover cursor change logic
    if (selectedType === "") {
        // check ground pins
        for (let i = 0; i < groundPoints.length; i++) {
            let p = groundPoints[i];
            let dis = length(subtract(p, where));
            if (dis < GRAB_DISTANCE) {
                setCursor("grab");
                return;
            }
        }

        // check Yuus
        for (let i = 0; i < yuus.length; i++) {
            let p = yuus[i];
            let dis = length(subtract(p, where));
            if (dis < GRAB_DISTANCE) {
                setCursor("grab");
                return;
            }
        }
        setCursor("pointer");
    }
}

function handleRelease(e) {
    // check for release behavior
    let where = getWorldClick(e);
    switch (selectedType) {
        case "yuu":
            if (where == null) return; // don't release yuu into the void

            // Where is the target landing location
            let t = Math.sqrt((eye[1] - where[1]) / GRAVITY / GRAVITY)
            let v_x = (where[0] - eye[0]) / t
            let v_z = (where[2] - eye[2]) / t

            yuu_vels[selected] = vec4(v_x, 0, v_z, 0);
            yuu_states[selected] = 2; // into freefall
            console.log(where)
            break;
    }

    selectedType = "";
    selected = -1;
    setCursor("pointer");
}

// sets cursor type to specified
function setCursor(cursor) {
    canvas.style.cursor = cursor;
}