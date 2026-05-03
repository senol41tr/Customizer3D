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

        this.container = document.createElement( 'div' );
        this.container.style.position = 'fixed';
        this.container.style.left = 0;
        this.container.style.top = 0;
        this.container.style.zIndex = 10;
        document.querySelector(this.c3d.props.container).appendChild(this.container);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 10, window.innerWidth / window.innerHeight, 0.01, 20 );


        this.lights = new THREE.Group();
        this.lights.name = 'LightGroup';
        this.scene.add(this.lights);

        // ambient
        let light = this.addLight({
            name: 'AmbientLight',
            color: 0xffffff,
            intensity: 1.1
        });
        
        // front
        light = this.addLight({
            name: 'DirectionalLight',
            color: 0xffffff,
            intensity: 1.0,
            position: {x:0, y: 0, z:30}
        });

        // let helper = new THREE.DirectionalLightHelper( light, 5 );
        // this.three.scene.add( helper );
    
        // back
        light = this.addLight({
            name: 'DirectionalLight',
            color: 0xffffff,
            intensity: 1.0,
            position: {x:0, y: 0, z:-30}
        });

        // helper = new THREE.DirectionalLightHelper( light, 5 );
        // this.three.scene.add( helper );
        
        // right
        light = this.addLight({
            name: 'DirectionalLight',
            color: 0xffffff,
            intensity: 1.0,
            position: {x:30, y: 0, z:0}
        });

        // helper = new THREE.DirectionalLightHelper( light, 5 );
        // this.three.scene.add( helper );
        
        // left
        light = this.addLight({
            name: 'DirectionalLight',
            color: 0xffffff,
            intensity: 1.0,
            position: {x:-30, y: 0, z:0}
        });

        // helper = new THREE.DirectionalLightHelper( light, 5 );
        // this.three.scene.add( helper );

        // top
        light = this.addLight({
            name: 'DirectionalLight',
            color: 0xffffff,
            intensity: 1.0,
            position: {x:0, y: 30, z:0}
        });

        // helper = new THREE.DirectionalLightHelper( light, 5 );
        // this.three.scene.add( helper );

        // bottom
        light = this.addLight({
            name: 'DirectionalLight',
            color: 0xffffff,
            intensity: 1.0,
            position: {x:0, y: -30, z:0}
        });

        this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.xr.enabled = true;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.container.appendChild( this.renderer.domElement );
        this.container.style.display = 'none';

        this.__onSelect = this.onSelect.bind(this);
        this.__onEnterFrame = this._onEnterFrame.bind(this);

        ARButton.createButton(this.renderer, {requiredFeatures: ['hit-test']}, this.c3d);
        
    }

    start()
    {
        this.container.style.display = 'block';
        this.c3d.three.stop();
        if(this.glbScene) this.scene.remove(this.glbScene);
        this.glbScene = this.c3d.glbScene.clone();
        this.scene.add(this.glbScene);
        this.glbScene.visible = false;

        this.renderer.setAnimationLoop( this.__onEnterFrame );

        if (this._init) return;

        this.controller1 = this.renderer.xr.getController(0);
        this.scene.add(this.controller1);
        this.controller1.addEventListener('select', this.__onSelect);

        this.controller2 = this.renderer.xr.getController(1);
        this.scene.add(this.controller2);
        this.controller2.addEventListener('select', this.__onSelect);

        this.reticle = new THREE.Mesh(
            new THREE.RingGeometry( 0.15, 0.2, 64 ).rotateX( - Math.PI / 2 ),
            new THREE.MeshBasicMaterial()
        );
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add( this.reticle );

        this._init = true;
    }

    stop()
    {
        this.container.style.display = 'none';
        document.querySelector(this.c3d.props.container).style.display = 'block';
        this.renderer.setAnimationLoop(null);
        this.hitTestSource = null;
        this.hitTestSourceRequested = false;
        this.c3d.three.start();
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

    addLight(options)
    {
        const light = new THREE[options.name](options.color, options.intensity);

        if(options.position) light.position.set( options.position.x, options.position.y, options.position.z );

        this.lights.add(light);

        return light;
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

        this.renderer.render( this.scene, this.camera );
    }

}
