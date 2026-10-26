import * as THREE from 'three';
import {TTFLoader} from 'three_dir/loaders/TTFLoader.js?c3d=0.6.1';
import {Font} from 'three_dir/loaders/FontLoader.js?c3d=0.6.1';
import {TextGeometry} from 'three_dir/geometries/TextGeometry.js?c3d=0.6.1';
import {Controls} from 'customizer3D_dir/three/utils/Controls.js?c3d=0.6.1';
import {GUI} from 'three_dir/libs/lil-gui.module.min.js';
import {MaterialBrowser} from 'customizer3D_dir/three/MaterialBrowser.js?c3d=0.6.1';
import {Dragable} from 'customizer3D_dir/dragable/Dragable.js?c3d=0.6.1';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=0.6.1';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.6.1';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.6.1';
import {createFiltersList, applyFilters} from 'customizer3D_dir/layers/Filters/Filters.js?c3d=0.6.1';
import {createEffectsList, applyEffects} from 'customizer3D_dir/layers/Effects/Effects.js?c3d=0.6.1';
import {degToRad} from 'customizer3D_dir/utils/degToRad.js?c3d=0.6.1';

export class ThreeDTextLayer
{
    constructor(c3d)
    {
        this.c3d = c3d;

        this.htmlEl = document.createElement('div');
        this.htmlEl.classList.add('threeDTextLayer');
        document.querySelector(this.c3d.props.container).append(this.htmlEl);
        this.materialBrowser = new MaterialBrowser(this.c3d);
        this.textureLoader = new THREE.TextureLoader();

        this.layer = null;
        this.mesh = null;
        this.is2DViewing = null;
        this.controls = null;
        this.oldCamState = null;
        this.__mouseUp = this._mouseUp.bind(this);
        this.__create = this._create.bind(this);
        this.__preMaterial = null;

        let el;

        this.htmlEl.innerHTML = `
        <div class="title">
            <p class="label" draggable="false">${this.c3d.lang['add-3d-text-layer']}</p>
            <div class="buttons">
                <img src="${C3D_SERVER}svg/arrow-drop-down.svg?c3d=0.6.1" alt="Icon" class="rollup" draggable="false" style="rotate:-180deg;">
                <img src="${C3D_SERVER}svg/plus.svg?c3d=0.6.1" alt="Icon" class="icon" draggable="false" style="rotate:45deg;">
            </div>
        </div>

        <div class="content">
            <div class="menu">
                <div class="rotate">
                    <div class="button" title="${this.c3d.lang['rotate']}"><img src="${C3D_SERVER}svg/rotate.svg?c3d=0.6.1" alt="Icon"></div>
                    <div class="list">
                        <div class="inputPercent" data-icon="°" title="${this.c3d.lang['degree']}">
                            <input type="number" min="-180" max="180" value="0">
                        </div>
                        <input type="range" min="-180" max="180" value="0" step="1">
                        <div style="padding-top: 0.5rem;">
                            <img src="${C3D_SERVER}svg/rotation_left.svg?c3d=0.6.1" alt="Icon" class="left" style="">
                            <img src="${C3D_SERVER}svg/rotation_reset.svg?c3d=0.6.1" alt="Icon" class="reset" style="">
                            <img src="${C3D_SERVER}svg/rotation_right.svg?c3d=0.6.1" alt="Icon" class="right">
                        </div>
                    </div>
                </div>
                <div class="zoom">
                    <div class="button" title="${this.c3d.lang['zoom']}"><img src="${C3D_SERVER}svg/zoom.svg?c3d=0.6.1" alt="Icon"></div>
                    <div class="list">
                        <div class="inputPercent" data-icon="%"><input type="number" min="1" max="2000" value="100"></div>
                        <input type="range" min="1" max="2000" value="100" step="0.5">
                    </div>
                </div>
                <div class="filters">
                    <div class="button" title="${this.c3d.lang['filter-gallery']}"><img src="${C3D_SERVER}svg/filters.svg?c3d=0.6.1" alt="Icon"></div>
                    <div class="list">
                    </div>
                </div>
                <div class="effects">
                    <div class="button" title="${this.c3d.lang['effects-gallery']}"><img src="${C3D_SERVER}svg/effects.svg?c3d=0.6.1" alt="Icon"></div>
                    <div class="list">
                    </div>
                </div>
                <div class="settings">
                    <div class="button" title="${this.c3d.lang['settings']}"><img src="${C3D_SERVER}svg/settings.svg?c3d=0.6.1" alt="Icon" style="height:24px;"></div>
                </div>
            </div>
            <canvas class="preview" oncontextmenu="return false;"></canvas>
        </div>`;

        const dragable = new Dragable({
            dragEl: this.htmlEl.querySelector('div.title'),
            container: this.htmlEl,
            root: document.querySelector(this.c3d.props.container),
            c3d: this.c3d
        });

        this.htmlEl.querySelector('div.title > div.buttons > img.rollup').addEventListener('click', (e) => {
            const content = this.htmlEl.querySelector('div.content');
            const visible = content.style.display == 'none' || content.style.display == '' ;
            content.style.display = visible ? 'flex' : 'none';
            e.currentTarget.style.rotate = visible ? '-180deg' : '0deg';
        });

        this.htmlEl.querySelector('div.title > div.buttons > img.icon').addEventListener('click', () => {
            this.hide();
        });

        // Click outside of element

        const _listClickOutside = (e) => // !!!
        {
            if(!this.htmlEl.querySelector('div.rotate > div.list').contains(e.target) && !this.htmlEl.querySelector('div.rotate > div.button').contains(e.target))
            {
                this.htmlEl.querySelector('div.rotate > div.list').style.display = 'none';
            }

            if(!this.htmlEl.querySelector('div.zoom > div.list').contains(e.target) && !this.htmlEl.querySelector('div.zoom > div.button').contains(e.target))
            {
                this.htmlEl.querySelector('div.zoom > div.list').style.display = 'none';
            }

            if(!this.htmlEl.querySelector('div.filters > div.list').contains(e.target) && !this.htmlEl.querySelector('div.filters > div.button').contains(e.target))
            {
                this.htmlEl.querySelector('div.filters > div.list').style.display = 'none';
            }

            if(!this.htmlEl.querySelector('div.effects > div.list').contains(e.target) && !this.htmlEl.querySelector('div.effects > div.button').contains(e.target))
            {
                this.htmlEl.querySelector('div.effects > div.list').style.display = 'none';
            }
        };
        window.addEventListener('click', _listClickOutside);
        window.addEventListener('touchstart', _listClickOutside);


        const _listOnclick = (e) =>
        {
            const divList = e.currentTarget.parentNode.querySelector('div.list');
            divList.style.display = divList.style.display == '' || divList.style.display == 'none' ? 'block' : 'none';
        };



        // ROTATION

        this.htmlEl.querySelector('div.rotate > div.button').addEventListener('click', _listOnclick);
        el = this.htmlEl.querySelector('div.rotate input[type="number"]');
        el.addEventListener('input', (e) => {
            let val = parseFloat(e.currentTarget.value);
            if(isNaN(val)) return;
            e.currentTarget.value = val;
            this.htmlEl.querySelector('div.rotate input[type="range"]').value = val;
            this.layer.rotation = val;
            this.updatePreview();
        });
        el.addEventListener('focus', (e) => e.currentTarget.select());
        el.addEventListener('keydown', (e) => {
            if (e.keyCode === 13)
            {
                e.preventDefault();
                const input = this.htmlEl.querySelector('div.rotate input[type="number"]');
                if(input.value < parseInt(input.min)) input.value = input.min;
                if(input.value > parseInt(input.max)) input.value = input.max;
                this.htmlEl.querySelector('div.rotate input[type="range"]').value = input.value;
                this.layer.rotation = parseFloat(input.value);
                input.parentNode.parentNode.style.display = 'none'; // hide list
                this.updatePreview();
            }
        });
        
        this.htmlEl.querySelector('div.rotate input[type="range"]').addEventListener('input', (e) => {
            this.layer.rotation = parseFloat(e.currentTarget.value);
            this.htmlEl.querySelector('div.rotate input[type="number"]').value = e.currentTarget.value;
            this.updatePreview();
        });

        const _rotate = (deg) => {
            if(deg <= -180) deg = 180;
            else if(deg >= 180) deg = -180;
            this.layer.rotation = deg;
            this.htmlEl.querySelector('div.rotate input[type="number"]').value = deg;
            this.htmlEl.querySelector('div.rotate input[type="range"]').value = deg;
            this.updatePreview();
        };

        this.htmlEl.querySelector('div.rotate img.left').addEventListener('click', (e) => _rotate(this.layer.rotation - 45));
        this.htmlEl.querySelector('div.rotate img.reset').addEventListener('click', (e) => _rotate(0));
        this.htmlEl.querySelector('div.rotate img.right').addEventListener('click', (e) => _rotate(this.layer.rotation + 45));



        // ZOOM

        this.htmlEl.querySelector('div.zoom > div.button').addEventListener('click', _listOnclick);
        el = this.htmlEl.querySelector('div.zoom input[type="number"]');
        el.addEventListener('input', (e) => {
            let val = parseFloat(e.currentTarget.value);
            if(isNaN(val)) return;
            e.currentTarget.value = val;
            this.htmlEl.querySelector('div.zoom input[type="range"]').value = val;
            this.layer.zoom = val;
            this.updatePreview();
        });
        el.addEventListener('focus', (e) => e.currentTarget.select());
        el.addEventListener('keyup', (e) => {
            const input = this.htmlEl.querySelector('div.zoom input[type="number"]');
            if(parseInt(input.value) < parseInt(input.min)) input.value = input.min;
            if(parseInt(input.value) > parseInt(input.max)) input.value = input.max;
            this.htmlEl.querySelector('div.zoom input[type="range"]').value = input.value;
            this.layer.zoom = parseFloat(input.value);
            this.updatePreview();
            if(e.keyCode === 13) input.parentNode.parentNode.style.display = 'none'; // hide list
        });
        
        this.htmlEl.querySelector('div.zoom input[type="range"]').addEventListener('input', (e) => {
            this.layer.zoom = parseFloat(e.currentTarget.value);
            this.htmlEl.querySelector('div.zoom input[type="number"]').value = e.currentTarget.value;
            this.updatePreview();
        });


        // FILTERS
        
        el = this.htmlEl.querySelector('div.filters > div.button');
        el.addEventListener('click', _listOnclick);
        el.addEventListener('click', () => {
            createFiltersList(
                this.c3d, 
                this.htmlEl.querySelector('div.filters > div.list'), 
                'threeDTextLayer'
            );
        });


        // EFFECTS
        
        el = this.htmlEl.querySelector('div.effects > div.button');
        el.addEventListener('click', _listOnclick);
        el.addEventListener('click', () => {
            createEffectsList(
                this.c3d, 
                this.htmlEl.querySelector('div.effects > div.list'), 
                'threeDTextLayer'
            );
        });

        // SHOW SETTINGS

        this.htmlEl.querySelector('div.settings > div.button').addEventListener('click', () => {
            this.showGUI();
            this._create();
        });


        // CANVAS

        const canvasPreview = this.htmlEl.querySelector('canvas.preview');

        const canvasMouseMove = (e) =>
        {
            // https://stackoverflow.com/a/69023543
            const touch = (e.touches && e.touches[0]) || (e.pointerType && e.pointerType === 'touch' && e);
            const clientX = (touch || e).clientX;
            const clientY = (touch || e).clientY;
            const bb = canvasPreview.getBoundingClientRect();

            this.layer.imagePosition =
            {
                x: -canvasPreview.width / 2 + ((clientX - bb.x) * this.c3d.PIXEL_RATIO), 
                y: -canvasPreview.height / 2 + ((clientY - bb.y) * this.c3d.PIXEL_RATIO)
            };
            
            this.updatePreview(true);
        };

        const canvasMouseUp = () =>
        {
            const container = document.querySelector(this.c3d.props.container);
            if(isMobile())
            {
                container.removeEventListener('touchend', canvasMouseUp);
                container.removeEventListener('touchmove', canvasMouseMove);
                document.body.style.overflow = 'auto';
            }
            else
            {
                container.removeEventListener('pointermove', canvasMouseMove);
                container.removeEventListener('pointerup', canvasMouseUp);
            }

            this.updatePreview(false);
        };

        const canvasMouseDown = (e) => 
        {
            canvasMouseMove(e);
            const container = document.querySelector(this.c3d.props.container);
            if(isMobile())
            {
                document.body.style.overflow = 'hidden';
                container.addEventListener('touchend', canvasMouseUp);
                container.addEventListener('touchmove', canvasMouseMove);
            }
            else
            {
                container.addEventListener('pointermove', canvasMouseMove);
                container.addEventListener('pointerup', canvasMouseUp);
            }
        };

        if(isMobile()) canvasPreview.addEventListener('touchstart', canvasMouseDown);
        else canvasPreview.addEventListener('pointerdown', canvasMouseDown);

    }


    show(layer)
    {
        // set active layer
        if(layer) this.layer = layer;
        const canvasPreview = this.htmlEl.querySelector('canvas.preview');

        //
        this.c3d.showHideUI.hideSubWindows();
        document.querySelector(this.c3d.props.layers).style.opacity = 0.25;

        this.htmlEl.querySelector('div.rotate').style.display = 'block';
        this.htmlEl.querySelector('div.rotate input[type="range"]').value = this.layer.rotation;
        this.htmlEl.querySelector('div.rotate input[type="number"]').value = this.layer.rotation;

        this.htmlEl.querySelector('div.zoom').style.display = 'block';
        this.htmlEl.querySelector('div.zoom input[type="range"]').value = this.layer.zoom;
        this.htmlEl.querySelector('div.zoom input[type="number"]').value = this.layer.zoom;

        // set top of window
        this.htmlEl.style.zIndex = this.c3d.zIndex.index;

        // as default show window
        this.htmlEl.querySelector('div.content').style.display = 'flex'; // show content
        this.htmlEl.querySelector('div.title > div.buttons > img.rollup').style.rotate = '180deg';


        // set window position
        const bb = document.querySelector(this.c3d.props.layers).getBoundingClientRect();
        const bbContainer = document.querySelector(this.c3d.props.container).getBoundingClientRect();
        const top = bb.top - bbContainer.y + 32;
        let left = bb.left;
        if(bb.width + bb.x > bbContainer.width + bbContainer.x) left = bbContainer.width + bbContainer.x - bb.width;
        // this.htmlEl.style.left = left + 'px';
        this.htmlEl.style.top = top + 'px';
        this.htmlEl.style.display = 'block';

        // set preview canvas dims.
        const printDims = getPrintDims(this.c3d, this.layer, 72);
        const previewDims = calculateAspectRatioFit(printDims.width, printDims.height, 150, 150);
        canvasPreview.style.width = Math.floor(previewDims.width) + 'px';
        canvasPreview.style.height = Math.floor(previewDims.height) + 'px';
        canvasPreview.width = previewDims.width * this.c3d.PIXEL_RATIO;
        canvasPreview.height = previewDims.height * this.c3d.PIXEL_RATIO;

        if(!this.layer.options.geometry)
        {
            this.showGUI();
            this._create();
            this.layer.updateThumbnail(canvasPreview);
        }

        this.updatePreview();
    }

    hide()
    {
        this.htmlEl.style.display = 'none';
        document.querySelector(this.c3d.props.layers).style.opacity = 1;
    }

    updatePreview(drawLines = false, render = true)
    {
        if(this.layer == null) return;

        const canvas = this.htmlEl.querySelector('canvas.preview');
        const ctx = canvas.getContext('2d', {willReadFrequently: true});
        const layer = this.layer;
        const snapX = Math.abs(layer.imagePosition.x) < 5;
        const snapY = Math.abs(layer.imagePosition.y) < 5;
        const multiplyer = Math.max(1, layer.zoom / 100);
        const x = layer.imagePosition.x * multiplyer;
        const y = layer.imagePosition.y * multiplyer;
        const source = layer.canvas;
        const textureDims = calculateAspectRatioFit(
            source.width, 
            source.height, 
            canvas.width,
            canvas.height
        );

        if(snapX && drawLines) layer.imagePosition.x = 0;
        if(snapY && drawLines) layer.imagePosition.y = 0;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.globalAlpha = layer.opacity / 100;
        ctx.translate(canvas.width / 2 + x, canvas.height / 2 + y);
        ctx.rotate(degToRad(layer.rotation));
        ctx.scale(layer.zoom / 100, layer.zoom / 100);
        ctx.drawImage(
            source, 
            -textureDims.width / 2, 
            -textureDims.height / 2, 
            textureDims.width, 
            textureDims.height
        );
        ctx.restore();

        if(drawLines)
        {        
            ctx.beginPath();
            ctx.setLineDash([5, 3]);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            if(snapY)
            {
                ctx.moveTo(0, Math.round(canvas.height / 2));
                ctx.lineTo(canvas.width, Math.round(canvas.height / 2));
            }
            if(snapX)
            {
                ctx.moveTo(Math.round(canvas.width / 2), 0);
                ctx.lineTo(Math.round(canvas.width / 2), canvas.height);
            }
            ctx.stroke();
        }

        this.layer.updateThumbnail(canvas);
        if(render)
        {
            this.c3d.render3d.renderView(this.layer.name);
            this.c3d.render2d.renderView(this.layer.name);
        }

    }

    bakeImageToLayer(isExport)
    {
        if(!this.layer) return;

        this.c3d.glbScene.visible = false;

        const c3d = this.c3d;
        const canvas = this.layer.canvas;
        const printDims = getPrintDims(this.c3d, {name: this.layer.name}, this.c3d.settings.getRenderDPI(), isExport);
        const ctx = canvas.getContext('2d', {willReadFrequently: true});
        const w = canvas.width = Math.round(printDims.width);
        const h = canvas.height = Math.round(printDims.height);
        
        const renderTargetOptions = 
        {
            // samples: 4,
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType,
            colorSpace: THREE.SRGBColorSpace
        };

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

        // Draw image
        this.layer.image.width = w;
        this.layer.image.height = h;
        const ctxImage = this.layer.image.getContext('2d');
        ctxImage.drawImage(canvas, 0, 0);

        this.hideGUI();
        this.hide();
        applyEffects(this.c3d, this.layer, 'threeDTextLayer', isExport);
        applyFilters(this.c3d, this.layer, 'threeDTextLayer', isExport);
        this.layer.__baked = true;
    }

    showGUI()
    {
        if(this.gui) this.gui.destroy();
        
        this.is2DViewing = document.querySelector(this.c3d.props.layers + ' > div.switchTo2D > button').classList.contains('threeD');
        if(this.is2DViewing) this.c3d.switchTo3D();
        this.c3d.showHideUI.hide();
        this.c3d.glbScene.visible = false;
        this.hide();
        this.c3d.three.controls.orbit.enabled = false;

        const options =
        {
            materialName: 'MeshMatcapMaterial',
            
            material:
            {
                color: '#ffffff',
                matcap: this.materialBrowser.root + 'matcaps/gold/27.webp'
            },

            geometry:
            {
                font: 'ScotchDisplay-SemiBold',
                height: 0.01,
                size: 500,
                curveSegments: 16,
                bevelEnabled: true,
                bevelThickness: 10,
                bevelSize: 5,
                bevelSegments: 10,
            }
        };

        const op = this.layer.options;
        if(!op.geometry) op.geometry = options.geometry;
        if(!op.materialOptions) op.materialOptions = options.material;
        else this.__preMaterialOptions = {...op.materialOptions};
        if(!op.material) op.material = options.materialName;

        const gui = this.gui = new GUI({title: '3D Text Options'});
        const guiSettings =
        {
            renderToCanvas: () =>
            {

                this.c3d.preloader.set('Creating Image Data... ');
                this.c3d.preloader.show();
                this.c3d.showHideUI.disableContainer();
                this.gui.domElement.style.opacity = 0.3;

                setTimeout(() => {
                    this.layer.__baked = false;
                    this.bakeImageToLayer();
                    this.show(this.layer);
                    this.c3d._setNavActive(this.layer.name, true, false);
                    this.c3d.preloader.hide();
                    this.c3d.showHideUI.enableContainer();
                    this.gui.domElement.style.opacity = 1.0;
                }, 250);
            },
            cancel: () =>
            {                
                this.show(this.layer);
                this.c3d._setNavActive(this.layer.name, true, false);

                if(this.layer.__baked) {
                    this.layer.options.materialOptions =  this.__preMaterialOptions;
                    this.hideGUI();
                    return;
                }

                this.__preMaterialOptions = null;
                this.layer.options.materialOptions = null;
                this.layer.options.material = null;
                this.layer.options.geometry = null;
                this.hideGUI();
                this.hide();
                this.layer.div.querySelector('img.remove').click();
            },
            openMaterialBrowser: async () =>
            {
                this.gui.domElement.style.display = 'none';
                await this.materialBrowser.show(this.layer, this.gui, this.__create);
            }
        };

        const txtFolder = gui.addFolder('Please Insert your text below:');

        txtFolder.add(this.layer, 'text')
            .name('Text')
            .onChange((value) => {
                this._create(true);
                value = (isMobile() ? 0.0005 : 0.001) / value.length;
                this.mesh.scale.setScalar(value);
                this.controls.meshScale = value;
            }).domElement.querySelector('div.name').remove();        

        
        const fontFolder = gui.addFolder('Select Font');
        fontFolder.add(this.layer.options.geometry, 'font', this.c3d.textLayer.getFontList())
            .name('Font Family')
            .onChange((value) => {
                this._create(true);
            });


        const matFolder = gui.addFolder('Material');
        matFolder.add(guiSettings, 'openMaterialBrowser').name('Material Browser').domElement.classList.add('btn-material-browser');


        const geoFolder = gui.addFolder('Geometry');

        geoFolder.add(this.layer.options.geometry, 'curveSegments')
            .name('Curve Segments')
            .min(1)
            .max(64)
            .step(1)
            .onChange((value) => {
                this._create(true);
            });

        geoFolder.add(this.layer.options.geometry, 'bevelEnabled')
            .name('Enable Bevel')
            .onChange((value) => {
                this._create(true);
            });

        geoFolder.add(this.layer.options.geometry, 'bevelThickness')
            .name('Bevel Thickness')
            .min(0.1)
            .max(500)
            .step(0.01)
            .onChange((value) => {
                this._create(true);
            });

        geoFolder.add(this.layer.options.geometry, 'bevelSize')
            .name('Bevel Size')
            .min(0.01)
            .max(50)
            .step(0.01)
            .onChange((value) => {
                this._create(true);
            });

        geoFolder.add(this.layer.options.geometry, 'bevelSegments')
            .name('Bevel Segments')
            .min(1)
            .max(64)
            .step(1)
            .onChange((value) => {
                this._create(true);
            });

        gui.add(guiSettings, 'renderToCanvas').name('Render to Canvas');
        gui.add(guiSettings, 'cancel').name('Cancel').domElement.classList.add('btn-cancel');

        window.addEventListener(isMobile() ? 'touchend' : 'mouseup', this.__mouseUp);
        if(!isMobile()) window.addEventListener('wheel', this.__mouseUp);
    }

    hideGUI()
    {
        if(this.mesh)
        {
            this.mesh.clear();
            this.mesh.removeFromParent();
            this.mesh = null;
        }

        this.materialBrowser.hide();
        if(this.gui) this.gui.destroy();
        this.c3d.three.camera.position.copy(this.oldCamState.position);
        this.c3d.three.camera.rotation.copy(this.oldCamState.rotation);
        this.c3d.three.controls.orbit.target.copy(this.oldCamState.target);

        this.c3d.showHideUI.show();
        this.c3d.glbScene.visible = true;
        this.c3d.three.controls.orbit.enabled = true;
        this.c3d.three.render();

        window.removeEventListener(isMobile() ? 'touchend' : 'mouseup', this.__mouseUp);
        this.controls.removeEventListeners();
    }

    _create(reCreate = false)
    {
        if(this.__preMaterial == this.layer.options.material && this.mesh && !reCreate)
        {
            const mo = this.layer.options.materialOptions;
            const mat = this.mesh.material;

            if(this.layer.options.material == 'MeshMatcapMaterial')
            {
                this.textureLoader.load(C3D_SERVER + mo.matcap, (matcap) => {
                    if(mo.color) mat.color = new THREE.Color(mo.color); 
                    mat.matcap.dispose();
                    mat.matcap = matcap;
                    mat.needsUpdate = true;
                    this.c3d.three.render();
                });
            }
            else
            {
                const props = Object.keys(mo);
                for (let i = 0; i < props.length; i++)
                {
                    const prop = props[i];
                    let val = mo[prop];
                    if(typeof val == 'string' && val.startsWith('#')) val = new THREE.Color(val);          
                    mat[prop] = val;
                }
                mat.needsUpdate = true;
                this.c3d.three.render();
            }
            return;
        }

        const geoOptions = this.layer.options.geometry;
        const base64 = this.c3d.textLayer.getFontData(geoOptions.font).base64.split(',')[1];
        const uint8Array = Uint8Array.fromBase64(base64);
        const arrayBuffer = uint8Array.buffer;

        let geo;

        try
        {
            const ttfLoader = new TTFLoader();
            const json = ttfLoader.parse(arrayBuffer);

            const meshGeoOptions = {...geoOptions};
            meshGeoOptions.font = new Font(json);
            geo = new TextGeometry(this.layer.text, meshGeoOptions);
            geo.center();
        }
        catch(e)
        {
            alert("An error occurred while converting the text to 3D!\nPlease select another font family.\nMessage: " + e);
            this.hide();
            return;
        }

        this.oldCamState = {
            position: this.c3d.three.camera.position.clone(), 
            rotation: this.c3d.three.camera.rotation.clone(),
            target: this.c3d.three.controls.orbit.target.clone()
        };
        this.c3d.three.camera.rotation.set(0, 0, 0);
        this.c3d.three.camera.position.set(0, 0, 1);

        const matOptions = {...this.layer.options.materialOptions};
        
        let matcapURL;
        if(this.layer.options.material == 'MeshMatcapMaterial')
        {
            matcapURL = matOptions.matcap;
            matOptions.matcap = this.layer.__matcap;
        }

        if(this.mesh)
        {
            this.mesh.clear();
            this.mesh.removeFromParent();
            this.mesh = null;
        }

        const mat = new THREE[this.layer.options.material](matOptions);
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.name = 'threeDText';

        if(matcapURL)
        {
            this.textureLoader.load(matcapURL, (matcap) => {
                this.layer.__matcap = matcap;
                mat.matcap = matcap;
                mat.needsUpdate = true;
                this.c3d.three.render();
            });
        }

        if(this.layer.options.meshState)
        {
            let o = this.layer.options.meshState.scale;
            this.mesh.scale.set(o.x, o.y, o.z);
            o = this.layer.options.meshState.position;
            this.mesh.position.set(o.x, o.y, o.z);
            o = this.layer.options.meshState.rotation;
            this.mesh.rotation.set(o.x, o.y, o.z);
        }
        else
        {
            this.mesh.rotation.set(0, 0.5, 0);
            this.mesh.scale.setScalar(0.0008);
        }

        this.controls = new Controls(this.mesh, this.c3d.three.getCanvas());
        this.controls.addEventListeners();

        this.c3d.three.scene.add(this.mesh);
        this.c3d.three.render();

        this.__preMaterial = this.layer.options.material;
    }

    _mouseUp()
    {
        if(this.mesh)
        {
            this.layer.options.meshState =
            {
                scale: {x: this.mesh.scale.x, y: this.mesh.scale.y, z: this.mesh.scale.z}, 
                position: {x: this.mesh.position.x, y: this.mesh.position.y, z: this.mesh.position.z},
                rotation: {x: this.mesh.rotation.x, y: this.mesh.rotation.y, z: this.mesh.rotation.z} 
            };
        }
    }



}
