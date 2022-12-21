import * as TWEEN from '../libs/tweenjs/tween.esm.js';
import * as THREE from '../libs/three_js/three.module.js';
import { OrbitControls } from '../libs/human_interface/OrbitControls.js';

class CameraMover {

    constructor(camera, domElement) {
        this.camera = camera
        this.domElement = domElement
        //this.camera.position.set(7, 3.5, 15);
        this.camera.position.set(-15, 3.5, 8);

        this.camera.rotation.set(0.0, -1.57, 0.0)
        // CONTROLS ------------------------------------------------------------------
        //this.controls = new OrbitControls(camera, domElement);
        //this.controls.minDistance = 1;
        //this.controls.maxDistance = 160;
        //this.controls.target.set(0, 1, 0);
        //this.controls.update();

        this.tweenGroup = new TWEEN.Group();

    }

    update() {
        //this.controls.target.set(0, this.camera.position.y, 0);
        //this.controls.update()
        this.tweenGroup.update()
    }
    windowResize(aspect) {
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }

    rotateToBuffer() {
        let tween = new TWEEN.Tween(this.camera.rotation, this.tweenGroup).to(new THREE.Vector3(0.0, 0.0, 0.0), 1000);
        tween.onComplete(() => {
            console.log(this.camera)
        })
        tween.start()
    }
}
export { CameraMover };