import ColorPicker from 'base/jscolorpicker/colorpicker.js?c3d=0.5.1';
import {BlendModes, createBlendModesList} from 'customizer3D_dir/layers/BlendModes/BlendModes.js?c3d=0.5.1';
import {addOpacityControls} from 'customizer3D_dir/layers/utils/addOpacityControls.js?c3d=0.5.1';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.5.1';
import {applyFilter} from 'customizer3D_dir/layers/Filters/Filters.js?c3d=0.5.1';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=0.5.1';
import {degToRad} from 'customizer3D_dir/utils/degToRad.js?c3d=0.5.1';

export class Shape
{
    constructor(root, c3d, data)
    {
        this.type = 'shape';

        this.root = root;
        this.c3d = c3d;
        this.div = null;
        this.canvas = document.createElement('canvas');
        this.image = document.createElement('canvas');
        this.shapePosition = data.shapePosition || {x:0, y:0};
        this.opacity = data.opacity || 100;
        this.rotation = data.rotation || 0;
        this.radius = data.radius || 50;
        this.lineWidth = data.lineWidth || 5;
        this.lineJoin = data.lineJoin || 'miter';
        this.shapeType = data.shapeType || 'triangle';
        this.fillColor = data.type ? data.fillColor : 0;
        this.strokeColor = data.type ? data.strokeColor : 0;
        this.blendMode = data.blendMode || BlendModes.normal.canvas;
        this.visible = typeof data.visible == 'boolean' ? data.visible : true;
        this.material = data.material;
        this.materialOptions = data.materialOptions;
        this.repeatX = data.repeatX;
        this.repeatY = data.repeatY;
        this.filters = data.filters || {};

        const ce = this.c3d.colorEngine;

        if(this.fillColor == 0)
        {
            ce.hex('#eeff00', false);
            this.fillColor = ce.color;
        }

        if(this.strokeColor == 0)
        {
            ce.hex('#1100ff', false);
            this.strokeColor = ce.color;
        }
        
    }

    // GETTERS

    get name()
    {
        return this.root.parentNode.parentNode.dataset.mesh;
    }



    // PUBLIC METHODS

    updateThumbnail()
    {
        const previewCanvas = this.c3d.shapeLayer.htmlEl.querySelector('canvas.preview');
        const canvas = this.div.querySelector('canvas.thumbnail');
        const ctx = canvas.getContext('2d');
        const width = 50;
        const height = 50;

        const imgDims = calculateAspectRatioFit(previewCanvas.width, previewCanvas.height, width, height);

        canvas.width = imgDims.width;
        canvas.height = imgDims.height;
        canvas.style.width = Math.round(imgDims.width) + 'px';
        canvas.style.height = Math.round(imgDims.height) + 'px';

        imgDims.width *= this.c3d.PIXEL_RATIO;
        imgDims.height *= this.c3d.PIXEL_RATIO;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(previewCanvas, (canvas.width - imgDims.width) / 2, (canvas.height - imgDims.height) / 2, imgDims.width, imgDims.height);
        
    }

    destroy()
    {
        div.querySelector('img.remove').click();
    }

    updateCanvas()
    {
        const ctx = this.image.getContext('2d', {willReadFrequently: true});
        const printDims = getPrintDims(this.c3d, {name: this.name}, this.c3d.settings.getRenderDPI());
        const canvas = this.c3d.shapeLayer.htmlEl.querySelector('canvas.preview');
        const ratio = printDims.width / canvas.width;

        this.image.width = printDims.width;
        this.image.height = printDims.height;

        ctx.clearRect(0, 0, this.image.width, this.image.height);

        ctx.save();
        if(this.fillColor != null) ctx.fillStyle = this.fillColor;
        if(this.strokeColor != null) ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = this.lineWidth * ratio;
        ctx.lineJoin = this.lineJoin;

        ctx.translate(
            this.image.width / 2 + this.shapePosition.x * ratio, 
            this.image.height / 2 + this.shapePosition.y * ratio
        );

        ctx.rotate(degToRad(this.rotation));

        ctx.beginPath();
        this.c3d.shapeLayer.drawShape(ctx, this.radius * ratio);
        ctx.closePath();

        if(this.strokeColor != null) ctx.stroke();
        if(this.fillColor != null) ctx.fill();
        ctx.restore();

        applyFilter(this.c3d, this, 'shapeLayer');

    }
    
    // PRIVATE METHODS

    _init()
    {
        const div = document.createElement('div');
        div.setAttribute('class', this.type);
        div.self = this;
        this.root.prepend(div);
        this.div = div;

        div.innerHTML = `
            <img class="visibility" src="${C3D_SERVER}svg/visibility.svg?c3d=0.5.1" alt="Icon" style="opacity:1;width: 12px;">
            <canvas class="thumbnail" oncontextmenu="return false;"></canvas>
            <div style="width:100%;"></div>
            <img src="${C3D_SERVER}svg/opacity.svg?c3d=0.5.1" alt="Icon" title="${this.c3d.lang['opacity']}" class="opacity">
            <img src="${C3D_SERVER}svg/blend_modes.svg?c3d=0.5.1" alt="Icon" title="${this.c3d.lang['blend-modes']}" class="blend-modes">
            <img src="${C3D_SERVER}svg/delete-bin.svg?c3d=0.5.1" title="${this.c3d.lang['delete-layer']}" class="remove">
        `;

        // VISIBILITY

        div.querySelector('img.visibility').addEventListener('click', (e) =>
        {
            const img = e.currentTarget;
            const isHidden = this.visible;

            img.style.opacity = isHidden ? 0.5 : 1;
            div.style.opacity = isHidden ? 0.5 : 1;

            this.visible = !this.visible;
            
            this.c3d.render3d.renderView(this.name);
            this.c3d.render2d.renderView(this.name);

        });
        div.querySelector('img.visibility').style.opacity = this.visible ? 1 : 0.5;
        div.style.opacity = this.visible ? 1 : 0.5;

        // CANVAS

        const thumbCanvas = div.querySelector('canvas.thumbnail');
        const _onClick = () => {
            this.c3d.shapeLayer.show(this);
        };
        thumbCanvas.addEventListener('click', _onClick);

        // OPACITY

        const opacityButton = div.querySelector('img.opacity');
        addOpacityControls(this.c3d, this, opacityButton);

        // BLEND MODES

        const blendModesList = document.createElement('div');
        blendModesList.classList.add('blend-modes')
        const blendModesButton = div.querySelector('img.blend-modes');
        createBlendModesList(this.c3d, blendModesList, this, blendModesButton);
        blendModesButton.addEventListener('click', () =>
        {
            this.c3d.contextMenu.setWidth('fit-content');
            this.c3d.contextMenu.setHTMLObj(blendModesList);
            this.c3d.contextMenu.show(blendModesButton);
        });

        // REMOVE

        div.querySelector('img.remove').addEventListener('click', () =>
        {
            div.remove();
            this.c3d.render3d.renderView(this.name);
            this.c3d.render2d.renderView(this.name);
        });

        // SORTABLE

        if(this.root.__C3D_Sortable)
        {
            this.root.__C3D_Sortable.addElement(thumbCanvas);
        }

        // FILTERS

        // applyFilter(this.c3d, this, 'shapeLayer');

    }

}
