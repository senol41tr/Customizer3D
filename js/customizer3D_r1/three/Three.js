import * as THREE from 'three';
import {Controls} from 'customizer3D_dir/three/Controls.js?c3d=103';
import {Lights} from 'customizer3D_dir/three/Lights.js?c3d=103';
import {mergeRecursive} from 'customizer3D_dir/utils/mergeRecursive.js?c3d=103';
import {Size} from 'customizer3D_dir/utils/Size.js?c3d=103';
import gsap from 'base/gsap@3.13.0/gsap@3.13.0.esm.js';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=103';
import Stats from 'three_dir/libs/stats.module.js?c3d=103';

export class Three
{
    constructor(c3d, options) // options !!!
    {
        this.INITIAL_Z = 4;
        this.INITIAL_Z_MOBILE = 8;

        this.c3d = c3d;
        this.options = options;
        this.raf = null; // requestAnimationFrame id
        this.controls = null;

        this.stats = new Stats();
        this.stats.dom.style.cssText = 'position:fixed;bottom:1rem;right:1rem;z-Index:5;display:none;';
        document.querySelector(this.c3d.props.container).appendChild(this.stats.dom);
        
        this._canvasDims = Size.htmlDims(this.c3d.props.canvas3d);

        this.__onEnterFrame = this._onEnterFrame.bind(this);
        this.__onMouseDown = this._onMouseDown.bind(this);
        this.__onMouseUp = this._onMouseUp.bind(this);
        this.__onMouseWheel = this._onMouseWheel.bind(this);
        this.__onResize = this._onResize.bind(this);
        this.__container = document.querySelector(c3d.props.container);
    }

    setupAll()
    {
        this.setupScene();
        // this.setupLights();
        this.setupRenderer();
        this.setupCamera();
        this._onResize();
    }

    setupAllOrthographic()
    {
        this.setupScene();
        // this.setupLights();
        this.setupRenderer();
        this.setupOrthographicCamera();
        this._onResize();
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
        this.stats.update();
        this.renderer.render(this.scene, this.camera);
    }

    updateOptions()
    {        
        this.updateCameraOptions();
        this.controls.updateOptions();
        // this.controls.saveSettings();
    }

    getCanvas()
    {
        return this.renderer.domElement;
    }
    
    destroy()
    {
        this.stop();
        this._clearThree(this.scene);
    }

    addControls()
    {
        this.controls = new Controls(this.c3d, this);
    }

    setupRenderer()
    {
        const options =
        {
            canvas: this.options?.rendererOptions?.canvas ? this.options.rendererOptions.canvas : document.querySelector(this.c3d.props.canvas3d),
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true
        };
        // options.context = options.canvas.getContext('webgl2');
        
        this.renderer = new THREE.WebGLRenderer(options);
        this.renderer.setPixelRatio(this.c3d.PIXEL_RATIO);
        this.renderer.onDeviceLost = () => {
            alert("WebGLRenderer: Context Lost!\nPlease save changes and reload the page.");
        };

        const gl = options.canvas.getContext('webgl2');
        if (!gl) alert("WebGL 2 not supported!");
    }

    setupLights()
    {
        // this.lights = new Lights(this)[this.c3d.props.three.lightType || 'studio']();
        this.lights = new Lights(this)['studio']();
    }

    setupScene()
    {
        this.scene = new THREE.Scene();
    }

    setupCamera()
    {
        this.camera = new THREE.PerspectiveCamera(40, this._canvasDims.width / this._canvasDims.height, 0.1, 500);
        this.updateCameraOptions();
    }

    updateCameraOptions()
    {
        const options = this.c3d.props?.three?.cameraOptions ? {...this.c3d.props.three.cameraOptions} : {};
        
        if(!options?.position) options.position = {};
        if(!options?.position?.x) options.position.x = 0;
        if(!options?.position?.y) options.position.y = 0;
        if(!options?.position?.z) options.position.z = isMobile() ? this.INITIAL_Z_MOBILE : this.INITIAL_Z;

        if(!options?.rotation) options.rotation = {};
        if(!options?.rotation?.x) options.rotation.x = 0;
        if(!options?.rotation?.y) options.rotation.y = 0;
        if(!options?.rotation?.z) options.rotation.z = 0;

        mergeRecursive(this.camera, options);
        
    }

    setupOrthographicCamera()
    {
        this.camera = new THREE.OrthographicCamera(
            -this._canvasDims.width / 2, 
            this._canvasDims.width / 2, 
            this._canvasDims.height / 2, 
            -this._canvasDims.height / 2, 
            -100, 
            100
        );
        this.updateOrthographicCameraOptions();
    }

    updateOrthographicCameraOptions()
    {
        const options = this.c3d.props.three.cameraOptions || {};
        
        // if(!options?.position) options.position = {};
        // if(!options?.position?.z) options.position.z = 1;

        mergeRecursive(this.camera, options);
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


    // PRIVATE FUNCTIONS


    _onResize(e, width, height)
    {
        this._canvasDims = Size.htmlDims(this.getCanvas());
        if(width) this._canvasDims.width = width;
        if(height) this._canvasDims.height = height;

        if(this.camera.type == 'OrthographicCamera')
        {
            this.camera.left = -this._canvasDims.width / 2;
            this.camera.right = this._canvasDims.width / 2;
            this.camera.top = this._canvasDims.height / 2;
            this.camera.bottom = -this._canvasDims.height / 2;
        }
        else
        {
            this.camera.aspect = this._canvasDims.width / this._canvasDims.height;
        }

        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this._canvasDims.width, this._canvasDims.height, false);
        this.render();
        
    }

    _onEnterFrame()
    {
        if(typeof(this.controls) === 'object' && this.controls?.orbit?.enabled) this.controls.update();
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
        while(obj.children.length > 0)
        { 
            this._clearThree(obj.children[0]);
            obj.remove(obj.children[0]);
        }

        if(obj.geometry) obj.geometry.dispose();
      
        if(obj.material)
        { 
            //in case of map, bumpMap, normalMap, envMap ...
            Object.keys(obj.material).forEach(prop =>
            {
                if(!obj.material[prop]) return;
                if(obj.material[prop] !== null && typeof obj.material[prop].dispose === 'function') obj.material[prop].dispose();
            })
            obj.material.dispose();
        }
    }

}
