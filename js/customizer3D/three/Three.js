import * as THREE from 'three';
import {Controls} from './Controls.js?c3d=0.5.1';
import {Lights} from './Lights.js?c3d=0.5.1';
import {mergeRecursive} from 'customizer3D_dir/utils/mergeRecursive.js?c3d=0.5.1';
import {Size} from 'customizer3D_dir/utils/Size.js?c3d=0.5.1';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.5.1';
import gsap from 'base/gsap@3.13.0/gsap@3.13.0.esm.js';

export class Three
{
    constructor(c3d)
    {
        this.c3d = c3d;

        this.raf = null; // requestAnimationFrame id

        this._screeDims = Size.htmlDims(this.c3d.props.three.rendererOptions.canvas);
        this._setupRenderer();
        this._setupCamera();
        this._setupScene();
        this.setupLights();
        this.__onEnterFrame = this._onEnterFrame.bind(this);
        this.__onMouseDown = this._onMouseDown.bind(this);
        this.__onMouseUp = this._onMouseUp.bind(this);
        this.__onMouseWheel = this._onMouseWheel.bind(this);
        this.__onResize = this._onResize.bind(this);
        this.__container = document.querySelector(c3d.props.container);
    }

    start()
    {
        if(isMobile())
        {
            this.__container.addEventListener('touchstart', this.__onMouseDown);
            this.__container.addEventListener('touchend', this.__onMouseUp);
        }
        else
        {
            this.__container.addEventListener('mousedown', this.__onMouseDown);
            this.__container.addEventListener('mouseup', this.__onMouseUp);
            this.__container.addEventListener('wheel', this.__onMouseWheel);
        }
        window.addEventListener('resize', this.__onResize);
        this.render();
    }

    stop()
    {
        if(isMobile())
        {
            this.__container.removeEventListener('touchstart', this.__onMouseDown);
            this.__container.removeEventListener('touchend', this.__onMouseUp);
        }
        else
        {
            this.__container.removeEventListener('mousedown', this.__onMouseDown);
            this.__container.removeEventListener('mouseup', this.__onMouseUp);
            this.__container.addEventListener('wheel', this.__onMouseWheel);
        }
        window.removeEventListener('resize', this.__onResize);
        cancelAnimationFrame(this.raf);
    }

    render()
    {
        this.renderer.render(this.scene, this.camera);
    }


    // PUBLIC FUNCTIONS

    updateOptions()
    {
        this.updateCameraOptions();
        this.updateRendererOptions();

        this.controls.updateOptions();
        this.controls.saveSettings();
    }

    updateCameraOptions()
    {
        const o = this.c3d.props.three.cameraOptions;
        if(o) mergeRecursive(this.camera, o);
    }

    updateRendererOptions()
    {
        
    }
    

    getCanvas()
    {
        return this.renderer.domElement;
    }
    
    destroy()
    {
        cancelAnimationFrame(this.raf);
        this._clearThree(this.scene);
    }

    addControls()
    {
        this.controls = new Controls(this.c3d, this);
        this.controls.saveSettings();
    }

    setupLights()
    {
        // this.lights = new Lights(this)[this.c3d.props.three.lightType || 'studio']();
        this.lights = new Lights(this)['studio']();
    }

    rotateToAngle(x, y, z, fn = 'to')
    {
        // mesh.rotation.set(x, x, z);
        gsap[fn](this.c3d.glbScene.rotation,
        {
            x: THREE.MathUtils.degToRad(x),
            y: THREE.MathUtils.degToRad(y),
            z: THREE.MathUtils.degToRad(z),
            duration: 0.75,
            ease: "power2.inOut",
            onUpdate: () => {
                this.render();
            }
        });
    }

    moveToAngle(x, y, z, fn = 'to')
    {
        // mesh.rotation.set(x, x, z);
        gsap[fn](this.c3d.glbScene.position,
        {
            x,
            y,
            z,
            duration: 0.75,
            ease: "power2.inOut",
            onUpdate: () => {
                this.render();
                // this.controls.orbit.target.set(x, y, z);
                this.controls.orbit.target.set(0, 0, z);
            },
            onComplete: () => {
                setTimeout(() => { // !!!
                    this.controls.update();
                    this.render();
                }, 100);
            }
        });
    }


    // PRIVATE FUNCTIONS

    _setupScene()
    {
        this.scene = new THREE.Scene();
    }

    _setupCamera()
    {
        this.camera = new THREE.PerspectiveCamera( 40, this._screeDims.width / this._screeDims.height, 0.1, 100 );
        this.updateCameraOptions();
    }

    _setupRenderer()
    {
        const o = {...this.c3d.props.three.rendererOptions} || {};
        if(typeof(o.canvas) === 'string') o.canvas = document.querySelector(o.canvas);
        if(typeof(o.antialias) === 'undefined') o.antialias = true;
        if(typeof(o.alpha) === 'undefined') o.alpha = true;

        this.renderer = new THREE.WebGLRenderer(o);
        this.renderer.setSize(this._screeDims.width, this._screeDims.height, false);
        this.renderer.setPixelRatio(this.c3d.PIXEL_RATIO);
        this.renderer.onDeviceLost = () => {
            alert("WebGLRenderer: Context Lost!\nPlease save changes and reload the page.");
        };
    }

    _onResize(e, width, height)
    {
        const canvasDims = Size.htmlDims(this.getCanvas());
        this._screeDims.width = canvasDims.width || window.innerWidth;
        this._screeDims.height = canvasDims.height || window.innerHeight;
        
        if(width) this._screeDims.width = width;
        if(height) this._screeDims.height = height;

        this.camera.aspect = this._screeDims.width / this._screeDims.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this._screeDims.width, this._screeDims.height, false);
        this.render();
    }

    _onEnterFrame()
    {
        if(typeof(this.controls) === 'object') this.controls.update();
        this.raf = requestAnimationFrame(this.__onEnterFrame);
        this.render();
    }

    _onMouseDown(e)
    {
        if(e.touches) {
            if(e.touches.length === 2) return;
        }
        this._onEnterFrame();
    }

    _onMouseUp()
    {
        cancelAnimationFrame(this.raf);
    }

    _onMouseWheel()
    {
        this.render();
    }

    _clearThree(obj) // https://stackoverflow.com/a/48768960
    {
        while(obj.children.length > 0){ 
            this._clearThree(obj.children[0]);
          obj.remove(obj.children[0]);
        }
        if(obj.geometry) obj.geometry.dispose();
      
        if(obj.material){ 
          //in case of map, bumpMap, normalMap, envMap ...
          Object.keys(obj.material).forEach(prop => {
            if(!obj.material[prop])
              return;
            if(obj.material[prop] !== null && typeof obj.material[prop].dispose === 'function')                                  
              obj.material[prop].dispose();                                                      
          })
          obj.material.dispose();
        }
    }

}
