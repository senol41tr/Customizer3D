import * as THREE from 'three';
import { ARButton } from './webxr/ARButton.js';

export class WebXR
{
    constructor(c3d)
    {
        this.c3d = c3d;

        this._init = false;

        // this.controller1 = null;
        // this.controller12 = null;
        // this.reticle = null;
        this.hitTestSource = null;
        this.hitTestSourceRequested = false;

        this.__onSelect = this.onSelect.bind(this);
        this.__onEnterFrame = this._onEnterFrame.bind(this);

        this.renderer = this.c3d.three.renderer;

        ARButton.createButton(this.renderer, {requiredFeatures: ['hit-test']}, this.c3d);
        
    }

    start()
    {
        this.glbScene = this.c3d.glbScene;
        this.glbScene.visible = false;

        this.reticle = new THREE.Mesh(
            new THREE.RingGeometry( 0.15, 0.05, 32 ).rotateX( - Math.PI / 2 ),
            new THREE.MeshBasicMaterial()
        );
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.c3d.three.scene.add( this.reticle );

        this.c3d.three.stop();
        this.renderer.setAnimationLoop( this.__onEnterFrame );

        if (this._init) return;

        this.controller1 = this.renderer.xr.getController(0);
        this.c3d.three.scene.add(this.controller1);
        this.controller1.addEventListener('select', this.__onSelect);

        this.controller2 = this.renderer.xr.getController(1);
        this.c3d.three.scene.add(this.controller2);
        this.controller2.addEventListener('select', this.__onSelect);

        this._init = true;
    }

    stop()
    {
        this.renderer.setAnimationLoop(null);
        this.hitTestSource = null;
        this.hitTestSourceRequested = false;
        this.reticle.removeFromParent();
        this.c3d.three.start();
    }

    onSelect()
    {
        const mesh = this.glbScene;
        this.reticle.matrix.decompose( mesh.position, mesh.quaternion, mesh.scale );
        this.reticle.visible = false;
        mesh.visible = true;

    }

    _onEnterFrame(timestamp, frame)
    {
        if ( frame ) {

            const referenceSpace = this.renderer.xr.getReferenceSpace();
            const session = this.renderer.xr.getSession();

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

        this.renderer.render( this.c3d.three.scene, this.c3d.three.camera );
    }

}
