import * as THREE from 'three';
import { ARButton } from './webxr/ARButton.js?c3d=107';
import {Three} from 'customizer3D_dir/three/Three.js?c3d=107';
import {Lights} from 'customizer3D_dir/three/Lights.js?c3d=0.5.0';

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

        ARButton.createButton({requiredFeatures: ['hit-test']}, this.c3d, this);

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

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );

        new Lights(this)['studio']();

        this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true, canvas : this.canvas } );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.xr.enabled = true;

        //this.camera.position.z = 1;

        this.glbScene = this.c3d.glbScene.clone();
        this.scene.add(this.glbScene);
        this.glbScene.visible = false;
        
        this.c3d.three.controls.orbit.enabled = false;

        this.controller1 = this.renderer.xr.getController(0);
        this.scene.add(this.controller1);
        this.controller1.addEventListener('select', this.__onSelect);

        this.controller2 = this.renderer.xr.getController(1);
        this.scene.add(this.controller2);
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
        this.scene.add( this.reticle );

        this.renderer.setAnimationLoop( this.__onEnterFrame );

    }

    stop()
    {
        this.renderer.setAnimationLoop(null);

        setTimeout(() =>
        {
            this.canvas.remove();

            this.hitTestSource = null;
            this.hitTestSourceRequested = false;

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

        this.renderer.render(this.scene, this.camera);
    }

}
