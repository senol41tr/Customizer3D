import * as THREE from 'three';
import {GUI} from 'three_dir/libs/lil-gui.module.min.js';
import {Controls} from 'customizer3D_dir/three/utils/Controls.js?c3d=0.5.7';
import {applyFilters} from 'customizer3D_dir/layers/Filters/Filters.js?c3d=0.5.7';
import {mergeRecursive} from 'customizer3D_dir/utils/mergeRecursive.js?c3d=0.5.7';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.5.7';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=0.5.7';
import {fitMeshToScreen} from 'customizer3D_dir/utils/fitMeshToScreen.js?c3d=0.5.7';

export class PointCloud
{
    constructor()
    {
        this.name = 'pointCloud';
        this.label = 'Point Cloud';

        this.c3d = null;
        this.layer = null;
        this.layerName = null;
        this.options = null;
        this.controls = null;
        this.gui = null;
        this.mesh = null;
        this.is2DViewing = null;
        this.oldCamState = null;
        this.drawCanvas = null;
    }

    bakeImageToLayer()
    {
        const c3d = this.c3d;
        const canvas = this.layer.effectsCanvas;
        
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const renderTargetOptions = 
        {
            // samples: 4,
            stencilBuffer: false,
            depthBuffer: false,
            colorSpace: THREE.SRGBColorSpace,
            format: THREE.RGBAFormat
        };
        if(c3d.three.scene.background == null) renderTargetOptions.type = THREE.UnsignedByteType;

        const oldCanvasSize = {...c3d.three._canvasDims};
        const target = new THREE.WebGLRenderTarget(w, h, renderTargetOptions);
        c3d.three.renderer.setRenderTarget(target);
        c3d.three.renderer.setPixelRatio(1);
        c3d.three._onResize(null, w, h);
        
        c3d.three.render();

        const pixels = new Uint8Array(w * h * 4);
        c3d.three.renderer.readRenderTargetPixels(target, 0, 0, w, h, pixels);

        c3d.three.renderer.setRenderTarget(null);
        c3d.three.renderer.setPixelRatio(c3d.PIXEL_RATIO);
        c3d.three._onResize(null, oldCanvasSize.width, oldCanvasSize.height);

        target.dispose();
        
        const imageData = ctx.createImageData(w, h);

        for (let y = 0; y < h; y++)
        {
            const sourceRow = y * w * 4;
            const targetRow = (h - 1 - y) * w * 4;
            imageData.data.set(pixels.subarray(sourceRow, sourceRow + w * 4), targetRow);
        }

        ctx.putImageData(imageData, 0, 0);
        
        applyFilters(this.c3d, this.layer, this.layerName);
        this.hide();        
    }

    apply()
    {
        this.options.meshState =
        {
            scale: {x: this.mesh.scale.x, y: this.mesh.scale.y, z: this.mesh.scale.z}, 
            position: {x: this.mesh.position.x, y: this.mesh.position.y, z: this.mesh.position.z},
            rotation: {x: this.mesh.rotation.x, y: this.mesh.rotation.y, z: this.mesh.rotation.z} 
        };
        this.bakeImageToLayer();
        this._cancel();
    }

    hide()
    {
        this.c3d.three.camera.position.copy(this.oldCamState.position);
        this.c3d.three.camera.rotation.copy(this.oldCamState.rotation);
        this.c3d.three.controls.orbit.target.copy(this.oldCamState.target);
        this.c3d.showHideUI.show();
        this.c3d.glbScene.visible = true;
        this.c3d.three.controls.orbit.enabled = true;
        this.c3d.three.scene.background = null;
        this.c3d.three.render();
    }


    show()
    {
        this.options =
        {
            uPosZ: 0.08,
            uPointSize: 1.2,
            blending: true,
            transparentBG: true,
            bgColor: '#000000',
            step: 2,
            maxBrightness: 1.0,
            direction: true,
        };
        mergeRecursive(this.options, this.layer.effects[this.name]);
        this.layer.effects[this.name] = this.options;
        

        this.is2DViewing = document.querySelector(this.c3d.props.layers + ' > div.switchTo2D > button').classList.contains('threeD');
        if(this.is2DViewing) this.c3d.switchTo3D();
        this.c3d.showHideUI.hide();
        this.c3d.glbScene.visible = false;
        this.c3d[this.layerName].hide();
        this.c3d.three.controls.orbit.enabled = false;
        this.c3d.three.renderer.setPixelRatio(1);

        if(!this.options.transparentBG) this.c3d.three.scene.background = new THREE.Color(this.options.bgColor);

        const vertexShader = `
            uniform float uPosZ;
            uniform float uPointSize;
            attribute float aBrightness;
            varying vec3 vColor;

            void main() {
                vColor = color;
                vec3 transformed = position;
                float posZ = aBrightness * (uPosZ * 5.0);
                transformed.z += posZ;
                vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                gl_PointSize = (uPointSize / -mvPosition.z);
            }
        `;

        const fragmentShader = `
            varying vec3 vColor;
            void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                gl_FragColor = vec4(vColor, 1.0);
            }
        `;

        const geometry = this._getGeometry(this.options.density, this.options.maxBrightness, this.options.direction);
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uPosZ: { value: this.options.uPosZ },
                uPointSize: { value: this.options.uPointSize }
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true
        });

        this.mesh = new THREE.Points(geometry, material);
        this.c3d.three.scene.add(this.mesh);

        if(this.options.meshState)
        {
            let o = this.options.meshState.scale;
            this.mesh.scale.set(o.x, o.y, o.z);
            o = this.options.meshState.position;
            this.mesh.position.set(o.x, o.y, o.z);
            o = this.options.meshState.rotation;
            this.mesh.rotation.set(o.x, o.y, o.z);
        }
        else
        {
            fitMeshToScreen(this.c3d.three.camera, this.mesh, 1.25, true);
        }

        this.oldCamState = {
            position: this.c3d.three.camera.position.clone(), 
            rotation: this.c3d.three.camera.rotation.clone(),
            target: this.c3d.three.controls.orbit.target.clone()
        };

        this.controls = new Controls(this.mesh, this.c3d.three.getCanvas());
        this.controls.addEventListeners();

        const gui = this.gui = new GUI({ title: 'Effect Controls' });
        const guiSettings = {
            blending: this.options.blending,
            transparentBG: this.options.transparentBG,
            bgColor: this.options.bgColor,
            step: this.options.step,
            maxBrightness: this.options.maxBrightness,
            direction: this.options.direction,
            copyToCanvas: () => {
                this.apply();
                this.hide();
                this.c3d[this.layerName].show(this.layer);
            },
            cancel: () =>
            {
                if(this.options.meshState) {
                    this._cancel();
                    return;
                }
                delete this.layer.effects[this.name];
                this._cancel();
                this.c3d[this.layerName].show(this.layer);
                this.c3d[this.layerName].updatePreview();
            }
        };


        gui.addColor(guiSettings, 'bgColor')
            .name('Background Color')
            .onChange((value) => {
                this.c3d.three.scene.background = new THREE.Color(value);
                guiSettings.transparentBG = this.options.transparentBG = false;
                this.options.bgColor = value;
                this.c3d.three.render();
            });

        gui.add(guiSettings, 'transparentBG')
            .name('Transparent Background')
            .onChange((value) => {
                this.c3d.three.scene.background = value ? null : new THREE.Color(guiSettings.bgColor);
                this.options.transparentBG = value;
                this.c3d.three.render();
            })
            .listen();

        gui.add(guiSettings, 'step')
            .min(1)
            .max(5)
            .step(1)
            .name('Pixel Density')
            .onFinishChange((density) => {
                this.options.step = density;
                this.mesh.geometry.dispose();
                this.mesh.geometry = this._getGeometry(density);
                this.c3d.three.render();
            });

        gui.add(material.uniforms.uPosZ, 'value')
            .min(0.0)
            .max(1.0)
            .step(0.01)
            .name('Z Depth')
            .onChange((value) => {
                this.options.uPosZ = value;
                this.c3d.three.render();
            });

        gui.add(material.uniforms.uPointSize, 'value')
            .min(0.15)
            .max(6.0)
            .step(0.1)
            .name('Point Size')
            .onChange((value) => {
                this.options.uPointSize = value;
                this.c3d.three.render();
            });

        gui.add(guiSettings, 'maxBrightness')
            .min(0.0)
            .max(1.0)
            .step(0.01)
            .name('Brightness')
            .onChange((value) => {
                this.options.maxBrightness = value;
                this.mesh.geometry.dispose();
                this.mesh.geometry = this._getGeometry(guiSettings.step, value);
                this.c3d.three.render();
            });

        gui.add(guiSettings, 'blending')
            .name('Additive Blending')
            .onChange((value) => {
                this.options.blending = value;
                material.blending = value ? THREE.AdditiveBlending : THREE.NormalBlending;
                this.c3d.three.render();
            });

        gui.add(guiSettings, 'direction')
            .name('Direction')
            .onChange((value) => {
                this.options.direction = value;
                this.mesh.geometry.dispose();
                this.mesh.geometry = this._getGeometry(guiSettings.step, guiSettings.maxBrightness, value);
                this.c3d.three.render();
            });

        gui.add(guiSettings, 'copyToCanvas').name('Render to Canvas');
        gui.add(guiSettings, 'cancel').name('Cancel').domElement.classList.add('btn-cancel');

        this.c3d.three.render();
    }

    _getGeometry(density = 2, maxBrightness = 1.0, direction = true)
    {
        const printDims = getPrintDims(this.c3d, {name: this.layer.name}, this.c3d.settings.getRenderDPI());
        this.drawCanvas = document.createElement('canvas');
        this.drawCanvas.width = printDims.width;
        this.drawCanvas.height = printDims.height;
        
        const ctx = this.drawCanvas.getContext('2d', {willReadFrequently: true});

        const fx = Object.keys(this.layer.effects).length > 1;
        const source = fx ? this.layer.effectsCanvas : this.layer.image;
        const imgDims = calculateAspectRatioFit(
            source[fx || this.layer.type != 'image' ? 'width' : 'naturalWidth'], 
            source[fx || this.layer.type != 'image' ? 'height' : 'naturalHeight'], 
            this.drawCanvas.width, 
            this.drawCanvas.height
        );
        
        ctx.drawImage(source, (this.drawCanvas.width - imgDims.width) / 2, (this.drawCanvas.height - imgDims.height) / 2, imgDims.width, imgDims.height);

        const data = ctx.getImageData(0, 0, this.drawCanvas.width, this.drawCanvas.height).data;
        const width = this.drawCanvas.width;
        const height = this.drawCanvas.height;

        const positions = [];
        const colors = [];
        const brightnesses = [];
        const step = density;
        const scaleFactor = 1 / Math.max(width, height);

        for (let y = 0; y < height; y += step)
        {
            for (let x = 0; x < width; x += step)
            {
                const index = (y * width + x) * 4;
                const r = data[index] / 255;
                const g = data[index + 1] / 255;
                const b = data[index + 2] / 255;
                const alpha = data[index + 3];

                if (alpha < 128) continue;
                    
                const brightness = (r * 0.299) + (g * 0.587) + (b * 0.114);

                if (brightness > maxBrightness) continue;

                const posX = (x - width / 2) * scaleFactor;
                const posY = -(y - height / 2) * scaleFactor;
                const posZ = 0;

                positions.push(posX, posY, posZ);
                colors.push(r, g, b);
                brightnesses.push(direction ? brightness : -brightness);
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('aBrightness', new THREE.Float32BufferAttribute(brightnesses, 1));

        return geometry;
    }



    _cancel()
    {
        this.controls.removeEventListeners();
        this.gui.destroy();
        this.mesh.clear();
        this.mesh.removeFromParent();
        if(this.is2DViewing) this.c3d.switchTo2D();
        this.hide();
    };

}
