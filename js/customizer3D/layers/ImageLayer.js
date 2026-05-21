import * as THREE from 'three';
import {uniforms2, vertexShader2, fragmentShader2} from 'customizer3D_dir/three/materials/Shaders.js?c3d=105';
import {Three} from 'customizer3D_dir/three/Three.js?c3d=105';
import {Size} from 'customizer3D_dir/utils/Size.js?c3d=105';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=105';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=105';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=105';
import {ExtractImages} from 'customizer3D_dir/layers/utils/ExtractImages.js?c3d=105';
import {createFiltersList} from 'customizer3D_dir/layers/Filters/createFiltersList.js?c3d=105';
import {RulerSlider} from 'customizer3D_dir/ui/RulerSlider.js?c3d=105';

export class ImageLayer
{
    constructor(c3d)
    {
        this.c3d = c3d;
        this.htmlEl = document.querySelector(this.c3d.props.layers + ' > div.imageLayer');
        
        this.three = null;
        this.canvas = null;
        this.texture = null;
        this.gridLines = null;
        this.rotationSlider = null;
        this.zoomSlider = null;

        this.layer = null; // active layer (new Image(): Image.js)
        this._selectImageIDIncrement = 0; // <input id=
        this._selectImageID = 'C3D_selectImageInput'; // <input id= id + increment
        this._snap = null;

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

            <div class="menu">

                <div class="selectImage">
                    <label class="selectImage"><img src="" alt="Icon"></label>
                    <div class="inputs"></div>
                </div>

                <div class="filters">
                    <div class="button" title="${this.c3d.lang['filter-gallery']}">
                        <img src="${C3D_SERVER}svg/filters.svg?c3d=105" alt="Icon">
                    </div>
                </div>

                <div class="threeD">
                    <div class="button" title="${this.c3d.lang['to-3d']}">
                        <img src="${C3D_SERVER}svg/3D.svg?c3d=105" alt="Icon">
                    </div>
                </div>

                <div class="gradient" style="flex-basis: 100%;"></div>

                <div class="snap">
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

                <div class="png" title="${this.c3d.lang['export']}" style="padding-left:0.5rem;">
                    <div class="button" title="PNG">
                        <img src="${C3D_SERVER}svg/png.svg?c3d=105" alt="Icon">
                    </div>
                </div>

            </div>

            <div class="slider slider_rotation">
                <canvas></canvas>
                <span></span>
            </div>

            <div class="slider slider_zoom">
                <canvas></canvas>
                <span></span>
            </div>

            <canvas class="preview" oncontextmenu="return false;"></canvas>

            <div class="filters" style="justify-content: flex-start; padding: 2rem; display:none;"></div>

        </div>`;

        // BACK

        this.htmlEl.querySelector('div.title > div.back').addEventListener('click', (e) => {
            this.htmlEl.querySelector('div.slider_rotation').classList.remove('show');
            this.htmlEl.querySelector('div.slider_zoom').classList.remove('show');
            this.htmlEl.querySelector('div.content > div.filters').style.display = 'none';
            this.hide();
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
                    this.layer.rotation = val;
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
            this.c3d._updateCanvasSize();
        });

        // CONVERT TO 3D

        el = this.htmlEl.querySelector('div.threeD > div.button');
        el.addEventListener('click', () => this.layer.converTo3D());


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
                console.warn("The print dimension(s) are larger than " + this.c3d.MAX_IMAGE_SIZE + "px!\nPerhaps the rendering won't be correct!\nFile size reduced.");
                printDims = calculateAspectRatioFit(printDims.width, printDims.height, this.c3d.MAX_IMAGE_SIZE, this.c3d.MAX_IMAGE_SIZE);
            }

            width = Math.floor(printDims.width);
            height = Math.floor(printDims.height);

            this.three._onResize(null, width, height);

            if(this.layer.is3D)
            {
                let obj;

                if(this.layer.detectedFileType == 'model/gltf-binary') obj = 'threeD';
                else if(this.layer.threeDSVG?.mesh) obj = 'threeDSVG';
                else console.warn('Unknown layer object!');

                bigCanvas = this.layer[obj].bakeImageToLayer(width, height, true, true);
            }
            else if(this.layer.type == 'gradient')
            {
                bigCanvas = this.layer.gradient.bakeImageToLayer(width, height, true, true);
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
            a.download = (this.layer.fileName || this.c3d.props.modelName) + '.png';
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

            this.c3d.preloader.hide();
            this.c3d.showHideUI.show();
            this.show(this.layer);

        });

        // CANVAS 3D
        
        const canvasPreview = this.htmlEl.querySelector('canvas.preview');

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
            // https://stackoverflow.com/a/69023543
            const touch = (e.touches && e.touches[0]) || (e.pointerType && e.pointerType === 'touch' && e);
            const clientX = (touch || e).clientX;
            const clientY = (touch || e).clientY;
            const bb = canvasPreview.getBoundingClientRect();

            this.layer.imagePosition =
            {
                x: (((clientX - bb.left) / bb.width) - 0.5) / (this.layer.zoom / 100), 
                y: (0.5 - ((clientY - bb.top) / bb.height)) / (this.layer.zoom / 100)
            };

            this.updatePreview(null, false);
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

            this.updatePreview(null, false, false);
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
        
    }


    show(imageLayer, width, height)
    {
        if(!imageLayer._mesh) return;

        // set as active layer
        if(imageLayer) this.layer = imageLayer;

        //
        this.htmlEl.style.display = 'block';

        //
        this.htmlEl.querySelector('div.title > p.label').innerText = this.layer.fileName || '';
        const layersDiv = document.querySelector(this.c3d.props.layers);
        layersDiv.querySelector('div.title').style.display = 'none';
        layersDiv.querySelector('div.content').style.display = 'none';
        layersDiv.querySelector('div.bottomNav').style.display = 'none';

        
        // CANVAS
        const previewCanvas = this.htmlEl.querySelector('canvas.preview');
        const printSize = getPrintDims(this.c3d, this.layer, 72);
        const isExport = width && height ? true : false;
        const previewCanvasDims = isExport ? {width, height} : calculateAspectRatioFit(printSize.width, printSize.height, 200, 200);

        previewCanvasDims.width = Math.round(previewCanvasDims.width);
        previewCanvasDims.height = Math.round(previewCanvasDims.height);

        if(!isExport)
        {
            this.canvas.style.width = previewCanvasDims.width + 'px';
            this.canvas.style.height = previewCanvasDims.height + 'px';
        }
        this.canvas.width = previewCanvasDims.width * (isExport ? 1 : this.c3d.PIXEL_RATIO);
        this.canvas.height = previewCanvasDims.height * (isExport ? 1 : this.c3d.PIXEL_RATIO);

        if(!isExport)
        {
            previewCanvas.style.width = previewCanvasDims.width + 'px';
            previewCanvas.style.height = previewCanvasDims.height + 'px';
        }
        previewCanvas.width = previewCanvasDims.width;
        previewCanvas.height = previewCanvasDims.height;


        this.gridLines.image.width = this.canvas.width;
        this.gridLines.image.height = this.canvas.height;

        // RESIZE THREE CANVAS 

        if(isExport) this.three._onResize(null, previewCanvasDims.width, previewCanvasDims.height);
        else this.three._onResize();

        // Dispose old texture
        const oldMesh = this.three.scene.getObjectByName('texture');
        if(oldMesh) oldMesh.material.uniforms.tDiffuse.value.dispose();
        
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


        // as default show window
        this.htmlEl.querySelector('div.content').style.display = 'flex'; // show content

        // add input for layer
        if(!this.layer.input)
        {
            this.layer.input = this._addSelectImageInput();
            previewCanvas.style.display = 
            this.htmlEl.querySelector('div.rotate').style.display = 
            this.htmlEl.querySelector('div.zoom').style.display = 
            this.htmlEl.querySelector('div.filters').style.display = 'none';
        }

        // UPDATE OR ADD IMAGE
        const selectImage = this.htmlEl.querySelector('div.selectImage > label.selectImage');
        selectImage.title = this.c3d.lang[this.layer.image ? 'change-image' : 'select-images'];
        selectImage.querySelector('img').src = C3D_SERVER + 'svg/' + (this.layer.image ? 'change_image' : 'image') + '.svg';
        selectImage.setAttribute('for', this.layer.input.id);

        const state = this.layer.image || this.layer.type == 'gradient';
        
        // CONVERT TO 3D
        this.htmlEl.querySelector('div.threeD').style.display = this.layer.detectedFileType == 'image/svg+xml' || this.layer.is3D ? 'block' : 'none';

        // ZOOM
        const zoomDiv = this.htmlEl.querySelector('div.zoom');
        zoomDiv.style.display = this.layer.is3D || state ? 'block' : 'none';
        this.zoomSlider.value = this.layer.zoom;
        
        // ROTATION
        const rotateDiv = this.htmlEl.querySelector('div.rotate');
        rotateDiv.style.display = this.layer.image && this.layer.type == 'image' ? 'block' : 'none';
        this.rotationSlider.value = this.layer.rotation;

        // FILTERS
        createFiltersList(this.c3d, this, this.htmlEl.querySelector('div.filters > div.button'));
        this.htmlEl.querySelector('div.filters').style.display = state ? 'block' : 'none';

        // SNAP
        this.htmlEl.querySelector('div.snap').style.display = state ? 'flex' : 'none';

        // SNAP
        this.htmlEl.querySelector('div.selectImage').style.display = this.layer.type == 'gradient' ? 'none' : 'block';

        // SNAP
        this.htmlEl.querySelector('div.png').style.display = state ? 'flex' : 'none';

        // CANVAS PREVIEW
        const canvasPreview = this.htmlEl.querySelector('canvas.preview');
        canvasPreview.style.display = state ? 'block' : 'none';

        // GRADIENT
        const gradient = this.htmlEl.querySelector('div.content > div.menu > div.gradient');
        gradient.style.display = this.layer.type == 'gradient' ? 'block' : 'none';

        // 
        this.updatePreview(null, true, false);
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
        if(!this.layer || !this.layer.image || !this.layer._mesh) return;

        let snapX, snapY;

        if(this._snap)
        {
            const snap = 0.05;
            const snapXPos = this.layer.imagePosition.x;
            const snapYPos = this.layer.imagePosition.y;
            snapX = (snapXPos >= -snap) && (snapXPos <= snap);
            snapY = (snapYPos >= -snap) && (snapYPos <= snap);
            if(snapX) this.layer.imagePosition.x = 0;
            if(snapY) this.layer.imagePosition.y = 0;
        }

        if(reDraw)
        {
            const ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            const printDims = getPrintDims(this.c3d, this.layer, 72);
            const imgWidth = this.layer.image?.naturalWidth ? this.layer.image.naturalWidth * 100 / this.layer.zoom : printDims.width;
            const imgHeight = this.layer.image?.naturalHeight ? this.layer.image.naturalHeight * 100 / this.layer.zoom : printDims.height;
            const {width, height} = calculateAspectRatioFit(imgWidth, imgHeight, this.canvas.width, this.canvas.height);

            if(canvasData)
            {
                ctx.drawImage(canvasData, 0, 0, this.canvas.width, this.canvas.height);
            }
            else if(this.layer.is3D)
            {
                const layerData = this.c3d.render3d.getLayerTexture(this.layer);
                const tmpCanvas = document.createElement('canvas');
                const tmpCtx = tmpCanvas.getContext('2d');
                tmpCanvas.width = layerData.width;
                tmpCanvas.height = layerData.height;
                
                const imageData = new ImageData(new Uint8ClampedArray(layerData.data), layerData.width, layerData.height);
                tmpCtx.putImageData(imageData, 0, 0);

                ctx.save();
                ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
                // ctx.rotate(THREE.MathUtils.degToRad(this.layer.rotation));
                ctx.drawImage(tmpCanvas, -this.canvas.width / 2, -this.canvas.height / 2, this.canvas.width, this.canvas.height);
                ctx.restore();
            }
            else
            {
                ctx.save();
                ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
                // ctx.rotate(THREE.MathUtils.degToRad(this.layer.rotation));
                ctx.drawImage(this.layer.image, -width / 2, -height / 2, width, height);
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


        // UPDATE UNIFORMS

        const renderer = this.c3d.glbScene.getObjectByName(this.layer.name);
        const plane = this.three.scene.getObjectByName('texture');
        const uniforms = plane.material.uniforms;

        if(this.layer._mesh && renderer)
        {
            const printDims = getPrintDims(this.c3d, this.layer.name, 72);
            const layerMeshUniforms = renderer.material.uniforms;
            const layer = this.layer;
            const index = layer._mesh.userData.index;
            const x = layer.imagePosition.x;
            const y = layer.imagePosition.y;
            const rotation = THREE.MathUtils.degToRad(layer.rotation);

            uniforms.uAspect.value = printDims.width / printDims.height;
            uniforms.uZoom.value = layer.zoom / 100;
            uniforms.uRotation.value = -rotation;
            uniforms.uOffset.value.set(x, y);
            uniforms.uBrightness.value = layer.uniforms.uBrightness || 1.0;
            uniforms.uContrast.value = layer.uniforms.uContrast || 1.0;
            uniforms.uHue.value = layer.uniforms.uHue || 0.0;
            uniforms.uSaturation.value = layer.uniforms.uSaturation || 1.0;
            uniforms.uSepia.value = layer.uniforms.uSepia || 0.0;
            uniforms.uInvert.value = layer.uniforms.uInvert || 0.0;
            uniforms.uVignette.value = layer.uniforms.uVignette || 0.0;
            uniforms.uGrainAmount.value = layer.uniforms.uGrainAmount || 0.0;
            uniforms.uOpacity.value = layer.opacity / 100;

            uniforms.uChromaticAmount.value.set(
                layer.uniforms.uChromaticAmount ? layer.uniforms.uChromaticAmount.x : 0.0,
                layer.uniforms.uChromaticAmount ? -layer.uniforms.uChromaticAmount.y : 0.0
            );

            uniforms.uIsGradient.value = layer.gradient ? 1 : 0;
            if(layer.gradient) layer.gradient.setUniforms();


            layerMeshUniforms.uAspect.value = uniforms.uAspect.value;


            const PARAMS_PER_LAYER = 5;
            const data = layerMeshUniforms.uData.value.image.data;
            const offset = index * PARAMS_PER_LAYER * 4;

            // P0

            data[offset + 0] = uniforms.uZoom.value; // zoom
            data[offset + 1] = rotation; // rotation
            data[offset + 2] = x; // offsetX
            data[offset + 3] = -y; // offsetY

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

            // data[offset + 12] = 0.0; // TINT R
            // data[offset + 13] = 0.0; // TINT G
            // data[offset + 14] = 0.0; // TINT B
            // data[offset + 15] = 0.0; // Tint Amount

            // P4

            const ratioX = layerMeshUniforms.uLayerTextures.value.image.width / canvas.width * this.c3d.PIXEL_RATIO;
            const ratioY = layerMeshUniforms.uLayerTextures.value.image.height / canvas.height * this.c3d.PIXEL_RATIO;
            data[offset + 16] = uniforms.uChromaticAmount.value.x / ratioX; // uChromaticAmount.value.x
            data[offset + 17] = -uniforms.uChromaticAmount.value.y / ratioY; // uChromaticAmount.value.y
            // data[offset + 18] = layer.blendMode; // blendMode
            data[offset + 19] = uniforms.uOpacity.value; // alpha

            // update data
            layerMeshUniforms.uData.value.needsUpdate = true;

        }

        if(reDraw)
        {
            uniforms.tDiffuse.value.needsUpdate = true;
        }

        this.three.render();
        this.layer.updateThumbnail();
        this.c3d.three.render();

    }




    // PRIVATE METHODS

    async _selectImageInputHandler(e)
    {
        const filesLength = e.target.files.length;
        const layerName = this.layer.name; // blender mesh name 
        const layersDivContent = document.querySelector(this.c3d.props.layers + ' > div.content');
        const layers = layersDivContent.querySelector('div.'+ layerName +' > div.content > div.layers');
        const _end = () =>
        {
            document.querySelector(this.c3d.props.layers).style.visibility = 'visible';
            this.c3d._setNavActive(this.layer.name, false); // update: style.maxHeight
            this.c3d.render3d.renderImageLayer(this.layer);
            this.c3d.render3d.updateRenderOrder(this.layer.name);
            this.updatePreview(null, false, false);
            this.c3d.three.render();
            this.c3d.preloader.hide();
            if(filesLength > 1) this.hide();
        };

        if(!this.layer.image) {
            this.layer.root.querySelector('img.remove').click();
        }

        document.querySelector(this.c3d.props.layers).style.visibility = 'hidden';

        // extract image(s)
        const extractImages = new ExtractImages({c3d: this.c3d});

        for(let i = 0; i < filesLength; i++)
        {
            const file = e.target.files[i];
            const blobArray = (await extractImages.extract(file)).reverse();

            if(blobArray.length == 0)
            {
                _end();
                break;
            }
            
            this.c3d.preloader.show();

            for(let j = 0; j < blobArray.length; j++)
            {

                const data = blobArray[j]; // {blob, detectedFileType}
                const objectURL = URL.createObjectURL(data.blob);

                this.c3d.preloader.set(
                    this.c3d.lang['getting-image-data'] + ' ' + 
                    (blobArray.length > 1 ? this.c3d.lang['file'] + ': ' + (j + 1) + ' - ' + blobArray.length : (i + 1) + ' - ' + filesLength)
                );

                // GLB

                if(data.detectedFileType == 'model/gltf-binary')
                {
                    if(this.c3d.render3d.checkLayersLength(layerName) && !this.layer.image)
                    {
                        this.layer = await this.c3d.layers.addImage(layers, {
                            input: file, 
                            image: objectURL, 
                            detectedFileType: data.detectedFileType, 
                            fileName: file.name,
                            mimeType: '.glb'
                        });
                        
                        // show 3D Model
                        if(filesLength == 1 && blobArray.length == 1) {
                            setTimeout(() => this.layer.converTo3D(), 10); // !!!
                        }
                    }
                    else // UPDATE CURRENT LAYER
                    {
                        URL.revokeObjectURL(this.layer.image);
                        this.layer.image = objectURL;
                        this.layer.detectedFileType = data.detectedFileType;
                        this.layer.fileName = file.name;
                        this.show(this.layer);
                    }
                    
                    _end();
                    return;
                }

                // IMAGE

                // create new image set class var.
                const img = new Image();
                img.src = objectURL;
                await img.decode();
                
                // ADD NEW LAYER
                if(!this.layer.image || (blobArray.length > 1 || filesLength > 1))
                {
                    if(this.c3d.render3d.checkLayersLength(layerName))
                    {
                        this.layer = await this.c3d.layers.addImage(layers, {
                            input: file, 
                            image: img, 
                            detectedFileType: data.detectedFileType,
                            fileName: file.name
                        });
                        this.c3d.render3d.renderImageLayer(this.layer);
                        this.c3d.render3d.updateRenderOrder(this.layer.name);
                    }
                    else
                    {
                        _end();
                        return;
                    }
                }
                else // UPDATE CURRENT LAYER
                {
                    if(data.detectedFileType == 'image/svg+xml')
                    {
                        this.layer.destroy();
                        this.layer.image = img;
                        this.layer.input = this._addSelectImageInput();
                        this.layer.detectedFileType = data.detectedFileType;
                        this.layer.fileName = file.name;
                        await this.layer._init();
                    }
                    else
                    {
                        this.layer.image = img;
                        this.layer.detectedFileType = data.detectedFileType;
                        this.layer.fileName = file.name;
                    }
                    this.show(this.layer);
                }

                _end();
            }

        }
    }

    _addSelectImageInput()
    {
        const id = this._selectImageID + this._selectImageIDIncrement;
        const inputs = this.htmlEl.querySelector('div.selectImage > div.inputs');
        
        const input = document.createElement('input');
        input.setAttribute('id', id);
        input.setAttribute('multiple', '');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', this.layer.mimeType);
        input.addEventListener('change', this._selectImageInputHandler.bind(this));
        input.addEventListener('cancel', () =>
        {
            if(!this.layer.image) 
            {
                this.layer.root.querySelector('img.remove').click();
            }
        });
        inputs.appendChild(input);

        this._selectImageIDIncrement++;

        return input;
    }

}
