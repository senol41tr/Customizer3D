import ColorPicker from 'base/jscolorpicker/colorpicker.js';
import {Dragable} from 'customizer3D_dir/dragable/Dragable.js';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js';

export class ShapeLayer
{
    constructor(c3d)
    {

        return;
        
        this.c3d = c3d;

        this.htmlEl = document.querySelector(this.c3d.props.shapeLayer);

        let el;

        this.htmlEl.innerHTML = `
        <div class="title">
            <p class="label" draggable="false">${this.c3d.lang['add-shape-layer']} {beta}</p>
            <div class="buttons">
                <img src="${C3D_SERVER}svg/arrow-drop-down.svg" alt="Icon" class="rollup" draggable="false" style="rotate:-180deg;">
                <img src="${C3D_SERVER}svg/plus.svg" alt="Icon" class="icon" draggable="false" style="rotate:45deg;">
            </div>
        </div>

        <div class="content">
            <div class="menu">
                <div class="actions">
                    <div class="triangle" title="${this.c3d.lang['triangle']}">
                        <img src="${C3D_SERVER}svg/triangle_filled.svg" alt="Icon">
                    </div>
                    <div class="square" title="${this.c3d.lang['square']}">
                        <img src="${C3D_SERVER}svg/square_filled.svg" alt="Icon">
                    </div>
                    <div class="circle" title="${this.c3d.lang['circle']}">
                        <img src="${C3D_SERVER}svg/circle_filled.svg" alt="Icon">
                    </div>
                    <div class="freeform" title="${this.c3d.lang['freeform']}">
                        <img src="${C3D_SERVER}svg/freeform_filled.svg" alt="Icon" style="pointer-events:none; opacity: 0.4;">
                    </div>
                </div>
                <div>
                    <div class="rotate">
                        <div class="button" title="${this.c3d.lang['rotate']}"><img src="${C3D_SERVER}svg/rotate.svg" alt="Icon"></div>
                        <div class="list">
                            <div><input type="number" min="0" max="359" value="0"> ${this.c3d.lang['degree']}</div>
                            <input type="range" min="0" max="359" value="0" step="1">
                        </div>
                    </div>
                    <div class="radius">
                        <div class="button" title="${this.c3d.lang['radius']}"><img src="${C3D_SERVER}svg/radius.svg" alt="Icon"></div>
                        <div class="list">
                            <div><input type="number" step="0.1" min="0.1" max="20" value="1"></div>
                            <input type="range" step="0.1" min="0.1" max="20" value="1">
                        </div>
                    </div>
                    <div class="filters">
                        <div style="pointer-events:none;opacity:0.4;" class="button" title="${this.c3d.lang['filter-gallery']}"><img src="${C3D_SERVER}svg/filters.svg" alt="Icon"></div>
                        <div class="list">
                        </div>
                    </div>
                    <div class="blend_modes">
                        <div style="pointer-events:none;opacity:0.4;" class="button" title="${this.c3d.lang['blend-modes']}"><img src="${C3D_SERVER}svg/blend_modes.svg" alt="Icon"></div>
                        <div class="list">
                        </div>
                    </div>
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



        // ROTATION
        this.htmlEl.querySelector('div.rotate > div.button').addEventListener('click', this._listOnclick.bind(this));
        el = this.htmlEl.querySelector('div.rotate input[type="number"]');
        el.addEventListener('input', async(e) => {
            let val = parseFloat(e.currentTarget.value);
            if(isNaN(val)) return;
            e.currentTarget.value = val;
            this.htmlEl.querySelector('div.rotate input[type="range"]').value = val;
            this.imageLayer.rotation = val;
            await this.updatePreview();
        });
        el.addEventListener('focus', (e) => e.currentTarget.select());
        el.addEventListener('keydown', async(e) => {
            if (e.keyCode === 13)
            {
                e.preventDefault();
                const input = this.htmlEl.querySelector('div.rotate input[type="number"]');
                if(input.value < parseInt(input.min)) input.value = input.min;
                if(input.value > parseInt(input.max)) input.value = input.max;
                this.htmlEl.querySelector('div.rotate input[type="range"]').value = input.value;
                this.imageLayer.rotation = parseFloat(input.value);
                input.parentNode.parentNode.style.display = 'none'; // hide list
                await this.updatePreview();
            }
        });
        
        this.htmlEl.querySelector('div.rotate input[type="range"]').addEventListener('input', async(e) => {
            this.imageLayer.rotation = parseFloat(e.currentTarget.value);
            this.htmlEl.querySelector('div.rotate input[type="number"]').value = e.currentTarget.value;
            await this.updatePreview();
        });

        // RADIUS

        el = this.htmlEl.querySelector('div.radius input[type="number"]');
        el.addEventListener('input', async(e) => {
            let val = parseFloat(e.currentTarget.value);
            if(isNaN(val)) return;
            e.currentTarget.value = val;
            this.htmlEl.querySelector('div.radius input[type="range"]').value = val;
            this.imageLayer.radius = val;
            await this.updatePreview();
        });
        el.addEventListener('focus', (e) => e.currentTarget.select());
        el.addEventListener('keyup', async(e) => {
            const input = this.htmlEl.querySelector('div.radius input[type="number"]');
            if(parseInt(input.value) < parseInt(input.min)) input.value = input.min;
            if(parseInt(input.value) > parseInt(input.max)) input.value = input.max;
            this.htmlEl.querySelector('div.radius input[type="range"]').value = input.value;
            this.imageLayer.radius = parseFloat(input.value);
            await this.updatePreview();
            if(e.keyCode === 13) input.parentNode.parentNode.style.display = 'none'; // hide list
        });
        
        this.htmlEl.querySelector('div.radius input[type="range"]').addEventListener('input', async(e) => {
            this.imageLayer.radius = parseFloat(e.currentTarget.value);
            this.htmlEl.querySelector('div.radius input[type="number"]').value = e.currentTarget.value;
            await this.updatePreview();
        });

        // CANVAS

        const canvasPreview = this.htmlEl.querySelector('canvas.preview');

        // mobile
        if (isMobile())
        {
            const __canvasMouseMove = (e) =>
            {
                const canvas = this.imageLayer.previewCanvas;
                const bb = canvas.getBoundingClientRect();
                this.imageLayer.imagePosition =
                {
                    x: -canvas.width / 2 + ((e.touches[0].clientX - bb.x) * 2), 
                    y: -canvas.height / 2 + ((e.touches[0].clientY - bb.y) * 2)
                };
                this.updatePreview(true);
        
            };

            const __canvasMouseUp = () =>
            {
                window.removeEventListener('mousemove', __canvasMouseMove);
                window.removeEventListener('mouseup', __canvasMouseUp);
                if(isMobile()) document.body.style.overflow = 'auto';
            };

            canvasPreview.addEventListener('touchstart', (e) => {
                __canvasMouseMove(e);
                if(isMobile()) document.body.style.overflow = 'hidden';
                window.addEventListener('touchmove', __canvasMouseMove);
                window.addEventListener('mouseup', __canvasMouseUp);
            });

            window.addEventListener('touchend', () => {
                window.removeEventListener('touchmove', __canvasMouseMove);
                if(isMobile()) document.body.style.overflow = 'auto';
                this.updatePreview(false);
            });

        }
        // desktop
        else
        {
            const __canvasMouseMove = (e) =>
            {
                const canvas = this.imageLayer.previewCanvas;
                const bb = canvas.getBoundingClientRect();
                this.imageLayer.imagePosition =
                {
                    x: -canvas.width / 2 + ((e.clientX - bb.x) * 2), 
                    y: -canvas.height / 2 + ((e.clientY - bb.y) * 2)
                };
                this.updatePreview(true);
            };

            const __canvasMouseUp = () =>
            {
                window.removeEventListener('mousemove', __canvasMouseMove);
                window.removeEventListener('mouseup', __canvasMouseUp);
                if(isMobile()) document.body.style.overflow = 'auto';
                this.updatePreview(false);
            };

            canvasPreview.addEventListener('mousedown', (e) => 
            {
                __canvasMouseMove(e);
                if(isMobile()) document.body.style.overflow = 'hidden';
                window.addEventListener('mousemove', __canvasMouseMove);
                window.addEventListener('mouseup', __canvasMouseUp);
            });

        }

    }


    async show(shapeLayer)
    {
        // set active layer
        if(shapeLayer) this.shapeLayer = shapeLayer;
        this.shapeLayer.previewCanvas = this.htmlEl.querySelector('canvas.preview');

        // set top of window
        this.htmlEl.style.zIndex = this.c3d.zIndex.index;

        // 
        const printDims = getPrintDims(this.c3d, this.shapeLayer, 72);
        const printWidth = printDims.width;
        const printHeight = printDims.height;
        const originalSize = printDims.originalSize;

        // set active layer and preview canvas
        this.shapeLayer = shapeLayer;

        // as default show window
        this.htmlEl.querySelector('div.content').style.display = 'flex'; // show content
        this.htmlEl.querySelector('div.title > div.buttons > img.rollup').style.rotate = '180deg';

        const bb = document.querySelector(this.c3d.props.layers).getBoundingClientRect();
        const bbContainer = document.querySelector(this.c3d.props.container).getBoundingClientRect();
        const top = bb.top - bbContainer.y + (isMobile() ? 32 : 0);
        const left = bb.left + (isMobile() ? 32 : bb.width + 16);

        this.htmlEl.style.left = left + 'px';
        this.htmlEl.style.top = top + 'px';
        this.htmlEl.style.display = 'block';

        // set preview canvas dims.
        this.shapeLayer.previewCanvas = this.htmlEl.querySelector('canvas.preview');
        const previewDims = calculateAspectRatioFit(printWidth, printHeight, 150, 150);
        this.shapeLayer.previewCanvas.style.width = Math.floor(previewDims.width) + 'px';
        this.shapeLayer.previewCanvas.style.height = Math.floor(previewDims.height) + 'px';
        this.shapeLayer.previewCanvas.width = previewDims.width * 2;
        this.shapeLayer.previewCanvas.height = previewDims.height * 2;

        await await this.updatePreview();
    }

    hide()
    {
        this.htmlEl.style.display = 'none';
    }

    _listOnclick(e)
    {
        const divList = e.currentTarget.parentNode.querySelector('div.list');
        divList.style.display = divList.style.display == '' || divList.style.display == 'none' ? 'block' : 'none';
    }

    async updatePreview(drawLines = false)
    {
        if(!this.shapeLayer.hasOwnProperty('previewCanvas')) return;;
        
        const canvas = this.htmlEl.querySelector('canvas.preview');
        const ctx = canvas.getContext('2d');
        const layer = this.shapeLayer;

        /*
        const snapX = Math.abs(layer.textPosition.x) < 10;
        const snapY = Math.abs(layer.textPosition.y) < 10;

        // layer.setText(layer.text);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if(snapX && drawLines)
        {
            layer.textPosition.x = 0;
        }

        if(snapY && drawLines)
        {
            layer.textPosition.y = 0;
        }

        ctx.fillStyle = layer.color;
        ctx.font = (layer.fontSize / 7.70516) + 'pt ' + layer.font;

        const metrics = ctx.measureText(layer.text);

        ctx.save();
        ctx.translate(canvas.width / 2 + layer.textPosition.x, canvas.height / 2 + layer.textPosition.y);
        ctx.rotate(layer.rotation * (Math.PI / 180));
        ctx.fillText(layer.text, -metrics.width / 2, (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2);
        ctx.restore();

        if(drawLines)
        {
            ctx.beginPath();
            ctx.setLineDash([3, 2]);
            ctx.strokeStyle = this.c3d.colorEngine.invert(canvas.style.backgroundColor, false);
            ctx.lineWidth = 1;
            if(snapX)
            {
                ctx.moveTo(0, Math.round(canvas.height / 2));
                ctx.lineTo(canvas.width, Math.round(canvas.height / 2));
            }
            if(snapY)
            {
                ctx.moveTo(Math.round(canvas.width / 2), 0);
                ctx.lineTo(Math.round(canvas.width / 2), canvas.height);
            }
            ctx.stroke();
        }
        */
    }

}
