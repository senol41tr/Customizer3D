import * as THREE from 'three';
import {GUI} from 'three_dir/libs/lil-gui.module.min.js';
import {Dragable} from 'customizer3D_dir/dragable/Dragable.js?c3d=0.6.2';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=0.6.2';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.6.2';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.6.2';
import {createFiltersList, applyFilters} from 'customizer3D_dir/layers/Filters/Filters.js?c3d=0.6.2';
import {createEffectsList, applyEffects} from 'customizer3D_dir/layers/Effects/Effects.js?c3d=0.6.2';
import {degToRad} from 'customizer3D_dir/utils/degToRad.js?c3d=0.6.2';
import {fitMeshToScreen} from 'customizer3D_dir/utils/fitMeshToScreen.js?c3d=0.6.2';

export class GradientLayer
{
    constructor(c3d)
    {
        this.c3d = c3d;

        this.htmlEl = document.createElement('div');
        this.htmlEl.classList.add('gradientLayer');
        document.querySelector(this.c3d.props.container).append(this.htmlEl);

        this.layer = null;
        this.mesh = null;
        this.is2DViewing = null;
        this.oldCamState = null;

        this.MAX_GRADIENT_COLORS = 5;

        this.vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        this.fragmentShader = `
            precision highp float;

            uniform vec3 uGradientColors[${this.MAX_GRADIENT_COLORS}];
            uniform int uGradientCount;
            uniform bool uGradientIsRadial;
            uniform float uGradientAngle;
            uniform float uGradientScale;

            varying vec2 vUv;

            vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
            
            float snoise(vec2 v) {
                const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + dot(v, C.yy));
                vec2 x0 = v - i + dot(i, C.xx);
                vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
                i = mod(i, 289.0);
                vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
                vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
                m = m * m; m = m * m;
                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5;
                vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox;
                m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
                vec3 g;
                g.x  = a0.x  * x0.x  + h.x  * x0.y;
                g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
            }

            vec3 getGradient(float t) {
                float stepSize = 1.0 / float(uGradientCount - 1);
                int index = int(t / stepSize);
                float segmentProgress = (t - float(index) * stepSize) / stepSize;
                index = clamp(index, 0, uGradientCount - 2);
                return mix(
                    uGradientColors[index], 
                    uGradientColors[index + 1], 
                    clamp(segmentProgress, 0.0, 1.0)
                );
            }

            void main() {
                vec2 uv = vUv;

                float gradT;
                if (uGradientIsRadial) {
                    gradT = distance(uv, vec2(0.5));
                } else {
                    float rad = radians(uGradientAngle);
                    vec2 dir = vec2(cos(rad), sin(rad));
                    vec2 centeredUv = uv - 0.5;
                    float dotVal = dot(centeredUv, dir);
                    float norm = abs(dir.x) + abs(dir.y);
                    gradT = (dotVal / norm) + 0.5;
                    gradT = clamp(gradT, 0.0, 1.0);
                }

                float noise = snoise(uv * uGradientScale);
                float noiseT = noise * 0.5 + 0.5;
                float t = mix(gradT, noiseT, 0.3); 

                vec3 color = getGradient(t);

                gl_FragColor = vec4(color, 1.0);
            }
        `;


        this.presets = {
            'Sunset Drive': {
                colors: ['#ff4e50', '#f9d423', '#e100ff'],
                count: 3, isRadial: false, angle: 45, scale: 2.0
            },
            'Cyberpunk Neon': {
                colors: ['#00f0ff', '#ff0055', '#7b00ff'],
                count: 3, isRadial: false, angle: 120, scale: 1.5
            },
            'Deep Ocean': {
                colors: ['#021B79', '#0575E6', '#00F260'],
                count: 3, isRadial: true, angle: 0, scale: 3.0
            },
            'Forest Mist': {
                colors: ['#134E5E', '#71B280', '#E8F5E9'],
                count: 3, isRadial: false, angle: 90, scale: 2.5
            },
            'Pastel Dream': {
                colors: ['#ff9a9e', '#fecfef', '#a1c4fd'],
                count: 3, isRadial: true, angle: 0, scale: 1.0
            },
            'Solar Flare': {
                colors: ['#ffe000', '#799f0c', '#000000'],
                count: 3, isRadial: true, angle: 0, scale: 4.0
            },
            'Aurora Borealis': {
                colors: ['#000000', '#00F260', '#0575E6', '#e100ff'],
                count: 4, isRadial: false, angle: 135, scale: 3.5
            },
            'Monochrome Noise': {
                colors: ['#111111', '#555555', '#cccccc', '#ffffff'],
                count: 4, isRadial: false, angle: 30, scale: 5.0
            },
            'Autumn Gold': {
                colors: ['#280202', '#D35400', '#F39C12', '#F1C40F'],
                count: 4, isRadial: false, angle: 60, scale: 2.0
            },
            'Cosmic Nebula': {
                colors: ['#0f0c29', '#302b63', '#24243e', '#ff007f'],
                count: 4, isRadial: true, angle: 0, scale: 2.8
            }
        };

        let el;

        this.htmlEl.innerHTML = `
        <div class="title">
            <p class="label" draggable="false">${this.c3d.lang['add-gradient-layer']}</p>
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
                'gradientLayer'
            );
        });


        // EFFECTS
        
        el = this.htmlEl.querySelector('div.effects > div.button');
        el.addEventListener('click', _listOnclick);
        el.addEventListener('click', () => {
            createEffectsList(
                this.c3d, 
                this.htmlEl.querySelector('div.effects > div.list'), 
                'gradientLayer'
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

        if(!this.layer.options.gradient)
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
        const printDims = getPrintDims(this.c3d, {name: this.layer.name}, c3d.settings.MAX_DPI, isExport);
        const ctx = canvas.getContext('2d', {willReadFrequently: true});
        const w = canvas.width = Math.round(printDims.width);
        const h = canvas.height = Math.round(printDims.height);

        const renderTargetOptions = 
        {
            // samples: 4,
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType
            // colorSpace: THREE.SRGBColorSpace
        };

        const oldCanvasSize = {...c3d.three._canvasDims};
        const target = new THREE.WebGLRenderTarget(w, h, renderTargetOptions);
        c3d.three.renderer.setRenderTarget(target);
        c3d.three.renderer.setPixelRatio(1);
        c3d.three._onResize(null, w, h);
        fitMeshToScreen(this.c3d.three.camera, this.mesh, 1.0, true);
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
        applyEffects(this.c3d, this.layer, 'gradientLayer', isExport);
        applyFilters(this.c3d, this.layer, 'gradientLayer', isExport);
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

        const options =
        {
            gradient:
            {
                color0: '#ff4e50',
                color1: '#f9d423',
                color2: '#e100ff',
                color3: '#000000',
                color4: '#ffffff'
            },
            count: 3,
            isRadial: false,
            angle: 45.0,
            scale: 2.0
        };

        if(!this.layer.options.gradient) this.layer.options = {...options};

        const gui = this.gui = new GUI({title: 'Gradient Editor'});
        const uniforms = this.mesh.material.uniforms;

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
                    this.c3d._setNavActive(this.layer.name, true, false);
                    this.c3d.preloader.hide();
                    this.c3d.showHideUI.enableContainer();
                }, 250);
            },

            cancel: () =>
            {                
                this.show(this.layer);
                this.c3d._setNavActive(this.layer.name, true, false);

                if(this.layer.__baked) {
                    this.hideGUI();
                    return;
                }

                this.layer.options = null;
                this.hideGUI();
                this.hide();
                this.layer.div.querySelector('img.remove').click();
            },

            randomizeColors: () =>
            {
                
                const getRandomHex = () => '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
                const activeColorCount = uniforms.uGradientCount.value;

                for (let i = 0; i < activeColorCount; i++)
                {
                    const newHex = getRandomHex();    
                    this.layer.options.gradient[`color${i}`] = newHex;
                    uniforms.uGradientColors.value[i].set(newHex);
                }

                // state.preset = 'Please Select';
                gui.controllersRecursive().forEach(controller => controller.updateDisplay());
                this.c3d.three.render();
            }

        };

        this.___selectedPreset = 'Please Select';
        gui.add(this, '___selectedPreset', ['Please Select', ...Object.keys(this.presets)])
        .name('Presets')
        .onChange((name) => this.applyPreset(name));

        const colorFolder = gui.addFolder('Colors');

        colorFolder.add(uniforms.uGradientCount, 'value', 2, this.MAX_GRADIENT_COLORS, 1)
            .name('Count')
            .onChange((name) => {
                if (name && name !== 'Please Select') {
                    this.applyPreset(name);
                }
            });

        for (let i = 0; i < this.MAX_GRADIENT_COLORS; i++)
        {
            colorFolder.addColor(this.layer.options.gradient, `color${i}`)
                .name(`Color ${i + 1}`)
                .onChange((val) => {
                    uniforms.uGradientColors.value[i].set(val);
                });
        }

        colorFolder.add(guiSettings, 'randomizeColors')
            .name('Randomize Colors')
            .domElement.classList.add('btn-cancel');


        const gradFolder = gui.addFolder('Options');

        gradFolder.add(uniforms.uGradientIsRadial, 'value')
            .name('Radial')
            .onChange((v) => {
                this.layer.options.isRadial = v;
            });
        
        gradFolder.add(uniforms.uGradientAngle, 'value', 0, 360, 1)
            .name('Rotation')
            .onChange((v) => {
                this.layer.options.angle = v;
            });
        
        gradFolder.add(uniforms.uGradientScale, 'value', 0.1, 10.0, 0.1)
            .name('Noise Scale')
            .onChange((v) => {
                this.layer.options.scale = v;
            });

        gui.onChange(() => {
            this.c3d.three.render();
        });


        gui.add(guiSettings, 'renderToCanvas').name('Render to Canvas');
        gui.add(guiSettings, 'cancel').name('Cancel').domElement.classList.add('btn-cancel');
        
        this.c3d.three.render();
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
    }

    applyPreset(presetName)
    {
        const p = this.presets[presetName];
        if (!p) return;

        const uniforms = this.mesh.material.uniforms;
        uniforms.uGradientCount.value = p.count;
        uniforms.uGradientIsRadial.value = p.isRadial;
        uniforms.uGradientAngle.value = p.angle;
        uniforms.uGradientScale.value = p.scale;

        for (let i = 0; i < p.count; i++)
        {
            const hex = p.colors[i];
            this.layer.options.gradient[`color${i}`] = hex;
            uniforms.uGradientColors.value[i].set(hex);
        }

        this.gui.controllersRecursive().forEach(c => c.updateDisplay());
        this.c3d.three.render();
    }

    _create()
    {
        this.oldCamState = {
            position: this.c3d.three.camera.position.clone(), 
            rotation: this.c3d.three.camera.rotation.clone(),
            target: this.c3d.three.controls.orbit.target.clone()
        };
        this.c3d.three.camera.rotation.set(0, 0, 0);
        this.c3d.three.camera.position.set(0, 0, 1);

        if(this.mesh)
        {
            this.mesh.clear();
            this.mesh.removeFromParent();
            this.mesh = null;
        }

        const o = this.layer.options;
        const printDims = getPrintDims(this.c3d, this.layer, 72);
        const size = isMobile() ? 0.325 : 0.65;
        const planeDims = calculateAspectRatioFit(printDims.width, printDims.height, size, size);
        const uniforms = {
            uGradientColors: { value:
            [
                new THREE.Color(o?.gradient?.color0 || '#ff4e50'),
                new THREE.Color(o?.gradient?.color1 || '#f9d423'),
                new THREE.Color(o?.gradient?.color2 || '#e100ff'),
                new THREE.Color(o?.gradient?.color3 || '#000000'),
                new THREE.Color(o?.gradient?.color4 || '#ffffff')
            ]},
            uGradientCount: { value: o.count == undefined ? 3 : o.count },
            uGradientIsRadial: { value: o.isRadial == undefined ? false : o.isRadial },
            uGradientAngle: { value: o.angle == undefined ? 45.0 : o.angle },
            uGradientScale: { value: o.scale == undefined ? 2.0 : o.scale }
        }


        const shaderMaterial = new THREE.ShaderMaterial({
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            uniforms
        });

        const geometry = new THREE.PlaneGeometry(planeDims.width, planeDims.height);
        this.mesh = new THREE.Mesh(geometry, shaderMaterial);
        this.mesh.name = 'gradient';
        this.c3d.three.scene.add(this.mesh);

        this.c3d.three.render();

    }

}
