import * as BABYLON from 'babylonjs';

module SoftEngine {
    // Pt 1: Our basic objects:
    // An interface for faces;
    // A camera to point at thing;
    // A mesh to have something to point it at.

    export interface Face {
        A: number;
        B: number;
        C: number;
    }

    export class Camera {
        Position: BABYLON.Vector3;
        Target: BABYLON.Vector3;

        constructor(){
            this.Position = BABYLON.Vector3.Zero();
            this.Target = BABYLON.Vector3.Zero();
        }
    }

    export class Mesh {
        Position: BABYLON.Vector3;
        Rotation: BABYLON.Vector3;
        Vertices: BABYLON.Vector3[];
        Faces: Face[];

        constructor(public name: string, verticesCount: number, facesCount: number){
            this.Vertices = new Array(verticesCount);
            this.Faces = new Array(facesCount);
            this.Rotation = new BABYLON.Vector3(0, 0, 0);
            this.Position = new BABYLON.Vector3(0, 0, 0);
        }
    }

    // Pt 2: The device aka the core of the sofware renderer
    export class Device {
        // the back buffer is equal to the number of pixels to draw
        // multiplied by 4 to get the RGBA values for each pixel.
        private backbuffer: ImageData;
        private workingCanvas: HTMLCanvasElement;
        private workingContext: CanvasRenderingContext2D;
        private workingWidth: number;
        private workingHeight: number;
        private backbufferdata: Uint8ClampedArray;

        constructor(canvas: HTMLCanvasElement){
            this.workingCanvas = canvas;
            this.workingWidth = canvas.width;
            this.workingHeight = canvas.height;
            this.workingContext = this.workingCanvas.getContext("2d");
        }

        public CreateMeshesFromJSON(jsObject: any): Mesh[] {
            const meshes: Mesh[] = [];

            jsObject.meshes.forEach((importedMesh: { name: string, position: number[], vertices: number[], indices: number[], uvCount: number }) => {
                // The needed data from the model
                const verticesArray: number[] = importedMesh.vertices;
                const indicesArray: number[] = importedMesh.indices; // faces
                
                // Depending on the number of UV-coordinates per vertex, jump in the array by a certain amount
                let verticesStep: number;

                switch (importedMesh.uvCount) {
                    case 0:
                        verticesStep = 6;
                        break;
                    case 1:
                        verticesStep = 8;
                        break;
                    case 2:
                        verticesStep = 10;
                        break;
                    default:
                        verticesStep = 1;
                }
                
                // converting the imported mesh into a SoftEngine.Mesh object                
                const verticesCount = verticesArray.length / verticesStep;
                const facesCount = indicesArray.length / 3;                       // number of faces is logically the size of the array divided by 3 (A, B, C)
                const mesh = new SoftEngine.Mesh(importedMesh.name, verticesCount, facesCount);

                // Filling the mesh object:
                // 1. Vertices array
                for (let i = 0; i < verticesCount; i++) {
                    const x = verticesArray[i * verticesStep];
                    const y = verticesArray[i * verticesStep + 1];
                    const z = verticesArray[i * verticesStep + 2];
                    mesh.Vertices[i] = new BABYLON.Vector3(x, y, z);
                }

                // 2. Faces array
                for (let i = 0; i < facesCount; i++) {
                    const a = indicesArray[i * 3];
                    const b = indicesArray[i * 3 + 1];
                    const c = indicesArray[i * 3 + 2];
                    mesh.Faces[i] = { A: a, B: b, C: c };
                }

                // Getting the position
                const position = importedMesh.position;
                mesh.Position = new BABYLON.Vector3(position[0], position[1], position[2]);
                meshes.push(mesh);
            });
            return meshes;
        }

        // clear the back buffer with a specific color
        public clear(): void {
            // Clearing with black
            this.workingContext.clearRect(0, 0, this.workingWidth, this.workingHeight);

            // when cleared, get back to associated image data to clear out back buffer
            this.backbuffer = this.workingContext.getImageData(0, 0, this.workingWidth, this.workingHeight);
        }

        // once everything is ready, flush back buffer into front buffer
        public present(): void {
            this.workingContext.putImageData(this.backbuffer, 0, 0);
        }

        // put a pixel on screen at specific coordinates
        public putPixel(x: number, y: number, color: BABYLON.Color4): void {
            this.backbufferdata = this.backbuffer.data;

            // for the back buffer, get the 1d equivalent from the 2d coordinates of the screen
            let i: number = ((x >> 0) + (y >> 0) * this.workingWidth) * 4;

            // store the color data in backbuffer
            this.backbufferdata[i] = color.r * 255;
            this.backbufferdata[i + 1] = color.g * 255;
            this.backbufferdata[i + 2] = color.b * 255;
            this.backbufferdata[i + 3] = color.a * 255;
        }

        // takes 3d coordinates and transforms them into 2d coordinates using transformation matrix
        public project(coord: BABYLON.Vector3, transMat: BABYLON.Matrix): BABYLON.Vector2 {
            // transforming the coordinates
            const point = BABYLON.Vector3.TransformCoordinates(coord, transMat);

            // The transformed coordinates will be based on coordinate system
            // starting on the center of the screen. But drawing on screen normally starts
            // from top left. We then need to transform them again to have x:0, y:0 on top left.
            const x = point.x * this.workingWidth + this.workingWidth / 2.0 >> 0;
            const y = -point.y * this.workingHeight + this.workingHeight / 2.0 >> 0;
            return (new BABYLON.Vector2(x, y));
        }

        // put a pixel after clipping what needs to be clipped
        public drawPoint(point: BABYLON.Vector2): void {
            // Clipping whats visible
            if (point.x >= 0 && point.y >= 0 && point.x < this.workingWidth && point.y < this.workingHeight){
                
                // draw a yellow point
                this.putPixel(point.x, point.y, new BABYLON.Color4(1, 1, 0, 1));
            }
        }

        public drawLine(point0: BABYLON.Vector2, point1: BABYLON.Vector2): void {
            let x0 = point0.x >> 0;
            let y0 = point0.y >> 0;
            const x1 = point1.x >> 0;
            const y1 = point1.y >> 0;
            const dx = Math.abs(x1 - x0);
            const dy = Math.abs(y1 - y0);
            const sx = (x0 < x1) ? 1 : -1;
            const sy = (y0 < y1) ? 1 : -1;
            let err = dx - dy;

            while (true) {
                this.drawPoint(new BABYLON.Vector2(x0, y0));
        
                if ((x0 == x1) && (y0 == y1)) break;
                const e2 = 2 * err;
                if (e2 > -dy) { err -= dy; x0 += sx; }
                if (e2 < dx) { err += dx; y0 += sy; }
            }
        }

        // the main method of the engine that recomputes each vertex projection during each frame
        public render(camera: Camera, meshes: Mesh[]): void {
            let viewMatrix = BABYLON.Matrix.LookAtLH(camera.Position, camera.Target, BABYLON.Vector3.Up());
            let projectionMatrix = BABYLON.Matrix.PerspectiveFovLH(0.78, this.workingWidth / this.workingHeight, 0.01, 1.0);

            const meshesLength = meshes.length;
            for (let i = 0; i < meshesLength; i++) {
                const cMesh = meshes[i];

                // apply rotation before translation
                const rotation = BABYLON.Matrix.RotationYawPitchRoll(cMesh.Rotation.y, cMesh.Rotation.x, cMesh.Rotation.z)
                const translation = BABYLON.Matrix.Translation(cMesh.Position.x, cMesh.Position.y, cMesh.Position.z)

                const worldMatrix = rotation.multiply(translation)
                const transformMatrix = worldMatrix.multiply(viewMatrix).multiply(projectionMatrix);
                
                const facesLength = cMesh.Faces.length;
                for (let j = 0; j < facesLength; j++){
                    const cFace = cMesh.Faces[j]
                    
                    const vertexA = cMesh.Vertices[cFace.A];
                    const vertexB = cMesh.Vertices[cFace.B];
                    const vertexC = cMesh.Vertices[cFace.C];

                    const pixelA = this.project(vertexA, transformMatrix);
                    const pixelB = this.project(vertexB, transformMatrix);
                    const pixelC = this.project(vertexC, transformMatrix);
                    
                    this.drawLine(pixelA, pixelB);
                    this.drawLine(pixelB, pixelC);
                    this.drawLine(pixelC, pixelA);
                }
            }
        }
    }
}

export default SoftEngine;