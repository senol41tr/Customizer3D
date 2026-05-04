import * as THREE from 'three';
import { ARButton } from './webxr/ARButton.js';

export class WebXR
{
    constructor(c3d)
    {
        this.c3d = c3d;

        this.controller1 = null;
        this.controller12 = null;
        this.reticle = null;
        this.hitTestSource = null;
        this.hitTestSourceRequested = false;

        this.__onSelect = this.onSelect.bind(this);
        this.__onEnterFrame = this._onEnterFrame.bind(this);

        ARButton.createButton(this.c3d.three.renderer, {requiredFeatures: ['hit-test']}, this.c3d);
        
    }

    start()
    {
        this.glbScene = this.c3d.glbScene.clone();
        this.c3d.three.scene.add(this.glbScene);
        this.glbScene.visible = false;
        this.c3d.glbScene.visible = false;
        this.glbScene.visible = false;
        this.c3d.three.controls.orbit.enabled = false;
        this.c3d.three.stop();

        this.c3d.three.renderer.setAnimationLoop( this.__onEnterFrame );

        this.controller1 = this.c3d.three.renderer.xr.getController(0);
        this.c3d.three.scene.add(this.controller1);
        this.controller1.addEventListener('select', this.__onSelect);

        this.controller2 = this.c3d.three.renderer.xr.getController(1);
        this.c3d.three.scene.add(this.controller2);
        this.controller2.addEventListener('select', this.__onSelect);

        const outerRadius = 0.1;
        const thickness = 0.015;
        const innerRadius = outerRadius - thickness;
        this.reticle = new THREE.Mesh(
            new THREE.RingGeometry(innerRadius, outerRadius, 64).rotateX( - Math.PI / 2 ),
            new THREE.MeshBasicMaterial({transparent:true, color:0xffffff, opacity: 0.75})
        );
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.c3d.three.scene.add( this.reticle );
    }

    stop()
    {
        this.scene.remove(this.glbScene);
        
        this.glbScene.visible = true;
        this.c3d.three.renderer.setAnimationLoop(null);

        this.controller1.removeEventListener('selectstart', this.__onSelect);
        // this.controller1.removeEventListener('selectend', this.__onSelectEnd);
        this.controller1.parent.remove(this.controller1);

        this.controller2.removeEventListener('selectstart', this.__onSelect);
        // this.controller2.removeEventListener('selectend', this.__onSelectEnd);
        this.controller2.parent.remove(this.controller2);

        this.reticle.removeFromParent();

        this.hitTestSource = null;
        this.hitTestSourceRequested = false;

        setTimeout(() =>
        {
            this.c3d.three.start();
            this.c3d.three.controls.orbit.enabled = true;
            this.glbScene.position.set(0,0,0);
            this.glbScene.rotation.set(0,0,0);
            this.c3d.three.controls.restoreSettings('set');
        }, 1000);
    }

    onSelect()
    {
        if (this.reticle.visible)
        {
            const mesh = this.c3d.glbScene;
            this.reticle.matrix.decompose( mesh.position, mesh.quaternion, mesh.scale );
            mesh.visible = true;
        }
    }

    _onEnterFrame(timestamp, frame)
    {
        if ( frame ) {

            const referenceSpace = this.c3d.three.renderer.xr.getReferenceSpace();
            const session = this.c3d.three.renderer.xr.getSession();

            if ( this.hitTestSourceRequested === false ) {
                const self = this;
                session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {

                    session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {

                        self.hitTestSource = source;

                    } );

                } );

                session.addEventListener( 'end', function () {

                    this.hitTestSourceRequested = false;
                    this.hitTestSource = null;

                } );

                this.hitTestSourceRequested = true;

            }

            if ( this.hitTestSource ) {

                const hitTestResults = frame.getHitTestResults( this.hitTestSource );

                if ( hitTestResults.length ) {

                    const hit = hitTestResults[ 0 ];

                    this.reticle.visible = true;
                    this.reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );

                } else {

                    this.reticle.visible = false;

                }

            }

        }

        this.c3d.three.renderer.render( this.c3d.three.scene, this.c3d.three.camera );
    }

}
