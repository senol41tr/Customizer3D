import * as THREE from 'three';
import {Dragable} from 'customizer3D_dir/dragable/Dragable.js?c3d=0.6.2';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=0.6.2';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.6.2';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.6.2';
import {createFiltersList, applyFilters} from 'customizer3D_dir/layers/Filters/Filters.js?c3d=0.6.2';
import {createEffectsList, applyEffects} from 'customizer3D_dir/layers/Effects/Effects.js?c3d=0.6.2';
import {degToRad} from 'customizer3D_dir/utils/degToRad.js?c3d=0.6.2';
import {Loader} from 'customizer3D_dir/three/loaders/Loader.js?c3d=0.6.2';
import {ExtractImages} from 'customizer3D_dir/layers/utils/ExtractImages.js?c3d=0.6.2';
import {GUI} from 'three_dir/libs/lil-gui.module.min.js?c3d=0.6.2';
import {Controls} from 'customizer3D_dir/three/utils/Controls.js?c3d=0.6.2';


export class ThreeDModelLayer
{
    constructor(c3d)
    {
        this.c3d = c3d;

        this.htmlEl = document.createElement('div');
        this.htmlEl.classList.add('threeDModelLayer');
        document.querySelector(this.c3d.props.container).append(this.htmlEl);
        this.extractImages = new ExtractImages({c3d: this.c3d});

        this.layer = null;
        this.mesh = null;
        this.is2DViewing = null;
        this.controls = null;
        this.oldCamState = null;

        let el;

        this.htmlEl.innerHTML = `
        <div class="title">
            <p class="label" draggable="false">${this.c3d.lang['add-3d-model-layer']}</p>
            <div class="buttons">
                <img src="${C3D_SERVER}svg/arrow-drop-down.svg?c3d=0.6.2" alt="Icon" class="rollup" draggable="false" style="rotate:-180deg;">
                <img src="${C3D_SERVER}svg/plus.svg?c3d=0.6.2" alt="Icon" class="icon" draggable="false" style="rotate:45deg;">
            </div>
        </div>

        <div class="content">
            <div class="menu">
                <div class="select3dModel">
                    <label class="select3dModel" title="${this.c3d.lang['change-image']}">
                        <img src="svg/change_image.svg" alt="Icon">
                        <input type="file" accept=".glb, .gltf, .obj, .fbx, .stl" style="display:none;">
                    </label>
                </div>
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


        // SELECT IMAGE (SVG)

        el = this.htmlEl.querySelector('div.select3dModel > label.select3dModel > input[type="file"]');
        el.addEventListener('change', async (e) =>
        {
            const file = e.target.files[0];
            const model = (await this.extractImages.extract(file))[0];
            
            if(model.detectedFileType != 'model/gltf-binary' &&
                model.detectedFileType != 'model/fbx' &&
                model.detectedFileType != 'model/obj' &&
                model.detectedFileType != 'model/stl'
            )
            {
                alert("Selected file not supported!\nPlease select valid 3D Model!\n.glb, .gltf, .obj, .fbx, .stl File");
                e.target.dispatchEvent(new Event('cancel'));
                return;
            }
            
            this.layer.fileName = file.name;
            this.layer.detectedFileType = model.detectedFileType;
            this.layer.model = URL.createObjectURL(model.blob);

            await this.showGUI();
        });
        el.addEventListener('cancel', () =>
        {
            if(!this.layer.source)
            {
                this.layer.root.querySelector('img.remove').click();
                this.c3d.showHideUI.hideSubWindows();
            }
        });


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
                'threeDModelLayer'
            );
        });


        // EFFECTS
        
        el = this.htmlEl.querySelector('div.effects > div.button');
        el.addEventListener('click', _listOnclick);
        el.addEventListener('click', () => {
            createEffectsList(
                this.c3d, 
                this.htmlEl.querySelector('div.effects > div.list'), 
                'threeDModelLayer'
            );
        });

        // SHOW SETTINGS

        this.htmlEl.querySelector('div.settings > div.button').addEventListener('click', async () => {
            await this.showGUI();
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

        this.htmlEl.querySelector('div.rotate input[type="range"]').value = this.layer.rotation;
        this.htmlEl.querySelector('div.rotate input[type="number"]').value = this.layer.rotation;

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


    async showGUI()
    {
        if(this.gui) this.gui.destroy();
        
        this.is2DViewing = document.querySelector(this.c3d.props.layers + ' > div.switchTo2D > button').classList.contains('threeD');
        if(this.is2DViewing) this.c3d.switchTo3D();
        this.c3d.showHideUI.hide();
        this.c3d.glbScene.visible = false;
        this.hide();
        this.c3d.three.controls.orbit.enabled = false;

        this.oldCamState = {
            position: this.c3d.three.camera.position.clone(), 
            rotation: this.c3d.three.camera.rotation.clone(),
            target: this.c3d.three.controls.orbit.target.clone()
        };

        await this._load3dModel();
        this.c3d.three.scene.add(this.mesh);

        const model = this.mesh.children[0];
        const box = new THREE.Box3().setFromObject(this.mesh);
        const size = box.getSize(new THREE.Vector3()).length();
        const center = box.getCenter(new THREE.Vector3());

        model.position.x += (model.position.x - center.x);
        model.position.y += (model.position.y - center.y);
        model.position.z += (model.position.z - center.z);

        if(this.layer.options.meshState)
        {
            let o = this.layer.options.meshState.scale;
            this.mesh.scale.set(o.x, o.y, o.z);
            o = this.layer.options.meshState.rotation;
            this.mesh.rotation.set(o.x, o.y, o.z);
        }
        else
        {
            const modelScale = (isMobile() ? 0.5 : 0.5) / size;
            this.mesh.scale.setScalar(modelScale);
        }

        this.c3d.three.render();

        this.controls = new Controls(this.mesh, this.c3d.three.getCanvas());
        this.controls.addEventListeners();

        const gui = this.gui = new GUI({title: '3D Model Position & Rotation'});

        const dragable = new Dragable({
            dragEl: gui.$title,
            container: gui.domElement,
            root: document.querySelector(this.c3d.props.container),
            c3d: this.c3d
        });

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
                    this.c3d.preloader.hide();
                    this.c3d.showHideUI.enableContainer();
                    this.gui.domElement.style.opacity = 1.0;
                }, 250);
            },
            cancel: () =>
            {  
                this.show(this.layer);
                // this.c3d._setNavActive(this.layer.name, true, false);

                if(this.layer.__baked) {
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
        };

        gui.add(guiSettings, 'renderToCanvas').name('Render to Canvas');
        gui.add(guiSettings, 'cancel').name('Cancel').domElement.classList.add('btn-cancel');

    }


    hideGUI()
    {
        if(this.mesh)
        {
            this.mesh.clear();
            this.mesh.removeFromParent();
            this.mesh = null;
        }

        this.gui.destroy();
        if(this.oldCamState)
        {
            this.c3d.three.camera.position.copy(this.oldCamState.position);
            this.c3d.three.camera.rotation.copy(this.oldCamState.rotation);
            this.c3d.three.controls.orbit.target.copy(this.oldCamState.target);
        }

        this.c3d.showHideUI.show();
        this.c3d.glbScene.visible = true;
        this.c3d.three.controls.orbit.enabled = true;
        this.c3d.three.render();

        if(this.controls)
        {
            this.controls.removeEventListeners();
            this.controls = null;
        }
    }



    bakeImageToLayer(isExport)
    {
        if(!this.layer) return;

        this.c3d.glbScene.visible = false;

        const c3d = this.c3d;
        const canvas = this.layer.image;
        const printDims = getPrintDims(this.c3d, {name: this.layer.name}, c3d.settings.MAX_DPI, isExport);
        const ctx = canvas.getContext('2d');
        const w = canvas.width = Math.round(printDims.width);
        const h = canvas.height = Math.round(printDims.height);
        const renderTargetOptions = 
        {
            // samples: 4,
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType,
            colorSpace: THREE.SRGBColorSpace
        };

        this.layer.options.meshState =
        {
            position: {x: this.mesh.position.x, y: this.mesh.position.y, z: this.mesh.position.z}, 
            scale: {x: this.mesh.scale.x, y: this.mesh.scale.y, z: this.mesh.scale.z}, 
            rotation: {x: this.mesh.rotation.x, y: this.mesh.rotation.y, z: this.mesh.rotation.z} 
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
        applyEffects(this.c3d, this.layer, 'threeDModelLayer', isExport);
        applyFilters(this.c3d, this.layer, 'threeDModelLayer', isExport);
        this.layer.__baked = true;

    }

    async _load3dModel()
    {
        let type;
        switch (this.layer.detectedFileType)
        {
            case 'model/fbx': type = 'fbx'; break;
            case 'model/obj': type = 'obj'; break;
            case 'model/stl': type = 'stl'; break;
            default: type = 'glb'; break;
        }

        const loader = new Loader({type, url: this.layer.model, preloader: this.c3d.preloader});
        const model = await loader.load();
        
        let scene = model;

        if(type == 'stl') {
            scene = new THREE.Mesh(model, new THREE.MeshStandardMaterial({ color: 0x888888 }));
        }
        if(type == 'glb') {
            scene = model.scene;
        }
        
        this.mesh = new THREE.Group();
        this.mesh.name = 'threeDModel';
        this.mesh.add(scene);
    }

}
