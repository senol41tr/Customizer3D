import * as THREE from 'three';
import ColorPicker from 'base/jscolorpicker/colorpicker.js?c3d=103';
import {Dragable} from 'customizer3D_dir/dragable/Dragable.js?c3d=103';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=103';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=103';
import {Size} from 'customizer3D_dir/utils/Size.js?c3d=103';
import {createFiltersList} from 'customizer3D_dir/layers/Filters/createFiltersList.js?c3d=103';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=103';
import {getCorrectedAxis} from 'customizer3D_dir/layers/utils/getCorrectedAxis.js?c3d=103';

export class ShapeLayer
{
    constructor(c3d)
    {
        this.c3d = c3d;
        this.htmlEl = document.querySelector(this.c3d.props.shapeLayer);

        this.gridLines = null;

        this.layer = {};
        this._snap = false;

        let el;

        this.htmlEl.innerHTML = `
        <div class="title">
            <p class="label" draggable="false">${this.c3d.lang['add-shape-layer']}</p>
            <div class="buttons">
                <img src="${C3D_SERVER}svg/arrow-drop-down.svg?c3d=103" alt="Icon" class="rollup" draggable="false" style="rotate:-180deg;">
                <img src="${C3D_SERVER}svg/plus.svg?c3d=103" alt="Icon" class="icon" draggable="false" style="rotate:45deg;">
            </div>
        </div>

        <div class="content">
            <div class="menu">
                <div class="freeform" style="pointer-events:none; opacity:0.6;">
                    <div class="button" title="${this.c3d.lang['freeform']}">
                        <img src="${C3D_SERVER}svg/freeform.svg?c3d=103" alt="Icon">
                    </div>
                    <div class="list"></div>
                </div>
                <div class="triangle">
                    <div class="button" title="${this.c3d.lang['triangle']}">
                        <img src="${C3D_SERVER}svg/triangle.svg?c3d=103" alt="Icon">
                    </div>
                    <div class="list"></div>
                </div>
                <div class="circle">
                    <div class="button" title="${this.c3d.lang['circle']}">
                        <img src="${C3D_SERVER}svg/circle.svg?c3d=103" alt="Icon">
                    </div>
                    <div class="list"></div>
                </div>
                <div class="square">
                    <div class="button" title="${this.c3d.lang['square']}">
                        <img src="${C3D_SERVER}svg/square.svg?c3d=103" alt="Icon">
                    </div>
                    <div class="list"></div>
                </div>
            </div>

            <div class="menu2" style="justify-content: flex-start; align-items: flex-start; width: 150px;">
                <div class="stroke" style="display:flex; gap:0.5rem; align-items: center;">
                    <div data-color="stroke" class="color_picker" title="${this.c3d.lang['stroke']} ${this.c3d.lang['color']}"></div>
                    <label style="display:flex; gap:0.25rem;">
                        <input data-type="stroke" type="checkbox" checked>
                        <p style="font-size: 0.65rem;">${this.c3d.lang['stroke']}</p>
                    </label>
                    <input type="range" class="lineWidth" min="0" max="100" value="5" step="1">
                </div>

                <div class="fill" style="display:flex; gap:0.5rem;">
                    <div data-color="fill" class="color_picker" title="${this.c3d.lang['fill']} ${this.c3d.lang['color']}"></div>
                    <label style="display:flex; gap:0.25rem;">
                        <input data-type="fill" type="checkbox" checked>
                        <p style="font-size: 0.65rem;">${this.c3d.lang['fill']}</p>
                    </label>
                </div>
            </div>

            <canvas class="preview" oncontextmenu="return false;"></canvas>

            <div style="padding-top:0.25rem;">
                <div class="snap toggle">
                    <div class="button" title="${this.c3d.lang['snap']}">
                        <img src="${C3D_SERVER}svg/magnet.svg?c3d=103" alt="Icon">
                    </div>
                </div>

                <div class="rotate">
                    <div class="button" title="${this.c3d.lang['rotate']}">
                        <img src="${C3D_SERVER}svg/rotate.svg?c3d=103" alt="Icon">
                    </div>
                    <div class="list">
                        <div class="inputPercent" title="°">
                            <input type="number" min="-180" max="180" value="0">
                        </div>
                        <input type="range" min="-180" max="180" value="0" step="1">
                    </div>
                </div>
                <div class="radius">
                    <div class="button" title="${this.c3d.lang['radius']}">
                        <img src="${C3D_SERVER}svg/radius.svg?c3d=103" alt="Icon">
                    </div>
                    <div class="list">
                        <div class="inputPercent" title="r">
                            <input type="number" min="10" max="400" value="50">
                        </div>
                        <input type="range" min="10" max="400" value="50" step="1">
                    </div>
                </div>
            </div>

        </div>`;

        const canvas = this.htmlEl.querySelector('canvas.preview');

        // COLOR PICKERS

        this.htmlEl.querySelectorAll('div.menu2 div.color_picker').forEach(cp =>
        {
            const ce = this.c3d.colorEngine;
            const active = cp.dataset.color;
            
            ce.hex('#eeff00', false);
            const fillColor = ce.color;
            ce.hex('#1100ff', false);
            const strokeColor = ce.color;

            this.colorPicker = new ColorPicker(cp, {
                color: active == 'fill' ? fillColor : strokeColor,
                submitMode: 'instant',
                enableEyedropper:true,
                enableAlpha:false,
                loadLocalSwatches:true,
                localStorage: this.c3d.localStorage,
                c3d: this.c3d
            });
            
            this.colorPicker.on('pick', (color) => {
                if(active == 'fill')
                {
                    ce.invert(color.string('hex'), true, false);
                    canvas.style.backgroundColor = ce.color;
                }
                this.layer[active == 'fill' ? 'fillColor' : 'strokeColor'] = color.string('hex');
                this.updatePreview(null, true, false);
            });   
        });


        // STROKE WIDTH

        el = this.htmlEl.querySelector('div.menu2 input[type="range"].lineWidth');
        el.addEventListener('input', (e) =>
        {
            this.layer.lineWidth = parseInt(e.currentTarget.value);
            this.updatePreview(null, true, false);
        });


        const canvasMouseMove = (e) =>
        {
            const touch = (e.touches && e.touches[0]) || (e.pointerType && e.pointerType === 'touch' && e);
            const clientX = (touch || e).clientX;
            const clientY = (touch || e).clientY;
            
            const bb = canvas.getBoundingClientRect();

            this.layer.shapePosition =
            {
                // x: (clientX - bb.left), 
                // y: (clientY - bb.top)
                x: (((clientX - bb.left) / bb.width) - 0.5), 
                y: (0.5 - ((clientY - bb.top) / bb.height))

            };

            this.updatePreview();
            // this.c3d.render3d.renderShapeLayer(this.layer);
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

           this.updatePreview(null, true, false);
            // this.c3d.render3d.renderShapeLayer(this.layer);
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


        this.htmlEl.querySelector('div.rotate > div.button').addEventListener('click', this._listOnclick.bind(this));
        this.htmlEl.querySelector('div.radius > div.button').addEventListener('click', this._listOnclick.bind(this));


        // ROTATION

        el = this.htmlEl.querySelector('div.rotate input[type="number"]');
        el.addEventListener('input', (e) => {
            let val = parseInt(e.currentTarget.value);
            if(isNaN(val)) return;
            e.currentTarget.value = val;
            this.htmlEl.querySelector('div.rotate input[type="range"]').value = val;
            this.layer.rotation = parseFloat(val);
            this.updatePreview(null, true, false);
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
                    this.updatePreview(null, true, false);
                    input.parentNode.parentNode.style.display = 'none'; // hide list
                }
            }
        );
        
        this.htmlEl.querySelector('div.rotate input[type="range"]').addEventListener('input', (e) => {
            this.layer.rotation = parseFloat(e.currentTarget.value);
            this.htmlEl.querySelector('div.rotate input[type="number"]').value = e.currentTarget.value;
            this.updatePreview(null, true, false);
        });


        // radius

        el = this.htmlEl.querySelector('div.radius input[type="number"]');

        el.addEventListener('input', (e) => {
            let val = parseFloat(e.currentTarget.value);
            if(isNaN(val)) return;
            e.currentTarget.value = val;
            this.htmlEl.querySelector('div.radius input[type="range"]').value = val;
            this.layer.radius = val;
            this.updatePreview(null, true, false);
        });

        el.addEventListener('focus', (e) => e.currentTarget.select());

        el.addEventListener('keyup', (e) => {
            const input = this.htmlEl.querySelector('div.radius input[type="number"]');
            if(e.keyCode === 13) input.parentNode.parentNode.style.display = 'none'; // hide list
            this.updatePreview(null, true, false);
        });
        
        el = this.htmlEl.querySelector('div.radius input[type="range"]');
        el.addEventListener('input', (e) => {
            this.layer.radius = parseFloat(e.currentTarget.value);
            this.htmlEl.querySelector('div.radius input[type="number"]').value = e.currentTarget.value;
            this.updatePreview(null, true, false);
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




        const _listClickOutside = (e) =>
        {
            if(!this.htmlEl.querySelector('div.rotate > div.list').contains(e.target) && !this.htmlEl.querySelector('div.rotate > div.button').contains(e.target))
            {
                this.htmlEl.querySelector('div.rotate > div.list').style.display = 'none';
            }
            if(!this.htmlEl.querySelector('div.radius > div.list').contains(e.target) && !this.htmlEl.querySelector('div.radius > div.button').contains(e.target))
            {
                this.htmlEl.querySelector('div.radius > div.list').style.display = 'none';
            }
        };
        window.addEventListener('click', _listClickOutside);
        window.addEventListener('touchstart', _listClickOutside);

    }


    show(shapeLayer, width, height)
    {
        if(!shapeLayer._mesh) return;

        // set as active layer
        this.layer = shapeLayer;

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
            previewCanvas.style.width = Math.floor(previewCanvasDims.width) + 'px';
            previewCanvas.style.height = Math.floor(previewCanvasDims.height) + 'px';
        }
        previewCanvas.width = Math.floor(previewCanvasDims.width) * (isExport ? 1 : this.c3d.PIXEL_RATIO);
        previewCanvas.height = Math.floor(previewCanvasDims.height) * (isExport ? 1 : this.c3d.PIXEL_RATIO);


        // disable/enable rotation
        // const rotation = this.htmlEl.querySelector('div.rotate');
        // rotation.style.display = this.layer.points ? 'block' : 'none';

        // // disable/enable rotation
        // const radius = this.htmlEl.querySelector('div.radius');
        // radius.style.display = this.layer.points ? 'block' : 'none';

        // // disable/enable snap
        // const snap = this.htmlEl.querySelector('div.snap');
        // snap.style.display = this.layer.points ? 'block' : 'none';

        // as default show window
        this.htmlEl.querySelector('div.content').style.display = 'flex'; // show content
        this.htmlEl.querySelector('div.title > div.buttons > img.rollup').style.rotate = '180deg';

        // set window position
        const bb = document.querySelector(this.c3d.props.layers).getBoundingClientRect();
        const bbContainer = document.querySelector(this.c3d.props.container).getBoundingClientRect();
        const top = bb.top - bbContainer.y;
        const left = bb.left + bb.width + 16;

        // document.querySelector(this.c3d.props.shapeLayer).style.display = 'none';

        this.htmlEl.style.left = left + 'px';
        this.htmlEl.style.top = top + 'px';
        this.htmlEl.style.display = 'block';

        // reset window vars
        // this.htmlEl.querySelector('div.fontSizes input[type="range"]').value = this.layer.fontSize;
        // this.htmlEl.querySelector('div.fontSizes input[type="number"]').value = this.layer.fontSize;
        // this.htmlEl.querySelector('div.rotate input[type="range"]').value = this.layer.rotation;
        // this.htmlEl.querySelector('div.rotate input[type="number"]').value = this.layer.rotation;
        // this.htmlEl.querySelector('div.content > input.text').value = this.layer.text;

        // set class vars
        // if(!this.layer.color)
        // {
        //     const ce = this.c3d.colorEngine;
        //     ce.invert('#eeff00', false)
        //     this.layer.color = ce.color;
        //     ce.hex('#eeff00', false);
        //     this.colorPicker.setColor(ce.color);
        // }
        // else
        // {
        //     this.colorPicker.setColor(this.layer.color);
        // }

        // FILTERS
        // const filtersDiv = this.htmlEl.querySelector('div.filters');
        // filtersDiv.style.display = this.layer.is3D ? 'block' : 'none';
        // if(this.layer.is3D) createFiltersList(this.c3d, this, this.htmlEl.querySelector('div.filters > div.button'));

        this.updatePreview(null, true, false);
    }

    hide()
    {
        this.htmlEl.style.display = 'none';
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
            if(canvasData)
            {
                // ctx.drawImage(canvasData, 0, 0, canvas.width, canvas.height);
            }
            // else if(this.layer.is3D)
            // {
            //     this.c3d.render3d.renderShapeLayer(this.layer);

            //     const layerData = this.c3d.render3d.getLayerTexture(this.layer);
            //     const tmpCanvas = document.createElement('canvas');
            //     const tmpCtx = tmpCanvas.getContext('2d');
            //     tmpCanvas.width = layerData.width;
            //     tmpCanvas.height = layerData.height;

            //     const imageData = new ImageData(new Uint8ClampedArray(layerData.data), layerData.width, layerData.height);
            //     tmpCtx.putImageData(imageData, 0, 0);

            //     ctx.save();
            //     
            //     ctx.drawImage(tmpCanvas, -canvas.width/2, -canvas.height/2, canvas.width, canvas.height);
            //     ctx.restore();
            // }
            else if(this.layer.shapeType)
            {
                // const sides = 8;//Math.floor(Math.random() * 32);
                // const splice = (Math.PI * 2) / sides;
                const angle = THREE.MathUtils.degToRad(this.layer.rotation);

                ctx.save();
                ctx.fillStyle = this.layer.fillColor;
                ctx.strokeStyle = this.layer.strokeColor;
                ctx.lineWidth = this.layer.lineWidth;
                // ctx.lineJoin = "round"; // miter, round, bevel 
                // context.miterLimit = 15;

                ctx.translate(
                    canvas.width / 2 + (this.layer.shapePosition.x * canvas.width), 
                    canvas.height / 2 - (this.layer.shapePosition.y * canvas.height)
                );

                ctx.rotate(angle);
                ctx.beginPath();

                this.drawShape(ctx);

                ctx.closePath();
                ctx.stroke();
                ctx.fill();
                ctx.restore();
            }

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

    drawShape(ctx, r = this.layer.radius)
    {
        switch(this.layer.shapeType)
        {

            case 'freeform':



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
