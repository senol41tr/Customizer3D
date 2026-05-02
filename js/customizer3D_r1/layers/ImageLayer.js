import * as THREE from 'three';
import {uniforms2, vertexShader2, fragmentShader2} from 'customizer3D_dir/three/materials/Shaders.js';
import {Three} from 'customizer3D_dir/three/Three.js';
import {Dragable} from 'customizer3D_dir/dragable/Dragable.js';
import {Size} from 'customizer3D_dir/utils/Size.js';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js';
import {ExtractImages} from 'customizer3D_dir/layers/utils/ExtractImages.js';
// import {getCorrectedAxis} from 'customizer3D_dir/layers/utils/getCorrectedAxis.js';
import {createFiltersList} from 'customizer3D_dir/layers/Filters/createFiltersList.js';

export class ImageLayer
{
    constructor(c3d)
    {
        this.c3d = c3d;
        this.htmlEl = document.querySelector(this.c3d.props.imageLayer);
        
        this.three = null;
        this.canvas = null;
        this.texture = null;
        this.gridLines = null;

        this.layer = null; // active layer (new Image(): Image.js)
        this._selectImageIDIncrement = 0; // <input id=
        this._selectImageID = 'C3D_selectImageInput'; // <input id= id + increment
        this._snap = null;

        let el;
        
        this.htmlEl.innerHTML = `
        <div class="title">
            <p class="label" draggable="false">...</p>
            <div class="buttons">
                <img src="${C3D_SERVER}svg/arrow-drop-down.svg" alt="Icon" class="rollup" draggable="false" style="rotate:-180deg;">
                <img src="${C3D_SERVER}svg/plus.svg" alt="Icon" class="icon" draggable="false" style="rotate:45deg;">
            </div>
        </div>

        <div class="content">
            <div class="menu">
                <div class="selectImage">
                    <label class="selectImage"><img src="" alt="Icon"></label>
                    <div class="inputs"></div>
                </div>
                <div class="filters">
                    <div class="button" title="${this.c3d.lang['filter-gallery']}">
                        <img src="${C3D_SERVER}svg/filters.svg" alt="Icon">
                    </div>
                </div>
                <div class="threeD">
                    <div class="button" title="${this.c3d.lang['to-3d']}">
                        <img src="${C3D_SERVER}svg/3D.svg" alt="Icon">
                    </div>
                </div>
                <div class="gradient" style="flex-basis: 100%;"></div>
            </div>
            <canvas class="preview" oncontextmenu="return false;"></canvas>
            <p class="description"></p>
            <p class="smaller-than-preffered"></p>
            <div style="padding-top:0.25rem;" class="snapping">
                <div class="snap">
                    <div class="button" title="${this.c3d.lang['snap']}">
                        <img src="${C3D_SERVER}svg/magnet.svg" alt="Icon">
                    </div>
                </div>
                <div class="rotate">
                    <div class="button" title="${this.c3d.lang['rotate']}">
                        <img src="${C3D_SERVER}svg/rotate.svg" alt="Icon">
                    </div>
                    <div class="list">
                        <div class="inputPercent" title="°">
                            <input type="number" min="0" max="359" value="0">
                        </div>
                        <input type="range" min="0" max="359" value="0" step="1">
                    </div>
                </div>
                <div class="zoom">
                    <div class="button" title="${this.c3d.lang['zoom']}">
                        <img src="${C3D_SERVER}svg/zoom.svg" alt="Icon">
                    </div>
                    <div class="list">
                        <div class="inputPercent" title="%">
                            <input type="number" min="10" max="500" value="100">
                        </div>
                        <input type="range" min="10" max="500" value="100" step="1">
                    </div>
                </div>
            </div>
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

        const _listClickOutside = (e) =>
        {
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


        const _listOnclick = (e) =>
        {
            const divList = e.currentTarget.parentNode.querySelector('div.list');
            divList.style.display = divList.style.display == '' || divList.style.display == 'none' ? 'block' : 'none';
        };



        const _upDateLayer = () =>
        {
            this.updatePreview(null, false);
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
                const input = this.htmlEl.querySelector('div.rotate input[type="number"]');
                input.parentNode.parentNode.style.display = 'none'; // hide list
                this.updatePreview();
            }
        });
        
        el = this.htmlEl.querySelector('div.rotate input[type="range"]');

        el.addEventListener('input', (e) => {
            this.layer.rotation = parseFloat(e.currentTarget.value);
            this.htmlEl.querySelector('div.rotate input[type="number"]').value = e.currentTarget.value;
            this.updatePreview();
        });

        // ZOOM

        this.htmlEl.querySelector('div.zoom > div.button').addEventListener('click', _listOnclick);
        el = this.htmlEl.querySelector('div.zoom input[type="number"]');

        el.addEventListener('input', (e) => {
            let val = parseFloat(e.currentTarget.value);
            if(isNaN(val)) return;
            e.currentTarget.value = val;
            this.htmlEl.querySelector('div.zoom input[type="range"]').value = val;
            this.layer.zoom = val;
            this.updatePreview(null, false, false);
        });

        el.addEventListener('focus', (e) => e.currentTarget.select());

        el.addEventListener('keyup', (e) => {
            const input = this.htmlEl.querySelector('div.zoom input[type="number"]');
            if(e.keyCode === 13) input.parentNode.parentNode.style.display = 'none'; // hide list
            this.updatePreview(null, false, false);
        });
        
        el = this.htmlEl.querySelector('div.zoom input[type="range"]');
        el.addEventListener('input', (e) => {
            this.layer.zoom = parseFloat(e.currentTarget.value);
            this.htmlEl.querySelector('div.zoom input[type="number"]').value = e.currentTarget.value;
            this.updatePreview(null, false, false);
        });


        // CONVERT TO 3D

        el = this.htmlEl.querySelector('div.threeD > div.button');
        el.addEventListener('click', () => this.layer.converTo3D());


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

            _upDateLayer();
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

        // show preferred size notice
        const smallerThanPreffered = this.c3d.lang['smaller-than-preffered'].replace('[warningIcon]', '<img src="' + C3D_SERVER + 'svg/warning.svg" alt="Icon">');
        this.htmlEl.querySelector('p.smaller-than-preffered').innerHTML = smallerThanPreffered;


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
        this.c3d.textLayer.hide();

        //
        this.htmlEl.querySelector('div.title > p.label').innerText = this.c3d.lang['add-' + this.layer.type + '-layer'];

        // set top of window
        this.htmlEl.style.zIndex = this.c3d.zIndex.index;
        
        // CANVAS
        const previewCanvas = this.htmlEl.querySelector('canvas.preview');
        const printSize = getPrintDims(this.c3d, this.layer, 72);
        const isExport = width && height ? true : false;
        const previewCanvasDims = isExport ? {width, height} : calculateAspectRatioFit(printSize.width, printSize.height, 150, 150);

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

        

        // hide notice
        this.htmlEl.querySelector('p.smaller-than-preffered').style.display = 'none';
        
        // set top of window
        this.htmlEl.style.zIndex = this.c3d.zIndex.index;

        // extract image(s)
        if(this.layer.image && this.layer.detectedFileType != 'image/svg+xml')
        {
            const printDims = getPrintDims(this.c3d, this.layer, 72);

            // show notice when file dimensions are small
            const pixelWidth = Math.round(new Size({size:printDims.originalSize.width, DPI:300}).px);
            const pixelHeight = Math.round(new Size({size:printDims.originalSize.height, DPI:300}).px);

            const info = this.c3d.lang['preferred-image-size']
            .replace('[printSize]', printDims.originalSize.width + ' x ' + printDims.originalSize.height)
            .replace('[pixelWidth]', pixelWidth)
            .replace('[pixelHeight]', pixelHeight)
            .replace('[DPI]', 72);
            this.htmlEl.querySelector('p.description').innerHTML = info;
            
            if(this.layer.image.naturalWidth < pixelWidth || this.layer.image.naturalHeight < pixelHeight)
            {
                this.htmlEl.querySelector('p.description').style.display = 'block';
                this.htmlEl.querySelector('p.smaller-than-preffered').style.display = 'flex';
                setTimeout(() => {
                    this.htmlEl.querySelector('p.description').style.display = 'none';
                    this.htmlEl.querySelector('p.smaller-than-preffered').style.display = 'none';
                }, 10000);
            }
            else
            {
                this.htmlEl.querySelector('p.description').style.display = 'none';
                this.htmlEl.querySelector('p.smaller-than-preffered').style.display = 'none';
            }
        }

        // as default show window
        this.htmlEl.querySelector('div.content').style.display = 'flex'; // show content
        this.htmlEl.querySelector('div.title > div.buttons > img.rollup').style.rotate = '180deg';


        // add input for layer
        if(!this.layer.input)
        {
            this.layer.input = this._addSelectImageInput();
            previewCanvas.style.display = 
            this.htmlEl.querySelector('div.rotate').style.display = 
            this.htmlEl.querySelector('div.zoom').style.display = 
            this.htmlEl.querySelector('div.filters').style.display = 'none';
        }


        // set window position
        const bb = document.querySelector(this.c3d.props.layers).getBoundingClientRect();
        const bbContainer = document.querySelector(this.c3d.props.container).getBoundingClientRect();
        const top = bb.top - bbContainer.y;
        const left = bb.left + bb.width + 16;

        document.querySelector(this.c3d.props.textLayer).style.display = 'none';

        this.htmlEl.style.left = left + 'px';
        this.htmlEl.style.top = top + 'px';
        this.htmlEl.style.display = 'block';

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
        zoomDiv.querySelector('input[type="range"]').value = this.layer.zoom;
        zoomDiv.querySelector('input[type="number"]').value = this.layer.zoom;
        
        // ROTATION
        const rotateDiv = this.htmlEl.querySelector('div.rotate');
        rotateDiv.style.display = this.layer.image && this.layer.type == 'image' ? 'block' : 'none';
        rotateDiv.querySelector('input[type="range"]').value = this.layer.rotation;
        rotateDiv.querySelector('input[type="number"]').value = this.layer.rotation;

        // FILTERS
        createFiltersList(this.c3d, this, this.htmlEl.querySelector('div.filters > div.button'));
        this.htmlEl.querySelector('div.filters').style.display = state ? 'block' : 'none';

        // SNAP
        this.htmlEl.querySelector('div.snapping').style.display = state ? 'flex' : 'none';

        // SNAP
        this.htmlEl.querySelector('div.selectImage').style.display = this.layer.type == 'gradient' ? 'none' : 'block';

        // CANVAS PREVIEW
        const canvasPreview = this.htmlEl.querySelector('canvas.preview');
        canvasPreview.style.display = state ? 'block' : 'none';

        // GRADIENT
        const gradient = this.htmlEl.querySelector('div.content > div.menu > div.gradient');
        gradient.style.display = this.layer.type == 'gradient' ? 'block' : 'none';

        // 
        this.updatePreview(null, true, false);
    }

    hide()
    {
        this.htmlEl.style.display = 'none';
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
            else if(this.layer.is3D || this.layer.type == 'gradient')
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
                ctx.drawImage(tmpCanvas, -this.canvas.width / 2, -this.canvas.height / 2, this.canvas.width, this.canvas.height);
                ctx.restore();
            }
            else
            {
                ctx.save();
                ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
                // ctx.scale(zoom, zoom);
                ctx.rotate(THREE.MathUtils.degToRad(this.layer.rotation));
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


        // UPDATE UNIFORMS

        const renderer = this.c3d.glbScene.getObjectByName(this.layer.name);
        const plane = this.three.scene.getObjectByName('texture');
        const uniforms = plane.material.uniforms;

        if(this.layer._mesh && renderer)
        {

            const layerMeshUniforms = renderer.material.uniforms;
            const ro = this.layer._mesh.userData.index;

            const x = this.layer.imagePosition.x;
            const y = this.layer.imagePosition.y;
            // const rotationRad = THREE.MathUtils.degToRad(this.layer.rotation);

            uniforms.uZoom.value = this.layer.zoom / 100;
            // uniforms.uAspect.value = height / width * 2;

            layerMeshUniforms.uZoom.value[ro] = uniforms.uZoom.value;
            // layerMeshUniforms.uAspect.value = uniforms.uAspect.value;

            // layerMeshUniforms.uRotation.value[ro] = rotationRad;
            // uniforms.uRotation.value = -rotationRad;
            
            // let correctedAxis = getCorrectedAxis(rotationRad, x, -y);
            // layerMeshUniforms.uOffset.value[ro].set(correctedAxis.x, correctedAxis.y);
            
            // correctedAxis = getCorrectedAxis(-rotationRad, x, y);
            // uniforms.uOffset.value.set(correctedAxis.x, correctedAxis.y);
            
            layerMeshUniforms.uOffset.value[ro].set(x, -y);
            uniforms.uOffset.value.set(x, y);
            
            uniforms.uBrightness.value = layerMeshUniforms.uBrightness.value[ro] = this.layer.uniforms.uBrightness || 1.0;
            uniforms.uContrast.value = layerMeshUniforms.uContrast.value[ro] = this.layer.uniforms.uContrast || 1.0;
            uniforms.uHue.value = layerMeshUniforms.uHue.value[ro] = this.layer.uniforms.uHue || 0.0;
            uniforms.uSaturation.value = layerMeshUniforms.uSaturation.value[ro] = this.layer.uniforms.uSaturation || 1.0;
            uniforms.uSepia.value = layerMeshUniforms.uSepia.value[ro] = this.layer.uniforms.uSepia || 0.0;
            uniforms.uInvert.value = layerMeshUniforms.uInvert.value[ro] = this.layer.uniforms.uInvert || 0.0;
            uniforms.uVignette.value = layerMeshUniforms.uVignette.value[ro] = this.layer.uniforms.uVignette || 0.0;
            uniforms.uGrainAmount.value = layerMeshUniforms.uGrainAmount.value[ro] = this.layer.uniforms.uGrainAmount || 0.0;
            uniforms.uOpacity.value = layerMeshUniforms.uAlphas.value[ro] = this.layer.opacity / 100;

            uniforms.uChromaticAmount.value.set(
                this.layer.uniforms.uChromaticAmount ? this.layer.uniforms.uChromaticAmount.x : 0.0,
                this.layer.uniforms.uChromaticAmount ? -this.layer.uniforms.uChromaticAmount.y : 0.0
            );
            layerMeshUniforms.uChromaticAmount.value[ro].set(
                this.layer.uniforms.uChromaticAmount ? this.layer.uniforms.uChromaticAmount.x : 0.0, 
                this.layer.uniforms.uChromaticAmount ? this.layer.uniforms.uChromaticAmount.y : 0.0
            );

            uniforms.uIsGradient.value = this.layer.gradient ? 1 : 0;
            if(this.layer.gradient) this.layer.gradient.setUniforms();
        }

        if(reDraw)
        {
            this.c3d.render3d.renderImageLayer(this.layer);
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
                // img.onload = () => URL.revokeObjectURL(img.src);
                
                // ADD NEW LAYER
                if(!this.layer.image || filesLength > 1)
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
                    URL.revokeObjectURL(this.layer.image.src);
                    this.layer.image = img;
                    this.layer.detectedFileType = data.detectedFileType;
                    this.layer.fileName = file.name;
                    if(data.detectedFileType == 'image/svg+xml')
                    {
                        this.layer.destroy();
                        await this.layer._init();
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
