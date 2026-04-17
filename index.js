//=====================================================
// Yoinking Yuus
// James Prendergast, Zack Robinson, Trey Bowen
//=====================================================


let gl;
let program;
let canvas;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas, null);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.9, 1.0, 1.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    render();
};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    requestAnimationFrame(render);
}