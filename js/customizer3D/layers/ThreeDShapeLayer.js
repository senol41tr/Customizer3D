import * as THREE from 'three';
import {GUI} from 'three_dir/libs/lil-gui.module.min.js';
import {Dragable} from 'customizer3D_dir/dragable/Dragable.js?c3d=0.6.2';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=0.6.2';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.6.2';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.6.2';
import {createFiltersList, applyFilters} from 'customizer3D_dir/layers/Filters/Filters.js?c3d=0.6.2';
import {createEffectsList, applyEffects} from 'customizer3D_dir/layers/Effects/Effects.js?c3d=0.6.2';
import {degToRad} from 'customizer3D_dir/utils/degToRad.js?c3d=0.6.2';
import {MaterialBrowser} from 'customizer3D_dir/three/MaterialBrowser.js?c3d=0.6.2';
import {Controls} from 'customizer3D_dir/three/utils/Controls.js?c3d=0.6.2';

export class ThreeDShapeLayer
{
    constructor(c3d)
    {
        this.c3d = c3d;
        this.layer = null;

        this.htmlEl = document.createElement('div');
        this.htmlEl.classList.add('threeDShapeLayer');
        document.querySelector(this.c3d.props.container).append(this.htmlEl);

        this.mesh = null;
        this.is2DViewing = null;
        this.oldCamState = null;
        this.geomFolder = null;
        this.__updateGeometry = this.updateGeometry.bind(this);
        this.materialBrowser = new MaterialBrowser(this.c3d);
        this.textureLoader = new THREE.TextureLoader();
        this.__preMaterial = null;
        this.__mouseUp = this._mouseUp.bind(this);
        this.__create = this._create.bind(this);
        this.controls = null;


        this.primitiveTypes = [
            'BoxGeometry',
            'ConeGeometry',
            'CylinderGeometry',
            'DodecahedronGeometry',
            'IcosahedronGeometry',
            'RingGeometry',
            'SphereGeometry',
            'TorusGeometry',
            'TorusKnotGeometry'
        ];

        this.geoParams = {
            BoxGeometry: { width: 2, height: 2, depth: 2, widthSegments: 1, heightSegments: 1, depthSegments: 1 },
            ConeGeometry: { radius: 1.5, height: 2.5, radialSegments: 128, heightSegments: 1, openEnded: false, thetaStart: 0, thetaLength: 360 },
            CylinderGeometry: { radiusTop: 1, radiusBottom: 1, height: 2.5, radialSegments: 128, heightSegments: 1, openEnded: false, thetaStart: 0, thetaLength: 360 },
            DodecahedronGeometry: { radius: 1.5, detail: 0 },
            IcosahedronGeometry: { radius: 1.5, detail: 0 },
            RingGeometry: { innerRadius: 0.5, outerRadius: 1.5, thetaSegments: 32, phiSegments: 8, thetaStart: 0, thetaLength: 360 },
            SphereGeometry: { radius: 1.5, widthSegments: 32, heightSegments: 16, phiStart: 0, phiLength: 360, thetaStart: 0, thetaLength: 180 },
            TorusGeometry: { radius: 1.2, tubeRadius: 0.4, radialSegments: 16, tubularSegments: 100 },
            TorusKnotGeometry: { radius: 1.0, tubeRadius: 0.3, tubularSegments: 128, radialSegments: 48, p: 2, q: 3 }
        };



        let el;

        this.htmlEl.innerHTML = `
        <div class="title">
            <p class="label" draggable="false">${this.c3d.lang['add-3d-shape-layer']}</p>
            <div class="buttons">
                <img src="${C3D_SERVER}svg/arrow-drop-down.svg?c3d=0.6.2" alt="Icon" class="rollup" draggable="false" style="rotate:-180deg;">
                <img src="${C3D_SERVER}svg/plus.svg?c3d=0.6.2" alt="Icon" class="icon" draggable="false" style="rotate:45deg;">
            </div>
        </div>

        <div class="content">
            <div class="menu">
                <div class="rotate">
                    <div class="button" title="${this.c3d.lang['rotate']}"><img src="${C3D_SERVER}svg/rotate.svg?c3d=0.6.2" alt="Icon"></div>
                    <div class="list">
                        <div class="inputPercent" data-icon="°" title="${this.c3d.lang['degree']}">
                            <input type="number" min="-180" max="180" value="0">
                        </div>
                        <input type="range" min="-180" max="180" value="0" step="1">
                        <div style="padding-top: 0.5rem;">
                            <img src="${C3D_SERVER}svg/rotation_left.svg?c3d=0.6.2" alt="Icon" class="left" style="">
                            <img src="${C3D_SERVER}svg/rotation_reset.svg?c3d=0.6.2" alt="Icon" class="reset" style="">
                            <img src="${C3D_SERVER}svg/rotation_right.svg?c3d=0.6.2" alt="Icon" class="right">
                        </div>
                    </div>
                </div>
                <div class="zoom">
                    <div class="button" title="${this.c3d.lang['zoom']}"><img src="${C3D_SERVER}svg/zoom.svg?c3d=0.6.2" alt="Icon"></div>
                    <div class="list">
                        <div class="inputPercent" data-icon="%"><input type="number" min="1" max="2000" value="100"></div>
                        <input type="range" min="1" max="2000" value="100" step="0.5">
                    </div>
                </div>
                <div class="filters">
                    <div class="button" title="${this.c3d.lang['filter-gallery']}"><img src="${C3D_SERVER}svg/filters.svg?c3d=0.6.2" alt="Icon"></div>
                    <div class="list">
                    </div>
                </div>
                <div class="effects">
                    <div class="button" title="${this.c3d.lang['effects-gallery']}"><img src="${C3D_SERVER}svg/effects.svg?c3d=0.6.2" alt="Icon"></div>
                    <div class="list">
                    </div>
                </div>
                <div class="settings">
                    <div class="button" title="${this.c3d.lang['settings']}"><img src="${C3D_SERVER}svg/settings.svg?c3d=0.6.2" alt="Icon" style="height:24px;"></div>
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
                'threeDShapeLayer'
            );
        });


        // EFFECTS
        
        el = this.htmlEl.querySelector('div.effects > div.button');
        el.addEventListener('click', _listOnclick);
        el.addEventListener('click', () => {
            createEffectsList(
                this.c3d, 
                this.htmlEl.querySelector('div.effects > div.list'), 
                'threeDShapeLayer'
            );
        });

        // SHOW SETTINGS

        this.htmlEl.querySelector('div.settings > div.button').addEventListener('click', () => {
            this._create();
            this.showGUI();
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

        if(!this.layer.options?.geometry)
        {
            this._create();
            this.showGUI();
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
        const canvas = this.layer.image;
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
        const scale = this.mesh.scale.x;
        this.mesh.scale.setScalar(scale * window.devicePixelRatio);
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

        this.hideGUI();
        this.hide();
        applyEffects(this.c3d, this.layer, 'threeDShapeLayer', isExport);
        applyFilters(this.c3d, this.layer, 'threeDShapeLayer', isExport);
        this.layer.__baked = true;
        
    }

    showGUI()
    {
        if(this.gui)
        {
            this.gui.destroy();
            this.gui = null;
        }

        this.is2DViewing = document.querySelector(this.c3d.props.layers + ' > div.switchTo2D > button').classList.contains('threeD');
        if(this.is2DViewing) this.c3d.switchTo3D();
        this.c3d.showHideUI.hide();
        this.c3d.glbScene.visible = false;
        this.hide();
        this.c3d.three.controls.orbit.enabled = false;

        this.controls = new Controls(this.mesh, this.c3d.three.getCanvas());
        this.controls.addEventListeners();

        const gui = this.gui = new GUI({title: '3D Shapes'});

        const dragable = new Dragable({
            dragEl: gui.$title,
            container: gui.domElement,
            root: document.querySelector(this.c3d.props.container),
            c3d: this.c3d
        });

        const primitivesFolder = gui.addFolder('Primitives');

        const iconGridDiv = document.createElement('div');
        iconGridDiv.classList.add('imageContainer')
        iconGridDiv.style.cssText = 'display:flex; flex-wrap:wrap; gap:0.5rem; padding:0.6rem;';
        
        primitivesFolder.$children.appendChild(iconGridDiv);

        for (let j = 1; j <= 9; j++)
        {
            const primitiveType = this.primitiveTypes[j - 1];
            const imageUrl = `${C3D_SERVER}svg/${primitiveType}.svg`;

            const img = document.createElement('img');
            img.style.cssText = 'width:36px; height:36px; cursor:pointer;';
            img.src = imageUrl;
            img.alt = `${primitiveType} Icon`;
            img.title = primitiveType;

            img.addEventListener('click', () =>
            {
                this.layer.options.primitive = primitiveType;
                this.rebuildGuiFolder();
            });

            iconGridDiv.appendChild(img);
        }

        const matFolder = gui.addFolder('Material Browser');
        matFolder.add(this, 'openMaterialBrowser').name('Material Browser').domElement.classList.add('btn-material-browser');

        this.rebuildGuiFolder();
        this.c3d.three.render();

        window.addEventListener(isMobile() ? 'touchend' : 'mouseup', this.__mouseUp);
        if(!isMobile()) window.addEventListener('wheel', this.__mouseUp);
    }


    renderToCanvas()
    {

        this.c3d.preloader.set('Creating Image Data... ');
        this.c3d.preloader.show();
        this.c3d.showHideUI.disableContainer();
        this.gui.destroy();

        setTimeout(() => {
            this.layer.__baked = false;
            this.bakeImageToLayer();
            this.show(this.layer);
            this.c3d._setNavActive(this.layer.name, true, false);
            this.c3d.preloader.hide();
            this.c3d.showHideUI.enableContainer();
        }, 250);
    }
    cancel()
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
    }

    async openMaterialBrowser()
    {
        this.gui.domElement.style.display = 'none';
        await this.materialBrowser.show(this.layer, this.gui, this.__create);
    }


    hideGUI()
    {
        if(this.mesh)
        {
            this.mesh.clear();
            this.mesh.removeFromParent();
            this.mesh = null;
        }
        
        if(this.gui)
        {
            this.gui.destroy();
            this.gui = null;
        }

        this.c3d.three.camera.position.copy(this.oldCamState.position);
        this.c3d.three.camera.rotation.copy(this.oldCamState.rotation);
        this.c3d.three.controls.orbit.target.copy(this.oldCamState.target);

        this.c3d.showHideUI.show();
        this.c3d.glbScene.visible = true;
        this.c3d.three.controls.orbit.enabled = true;
        this.c3d.three.render();

        if(this.controls)
        {
            this.controls.removeEventListeners();
            this.controls = null;
        }

        window.removeEventListener(isMobile() ? 'touchend' : 'mouseup', this.__mouseUp);
        if(!isMobile()) window.removeEventListener('wheel', this.__mouseUp);
    }

    updateGeometry()
    {
        const mesh = this.mesh;
        
        if (mesh.geometry) {
            mesh.geometry.dispose();
        }

        const type = this.layer.options.primitive;
        const p = this.geoParams[type];

        switch (type) {
            case 'BoxGeometry':
                mesh.geometry = new THREE.BoxGeometry(p.width, p.height, p.depth, p.widthSegments, p.heightSegments, p.depthSegments);
                break;
            case 'ConeGeometry':
                mesh.geometry = new THREE.ConeGeometry(p.radius, p.height, p.radialSegments, p.heightSegments, p.openEnded, degToRad(p.thetaStart), degToRad(p.thetaLength));
                break;
            case 'CylinderGeometry':
                mesh.geometry = new THREE.CylinderGeometry(p.radiusTop, p.radiusBottom, p.height, p.radialSegments, p.heightSegments, p.openEnded, degToRad(p.thetaStart), degToRad(p.thetaLength));
                break;
            case 'DodecahedronGeometry':
                mesh.geometry = new THREE.DodecahedronGeometry(p.radius, p.detail);
                break;
            case 'IcosahedronGeometry':
                mesh.geometry = new THREE.IcosahedronGeometry(p.radius, p.detail);
                break;
            case 'RingGeometry':
                mesh.geometry = new THREE.RingGeometry(p.innerRadius, p.outerRadius, p.thetaSegments, p.phiSegments, degToRad(p.thetaStart), degToRad(p.thetaLength));
                break;
            case 'SphereGeometry':
                mesh.geometry = new THREE.SphereGeometry(p.radius, p.widthSegments, p.heightSegments, degToRad(p.phiStart), degToRad(p.phiLength), degToRad(p.thetaStart), degToRad(p.thetaLength));
                break;
            case 'TorusGeometry':
                mesh.geometry = new THREE.TorusGeometry(p.radius, p.tubeRadius, p.radialSegments, p.tubularSegments);
                break;
            case 'TorusKnotGeometry':
                mesh.geometry = new THREE.TorusKnotGeometry(p.radius, p.tubeRadius, p.tubularSegments, p.radialSegments, p.p, p.q);
                break;
        }

        mesh.geometry.center();
        this.c3d.three.render();
    }


    rebuildGuiFolder()
    {
        if (this.geomFolder) {
            this.geomFolder.destroy();
        }

        const type = this.layer.options.primitive;
        const p = this.geoParams[type];
        this.geomFolder = this.gui.addFolder(`${type}`);

        Object.keys(p).forEach(key => {
            if (typeof p[key] === 'boolean') {
                this.geomFolder.add(p, key).onChange(this.__updateGeometry);
                return;
            }

            const isAngle = key.includes('theta') || key.includes('phi');
            const isSegment = key.toLowerCase().includes('segment') || key === 'detail' || key === 'p' || key === 'q';

            let min = 0.1;
            let max = 5;
            let step = 0.1;

            if (isAngle) {
                min = 0; max = 360; step = 1;
            } else if (isSegment) {
                min = key === 'detail' ? 0 : 1;
                max = key === 'detail' ? 5 : 256;
                step = 1;
            }

            this.geomFolder.add(p, key, min, max, step).onChange(this.__updateGeometry);
        });

        this.geomFolder.add(this, 'renderToCanvas').name('Render to Canvas');
        this.geomFolder.add(this, 'cancel').name('Cancel').domElement.classList.add('btn-cancel');

        this.__updateGeometry();
    }

    _create()
    {

        if(this.__preMaterial == this.layer.options?.material && this.mesh)
        {
            const mo = this.layer.options.materialOptions;

            if(this.layer.options.material == 'MeshMatcapMaterial' && mo.matcap)
            {
                this.textureLoader.load(C3D_SERVER + mo.matcap, (matcap) =>
                {
                    const mat = this.mesh.material;
                    if(mo.color) mat.color = new THREE.Color(mo.color); 
                    if(mat.matcap?.isTexture) mat.matcap.dispose();
                    mat.matcap = matcap;
                    mat.wireframe = mo.wireframe;
                    mat.needsUpdate = true;
                    this.c3d.three.render();
                });
            }
            else
            {
                const mat = this.mesh.material;
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

        this.oldCamState = {
            position: this.c3d.three.camera.position.clone(), 
            rotation: this.c3d.three.camera.rotation.clone(),
            target: this.c3d.three.controls.orbit.target.clone()
        };

        if(this.mesh)
        {
            this.mesh.clear();
            this.mesh.removeFromParent();
        }

        const o = this.layer.options;

        const options =
        {
            primitive: 'TorusKnotGeometry',
            material: 'MeshMatcapMaterial',
            materialOptions:
            {
                color: '#ffffff',
                matcap: this.materialBrowser.root + 'matcaps/ultra-realistic/13.webp',
                side: THREE.DoubleSide
            },
            geometry: {...this.geoParams.TorusKnotGeometry}
        };

        if(!o?.primitive) o.primitive = options.primitive;
        if(!o?.material) o.material = options.material;
        if(!o?.materialOptions) o.materialOptions = options.materialOptions;
        if(!o?.geometry) o.geometry = options.geometry;

        let matcapURL;
        if(o.material == 'MeshMatcapMaterial')
        {
            matcapURL = o.materialOptions.matcap;
            o.materialOptions.matcap = this.layer.__matcap;
        }

        this.mesh = new THREE.Mesh(undefined, new THREE[o.material](o.materialOptions));
        this.mesh.name = 'threeDShape';
        this.c3d.three.scene.add(this.mesh);
        this.updateGeometry();

        if(matcapURL)
        {
            this.textureLoader.load(matcapURL, (matcap) => {
                this.layer.__matcap = matcap;
                o.materialOptions.matcap = matcapURL;
                if(!this.mesh) return;
                const mat = this.mesh.material;
                if(mat.matcap?.isTexture) mat.matcap.dispose();
                mat.matcap = matcap;
                mat.needsUpdate = true;
                this.c3d.three.render();
            });
        }


        if(o.meshState)
        {
            let op = o.meshState.scale;
            this.mesh.scale.set(op.x, op.y, op.z);
            op = o.meshState.position;
            this.mesh.position.set(op.x, op.y, op.z);
            op = o.meshState.rotation;
            this.mesh.rotation.set(op.x, op.y, op.z);
        }
        else
        {
            this.mesh.scale.setScalar(0.1);
        }


        this.c3d.three.render();
        this.__preMaterial = o.material;
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
