import * as BABYLON from 'babylonjs';
import SoftEngine from "./SoftEngine";
import monkey from "./monkey";
import blenderCube from './cube';

let canvas: HTMLCanvasElement;
let device: SoftEngine.Device;
let cube: SoftEngine.Mesh;
let anotherCube: SoftEngine.Mesh;
let suzanne: SoftEngine.Mesh;
let meshes: SoftEngine.Mesh[];
let camera: SoftEngine.Camera;

document.addEventListener("DOMContentLoaded", init, false);

function init(){
    console.log("Initializing the basic components")

    // Basic rendering components
    canvas = <HTMLCanvasElement> document.getElementById("frontBuffer");
    camera = new SoftEngine.Camera();
    device = new SoftEngine.Device(canvas);

    // Creating our meshes
    cube = new SoftEngine.Mesh("cube", 8, 12);
    cube.Vertices[0] = new BABYLON.Vector3(-1, 1, 1);
    cube.Vertices[1] = new BABYLON.Vector3(1, 1, 1);
    cube.Vertices[2] = new BABYLON.Vector3(-1, -1, 1);
    cube.Vertices[3] = new BABYLON.Vector3(1, -1, 1);
    cube.Vertices[4] = new BABYLON.Vector3(-1, 1, -1);
    cube.Vertices[5] = new BABYLON.Vector3(1, 1, -1);
    cube.Vertices[6] = new BABYLON.Vector3(1, -1, -1);
    cube.Vertices[7] = new BABYLON.Vector3(-1, -1, -1);
    cube.Faces[0] = { A:0, B:1, C:2 };
    cube.Faces[1] = { A:1, B:2, C:3 };
    cube.Faces[2] = { A:1, B:3, C:6 };
    cube.Faces[3] = { A:1, B:5, C:6 };
    cube.Faces[4] = { A:0, B:1, C:4 };
    cube.Faces[5] = { A:1, B:4, C:5 };
    cube.Faces[6] = { A:2, B:3, C:7 };
    cube.Faces[7] = { A:3, B:6, C:7 };
    cube.Faces[8] = { A:0, B:2, C:7 };
    cube.Faces[9] = { A:0, B:4, C:7 };
    cube.Faces[10] = { A:4, B:5, C:6 };
    cube.Faces[11] = { A:4, B:6, C:7 };

    console.log("creating meshes")
    meshes = [
        // cube,
        suzanne = device.CreateMeshesFromJSON(monkey)[0],
        // anotherCube = device.CreateMeshesFromJSON(blenderCube)[0],
    ]
    console.log("Done creating meshes")

    // point the camera at our mesh
    console.log("pointing the camera at target")
    camera.Position = new BABYLON.Vector3(0, 0, 10);
    camera.Target = new BABYLON.Vector3(0, 0, 0);

    // call the HTML5 rendering loop
    console.log("Requesting first animation frame")
    requestAnimationFrame(drawingLoop);
}

// rendering loop handler
function drawingLoop() {
    device.clear();

    // Rotate the meshes a bit each frame
    const meshesLength = meshes.length;
    for (let i = 0; i < meshesLength; i++){
        // meshes[i].Rotation.x += 0.01;
        meshes[i].Rotation.y += 0.01;
    }

    // Doing all the matrix things
    // console.log("Rendering meshes")
    device.render(camera, meshes);

    // Flushing the back buffer into the front buffer
    // console.log("Presenting...")
    device.present();

    // Recursively call the rendering loop
    requestAnimationFrame(drawingLoop);
}