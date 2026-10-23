import * as THREE from 'three';
import {GUI} from 'three_dir/libs/lil-gui.module.min.js';
import {Controls} from 'customizer3D_dir/three/utils/Controls.js?c3d=0.5.8';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.5.8';
import {applyFilters} from 'customizer3D_dir/layers/Filters/Filters.js?c3d=0.5.8';
import {mergeRecursive} from 'customizer3D_dir/utils/mergeRecursive.js?c3d=0.5.8';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.5.8';

export class ColorAnalyzer
{
    constructor()
    {
        this.name = 'colorAnalyzer';
        this.label = 'Color Analyzer';

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
        this.drawCtx = null;
        this.imgCanvas = null;
        this.imgCtx = null;
        this.mainTexture = null;
    }

    bakeImageToLayer()
    {
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

        this.is2DViewing = document.querySelector(this.c3d.props.layers + ' > div.switchTo2D > button').classList.contains('threeD');
        if(this.is2DViewing) this.c3d.switchTo3D();
        this.c3d.showHideUI.hide();
        this.c3d.glbScene.visible = false;
        this.c3d[this.layerName].hide();
        this.c3d.three.controls.orbit.enabled = false;
        this.c3d.three.renderer.setPixelRatio(1);

        this.options =
        {
            gridStep: 20,
            colorTolerance: 24,
            shapeType: 0,
            strokeWidth: 0.5,
            crossSize: 12,
            showText: true,
            fontSize: 10,
            useOriginalColor: true,
            strokeColor: '#ffffff',
            bgOpacity: 0.15,
            bgColor: '#000000',
            transparentBG: false,
            labelOpacity: 1.0
        };

        mergeRecursive(this.options, this.layer.effects[this.name]);
        
        this.layer.effects[this.name] = this.options;

        this.drawCanvas = this.layer.effectsCanvas;
        this.drawCtx = this.drawCanvas.getContext('2d', {willReadFrequently: true});

        this.imgCanvas = document.createElement('canvas');
        this.imgCanvas.width = this.drawCanvas.width;
        this.imgCanvas.height = this.drawCanvas.height;
        this.imgCtx = this.imgCanvas.getContext('2d', {willReadFrequently: true});

        const fx = Object.keys(this.layer.effects).length > 1;
        const source = fx ? this.layer.effectsCanvas : this.layer.image;
        const imgDims = calculateAspectRatioFit(
            source[fx || this.layer.type != 'image' ? 'width' : 'naturalWidth'], 
            source[fx || this.layer.type != 'image' ? 'height' : 'naturalHeight'], 
            this.drawCanvas.width, 
            this.drawCanvas.height
        );
        
        this.imgCtx.drawImage(source, (this.drawCanvas.width - imgDims.width) / 2, (this.drawCanvas.height - imgDims.height) / 2, imgDims.width, imgDims.height);

        this.mainTexture = new THREE.CanvasTexture(this.drawCanvas);
        this.mainTexture.colorSpace = THREE.SRGBColorSpace;

        const planeMaterial = new THREE.MeshBasicMaterial({
            map: this.mainTexture,
            transparent: true,
            depthTest:false,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        const planeDims = calculateAspectRatioFit(this.drawCanvas.width, this.drawCanvas.height, isMobile() ? 0.65 : 1, isMobile() ? 0.65 : 1);
        this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(planeDims.width,planeDims.height), planeMaterial);
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
            this.mesh.position.z = isMobile() ? 0 : 0.5;
        }

        this.oldCamState = {
            position: this.c3d.three.camera.position.clone(), 
            rotation: this.c3d.three.camera.rotation.clone(),
            target: this.c3d.three.controls.orbit.target.clone()
        };
        this.c3d.three.camera.rotation.set(0, 0, 0);
        this.c3d.three.camera.position.set(0, 0, 2);

        this.controls = new Controls(this.mesh, this.c3d.three.getCanvas());
        this.controls.addEventListeners();


        const gui = this.gui = new GUI({ title: ' Color Analyzer' });
        const guiSettings = {
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

        const __update = this._update.bind(this);
        const colorFolder = gui.addFolder('Color Filtering & Tolerance');
        colorFolder.add(this.options, 'colorTolerance', 12, 64, 4).name(' Color Tolerance').onChange(__update);
        colorFolder.add(this.options, 'gridStep', 8, 48, 1).name(' Sampling Step').onChange(__update);

        const shapeFolder = gui.addFolder('Shapes');
        shapeFolder.add(
            this.options,
            'shapeType',
            {
                'Mix All': 0,
                'Circle': 1,
                'Square': 2,
                'Triangle': 3
            }
        ).name(' Shape Type').onChange(__update);

        shapeFolder.add(this.options, 'strokeWidth', 0.1, 6, 0.1)
            .name(' Stroke Width')
            .onChange(__update);
        
        shapeFolder.add(this.options, 'crossSize', 0, 300, 1)
            .name(' Cross Size')
            .onChange(__update);

        const styleFolder = gui.addFolder('Style');

        styleFolder.add(this.options, 'useOriginalColor')
            .name(' Use Image Colors')
            .onChange(__update)
            .listen();
        
        styleFolder.addColor(this.options, 'strokeColor')
            .name(' Fixed Stroke Color')
            .onChange(() => {
                this.options.useOriginalColor = false;
                __update();
            });
        
        styleFolder.add(this.options, 'showText')
            .name(' Show Text')
            .onChange(__update);
        
        styleFolder.add(this.options, 'fontSize', 6, 24, 1)
            .name(' Font Size')
            .onChange(__update);
        
        styleFolder.add(this.options, 'labelOpacity', 0, 1, 0.01)
            .name(' Text Opacity')
            .onChange(__update);
        
        styleFolder.addColor(this.options, 'bgColor')
            .name(' Background Color')
            .onChange(() => {
                __update();
                this.options.transparentBG = false;
            });
        
        styleFolder.add(this.options, 'bgOpacity', 0.0, 1.0, 0.05)
            .name(' BG Photo Opacity')
            .onChange(__update)
            .listen();
        
        styleFolder.add(this.options, 'transparentBG').name(' Transparent BG')
        .onChange((value) => {
                if(value) this.options.bgOpacity = 1.0;
                __update();
            })
            .listen();

        gui.add(guiSettings, 'copyToCanvas')
            .name('Render to Canvas');
        
        gui.add(guiSettings, 'cancel')
            .name('Cancel')
            .domElement.classList.add('btn-cancel');

        __update();

        this.c3d.three.render();
    }

    _cancel()
    {
        this.controls.removeEventListeners();
        this.gui.destroy();
        this.mesh.clear();
        this.mesh.removeFromParent();
        if(this.is2DViewing) this.c3d.switchTo2D();
        this.hide();
    }

    _update()
    {
        const width = this.drawCanvas.width;
        const height = this.drawCanvas.height;

        this.drawCtx.clearRect(0, 0, width, height);

        this.drawCtx.save();
        
        if(!this.options.transparentBG)
        {
            this.drawCtx.fillStyle = this.options.bgColor;
            this.drawCtx.fillRect(0, 0, width, height);
        }
        this.drawCtx.globalAlpha = this.options.bgOpacity;
        this.drawCtx.imageSmoothingEnabled = false;
        this.drawCtx.drawImage(this.imgCanvas, 0, 0, width, height);
        this.drawCtx.restore();

        const imgData = this.imgCtx.getImageData(0, 0, width, height);
        const pixels = imgData.data;
        const step = this.options.gridStep;
        const tol = this.options.colorTolerance;
        const __padZero = (str, len = 2) =>
        {
            const zeros = new Array(len).join('0');
            return (zeros + str).slice(-len);
        };

        const colorMap = new Map();

        for (let y = step / 2; y < height; y += step) {
            for (let x = step / 2; x < width; x += step) {
                const posX = Math.floor(x);
                const posY = Math.floor(y);

                const idx = (posY * width + posX) * 4;
                const r = pixels[idx];
                const g = pixels[idx + 1];
                const b = pixels[idx + 2];

                const qR = Math.floor(r / tol) * tol;
                const qG = Math.floor(g / tol) * tol;
                const qB = Math.floor(b / tol) * tol;
                const colorKey = `${qR}_${qG}_${qB}`;

                if (colorMap.has(colorKey)) {
                    colorMap.get(colorKey).count += 1;
                } else {
                    colorMap.set(colorKey, {
                        key: colorKey,
                        x: posX,
                        y: posY,
                        r: r,
                        g: g,
                        b: b,
                        count: 1
                    });
                }
            }
        }

        colorMap.forEach((item) => {
            const luminance = (0.299 * item.r + 0.587 * item.g + 0.114 * item.b) / 255;

            let radius = 4 + (luminance * 6) + (item.count * 2.2);
            // radius = Math.min(radius, 75);

            const isOutOfBounds = (
                item.x - radius < 0 || 
                item.x + radius > width || 
                item.y - radius < 0 || 
                item.y + radius > height
            );

            if (isOutOfBounds) {
                return;
            }

            let currentShape = this.options.shapeType;
            if (this.options.shapeType === 0) {
                currentShape = this._getHashType(item.key);
            }

            this.drawCtx.lineWidth = this.options.strokeWidth;
            if (this.options.useOriginalColor) {
                this.drawCtx.strokeStyle = `rgb(${item.r}, ${item.g}, ${item.b})`;
            } else {
                this.drawCtx.strokeStyle = this.options.strokeColor;
            }

            this._drawShape(this.drawCtx, item.x, item.y, radius, currentShape);

            if (this.options.showText) {
                this.drawCtx.fillStyle = this.options.useOriginalColor ? `rgba(${item.r}, ${item.g}, ${item.b}, ${this.options.labelOpacity})` : this.options.strokeColor;
                this.drawCtx.font = `Bold ${this.options.fontSize}px monospace`;
                this.drawCtx.textAlign = 'left';
                this.drawCtx.textBaseline = 'middle';

                const r = __padZero(item.r.toString(16));
                const g = __padZero(item.g.toString(16)); 
                const b = __padZero(item.b.toString(16));
                const label = `#${r}${g}${b}`.toUpperCase() + ` [X${item.count}]`;
                const textOffset = radius + 5;
                
                this.drawCtx.fillText(label, item.x + textOffset, item.y);
            }
        });

        this.mainTexture.needsUpdate = true;
        this.c3d.three.render();
    }

    _drawShape(ctx, x, y, radius, type)
    {
        ctx.beginPath();
        if (type === 1) {
            ctx.arc(x, y, radius, 0, Math.PI * 2);
        } else if (type === 2) {
            ctx.rect(x - radius, y - radius, radius * 2, radius * 2);
        } else if (type === 3) {
            const height = radius * Math.sqrt(3);
            ctx.moveTo(x, y - radius);
            ctx.lineTo(x + radius, y + height / 2);
            ctx.lineTo(x - radius, y + height / 2);
            ctx.closePath();
        }
        ctx.stroke();

        const cSize = this.options.crossSize;
        ctx.beginPath();
        ctx.moveTo(x - cSize, y);
        ctx.lineTo(x + cSize, y);
        ctx.moveTo(x, y - cSize);
        ctx.lineTo(x, y + cSize);
        ctx.stroke();
    }

    _getHashType(key)
    {
        let hash = 0;
        for (let i = 0; i < key.length; i++) hash = (hash << 5) - hash + key.charCodeAt(i);
        return (Math.abs(hash) % 3) + 1;
    }

}
