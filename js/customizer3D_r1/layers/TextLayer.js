import * as THREE from 'three';
import {uniforms2, vertexShader2, fragmentShader2} from 'customizer3D_dir/three/materials/Shaders.js';
import {Three} from 'customizer3D_dir/three/Three.js';
import * as opentype from "base/opentype/opentype.esm.js";
import ColorPicker from 'base/jscolorpicker/colorpicker.js';
import {Dragable} from 'customizer3D_dir/dragable/Dragable.js';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js';
import {Size} from 'customizer3D_dir/utils/Size.js';
import {createFiltersList} from 'customizer3D_dir/layers/Filters/createFiltersList.js';
import {getCorrectedAxis} from 'customizer3D_dir/layers/utils/getCorrectedAxis.js';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js';

export class TextLayer
{
    constructor(c3d)
    {
        this.c3d = c3d;
        this.htmlEl = document.querySelector(this.c3d.props.textLayer);

        this.three = null;
        this.canvas = null;
        this.texture = null;
        this.gridLines = null;

        this.customFonts = [];
        this.builtInFonts = [];
        this.layer = {};
        this._customFontInputID = 'C3D_loadCustomFontInput' + new Date().getTime(); // <input id=
        this._snap = false;

        let el;

        this.htmlEl.innerHTML = `
        <div class="title">
            <p class="label" draggable="false">${this.c3d.lang['add-text-layer']}</p>
            <div class="buttons">
                <img src="${C3D_SERVER}svg/arrow-drop-down.svg" alt="Icon" class="rollup" draggable="false" style="rotate:-180deg;">
                <img src="${C3D_SERVER}svg/plus.svg" alt="Icon" class="icon" draggable="false" style="rotate:45deg;">
            </div>
        </div>

        <div class="content">
            <input type="text" class="text" placeholder="${this.c3d.lang['enter-your-text']}">
            <div class="menu">
                <div class="builtInFonts">
                    <div class="button" title="${this.c3d.lang['font']}">
                        <img src="${C3D_SERVER}svg/font_family.svg" alt="Icon">
                    </div>
                    <div class="list"></div>
                </div>
                <div class="fontSizes">
                    <div class="button" title="${this.c3d.lang['size']}">
                        <img src="${C3D_SERVER}svg/font_size.svg" alt="Icon">
                    </div>
                    <!-- change Text.js if default font size change -->
                    <div class="list">
                        <div class="inputPercent" title="pt">
                            <input type="number" min="1" max="552" value="50">
                        </div>
                        <input type="range" min="1" max="552" value="50" step="1">
                    </div>
                </div>
                <div class="color_picker" title="${this.c3d.lang['color']}"></div>
                <div class="filters">
                    <div class="button" title="${this.c3d.lang['filter-gallery']}">
                        <img src="${C3D_SERVER}svg/filters.svg" alt="Icon">
                    </div>
                </div>
                <div class="threeD">
                    <div class="button" title="${this.c3d.lang['3D-text']}">
                        <img src="${C3D_SERVER}svg/3D.svg" alt="Icon">
                    </div>
                    <div class="list">
                    </div>
                </div>
            </div>
            <canvas class="preview" oncontextmenu="return false;"></canvas>
            <div class="input">
                <div class="list"></div>
                <a href="https://convertio.co" target="_blank" class="convertURL">${this.c3d.lang['convert-font']}</a>
            </div>
            <div style="padding-top:0.25rem;">
                <div class="snap toggle">
                    <div class="button" title="${this.c3d.lang['snap']}">
                        <img src="${C3D_SERVER}svg/magnet.svg" alt="Icon">
                    </div>
                </div>

                <div class="rotate">
                    <div class="button" title="${this.c3d.lang['rotate']}">
                        <img src="${C3D_SERVER}svg/rotate.svg" alt="Icon">
                    </div>
                    <div class="list">
                        <div class="inputPercent" title="°"><input type="number" min="0" max="360" value="0"></div>
                        <input type="range" min="0" max="360" value="0" step="0.1">
                    </div>
                </div>
                <div class="zoom">
                    <div class="button" title="${this.c3d.lang['zoom']}">
                        <img src="${C3D_SERVER}svg/zoom.svg" alt="Icon">
                    </div>
                    <div class="list">
                        <div class="inputPercent" title="%"><input type="number" min="10" max="500" value="100"></div>
                        <input type="range" min="10" max="500" value="100" step="1">
                    </div>
                </div>
            </div>
        </div>`;

        const canvasPreview = this.htmlEl.querySelector('canvas.preview');
        const _upDateLayer = () =>
        {
            this.updatePreview(null, false);
        };

        // COLOR PICKERS

        const ce = this.c3d.colorEngine;
        ce.invert('#eeff00', false, false);
        this.colorPicker = new ColorPicker(this.htmlEl.querySelector('div.color_picker'), {
            color: ce.color,
            submitMode: 'instant',
            enableEyedropper:true,
            enableAlpha:false,
            loadLocalSwatches:true,
            localStorage: this.c3d.localStorage,
            c3d: this.c3d
        });
        
        this.colorPicker.on('pick', (color) => {
            ce.invert(color.string('hex'), true, false);
            canvasPreview.style.backgroundColor = ce.color;
            this.layer.color = color.string('hex');
            this.updatePreview(null, false, false);
        });

        this.colorPicker.on('close', () => {
            if(this.layer.is3D) {
                this.layer.threeDText.update(true);
                this.c3d.render3d.renderTextLayer(this.layer);
            }
        });

        // CANVAS 3D

        this.three = new Three(this.c3d, {
            rendererOptions:
            {
                canvas: canvasPreview
            }
        });

        this.three.setupAll();//Orthographic();
        this.three.camera.position.z = 1;

        this.canvas = document.createElement('canvas');
        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.matrixAutoUpdate = false;
        this.texture.generateMipmaps = false;
        // this.texture.colorSpace = THREE.SRGBColorSpace;

        this.gridLines = new THREE.CanvasTexture(document.createElement('canvas'));
        this.gridLines.minFilter = THREE.LinearFilter;

        const canvasMouseMove = (e) =>
        {
            const touch = (e.touches && e.touches[0]) || (e.pointerType && e.pointerType === 'touch' && e);
            const clientX = (touch || e).clientX;
            const clientY = (touch || e).clientY;
            
            const bb = canvasPreview.getBoundingClientRect();

            this.layer.textPosition =
            {
                x: (((clientX - bb.left) / bb.width) - 0.5) / (this.layer.zoom / 100), 
                y: (0.5 - ((clientY - bb.top) / bb.height)) / (this.layer.zoom / 100)
            };
            if(this.layer.is3D) _upDateLayer();
            else {
                this.updatePreview();
                this.c3d.render3d.renderTextLayer(this.layer);
                this.three.render();
            }
        };

        const canvasMouseUp = () =>
        {
            const container = document.querySelector(this.c3d.props.container);
            if(isMobile())
            {
                container.removeEventListener('touchend', canvasMouseUp);
                container.removeEventListener('touchmove', canvasMouseMove);
            }
            else
            {
                container.removeEventListener('pointermove', canvasMouseMove);
                container.removeEventListener('pointerup', canvasMouseUp);
            }

            if(!this.layer.is3D)
            {
                this.c3d.render3d.renderTextLayer(this.layer);
                this.updatePreview();
            }
            this.updatePreview(null, false, false);
        };

        const canvasMouseDown = (e) => 
        {
            canvasMouseMove(e);
            const container = document.querySelector(this.c3d.props.container);
            if(isMobile())
            {
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

        
        // OTHER HTML STUFF
        
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

        this.htmlEl.querySelector('div.content > input.text').addEventListener('input', (e) => {
            this.layer.setText(e.currentTarget.value);
            this.layer.text = e.currentTarget.value;
            if(!this.layer.is3D) {
                this.c3d.render3d.renderTextLayer(this.layer);
            }
            this.updatePreview(null, true, false);
        });
        this.htmlEl.querySelector('div.content > input.text').addEventListener('focus', (e) => e.currentTarget.select());

        this.htmlEl.querySelector('div.builtInFonts > div.button').addEventListener('click', this._listOnclick.bind(this));
        this.htmlEl.querySelector('div.fontSizes > div.button').addEventListener('click', this._listOnclick.bind(this));
        this.htmlEl.querySelector('div.rotate > div.button').addEventListener('click', this._listOnclick.bind(this));
        this.htmlEl.querySelector('div.zoom > div.button').addEventListener('click', this._listOnclick.bind(this));
        
        // FONT SIZE

        el = this.htmlEl.querySelector('div.fontSizes input[type="number"]');
        el.addEventListener('input', (e) => {
            let val = parseInt(e.currentTarget.value);
            if(isNaN(val)) return;
            e.currentTarget.value = val;
            this.htmlEl.querySelector('div.fontSizes input[type="range"]').value = val;
            this.layer.fontSize = val;
            if(!this.layer.is3D) {
                this.c3d.render3d.renderTextLayer(this.layer);
            }
            _upDateLayer();
        });
        el.addEventListener('focus', (e) => e.currentTarget.select());
        el.addEventListener('keydown', (e) => 
        {
            if (e.keyCode === 13)
            {
                e.preventDefault();
                const input = this.htmlEl.querySelector('div.fontSizes input[type="number"]');
                if(input.value < parseInt(input.min)) input.value = input.min;
                if(input.value > parseInt(input.max)) input.value = input.max;
                this.htmlEl.querySelector('div.fontSizes input[type="range"]').value = input.value;
                this.layer.fontSize = input.value;
                _upDateLayer();
                input.parentNode.parentNode.style.display = 'none'; // hide list
            }
        });
        
        this.htmlEl.querySelector('div.fontSizes input[type="range"]').addEventListener('input', (e) => {
            this.layer.fontSize = e.currentTarget.value;
            this.htmlEl.querySelector('div.fontSizes input[type="number"]').value = e.currentTarget.value;
            this.updatePreview(null, true, false);
        });

        this.htmlEl.querySelector('div.fontSizes input[type="range"]').addEventListener('change', (e) => {
            this.c3d.render3d.renderTextLayer(this.layer);
            this.updatePreview(null, true, false);
        });


        // ROTATION

        el = this.htmlEl.querySelector('div.rotate input[type="number"]');
        el.addEventListener('input', (e) => {
            let val = parseInt(e.currentTarget.value);
            if(isNaN(val)) return;
            e.currentTarget.value = val;
            this.htmlEl.querySelector('div.rotate input[type="range"]').value = val;
            this.layer.rotation = parseFloat(val);
            this.updatePreview();
        });
        el.addEventListener('focus', (e) => e.currentTarget.select());
        el.addEventListener('keydown', (e) => 
            {
                if (e.keyCode === 13)
                {
                    e.preventDefault();
                    const input = this.htmlEl.querySelector('div.rotate input[type="number"]');
                    if(input.value < parseInt(input.min)) input.value = input.min;
                    if(input.value > parseInt(input.max)) input.value = input.max;
                    this.htmlEl.querySelector('div.rotate input[type="range"]').value = input.value;
                    this.layer.rotation = parseFloat(input.value);
                    this.updatePreview();
                    input.parentNode.parentNode.style.display = 'none'; // hide list
                }
            }
        );
        
        this.htmlEl.querySelector('div.rotate input[type="range"]').addEventListener('input', (e) => {
            this.layer.rotation = parseFloat(e.currentTarget.value);
            this.htmlEl.querySelector('div.rotate input[type="number"]').value = e.currentTarget.value;
            this.updatePreview();
        });


        // ZOOM

        el = this.htmlEl.querySelector('div.zoom input[type="number"]');

        el.addEventListener('input', (e) => {
            let val = parseFloat(e.currentTarget.value);
            if(isNaN(val)) return;
            e.currentTarget.value = val;
            this.htmlEl.querySelector('div.zoom input[type="range"]').value = val;
            this.layer.zoom = val;
            _upDateLayer();
        });

        el.addEventListener('focus', (e) => e.currentTarget.select());

        el.addEventListener('keyup', (e) => {
            const input = this.htmlEl.querySelector('div.zoom input[type="number"]');
            if(e.keyCode === 13) input.parentNode.parentNode.style.display = 'none'; // hide list
            _upDateLayer();
        });
        
        el = this.htmlEl.querySelector('div.zoom input[type="range"]');
        el.addEventListener('input', (e) => {
            this.layer.zoom = parseFloat(e.currentTarget.value);
            this.htmlEl.querySelector('div.zoom input[type="number"]').value = e.currentTarget.value;
            _upDateLayer();
        });


        // CONVERT TO 3D TEXT

        el = this.htmlEl.querySelector('div.threeD > div.button');
        el.addEventListener('click', () => this.layer.converTo3D());


        // SNAP

        el = this.htmlEl.querySelector('div.snap > div.button');
        el.addEventListener('click', (e) =>
        {
            this._snap = !this._snap;

            const el = e.currentTarget.parentNode;       
            el.classList[this._snap ? 'remove' : 'add']('toggle');
            this.c3d.localStorage.set('snapping', this._snap ? 1 : 0);

        });
        const snapping = parseInt(this.c3d.localStorage.get('snapping'));
        this._snap = snapping == 1;
        el.parentNode.classList[this._snap ? 'remove' : 'add']('toggle');



        const _listClickOutside = (e) =>
        {
            if(!this.htmlEl.querySelector('div.builtInFonts > div.list').contains(e.target) && !this.htmlEl.querySelector('div.builtInFonts > div.button').contains(e.target))
            {
                this.htmlEl.querySelector('div.builtInFonts > div.list').style.display = 'none';
            }
            if(!this.htmlEl.querySelector('div.fontSizes > div.list').contains(e.target) && !this.htmlEl.querySelector('div.fontSizes > div.button').contains(e.target))
            {
                this.htmlEl.querySelector('div.fontSizes > div.list').style.display = 'none';
            }
            if(!this.htmlEl.querySelector('div.rotate > div.list').contains(e.target) && !this.htmlEl.querySelector('div.rotate > div.button').contains(e.target))
            {
                this.htmlEl.querySelector('div.rotate > div.list').style.display = 'none';
            }
            if(!this.htmlEl.querySelector('div.zoom > div.list').contains(e.target) && !this.htmlEl.querySelector('div.zoom > div.button').contains(e.target))
            {
                this.htmlEl.querySelector('div.zoom > div.list').style.display = 'none';
            }
        };
        window.addEventListener('click', _listClickOutside);
        window.addEventListener('touchstart', _listClickOutside);

        this._addCustomFontInput(); // add custom font input

    }


    show(textLayer, width, height)
    {
        if(!textLayer._mesh) return;

        // set as active layer
        this.layer = textLayer;

        // set top of window
        this.htmlEl.style.zIndex = this.c3d.zIndex.index;

        //
        this.c3d.imageLayer.hide();

        // CANVAS
        const previewCanvas = this.htmlEl.querySelector('canvas.preview');
        const printSize = getPrintDims(this.c3d, this.layer, 72);
        const isExport = width && height ? true : false;
        const previewCanvasDims = isExport ? {width, height} : calculateAspectRatioFit(printSize.width, printSize.height, 150, 150);

        if(!isExport)
        {
            this.canvas.style.width = Math.floor(previewCanvasDims.width) + 'px';
            this.canvas.style.height = Math.floor(previewCanvasDims.height) + 'px';
        }
        this.canvas.width = Math.floor(previewCanvasDims.width) * (isExport ? 1 : this.c3d.PIXEL_RATIO);
        this.canvas.height = Math.floor(previewCanvasDims.height) * (isExport ? 1 : this.c3d.PIXEL_RATIO);

        if(!isExport)
        {
            previewCanvas.style.width = Math.floor(previewCanvasDims.width) + 'px';
            previewCanvas.style.height = Math.floor(previewCanvasDims.height) + 'px';
        }
        previewCanvas.width = Math.floor(previewCanvasDims.width);
        previewCanvas.height = Math.floor(previewCanvasDims.height);


        this.gridLines.image.width = this.canvas.width;
        this.gridLines.image.height = this.canvas.height;

        // RESIZE THREE CANVAS 

        if(isExport) this.three._onResize(null, Math.floor(previewCanvasDims.width), Math.floor(previewCanvasDims.height));
        else this.three._onResize();

        // Dispose old texture
        const oldPlane = this.three.scene.getObjectByName('texture');
        if(oldPlane) oldPlane.material.uniforms.tDiffuse.value.dispose();
        
        this.three._clearThree(this.three.scene);

        const uniforms = THREE.UniformsUtils.clone(uniforms2);
        uniforms.tDiffuse.value = this.texture;

        const material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader: vertexShader2,
            fragmentShader: fragmentShader2,
            transparent: true
        });

        const ang_rad = this.three.camera.fov * Math.PI / 180;
        const fov_y = this.three.camera.position.z * Math.tan(ang_rad / 2) * 2;
        const geometry = new THREE.PlaneGeometry(fov_y * this.three.camera.aspect, fov_y);

        const gridLines = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({map: this.gridLines, transparent: true}));
        gridLines.name = 'gridLines';
        this.three.scene.add(gridLines);

        const plane = new THREE.Mesh(geometry, material);
        plane.name = 'texture';
        this.three.scene.add(plane);

        // disable/enable font size
        const fSize = this.htmlEl.querySelector('div.fontSizes');
        fSize.style.display = this.layer.is3D ? 'none' : 'block';

        // disable/enable rotation
        const rotation = this.htmlEl.querySelector('div.rotate');
        rotation.style.display = this.layer.is3D ? 'block' : 'none';

        // disable/enable rotation
        const zoom = this.htmlEl.querySelector('div.zoom');
        zoom.style.display = this.layer.is3D ? 'block' : 'none';

        // as default show window
        this.htmlEl.querySelector('div.content').style.display = 'flex'; // show content
        this.htmlEl.querySelector('div.title > div.buttons > img.rollup').style.rotate = '180deg';

        // set window position
        const bb = document.querySelector(this.c3d.props.layers).getBoundingClientRect();
        const bbContainer = document.querySelector(this.c3d.props.container).getBoundingClientRect();
        const top = bb.top - bbContainer.y;
        const left = bb.left + bb.width + 16;

        document.querySelector(this.c3d.props.textLayer).style.display = 'none';

        this.htmlEl.style.left = left + 'px';
        this.htmlEl.style.top = top + 'px';
        this.htmlEl.style.display = 'block';

        // reset window vars
        this.htmlEl.querySelector('div.fontSizes input[type="range"]').value = this.layer.fontSize;
        this.htmlEl.querySelector('div.fontSizes input[type="number"]').value = this.layer.fontSize;
        this.htmlEl.querySelector('div.rotate input[type="range"]').value = this.layer.rotation;
        this.htmlEl.querySelector('div.rotate input[type="number"]').value = this.layer.rotation;
        this.htmlEl.querySelector('div.content > input.text').value = this.layer.text;

        // set class vars
        if(!this.layer.color)
        {
            const ce = this.c3d.colorEngine;
            ce.invert('#eeff00', false)
            this.layer.color = ce.color;
            ce.hex('#eeff00', false);
            this.colorPicker.setColor(ce.color);
        }
        else
        {
            this.colorPicker.setColor(this.layer.color);
        }

        // FILTERS
        const filtersDiv = this.htmlEl.querySelector('div.filters');
        filtersDiv.style.display = this.layer.is3D ? 'block' : 'none';
        if(this.layer.is3D) createFiltersList(this.c3d, this, this.htmlEl.querySelector('div.filters > div.button'));

        this.layer.setText(this.layer.text);
        this.updatePreview(null, true, false);
        // if(!this.layer.is3D) this.c3d.render3d.renderTextLayer(this.layer);
        this.three.render();
    }

    hide()
    {
        this.htmlEl.style.display = 'none';
    }


    updatePreview(canvasData = null, reDraw = true, drawSnappingLines = true)
    {        
        if(!this.layer || !this.layer._mesh) return;
        
        let snapX, snapY;

        if(this._snap)
        {
            const snap = 0.05;
            const snapXPos = this.layer.textPosition.x;
            const snapYPos = this.layer.textPosition.y;
            snapX = (snapXPos >= -snap) && (snapXPos <= snap);
            snapY = (snapYPos >= -snap) && (snapYPos <= snap);
            if(snapX) this.layer.textPosition.x = 0;
            if(snapY) this.layer.textPosition.y = 0;
        }

        if(reDraw)
        {
            const ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            if(canvasData)
            {
                ctx.drawImage(canvasData, 0, 0, this.canvas.width, this.canvas.height);
            }
            else if(this.layer.is3D)
            {
                this.c3d.render3d.renderTextLayer(this.layer);

                const layerData = this.c3d.render3d.getLayerTexture(this.layer);
                const tmpCanvas = document.createElement('canvas');
                const tmpCtx = tmpCanvas.getContext('2d');
                tmpCanvas.width = layerData.width;
                tmpCanvas.height = layerData.height;

                const imageData = new ImageData(new Uint8ClampedArray(layerData.data), layerData.width, layerData.height);
                tmpCtx.putImageData(imageData, 0, 0);

                ctx.save();
                ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
                ctx.drawImage(tmpCanvas, -this.canvas.width/2, -this.canvas.height/2, this.canvas.width, this.canvas.height);
                ctx.restore();
            }
            else
            {
                const canvasPreview = this.htmlEl.querySelector('canvas.preview');
                const pixelRatio = this.canvas.width / Size.htmlDims(canvasPreview).width;
                
                ctx.fillStyle = this.layer.color;
                ctx.font = (this.layer.fontSize * 96 / 300 * pixelRatio) + 'pt ' + this.layer.font;

                const metrics = ctx.measureText(this.layer.text);
                const actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

                ctx.save();
                // ctx.globalAlpha = this.layer.opacity / 100;
                ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
                ctx.fillText(
                    this.layer.text, 
                    this.layer.textPosition.x * canvasPreview.width - (metrics.width / 2), 
                    -this.layer.textPosition.y * canvasPreview.height + (actualHeight / 2)
                );
                // ctx.fillText(this.layer.text, - metrics.width / 2, actualHeight / 2);
                ctx.restore();
            }

        }


        // DRAW GRID LINES

        const gridLines = this.three.scene.getObjectByName('gridLines');
        const canvas = gridLines.material.map.image;
        const ctx = canvas.getContext('2d');

        if(this._snap || !drawSnappingLines) ctx.clearRect(0, 0, canvas.width, canvas.height);

        if(this._snap && drawSnappingLines)
        {
            ctx.beginPath();
            ctx.setLineDash([5, 3]);
            ctx.strokeStyle = 'rgb(128,128,128)';
            ctx.lineWidth = 2;
            if(snapX)
            {
                ctx.moveTo(canvas.width / 2, 0);
                ctx.lineTo(canvas.width / 2, canvas.height);
            }
            if(snapY)
            {
                ctx.moveTo(0, canvas.height / 2);
                ctx.lineTo(canvas.width, canvas.height / 2);
            }
            ctx.stroke();
        }

        if(this._snap || !drawSnappingLines) gridLines.material.map.needsUpdate = true;



        const plane = this.three.scene.getObjectByName('texture');
        const uniforms = plane.material.uniforms;
        const layerMeshUniforms = this.c3d.glbScene.getObjectByName(this.layer.name).material.uniforms;
        const ro = this.layer._mesh.userData.index;

        uniforms.uOpacity.value = layerMeshUniforms.uAlphas.value[ro] = this.layer.opacity / 100;

        // layerMeshUniforms.uAspect.value = (this.canvas.width < this.canvas.height ? this.canvas.width / this.canvas.height : this.canvas.height / this.canvas.width);
        // layerMeshUniforms.uOffset.value[ro].set(this.layer.textPosition.x, -this.layer.textPosition.y);
        // uniforms.uOffset.value.set(this.layer.textPosition.x, this.layer.textPosition.y);

        if(this.layer.is3D)
        {
            // const rotationRad = THREE.MathUtils.degToRad(this.layer.rotation);
            const x = this.layer.textPosition.x;
            const y = this.layer.textPosition.y;

            layerMeshUniforms.uOffset.value[ro].set(x, -y);
            uniforms.uOffset.value.set(x, y);

            // layerMeshUniforms.uRotation.value[ro] = rotationRad;
            // uniforms.uRotation.value = -rotationRad;

            // if(this.layer.is3D)
            // {
            //     let correctedAxis = getCorrectedAxis(rotationRad, x, -y);
            //     layerMeshUniforms.uOffset.value[ro].set(correctedAxis.x, correctedAxis.y);
                
            //     correctedAxis = getCorrectedAxis(-rotationRad, x, y);
            //     uniforms.uOffset.value.set(correctedAxis.x, correctedAxis.y);
            // }
        }

        uniforms.uZoom.value = layerMeshUniforms.uZoom.value[ro] = this.layer.zoom / 100;
        layerMeshUniforms.uTintAmount.value[ro] = 0.0;
        uniforms.uBrightness.value = layerMeshUniforms.uBrightness.value[ro] = this.layer.uniforms.uBrightness || 1.0;
        uniforms.uContrast.value = layerMeshUniforms.uContrast.value[ro] = this.layer.uniforms.uContrast || 1.0;
        uniforms.uHue.value = layerMeshUniforms.uHue.value[ro] = this.layer.uniforms.uHue || 0.0;
        uniforms.uSaturation.value = layerMeshUniforms.uSaturation.value[ro] = this.layer.uniforms.uSaturation || 1.0;
        uniforms.uSepia.value = layerMeshUniforms.uSepia.value[ro] = this.layer.uniforms.uSepia || 0.0;
        uniforms.uInvert.value = layerMeshUniforms.uInvert.value[ro] = this.layer.uniforms.uInvert || 0.0;
        uniforms.uVignette.value = layerMeshUniforms.uVignette.value[ro] = this.layer.uniforms.uVignette || 0.0;
        uniforms.uGrainAmount.value = layerMeshUniforms.uGrainAmount.value[ro] = this.layer.uniforms.uGrainAmount || 0.0;

        uniforms.uChromaticAmount.value.set(
            this.layer.uniforms.uChromaticAmount ? this.layer.uniforms.uChromaticAmount.x : 0.0,
            this.layer.uniforms.uChromaticAmount ? -this.layer.uniforms.uChromaticAmount.y : 0.0
        );
        layerMeshUniforms.uChromaticAmount.value[ro].set(
            this.layer.uniforms.uChromaticAmount ? this.layer.uniforms.uChromaticAmount.x : 0.0, 
            this.layer.uniforms.uChromaticAmount ? this.layer.uniforms.uChromaticAmount.y : 0.0
        );

        if(!this.layer.is3D)
        {
            uniforms.uTintAmount.value = 1.0;
            layerMeshUniforms.uTintAmount.value[ro] = 1.0;
            
            const color = new THREE.Color(this.layer.color);
            uniforms.uTint.value.set(color.r, color.g, color.b);
            layerMeshUniforms.uTint.value[ro].set(color.r, color.g, color.b);
        }
        
        if(reDraw) uniforms.tDiffuse.value.needsUpdate = true;

        this.three.render();
        this.c3d.three.render();
    }


    async addBase64Font(o)
    {
        if(this._checkIfFontExists(o.postscript_name)) return;

        const listDiv = this.htmlEl.querySelector('div.builtInFonts > div.list');
        // https://stackoverflow.com/questions/21797299/how-can-i-convert-a-base64-string-to-arraybuffer/41106346#comment124033543_49273187
        const data = await (await fetch(o.base64)).arrayBuffer();
        const font = new FontFace(o.postscript_name, data);

        // add to doc
        await font.load();
        document.fonts.add(font);
        
        // add to custom fonts array
        this.customFonts.push({
            postscript_name: o.postscript_name,
            name: o.name,
            base64: o.base64
        }); 

        // add to html div
        this._addFontToList(listDiv, {name: o.name, postscript_name: o.postscript_name}, true);

        // set active font
        this.layer.font = o.postscript_name;

    }

    getFontData(postscript_name)
    {
        const fonts = this.builtInFonts.concat(this.customFonts);
        
        for (let i = 0; i < fonts.length; i++)
        {
            if(fonts[i].postscript_name == postscript_name)
            {
                return fonts[i];
            }
        }
    }

    isCustomFont(postscript_name)
    {        
        for (let i = 0; i < this.customFonts.length; i++)
        {
            if(this.customFonts[i].postscript_name == postscript_name)
            {
                return true;
            }
        }

        return false;
    }

    // https://stackoverflow.com/a/71536843
    async _loadFont(name, url)
    {
        const font = new FontFace(name, 'url(' + C3D_SERVER + url + ')');
        await font.load();
        document.fonts.add(font);
    }

    // https://stackoverflow.com/a/42272155
    async _loadBuiltInFonts()
    {
        const url = 'fonts/fonts.json'; // load all built-in fonts
        
        this.c3d.preloader.show();
        this.c3d.preloader.set(url);

        const listDiv = this.htmlEl.querySelector('div.builtInFonts > div.list');
        const response = await fetch(C3D_SERVER + url);
        const json = await response.json();
        
        for (let i = 0; i < json.length; i++)
        {
            const data = json[i];
            
            if(this._checkIfFontExists(data.postscript_name)) continue;

            const url = 'fonts/' + data.url;
            
            this.c3d.preloader.set(url);
            
            // add to doc
            await this._loadFont(data.postscript_name, url);

            // get uint8Array (https://stackoverflow.com/a/77388622)
            const response = await fetch(C3D_SERVER + url);
            const blob = await response.blob();
            json[i]['base64'] = await new Promise((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result)
                reader.readAsDataURL(blob)
            });

            // add to list
            this._addFontToList(listDiv, json[i]);

            // add to builtInFonts
            this.builtInFonts.push(data);
        }

        this.c3d.preloader.hide();
    }

    _addFontToList(listDiv, data, prepend = false)
    {
        const p = document.createElement('p');
        p.innerText = data.name;
        p.style.fontFamily = data.postscript_name;
        p.addEventListener('click', (e) => {
            this.layer.font = data.postscript_name;
            e.currentTarget.parentNode.style.display = 'none'; // hide list
            
            if(this.layer.is3D)
            {
                this.layer.threeDText.update(true);
            }
            else
            {
            }
            this.c3d.render3d.renderTextLayer(this.layer);
            this.updatePreview(null, true, false);
            this.c3d.three.render();
        });
        listDiv[prepend ? 'prepend' : 'append'](p);
    }

    _listOnclick(e)
    {
        const divList = e.currentTarget.parentNode.querySelector('div.list');
        divList.style.display = divList.style.display == '' || divList.style.display == 'none' ? 'block' : 'none';
    }

    _addCustomFontInput()
    {
        const list = this.htmlEl.querySelector('div.content > div.input > div.list');

        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', '.ttf, .otf');
        input.setAttribute('id', this._customFontInputID);
        
        list.prepend(input);

        const label = document.createElement('label');
        label.setAttribute('for', this._customFontInputID);
        label.innerText = this.c3d.lang['load-custom-font'];
        list.prepend(label);

        input.addEventListener('change', this._customFontInputHandler.bind(this));

    }

    async _customFontInputHandler(e)
    {
        e.preventDefault();

        const file = e.currentTarget.files[0];

        if(!file) return;
        
        // check file type
        let header = '';
        const arrayBuffer = await file.arrayBuffer();
        const fileSignature = new Uint8Array(arrayBuffer).subarray(0, 4).forEach((v) => header+=v.toString(16));
        
        //            TTF                 OTF
        if(header != '0100' && header != '4f54544f')
        {
            alert('File Type mismatch!!\nSupported file types are [.ttf, .otf]');
            return;
        }
        
        const reader = new FileReader();
        const self = this;
        
        reader.onloadend = async function(e)
        {
            const listDiv = self.htmlEl.querySelector('div.builtInFonts > div.list');
            const data = await file.arrayBuffer(); // https://stackoverflow.com/a/61644025
            const fontData = opentype.parse(data);
            const name = fontData.names.fontFamily.en;
            const postscript_name = fontData.names.postScriptName.en;
            const _update = () =>
            {
                if(self.layer.is3D) self.layer.threeDText.update(true);
                self.c3d.render3d.renderTextLayer(self.layer);
                self.updatePreview(null, true, false);
                self.c3d.three.render();
            };
            
            // check if exist
            if(self._checkIfFontExists(postscript_name))
            {
                // set active font
                self.layer.font = postscript_name;

                // update preview
                _update();
                return;
            }
            
            self.customFonts.push({
                postscript_name,
                name,
                base64: this.result   
            });

            const font = new FontFace(postscript_name, data);
            await font.load();
            document.fonts.add(font);

            // add to list
            self._addFontToList(listDiv, {name, postscript_name}, true);
            
            // set active font
            self.layer.font = postscript_name;

            // update preview
            _update();
        }

        reader.readAsDataURL(file);
    }

    _checkIfFontExists(postscript_name)
    {
        const fonts = this.builtInFonts.concat(this.customFonts);
        
        for (let i = 0; i < fonts.length; i++)
        {
            if(fonts[i].postscript_name == postscript_name)
            {
                return true;
            }
        }

        return false;
    }

}
