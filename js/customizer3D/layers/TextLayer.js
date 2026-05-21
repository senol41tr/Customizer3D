import * as THREE from 'three';
import {uniforms2, vertexShader2, fragmentShader2} from 'customizer3D_dir/three/materials/Shaders.js?c3d=105';
import {Three} from 'customizer3D_dir/three/Three.js?c3d=105';
import * as opentype from "base/opentype/opentype.esm.js";
import ColorPicker from 'base/jscolorpicker/colorpicker.js?c3d=105';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=105';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=105';
import {Size} from 'customizer3D_dir/utils/Size.js?c3d=105';
import {createFiltersList} from 'customizer3D_dir/layers/Filters/createFiltersList.js?c3d=105';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=105';
import {RulerSlider} from 'customizer3D_dir/ui/RulerSlider.js?c3d=105';

export class TextLayer
{
    constructor(c3d)
    {
        this.c3d = c3d;
        this.htmlEl = document.querySelector(this.c3d.props.layers + ' > div.textLayer');

        this.three = null;
        this.canvas = null;
        this.texture = null;
        this.gridLines = null;
        this.rotationSlider = null;
        this.zoomSlider = null;

        this.customFonts = [];
        this.builtInFonts = [];
        this.layer = {};
        this._customFontInputID = 'C3D_loadCustomFontInput' + new Date().getTime(); // <input id=
        this._snap = false;

        let el;

        this.htmlEl.innerHTML = `

        <div class="title">
            <div class="back">
                <img src="${C3D_SERVER}svg/arrow-drop-down.svg?c3d=105" alt="Icon" class="back" draggable="false">
                <p class="title" draggable="false">${this.c3d.lang['back']}</p>
            </div>
            <p class="label" draggable="false"></p>
        </div>

        <div class="content">

            <input type="text" class="text" placeholder="${this.c3d.lang['enter-your-text']}">

            <div class="menu">

                <div class="builtInFonts">
                    <div class="button" title="${this.c3d.lang['font']}">
                        <img src="${C3D_SERVER}svg/font_family.svg?c3d=105" alt="Icon">
                    </div>
                </div>

                <div class="fontSizes">
                    <div class="button" title="${this.c3d.lang['size']}">
                        <img src="${C3D_SERVER}svg/font_size.svg?c3d=105" alt="Icon">
                    </div>
                </div>

                <div class="color_picker" title="${this.c3d.lang['color']}"></div>

                <div class="filters">
                    <div class="button" title="${this.c3d.lang['filter-gallery']}">
                        <img src="${C3D_SERVER}svg/filters.svg?c3d=105" alt="Icon">
                    </div>
                </div>

                <div class="threeD">
                    <div class="button" title="${this.c3d.lang['3D-text']}">
                        <img src="${C3D_SERVER}svg/3D.svg?c3d=105" alt="Icon">
                    </div>
                </div>

                <div class="png" title="${this.c3d.lang['export']}" style="padding-left:0.5rem;">
                    <div class="button" title="PNG">
                        <img src="${C3D_SERVER}svg/png.svg?c3d=105" alt="Icon">
                    </div>
                </div>

                <div class="snap toggle">
                    <div class="button" title="${this.c3d.lang['snap']}">
                        <img src="${C3D_SERVER}svg/magnet.svg?c3d=105" alt="Icon">
                    </div>
                </div>

                <div class="rotate">
                    <div class="button" title="${this.c3d.lang['rotate']}">
                        <img src="${C3D_SERVER}svg/rotate.svg?c3d=105" alt="Icon">
                    </div>
                </div>

                <div class="zoom">
                    <div class="button" title="${this.c3d.lang['zoom']}">
                        <img src="${C3D_SERVER}svg/zoom.svg?c3d=105" alt="Icon">
                    </div>
                </div>


            </div>

            <div class="slider slider_fontsize">
                <canvas></canvas>
                <span></span>
            </div>

            <div class="slider slider_rotation">
                <canvas></canvas>
                <span></span>
            </div>

            <div class="slider slider_zoom">
                <canvas></canvas>
                <span></span>
            </div>

            <div class="fontList"></div>

            <div class="filters" style="justify-content: flex-start; padding: 2rem; display:none;"></div>

            <canvas class="preview" oncontextmenu="return false;"></canvas>

            <div class="input">
                <div class="list"></div>
                <a href="https://convertio.co" target="_blank" class="convertURL">${this.c3d.lang['convert-font']}</a>
            </div>

        </div>`;

        const canvasPreview = this.htmlEl.querySelector('canvas.preview');

        // BACK

        this.htmlEl.querySelector('div.title > div.back').addEventListener('click', (e) => {
            this.htmlEl.querySelector('div.slider_fontsize').classList.remove('show');
            this.htmlEl.querySelector('div.slider_rotation').classList.remove('show');
            this.htmlEl.querySelector('div.slider_zoom').classList.remove('show');
            this.htmlEl.querySelector('div.fontList').classList.remove('show');
            this.htmlEl.querySelector('div.content > div.filters').style.display = 'none';
            this.htmlEl.querySelector('canvas.preview').style.display = 'block';
            this.hide();
        });

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
                this.c3d.three.render();
            }
        });

        // CANVAS 3D

        this.three = new Three(this.c3d, {
            rendererOptions:
            {
                canvas: canvasPreview
            }
        });

        this.three.setupAll();
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
            if(this.layer.is3D) this.updatePreview(null, false, true);
            else {
                this.updatePreview();
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

        
        // INPUT TEXT

        this.htmlEl.querySelector('div.content > input.text').addEventListener('input', (e) => {
            this.layer.setText(e.currentTarget.value);
            this.layer.text = e.currentTarget.value;
            if(!this.layer.is3D) {
                this.c3d.render3d.renderTextLayer(this.layer);
            }
            this.updatePreview(null, true, false);
        });
        this.htmlEl.querySelector('div.content > input.text').addEventListener('focus', (e) => e.currentTarget.select());


        // FONT LIST

        this.htmlEl.querySelector('div.builtInFonts').addEventListener('click', () => {
            this.htmlEl.querySelector('div.fontList').classList.toggle('show');
            this.c3d._updateCanvasSize();
        });


        
        // FONT SIZE

        this.fontsizeSlider = new RulerSlider(
            this.htmlEl.querySelector('div.slider_fontsize > canvas'), 
            this.htmlEl.querySelector('div.slider_fontsize > span'),
            {
                min: 1,
                max: 552,
                value: 50,
                step: 8,
                suffix: ' pt',
                onChange: (val) =>
                {
                    this.layer.fontSize = val;
                    if(!this.layer.is3D) {
                        this.c3d.render3d.renderTextLayer(this.layer);
                    }
                    this.updatePreview(null, true, false);
                }
            }
        );

        this.htmlEl.querySelector('div.fontSizes').addEventListener('click', () => {
            this.htmlEl.querySelector('div.slider_fontsize').classList.toggle('show');
            this.c3d._updateCanvasSize();
        });


        // ROTATION
        
        this.rotationSlider = new RulerSlider(
            this.htmlEl.querySelector('div.slider_rotation > canvas'), 
            this.htmlEl.querySelector('div.slider_rotation > span'),
            {
                min: -180,
                max: 180,
                value: 0,
                suffix: '°',
                onChange: (val) =>
                {
                    this.layer.rotation = parseFloat(val);
                    this.updatePreview(null, false, false);
                }
            }
        );

        this.htmlEl.querySelector('div.rotate').addEventListener('click', () => {
            this.htmlEl.querySelector('div.slider_rotation').classList.toggle('show');
            this.c3d._updateCanvasSize();
        });

        // ZOOM

        this.zoomSlider = new RulerSlider(
            this.htmlEl.querySelector('div.slider_zoom > canvas'), 
            this.htmlEl.querySelector('div.slider_zoom > span'),
            {
                min: 10,
                max: 500,
                value: 100,
                step: 10,
                onChange: (val) =>
                {
                    this.layer.zoom = val;
                    this.updatePreview(null, false, false);
                }
            }
        );

        this.htmlEl.querySelector('div.zoom').addEventListener('click', () => {
            this.htmlEl.querySelector('div.slider_zoom').classList.toggle('show');
        });


        // CONVERT TO 3D TEXT

        el = this.htmlEl.querySelector('div.threeD > div.button');
        el.addEventListener('click', () => {
            this.htmlEl.querySelector('div.slider_fontsize').classList.remove('show');
            this.layer.converTo3D();
        });


        // MORE OPTIONS

        el = this.htmlEl.querySelector('div.png');
        el.addEventListener('click', async (e) =>
        {
            e.preventDefault();

            this.c3d.showHideUI.hide();
            this.c3d.preloader.show();

            let width, height, bigCanvas;

            // CALCULATE IMAGE SIZE

            let printDims = getPrintDims(this.c3d, this.layer.name, 300);

            if(printDims.width > this.c3d.MAX_IMAGE_SIZE || printDims.height > this.c3d.MAX_IMAGE_SIZE) {
                console.warn("The print dimensions are larger than this.c3d.MAX_IMAGE_SIZE * 2px!\nPerhaps the rendering won't be correct!\nFile size reduced.");
                printDims = calculateAspectRatioFit(printDims.width, printDims.height, this.c3d.MAX_IMAGE_SIZE, this.c3d.MAX_IMAGE_SIZE);
            }

            width = Math.floor(printDims.width);
            height = Math.floor(printDims.height);

            this.three._onResize(null, width, height);

            if(this.layer.is3D)
            {
                bigCanvas = this.layer.threeDText.bakeTextToLayer(width, height, true, true);
            }
            else
            {
                width /= this.c3d.PIXEL_RATIO;
                height /= this.c3d.PIXEL_RATIO;
            }

            this.show(this.layer, width, height);
            this.updatePreview(bigCanvas, true, false);

            this.three.render();

            const blob = await new Promise(resolve => this.three.getCanvas().toBlob(resolve, 'image/png', 1.0));

            const fileBlob = new Blob( [blob] , {type:'image/png'});
            const a = document.createElement('a');
            const blobUrl = URL.createObjectURL(fileBlob);
            a.href = blobUrl;
            a.download = this.layer.text + '.png' || this.c3d.props.modelName + '_Screenshot.png';
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

            this.c3d.preloader.hide();
            this.c3d.showHideUI.show();
            this.show(this.layer);

        });


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

        this._addCustomFontInput(); // add custom font input

    }


    show(textLayer, width, height)
    {
        if(!textLayer._mesh) return;

        // set as active layer
        this.layer = textLayer;

        //
        this.htmlEl.style.display = 'block';

        //
        this.htmlEl.querySelector('div.title > p.label').innerText = this.layer.text || '';
        const layersDiv = document.querySelector(this.c3d.props.layers);
        layersDiv.querySelector('div.title').style.display = 'none';
        layersDiv.querySelector('div.content').style.display = 'none';
        layersDiv.querySelector('div.bottomNav').style.display = 'none';

        // CANVAS
        const previewCanvas = this.htmlEl.querySelector('canvas.preview');
        const printSize = getPrintDims(this.c3d, this.layer, 72);
        const isExport = width && height ? true : false;
        const previewCanvasDims = isExport ? {width, height} : calculateAspectRatioFit(printSize.width, printSize.height, 200, 200);

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
        this.fontsizeSlider.value = this.layer.fontSize;

        // disable/enable rotation
        const rotation = this.htmlEl.querySelector('div.rotate');
        rotation.style.display = this.layer.is3D ? 'block' : 'none';
        this.rotationSlider.value = this.layer.rotation;

        // disable/enable zoom
        const zoom = this.htmlEl.querySelector('div.zoom');
        zoom.style.display = this.layer.is3D ? 'block' : 'none';
        this.zoomSlider.value = this.layer.zoom;

        // as default show window
        // this.htmlEl.querySelector('div.content').style.display = 'flex'; // show content

        // set text
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
        this.c3d._updateCanvasSize();
    }

    hide()
    {
        this.htmlEl.style.display = 'none';

        const layersDiv = document.querySelector(this.c3d.props.layers);
        layersDiv.querySelector('div.content').style.display = 'flex';
        layersDiv.querySelector('div.title').style.display = 'flex';
        const bottomNav = layersDiv.querySelector('div.bottomNav');
        if(bottomNav) bottomNav.style.display = 'flex';
        this.c3d._updateCanvasSize();
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
                    this.layer.textPosition.x * this.canvas.width - (metrics.width / 2), 
                    -this.layer.textPosition.y * this.canvas.height + (actualHeight / 2)
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
            ctx.lineWidth = 2 * this.c3d.PIXEL_RATIO;
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



        const renderer = this.c3d.glbScene.getObjectByName(this.layer.name);
        const plane = this.three.scene.getObjectByName('texture');
        const uniforms = plane.material.uniforms;

        if(this.layer._mesh && renderer)
        {
            const layerMeshUniforms = renderer.material.uniforms;
            const layer = this.layer;
            const index = layer._mesh.userData.index;
            const printDims = getPrintDims(this.c3d, this.layer.name, 72);
            const rotation = THREE.MathUtils.degToRad(layer.rotation);


            if(layer.is3D)
            {
                const x = layer.textPosition.x;
                const y = layer.textPosition.y;

                uniforms.uOffset.value.set(x, y);
            }

            uniforms.uAspect.value = printDims.width / printDims.height;
            uniforms.uZoom.value = layer.zoom / 100;
            uniforms.uRotation.value = -rotation;
            uniforms.uBrightness.value = layer.uniforms.uBrightness || 1.0;
            uniforms.uContrast.value = layer.uniforms.uContrast || 1.0;
            uniforms.uHue.value = layer.uniforms.uHue || 0.0;
            uniforms.uSaturation.value = layer.uniforms.uSaturation || 1.0;
            uniforms.uSepia.value = layer.uniforms.uSepia || 0.0;
            uniforms.uInvert.value = layer.uniforms.uInvert || 0.0;
            uniforms.uGrainAmount.value = layer.uniforms.uGrainAmount || 0.0;
            uniforms.uVignette.value = layer.uniforms.uVignette || 0.0;

            uniforms.uChromaticAmount.value.set(
                layer.uniforms.uChromaticAmount ? layer.uniforms.uChromaticAmount.x : 0.0,
                layer.uniforms.uChromaticAmount ? -layer.uniforms.uChromaticAmount.y : 0.0
            );

            if(!layer.is3D)
            {
                uniforms.uTintAmount.value = 1.0;
                
                const color = new THREE.Color(layer.color);
                uniforms.uTint.value.set(color.r, color.g, color.b);
            }

            uniforms.uOpacity.value = layer.opacity / 100;


            const PARAMS_PER_LAYER = 5;
            const data = layerMeshUniforms.uData.value.image.data;
            const offset = index * PARAMS_PER_LAYER * 4;

            layerMeshUniforms.uAspect.value = uniforms.uAspect.value;


            // P0

            data[offset + 0] = uniforms.uZoom.value; // zoom
            data[offset + 1] = rotation; // rotation
            data[offset + 2] = uniforms.uOffset.value.x; // offsetX
            data[offset + 3] = -uniforms.uOffset.value.y; // offsetY

            // P1

            data[offset + 4] = uniforms.uBrightness.value; // uBrightness
            data[offset + 5] = uniforms.uContrast.value; // uContrast
            data[offset + 6] = uniforms.uHue.value; // uHue
            data[offset + 7] = uniforms.uSaturation.value; // uSaturation

            // P2

            data[offset + 8] = uniforms.uSepia.value; // uSepia
            data[offset + 9] = uniforms.uInvert.value; // uInvert
            data[offset + 10] = uniforms.uGrainAmount.value; // uGrainAmount
            data[offset + 11] = uniforms.uVignette.value; // uVignette

            // P3

            data[offset + 12] = uniforms.uTint.value.r; // TINT R
            data[offset + 13] = uniforms.uTint.value.g; // TINT G
            data[offset + 14] = uniforms.uTint.value.b; // TINT B
            data[offset + 15] = uniforms.uTintAmount.value; // Tint Amount

            // P4

            const ratioX = layerMeshUniforms.uLayerTextures.value.image.width / canvas.width * this.c3d.PIXEL_RATIO;
            const ratioY = layerMeshUniforms.uLayerTextures.value.image.height / canvas.height * this.c3d.PIXEL_RATIO;
            data[offset + 16] = uniforms.uChromaticAmount.value.x / ratioX; // uChromaticAmount.value.x
            data[offset + 17] = -uniforms.uChromaticAmount.value.y / ratioY; // uChromaticAmount.value.y
            // data[offset + 18] = 0; // blendMode
            data[offset + 19] = uniforms.uOpacity.value; // alpha

            layerMeshUniforms.uData.value.needsUpdate = true;
        }
        
        if(reDraw) uniforms.tDiffuse.value.needsUpdate = true;

        this.three.render();
        this.c3d.three.render();
    }


    async addBase64Font(o)
    {
        if(this._checkIfFontExists(o.postscript_name)) return;

        const listDiv = this.htmlEl.querySelector('div.fontList');
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
        const url = 'fonts/fonts.json?c3d=105'; // load all built-in fonts
        
        this.c3d.preloader.show();
        this.c3d.preloader.set(url);

        const listDiv = this.htmlEl.querySelector('div.fontList');
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
            e.currentTarget.parentNode.classList.toggle('show'); // hide list
            this.c3d._updateCanvasSize();
            
            if(this.layer.is3D) {
                this.layer.threeDText.update(true);
            }
            this.c3d.render3d.renderTextLayer(this.layer);
            this.updatePreview(null, true, false);
            this.c3d.three.render();
        });
        listDiv[prepend ? 'prepend' : 'append'](p);
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
            const listDiv = self.htmlEl.querySelector('div.fontList');
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
