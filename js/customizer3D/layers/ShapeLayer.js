import ColorPicker from 'base/jscolorpicker/colorpicker.js?c3d=0.5.7';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.5.7';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.5.7';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=0.5.7';
import {Dragable} from 'customizer3D_dir/dragable/Dragable.js?c3d=0.5.7';
import {createFiltersList} from 'customizer3D_dir/layers/Filters/Filters.js?c3d=0.5.7';
import {applyFilters} from 'customizer3D_dir/layers/Filters/Filters.js?c3d=0.5.7';

export class ShapeLayer
{
    constructor(c3d)
    {
        this.c3d = c3d;

        this.htmlEl = document.createElement('div');
        this.htmlEl.classList.add('shapeLayer');
        document.querySelector(this.c3d.props.container).append(this.htmlEl);

        let el;

        this.htmlEl.innerHTML = `

        <div class="title">
            <p class="label" draggable="false">${this.c3d.lang['add-shape-layer']}</p>
            <div class="buttons">
                <img src="${C3D_SERVER}svg/arrow-drop-down.svg?c3d=0.5.7" alt="Icon" class="rollup" draggable="false" style="rotate:-180deg;">
                <img src="${C3D_SERVER}svg/plus.svg?c3d=0.5.7" alt="Icon" class="icon" draggable="false" style="rotate:45deg;">
            </div>
        </div>

        <div class="content">
            <div class="menu">

                <div class="triangle">
                    <div class="button" title="${this.c3d.lang['triangle']}">
                        <img src="${C3D_SERVER}svg/triangle.svg?c3d=0.5.7" alt="Icon">
                    </div>
                </div>

                <div class="circle">
                    <div class="button" title="${this.c3d.lang['circle']}">
                        <img src="${C3D_SERVER}svg/circle.svg?c3d=0.5.7" alt="Icon">
                    </div>
                </div>

                <div class="square">
                    <div class="button" title="${this.c3d.lang['square']}">
                        <img src="${C3D_SERVER}svg/square.svg?c3d=0.5.7" alt="Icon">
                    </div>
                </div>

                <div class="rotate">
                    <div class="button" title="${this.c3d.lang['rotate']}">
                        <img src="${C3D_SERVER}svg/rotate.svg?c3d=0.5.7" alt="Icon">
                    </div>
                    <div class="list">
                        <div class="inputPercent" data-icon="°" title="${this.c3d.lang['degree']}">
                            <input type="number" min="-180" max="180" value="0">
                        </div>
                        <input type="range" min="-180" max="180" value="0" step="0.1">
                    </div>
                </div>

                <div class="radius">
                    <div class="button" title="${this.c3d.lang['radius']}">
                        <img src="${C3D_SERVER}svg/radius.svg?c3d=0.5.7" alt="Icon">
                    </div>
                    <div class="list">
                        <div class="inputPercent" data-icon="r"><input type="number" min="1" max="1000" value="50"></div>
                        <input type="range" min="1" max="1000" value="50" step="1">
                    </div>
                </div>

                <div class="filters">
                    <div class="button" title="${this.c3d.lang['filter-gallery']}"><img src="${C3D_SERVER}svg/filters.svg?c3d=0.5.7" alt="Icon"></div>
                    <div class="list">
                    </div>
                </div>

            </div>

            <div class="menu2" style="justify-content: center; align-items: center; padding-top:0.5rem;flex-direction:column;">

                <div style="display:flex; flex-direction:column; gap:1rem;">
                
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

                </div>

                <div class="linejoin-container" style="display:flex; gap:0.75rem; padding-top: 0.75rem;justify-content: center;">

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


        const dragable = new Dragable({
            dragEl: this.htmlEl.querySelector('div.title'),
            container: this.htmlEl,
            root: document.querySelector(this.c3d.props.container),
            c3d: this.c3d
        });


        this.htmlEl.querySelector('div.title > div.buttons > img.rollup').addEventListener('click', (e) => {
            const content = this.htmlEl.querySelector('div.content');
            const visible = content.style.display == 'none' || content.style.display == '';
            content.style.display = visible ? 'flex' : 'none';
            e.currentTarget.style.rotate = visible ? '-180deg' : '0deg';
        });

        this.htmlEl.querySelector('div.title > div.buttons > img.icon').addEventListener('click', () => {
            this.hide();
        });


        const canvas = this.htmlEl.querySelector('canvas.preview');
        const drawAndApplyFilters = () =>
        {
            const filtersCount = Object.keys(this.layer.filters).length;
            if(filtersCount > 0) applyFilters(this.c3d, this.layer, 'shapeLayer');
            else this.layer.updateCanvas();
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
            this.updatePreview();
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
                x: -canvas.width / 2 + ((clientX - bb.x) * 2), 
                y: -canvas.height / 2 + ((clientY - bb.y) * 2)

            };
            drawAndApplyFilters();
            this.updatePreview(true);
        };


        const _listOnclick = (e) =>
        {
            const divList = e.currentTarget.parentNode.querySelector('div.list');
            divList.style.display = divList.style.display == '' || divList.style.display == 'none' ? 'block' : 'none';
        };

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
            if(!this.htmlEl.querySelector('div.filters > div.list').contains(e.target) && !this.htmlEl.querySelector('div.filters > div.button').contains(e.target))
            {
                this.htmlEl.querySelector('div.filters > div.list').style.display = 'none';
            }
        };
        
        if(isMobile()) window.addEventListener('touchstart', _listClickOutside);
        else window.addEventListener('click', _listClickOutside);

        // ROTATION
        
        el = this.htmlEl.querySelector('div.rotate input[type="number"]');
        el.addEventListener('input', (e) => {
            let val = parseInt(e.currentTarget.value);
            if(isNaN(val)) return;
            e.currentTarget.value = val;
            this.htmlEl.querySelector('div.rotate input[type="range"]').value = val;
            this.layer.rotation = parseFloat(val);
            drawAndApplyFilters();
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
                    drawAndApplyFilters();
                    this.updatePreview();
                    input.parentNode.parentNode.style.display = 'none'; // hide list
                }
            }
        );
        
        this.htmlEl.querySelector('div.rotate input[type="range"]').addEventListener('input', (e) => {
            this.layer.rotation = parseFloat(e.currentTarget.value);
            this.htmlEl.querySelector('div.rotate input[type="number"]').value = e.currentTarget.value;
            drawAndApplyFilters();
            this.updatePreview();
        });
        this.htmlEl.querySelector('div.rotate > div.button').addEventListener('click', _listOnclick.bind(this));


        // RADIUS

        el = this.htmlEl.querySelector('div.radius input[type="number"]');
        el.addEventListener('input', (e) => {
            let val = parseInt(e.currentTarget.value);
            if(isNaN(val)) return;
            e.currentTarget.value = val;
            this.htmlEl.querySelector('div.radius input[type="range"]').value = val;
            this.layer.radius = parseFloat(val);
            drawAndApplyFilters();
            this.updatePreview();
        });
        el.addEventListener('focus', (e) => e.currentTarget.select());
        el.addEventListener('keydown', (e) => 
            {
                if (e.keyCode === 13)
                {
                    e.preventDefault();
                    const input = this.htmlEl.querySelector('div.radius input[type="number"]');
                    if(input.value < parseInt(input.min)) input.value = input.min;
                    if(input.value > parseInt(input.max)) input.value = input.max;
                    this.htmlEl.querySelector('div.radius input[type="range"]').value = input.value;
                    this.layer.radius = parseFloat(input.value);
                    drawAndApplyFilters();
                    this.updatePreview();
                    input.parentNode.parentNode.style.display = 'none'; // hide list
                }
            }
        );
        
        this.htmlEl.querySelector('div.radius input[type="range"]').addEventListener('input', (e) => {
            this.layer.radius = parseFloat(e.currentTarget.value);
            this.htmlEl.querySelector('div.radius input[type="number"]').value = e.currentTarget.value;
            drawAndApplyFilters();
            this.updatePreview();
        });

        this.htmlEl.querySelector('div.radius > div.button').addEventListener('click', _listOnclick.bind(this));


        // TRIANGLE
        
        el = this.htmlEl.querySelector('div.triangle > div.button');
        el.addEventListener('click', (e) =>
        {
            this.layer.shapeType = 'triangle';
            drawAndApplyFilters();
            this.updatePreview();
        });


        // CIRCLE
        
        el = this.htmlEl.querySelector('div.circle > div.button');
        el.addEventListener('click', (e) =>
        {
            this.layer.shapeType = 'circle';
            drawAndApplyFilters();
            this.updatePreview();
        });



        // SQUARE
        
        el = this.htmlEl.querySelector('div.square > div.button');
        el.addEventListener('click', (e) =>
        {
            this.layer.shapeType = 'square';
            drawAndApplyFilters();
            this.updatePreview();
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

                drawAndApplyFilters();
                this.updatePreview();

            });

            cp._colorPicker = colorPicker;

        });

        // STROKE CHECKBOX

        el = this.htmlEl.querySelector('input[data-type="stroke"]');
        el.addEventListener('change', () =>
        {
            const strokeCheckBox = this.htmlEl.querySelector('input[data-type="stroke"]');
            const fillCheckBox = this.htmlEl.querySelector('input[data-type="fill"]');
            const lineJoinDiv = this.htmlEl.querySelector('div.linejoin-container');

            lineJoinDiv.style.display = strokeCheckBox.checked ? 'flex' : 'none';
            fillCheckBox.disabled = !strokeCheckBox.checked;
        });




        // STROKE WIDTH

        el = this.htmlEl.querySelector('div.menu2 input[type="range"].lineWidth');
        el.addEventListener('input', (e) =>
        {
            const cp = this.htmlEl.querySelector('div.color_picker[data-color-type="stroke"]');            
            const val = parseInt(e.currentTarget.value);
            this.layer.lineWidth = val;
            this.layer.strokeColor = val == 0 ? null : cp.dataset.color;
            drawAndApplyFilters();
            this.updatePreview();
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
            drawAndApplyFilters();
            this.updatePreview();
        });


        // FILL CHECKBOX

        el = this.htmlEl.querySelector('input[data-type="fill"]');
        el.addEventListener('change', (e) =>
        {
            const cp = this.htmlEl.querySelector('div.color_picker[data-color-type="fill"]');
            this.layer.fillColor = e.currentTarget.checked ? cp.dataset.color : null;
            drawAndApplyFilters();
            this.updatePreview();
        });


        // LINE JOIN

        this.htmlEl.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () =>
            {
                this.layer.lineJoin = radio.value;
                drawAndApplyFilters();
                this.updatePreview();
            });
        });

        // FILTERS
        
        el = this.htmlEl.querySelector('div.filters > div.button');
        el.addEventListener('click', _listOnclick);
        el.addEventListener('click', () => {
            createFiltersList(
                this.c3d, 
                this.htmlEl.querySelector('div.filters > div.list'), 
                'shapeLayer'
            );
        });

    }


    show(shapeLayer)
    {
        // set as active layer
        this.layer = shapeLayer;

        const canvasPreview = this.htmlEl.querySelector('canvas.preview');
        
        this.c3d.showHideUI.hideSubWindows();
        document.querySelector(this.c3d.props.layers).style.opacity = 0.25;

        // set window position
        const bb = document.querySelector(this.c3d.props.layers).getBoundingClientRect();
        const bbContainer = document.querySelector(this.c3d.props.container).getBoundingClientRect();
        const top = bb.top - bbContainer.y + 32;
        let left = bb.left;
        if(bb.width + bb.x > bbContainer.width + bbContainer.x) left = bbContainer.width + bbContainer.x - bb.width;
        // this.htmlEl.style.left = left + 'px';
        this.htmlEl.style.top = top + 'px';
        this.htmlEl.style.display = 'block';
        
        this.htmlEl.style.zIndex = this.c3d.zIndex.index;

        // set preview canvas dims.
        const printDims = getPrintDims(this.c3d, this.layer, 72);
        const printWidth = printDims.width;
        const printHeight = printDims.height;
        const previewDims = calculateAspectRatioFit(printWidth, printHeight, 150, 150);
        canvasPreview.style.width = Math.floor(previewDims.width) + 'px';
        canvasPreview.style.height = Math.floor(previewDims.height) + 'px';
        canvasPreview.width = previewDims.width * this.c3d.PIXEL_RATIO;
        canvasPreview.height = previewDims.height * this.c3d.PIXEL_RATIO;

        // reset line width
        this.htmlEl.querySelector('div.menu2 input[type="range"].lineWidth').value = this.layer.lineWidth;
        
        // check line join radio
        this.htmlEl.querySelector('input[value="' + this.layer.lineJoin +'"]').checked = true;

        // set checkboxes and range values
        this.htmlEl.querySelector('input[data-type="stroke"]').checked = this.layer.strokeColor != null;
        this.htmlEl.querySelector('input[data-type="fill"]').checked = this.layer.fillColor != null;
        const lwRange = this.htmlEl.querySelector('div.menu2 input[type="range"].lineWidth');
        lwRange.value = this.layer.lineWidth;
        lwRange.disabled = this.layer.strokeColor == null;
        lwRange.style.opacity = this.layer.strokeColor == null ? 0.5 : 1;
        this.htmlEl.querySelector('div.rotate input[type="number"]').value = this.layer.rotation;
        this.htmlEl.querySelector('div.rotate input[type="range"]').value = this.layer.rotation;
        this.htmlEl.querySelector('div.radius input[type="number"]').value = this.layer.radius;
        this.htmlEl.querySelector('div.radius input[type="range"]').value = this.layer.radius;

        // set color picker colors
        this.htmlEl.querySelectorAll('div.menu2 div.color_picker').forEach(cp =>
        {
            const active = cp.dataset.colorType;
            cp._colorPicker.setColor(this.layer[active + 'Color']);
        });

    }

    hide()
    {
        this.htmlEl.style.display = 'none';
        document.querySelector(this.c3d.props.layers).style.opacity = 1;
    }


    updatePreview(drawLines = false)
    {     
        if(!this.layer) return;

        const canvas = this.htmlEl.querySelector('canvas.preview');
        const ctx = canvas.getContext('2d', {willReadFrequently: true});
        const layer = this.layer;
        const snapX = Math.abs(layer.shapePosition.x) < 5;
        const snapY = Math.abs(layer.shapePosition.y) < 5;

        if(snapX && drawLines) layer.shapePosition.x = 0;
        if(snapY && drawLines) layer.shapePosition.y = 0;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        ctx.globalAlpha = layer.opacity / 100;
        ctx.drawImage(layer.canvas, 0, 0, canvas.width, canvas.height);
        ctx.restore();


        // DRAW GRID LINES

        if(drawLines)
        {
            // const ce = this.c3d.colorEngine;
            // ce.invert(canvas.style.backgroundColor, true, false);
            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([3, 2]);
            ctx.strokeStyle = '#000';//ce.color;
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
            ctx.restore();
        }

        this.layer.updateThumbnail();
        this.c3d.render3d.renderView(this.layer.name);
        this.c3d.render2d.renderView(this.layer.name);
    }

    drawShape(ctx, r)
    {

        switch(this.layer.shapeType)
        {

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
