import * as THREE from 'three';
import ColorPicker from 'base/jscolorpicker/colorpicker.js?c3d=106';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=106';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=106';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=106';
import {RulerSlider} from 'customizer3D_dir/ui/RulerSlider.js?c3d=106';

export class ShapeLayer
{
    constructor(c3d)
    {
        this.c3d = c3d;
        this.htmlEl = document.querySelector(this.c3d.props.layers + ' > div.shapeLayer');

        this.gridLines = null;
        this.rotationSlider = null;
        this.radiusSlider = null;


        this.layer = {};
        this._snap = false;

        let el;

        this.htmlEl.innerHTML = `

        <div class="title">
            <div class="back">
                <img src="${C3D_SERVER}svg/arrow-drop-down.svg?c3d=106" alt="Icon" class="back" draggable="false">
                <p class="title" draggable="false">${this.c3d.lang['back']}</p>
            </div>
            <p class="label" draggable="false"></p>
        </div>

        <div class="content">
            <div class="menu">

                <div class="freeform" style="pointer-events:none; opacity:0.6;">
                    <div class="button" title="${this.c3d.lang['freeform']}">
                        <img src="${C3D_SERVER}svg/freeform.svg?c3d=106" alt="Icon">
                    </div>
                </div>

                <div class="triangle">
                    <div class="button" title="${this.c3d.lang['triangle']}">
                        <img src="${C3D_SERVER}svg/triangle.svg?c3d=106" alt="Icon">
                    </div>
                </div>

                <div class="circle">
                    <div class="button" title="${this.c3d.lang['circle']}">
                        <img src="${C3D_SERVER}svg/circle.svg?c3d=106" alt="Icon">
                    </div>
                </div>

                <div class="square">
                    <div class="button" title="${this.c3d.lang['square']}">
                        <img src="${C3D_SERVER}svg/square.svg?c3d=106" alt="Icon">
                    </div>
                </div>

                <div class="snap toggle">
                    <div class="button" title="${this.c3d.lang['snap']}">
                        <img src="${C3D_SERVER}svg/magnet.svg?c3d=106" alt="Icon">
                    </div>
                </div>

                <div class="rotate">
                    <div class="button" title="${this.c3d.lang['rotate']}">
                        <img src="${C3D_SERVER}svg/rotate.svg?c3d=106" alt="Icon">
                    </div>
                </div>

                <div class="radius">
                    <div class="button" title="${this.c3d.lang['radius']}">
                        <img src="${C3D_SERVER}svg/radius.svg?c3d=106" alt="Icon">
                    </div>
                </div>

            </div>

            <div class="slider slider_rotation">
                <canvas></canvas>
                <span></span>
            </div>

            <div class="slider slider_radius">
                <canvas></canvas>
                <span></span>
            </div>

            <div class="menu2" style="justify-content: center; align-items: center; padding-top:0.5rem;">
                <div class="stroke" style="display:flex; gap:0.5rem; align-items: center;">
                    <div class="color_picker" data-color-type="stroke" title="${this.c3d.lang['stroke']} ${this.c3d.lang['color']}"></div>
                    <label style="display:flex; gap:0.25rem; align-items:center;">
                        <input data-type="stroke" type="checkbox" checked>
                        <p>${this.c3d.lang['stroke']}</p>
                    </label>
                    <input type="range" class="lineWidth" min="0" max="150" value="5" step="1">
                </div>

                <div class="fill" style="display:flex; gap:0.5rem; align-items:center;">
                    <div class="color_picker" data-color-type="fill" title="${this.c3d.lang['fill']} ${this.c3d.lang['color']}"></div>
                    <label style="display:flex; gap:0.25rem;">
                        <input data-type="fill" type="checkbox" checked>
                        <p>${this.c3d.lang['fill']}</p>
                    </label>
                </div>

                <div style="display:flex; gap:1.5rem;">

                    <label style="display:flex; gap:0.25rem;">
                        <input name="lineJoin" type="radio" value="miter">
                        <p>Miter</p>
                    </label>

                    <label style="display:flex; gap:0.25rem;">
                        <input name="lineJoin" type="radio" value="round">
                        <p>Round</p>
                    </label>

                    <label style="display:flex; gap:0.25rem;">
                        <input name="lineJoin" type="radio" value="bevel">
                        <p>Bevel</p>
                    </label>

                </div>

            </div>

            <canvas class="preview" oncontextmenu="return false;"></canvas>

        </div>`;

        const canvas = this.htmlEl.querySelector('canvas.preview');

        // BACK

        this.htmlEl.querySelector('div.title > div.back').addEventListener('click', (e) => {
            this.htmlEl.querySelector('div.slider_rotation').classList.remove('show');
            this.htmlEl.querySelector('div.slider_radius').classList.remove('show');
            this.hide();
        });


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

           this.updatePreview(null, true, false);
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

        if(isMobile()) canvas.addEventListener('touchstart', canvasMouseDown);
        else canvas.addEventListener('pointerdown', canvasMouseDown);

        const canvasMouseMove = (e) =>
        {
            const touch = (e.touches && e.touches[0]) || (e.pointerType && e.pointerType === 'touch' && e);
            const clientX = (touch || e).clientX;
            const clientY = (touch || e).clientY;
            
            const bb = canvas.getBoundingClientRect();

            this.layer.shapePosition =
            {
                x: (((clientX - bb.left) / bb.width) - 0.5), 
                y: (0.5 - ((clientY - bb.top) / bb.height))

            };

            this.updatePreview();
        };


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
                    this.updatePreview(null, true, false);
                }
            }
        );

        this.htmlEl.querySelector('div.rotate').addEventListener('click', () => {
            this.htmlEl.querySelector('div.slider_rotation').classList.toggle('show');
            this.c3d._updateCanvasSize();
        });


        // RADIUS

        this.radiuslider = new RulerSlider(
            this.htmlEl.querySelector('div.slider_radius > canvas'), 
            this.htmlEl.querySelector('div.slider_radius > span'),
            {
                min: 10,
                max: 400,
                value: 50,
                step: 8,
                suffix: ' r',
                onChange: (val) =>
                {
                    this.layer.radius = val;
                    this.updatePreview(null, true, false);
                }
            }
        );

        this.htmlEl.querySelector('div.radius').addEventListener('click', () => {
            this.htmlEl.querySelector('div.slider_radius').classList.toggle('show');
            this.c3d._updateCanvasSize();
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


        // FREEFORM

        el = this.htmlEl.querySelector('div.freeform > div.button');
        el.addEventListener('click', (e) =>
        {
            this.layer.shapeType = 'freeform';
            this.updatePreview(null, true, false);
        });


        // TRIANGLE
        
        el = this.htmlEl.querySelector('div.triangle > div.button');
        el.addEventListener('click', (e) =>
        {
            this.layer.shapeType = 'triangle';
            this.updatePreview(null, true, false);
        });


        // CIRCLE
        
        el = this.htmlEl.querySelector('div.circle > div.button');
        el.addEventListener('click', (e) =>
        {
            this.layer.shapeType = 'circle';
            this.updatePreview(null, true, false);
        });



        // SQUARE
        
        el = this.htmlEl.querySelector('div.square > div.button');
        el.addEventListener('click', (e) =>
        {
            this.layer.shapeType = 'square';
            this.updatePreview(null, true, false);
        });


        // COLOR PICKERS

        this.htmlEl.querySelectorAll('div.menu2 div.color_picker').forEach(cp =>
        {
            const ce = this.c3d.colorEngine;
            const active = cp.dataset.colorType;

            const colorPicker = new ColorPicker(cp,
            {
                color: '#000000',
                submitMode: 'instant',
                enableEyedropper:true,
                enableAlpha:false,
                loadLocalSwatches:true,
                localStorage: this.c3d.localStorage,
                c3d: this.c3d
            });
            
            colorPicker.on('pick', (color) =>
            {
                
                if(!color) return;

                if(active == 'fill')
                {
                    ce.invert(color.string('hex'), true, false);
                    canvas.style.backgroundColor = ce.color;
                }
                this.layer[active == 'fill' ? 'fillColor' : 'strokeColor'] = color.string('hex');

                if((this.htmlEl.querySelector('input[data-type="stroke"]').checked && active == 'stroke') ||
                (this.htmlEl.querySelector('input[data-type="fill"]').checked && active == 'fill')) {
                    this.updatePreview(null, true, false);
                }

            });

            cp._colorPicker = colorPicker;

        });


        // STROKE WIDTH

        el = this.htmlEl.querySelector('div.menu2 input[type="range"].lineWidth');
        el.addEventListener('input', (e) =>
        {
            const cp = this.htmlEl.querySelector('div.color_picker[data-color-type="stroke"]');            
            const val = parseInt(e.currentTarget.value);
            this.layer.lineWidth = val;

            this.layer.strokeColor = val == 0 ? null : cp.dataset.color;
            this.updatePreview(null, true, false);
        });


        // STROKE CHECKBOX

        el = this.htmlEl.querySelector('input[data-type="stroke"]');
        el.addEventListener('change', (e) =>
        {
            const range = this.htmlEl.querySelector('div.menu2 input[type="range"].lineWidth');
            range.disabled = !e.currentTarget.checked;
            range.style.opacity = e.currentTarget.checked ? 1 : 0.5;

            const cp = this.htmlEl.querySelector('div.color_picker[data-color-type="stroke"]');
            this.layer.strokeColor = e.currentTarget.checked ? cp.dataset.color : null;
            
            this.updatePreview(null, true, false);
        });


        // FILL CHECKBOX

        el = this.htmlEl.querySelector('input[data-type="fill"]');
        el.addEventListener('change', (e) =>
        {
            const cp = this.htmlEl.querySelector('div.color_picker[data-color-type="fill"]');
            this.layer.fillColor = e.currentTarget.checked ? cp.dataset.color : null;
            
            this.updatePreview(null, true, false);
        });


        // LINE JOIN

        this.htmlEl.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () =>
            {
                this.layer.lineJoin = radio.value;
                this.updatePreview(null, true, false);
            });
        });

    }


    show(shapeLayer, width, height)
    {
        if(!shapeLayer._mesh) return;

        // set as active layer
        this.layer = shapeLayer;

        //
        this.htmlEl.style.display = 'block';

        //
        this.htmlEl.querySelector('div.title > p.label').innerText = this.layer.shapeType || '';
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
            previewCanvas.style.width = Math.floor(previewCanvasDims.width) + 'px';
            previewCanvas.style.height = Math.floor(previewCanvasDims.height) + 'px';
        }
        previewCanvas.width = Math.floor(previewCanvasDims.width) * (isExport ? 1 : this.c3d.PIXEL_RATIO);
        previewCanvas.height = Math.floor(previewCanvasDims.height) * (isExport ? 1 : this.c3d.PIXEL_RATIO);


        // reset line width
        this.htmlEl.querySelector('div.menu2 input[type="range"].lineWidth').value = this.layer.lineWidth;
        
        // check line join radio
        this.htmlEl.querySelector('input[value="' + this.layer.lineJoin +'"]').checked = true;

        // set color picker colors
        this.htmlEl.querySelectorAll('div.menu2 div.color_picker').forEach(cp =>
        {
            const active = cp.dataset.colorType;
            cp._colorPicker.setColor(this.layer[active + 'Color']);
        });

        // set checkboxes and range
        this.htmlEl.querySelector('input[data-type="stroke"]').checked = this.layer.strokeColor != null;
        this.htmlEl.querySelector('input[data-type="fill"]').checked = this.layer.fillColor != null;
        const lwRange = this.htmlEl.querySelector('div.menu2 input[type="range"].lineWidth');
        lwRange.value = this.layer.lineWidth;
        lwRange.disabled = this.layer.strokeColor == null;
        lwRange.style.opacity = this.layer.strokeColor == null ? 0.5 : 1;

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
        if(!this.layer || !this.layer._mesh) return;

        const canvas = this.htmlEl.querySelector('canvas.preview');
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let snapX, snapY;

        if(this._snap)
        {
            const snap = 0.05;
            const snapXPos = this.layer.shapePosition.x;
            const snapYPos = this.layer.shapePosition.y;
            snapX = (snapXPos >= -snap) && (snapXPos <= snap);
            snapY = (snapYPos >= -snap) && (snapYPos <= snap);
            if(snapX) this.layer.shapePosition.x = 0;
            if(snapY) this.layer.shapePosition.y = 0;
        }

        if(reDraw)
        {
            const ratio = canvas.width / parseInt(canvas.style.width) / this.c3d.PIXEL_RATIO;
            const radius = this.layer.radius * ratio;

            const angle = THREE.MathUtils.degToRad(this.layer.rotation);

            ctx.save();
            if(this.layer.fillColor != null) ctx.fillStyle = this.layer.fillColor;
            if(this.layer.strokeColor != null) ctx.strokeStyle = this.layer.strokeColor;
            ctx.lineWidth = this.layer.lineWidth * ratio;
            ctx.lineJoin = this.layer.lineJoin; 

            ctx.translate(
                canvas.width / 2 + (this.layer.shapePosition.x * canvas.width), 
                canvas.height / 2 - (this.layer.shapePosition.y * canvas.height)
            );

            ctx.rotate(angle);
            ctx.globalAlpha = this.layer.opacity / 100;
            
            ctx.beginPath();
            this.drawShape(ctx, radius);
            ctx.closePath();

            if(this.layer.strokeColor != null) ctx.stroke();
            if(this.layer.fillColor != null) ctx.fill();
            ctx.restore();

        }


        // DRAW GRID LINES

        // if(this._snap || !drawSnappingLines) ctx.clearRect(0, 0, canvas.width, canvas.height);

        if(this._snap && drawSnappingLines)
        {
            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([5, 3]);
            ctx.strokeStyle = 'rgb(128,128,128)';
            ctx.lineWidth = 2;// * this.c3d.PIXEL_RATIO;
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
            ctx.restore();
        }

        //if(reDraw && !drawSnappingLines)
        this.c3d.render3d.renderShapeLayer(this.layer);

        this.layer.updateThumbnail();
        this.c3d.three.render();

    }


    _listOnclick(e)
    {
        const divList = e.currentTarget.parentNode.querySelector('div.list');
        divList.style.display = divList.style.display == '' || divList.style.display == 'none' ? 'block' : 'none';
    }

    drawShape(ctx, r)
    {

        switch(this.layer.shapeType)
        {

            case 'freeform':

                console.log('Not implemented!');

            break;

            case 'triangle':

                ctx.moveTo(0, - r / 2);
                ctx.lineTo(r / 2 * Math.cos(Math.PI / 6), r / 2 * Math.sin(Math.PI / 6));
                ctx.lineTo(- r / 2 * Math.cos(Math.PI / 6), r / 2 * Math.sin(Math.PI / 6));

            break;

            case 'circle':

                ctx.arc(0, 0, r / 2, 0, Math.PI * 2, true);

            break;

            case 'square':

                ctx.rect(- r / 2, - r / 2, r, r)

            break;
        }

    }

}
