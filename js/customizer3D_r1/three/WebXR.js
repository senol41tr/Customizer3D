import * as THREE from 'three';
import { ARButton } from './webxr/ARButton.js?c3d=103';
import {Three} from 'customizer3D_dir/three/Three.js?c3d=103';

export class WebXR
{
    constructor(c3d)
    {
        this.c3d = c3d;

        this.controller1 = null;
        this.controller12 = null;
        this.glbScene = null;
        this.reticle = null;
        this.hitTestSource = null;
        this.hitTestSourceRequested = false;
        this.canvas = null;
        this.three = null;

        this.__onSelect = this.onSelect.bind(this);
        this.__onEnterFrame = this._onEnterFrame.bind(this);

        ARButton.createButton({requiredFeatures: ['hit-test']}, this.c3d);

    }

    start()
    {

        // CANVAS 3D
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.left = 0;
        this.canvas.style.top = 0;
        this.canvas.style.zIndex = this.c3d.zIndex.index;
        document.querySelector(this.c3d.props.container).appendChild(this.canvas);

        this.three = new Three(this.c3d, {
            rendererOptions:
            {
                canvas: this.canvas
            }
        });

        this.three.setupAll();
        this.three.setupLights();
        this.three.renderer.xr.enabled = true;
        this.three.renderer.setPixelRatio(window.devicePixelRatio);
        this.three.camera.position.z = 1;
        this.three._onResize(null, window.innerWidth, window.innerHeight);


        this.glbScene = this.c3d.glbScene.clone();
        this.three.scene.add(this.glbScene);
        this.glbScene.visible = false;
        
        this.c3d.glbScene.visible = false;
        this.c3d.three.controls.orbit.enabled = false;
        this.c3d.three.stop();

        this.controller1 = this.three.renderer.xr.getController(0);
        this.three.scene.add(this.controller1);
        this.controller1.addEventListener('select', this.__onSelect);

        this.controller2 = this.three.renderer.xr.getController(1);
        this.three.scene.add(this.controller2);
        this.controller2.addEventListener('select', this.__onSelect);

        const outerRadius = 0.1;
        const thickness = 0.02;
        const innerRadius = outerRadius - thickness;
        this.reticle = new THREE.Mesh(
            new THREE.RingGeometry(innerRadius, outerRadius, 64).rotateX( - Math.PI / 2 ),
            new THREE.MeshBasicMaterial({transparent:true, color:0xffffff, opacity: 0.75})
        );
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.three.scene.add( this.reticle );

        this.three.renderer.setAnimationLoop( this.__onEnterFrame );

    }

    stop()
    {
        this.three.renderer.setAnimationLoop(null);

        setTimeout(() =>
        {
            this.c3d.three._clearThree(this.three.scene);
            
            this.canvas.remove();

            this.c3d.glbScene.visible = true;

            this.hitTestSource = null;
            this.hitTestSourceRequested = false;

            this.c3d.three.start();
            this.c3d.three.controls.orbit.enabled = true;
        }, 100);
    }

    onSelect()
    {
        if (this.reticle.visible)
        {
            const mesh = this.glbScene;
            this.reticle.matrix.decompose( mesh.position, mesh.quaternion, mesh.scale );
            mesh.visible = true;
        }
    }

    _onEnterFrame(timestamp, frame)
    {
        if ( frame ) {

            const referenceSpace = this.three.renderer.xr.getReferenceSpace();
            const session = this.three.renderer.xr.getSession();

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

        this.three.renderer.render(this.three.scene, this.three.camera);
    }

}
