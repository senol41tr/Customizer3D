import * as THREE from 'three';
import {GLB} from 'customizer3D_dir/three/loaders/GLB.js?c3d=103';
import {Controls} from 'customizer3D_dir/layers/utils/Controls.js?c3d=103';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=103';
import {fitMeshToScreen} from 'customizer3D_dir/utils/fitMeshToScreen.js?c3d=103';

export class ThreeD
{
    constructor(c3d, layer)
    {
        this.c3d = c3d;
        this.layer = layer;

        this.options = this.layer.threeDOptions;
        this.controls = null;
        this.mesh = null;
        this.div = null;

        this.__mouseUp = this._mouseUp.bind(this);
        this.__resize = this._onResize.bind(this);
    }

    // LOAD AND PARSE SVG

    async loadGLB()
    {
        const glbLoader = new GLB({url: this.layer.image, preloader: this.c3d.preloader});
        const glb = await glbLoader.load();
        this.mesh = glb.scene;
        this.mesh.name = 'threeD_layer_' + (Math.max(0, this.layer._mesh.userData.index - 1));

        // CENTER GLB

        const box = new THREE.Box3().setFromObject(this.mesh);
        const center = new THREE.Vector3();
        box.getCenter(center);
        this.mesh.position.sub(center);

        this.c3d.three.scene.add(this.mesh);
        
        if(!this.controls) {
            this.controls = new Controls(this.mesh, this.c3d.three.getCanvas());
        }

    }

    hide()
    {
        this._hideOptions();

        if(this.mesh) this.mesh.visible = false;
        this.c3d.glbScene.visible = true;
        this.c3d.three.controls.orbit.enabled = true;
        document.querySelector(this.c3d.props.layers).style.visibility = 'visible';
        this.c3d.textLayer.htmlEl.style.visibility = 'visible';
        this.c3d.imageLayer.htmlEl.style.visibility = 'visible';

        window.removeEventListener(isMobile() ? 'touchend' : 'mouseup', this.__mouseUp);
        if(!isMobile()) window.removeEventListener('wheel', this.__mouseUp);
        window.removeEventListener('resize', this.__resize);

        if(isMobile())
        {
            this.controls.removeTouchEvents();
            window.removeEventListener('touchend', this.__mouseUp);
        }
        else
        {
            this.controls.removeEventListeners();
            window.removeEventListener('mouseup', this.__mouseUp);
        }

        this.c3d.imageLayer.updatePreview(null, true, false);
        this.c3d.three.controls.restoreSettings('set');
        this.c3d.three.render();
    }

    show()
    {
        this.c3d.three.controls.restoreSettings('set');
        this.c3d.three.controls.orbit.enabled = false;
        this.c3d.glbScene.visible = false;

        this.mesh.visible = true;

        if(isMobile()) this.controls.addTouchEvents();
        else this.controls.addEventListeners();

        this._showOptions();

        window.addEventListener(isMobile() ? 'touchend' : 'mouseup', this.__mouseUp);
        if(!isMobile()) window.addEventListener('wheel', this.__mouseUp);
        window.addEventListener('resize', this.__resize);
        
        this.c3d.textLayer.htmlEl.style.visibility = 'hidden';
        this.c3d.imageLayer.htmlEl.style.visibility = 'hidden';
        document.querySelector(this.c3d.props.layers).style.visibility = 'hidden';
        this._onResize();
        this.c3d.three.render();   
    }



    bakeImageToLayer(width, height, getCanvas = false, exportToPDF = false)
    {
        const canvasImage = document.createElement('canvas');

        const renderer = this.c3d.glbScene.getObjectByName(this.layer.name);
        if(!renderer) { alert('renderer not found!'); return canvasImage; }
        
        const oldGLBVisible = this.c3d.glbScene.visible;
        const oldMeshVisible = this.mesh.visible;

        this.c3d.three.controls.restoreSettings('set');
        this.c3d.glbScene.visible = false;
        this.mesh.visible = true;

        const tex = renderer.material.uniforms.uLayerTextures.value;
        const w = width ? Math.round(width) : tex.image.width;
        const h = height ? Math.round(height) : tex.image.height;
        const c3d = this.c3d;
        const target = new THREE.WebGLRenderTarget(w, h,
        {
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType,
            colorSpace: THREE.SRGBColorSpace,
            samples: 4
        });

        const oldCanvasSize = {...c3d.three._canvasDims};

        c3d.three.renderer.setRenderTarget(target);
        c3d.three.renderer.setPixelRatio(1);
        c3d.three._onResize(null, w, h);

        const oldCamPos = c3d.three.camera.position.clone();

        fitMeshToScreen(this.c3d.three.camera, this.mesh, 1.1);
        
        c3d.three.render();

        const pixels = new Uint8Array(w * h * 4);
        c3d.three.renderer.readRenderTargetPixels(target, 0, 0, w, h, pixels);

        c3d.three.renderer.setRenderTarget(null);
        c3d.three.renderer.setPixelRatio(c3d.PIXEL_RATIO);
        c3d.three._onResize(null, oldCanvasSize.width, oldCanvasSize.height);

        this.c3d.glbScene.visible = oldGLBVisible;
        this.mesh.visible = oldMeshVisible;
        c3d.three.camera.position.copy(oldCamPos);

        target.dispose();
        
        canvasImage.width = w;
        canvasImage.height = h;

        const canvasImageCtx = canvasImage.getContext('2d');
        const imageData = canvasImageCtx.createImageData(w, h);

        for (let y = 0; y < h; y++)
        {
            const sourceRow = y * w * 4;
            const targetRow = (h - 1 - y) * w * 4;
            imageData.data.set(pixels.subarray(sourceRow, sourceRow + w * 4), targetRow);
        }

        canvasImageCtx.putImageData(imageData, 0, 0);

        if(getCanvas || exportToPDF) {
            return canvasImage;
        }

        c3d.render3d.renderImageLayer(this.layer);
        c3d.render3d.updateLayerTexture(this.layer, canvasImage);
        c3d.imageLayer.show(this.layer);
    }









    _mouseUp()
    {
        if(this.mesh)
        {
            this.options.state =
            {
                rotation:
                {
                    x: this.mesh.rotation.x,
                    y: this.mesh.rotation.y,
                    z: this.mesh.rotation.z
                }
            };
        }
    }

    _onResize()
    {
        fitMeshToScreen(this.c3d.three.camera, this.mesh, 1.5);
    }

    _showOptions()
    {
        const button = this.c3d.imageLayer.htmlEl.querySelector('div.threeD > div.button');
        
        if(this.div)
        {
            this.c3d.contextMenu.setHTMLObj(this.div);
            this.c3d.contextMenu.show(button, false);
            this.c3d.contextMenu.setPosition(16, 16);
            this.c3d.contextMenu.setWidth(180);
            return;
        }

        this.div = document.createElement('div');

        let html = '';
        html += '<div style="display:flex; flex-direction:column; gap: 0.25rem; border: 1px solid rgba(0, 0, 0, 0.15);border-radius: 7px; padding: 0.35rem; margin: 0.1rem; margin-bottom:0.5rem;">';
        html += '<button class="render">RENDER</button>';
        html += '</div>';

        this.div.innerHTML = html;

        this.div.querySelector('button.render').addEventListener('click', () => {
            this.hide();
            this.c3d.imageLayer.updatePreview(null, true, false);
            this.bakeImageToLayer();
            this.c3d.three.controls.restoreSettings('set');
            this.c3d.three.render();
        });


        this.c3d.contextMenu.setHTMLObj(this.div);
        this.c3d.contextMenu.show(button, false);
        this.c3d.contextMenu.setPosition(16, 16);
        this.c3d.contextMenu.setWidth(180);

    }

    _hideOptions()
    {
        this.c3d.contextMenu.hide();
    }

    _removeMesh()
    {
        this.c3d.three._clearThree(this.mesh);
        this.mesh.removeFromParent();
        this.mesh = null;
    }

}
