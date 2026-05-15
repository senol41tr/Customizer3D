import {addOpacityControls} from 'customizer3D_dir/layers/utils/addOpacityControls.js?c3d=105';
import * as BlendModes from 'customizer3D_dir/layers/BlendModes/BlendModes.js?c3d=104';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=104';

export class Shape
{
    constructor(root, c3d, data)
    {
        this.type = 'shape';

        this.root = root;
        this.c3d = c3d;
        this.div = null;

        this.shapePosition = data.shapePosition || {x:0, y:0};
        this.opacity = data.opacity || 100;
        this.rotation = data.rotation || 0;
        this.radius = data.radius || 50;
        this.lineWidth = data.lineWidth || 5;
        this.lineJoin = data.lineJoin || 'miter';
        this.shapeType = data.shapeType || 'triangle';
        this.fillColor = data.type ? data.fillColor : 0;
        this.strokeColor = data.type ? data.strokeColor : 0;
        this.blendMode = typeof data.blendMode == 'number' ? data.blendMode : 0;
        this.visible = typeof data.visible == 'boolean' ? data.visible : true;
        this.uniforms = data.uniforms || {};

        this._mesh = null;

        
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
        const width = 40;
        const height = 40;

        const imgDims = calculateAspectRatioFit(previewCanvas.width, previewCanvas.height, width, height);

        canvas.width = imgDims.width * 2;
        canvas.height = imgDims.height * 2;
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

    
    // PRIVATE METHODS

    async _init()
    {
        const div = document.createElement('div');
        div.setAttribute('class', this.type);
        div.self = this;
        this.root.prepend(div);
        this.div = div;

        div.innerHTML = `
            <img class="visibility" src="${C3D_SERVER}svg/show.svg?c3d=104" alt="Icon" style="opacity:1;">
            <canvas class="thumbnail" oncontextmenu="return false;"></canvas>
            <div style="width:100%;"></div>
            <img src="${C3D_SERVER}svg/opacity.svg?c3d=104" alt="Icon" title="${this.c3d.lang['opacity']}" class="opacity">
            <img src="${C3D_SERVER}svg/blend_modes.svg?c3d=104" alt="Icon" title="${this.c3d.lang['blend-modes']}" class="blend-modes">
            <img src="${C3D_SERVER}svg/delete-bin.svg?c3d=104" title="${this.c3d.lang['delete-layer']}" class="remove">
        `;

        // VISIBILITY

        div.querySelector('img.visibility').addEventListener('click', (e) =>
        {
            const img = e.currentTarget;
            const isHidden = parseFloat(img.style.opacity) == 1;

            img.style.opacity = isHidden ? 0.5 : 1;
            this.c3d.render3d.setVisibility(this, isHidden);
            this.visible = !isHidden;
            this.div.style.opacity = isHidden ? 0.5 : 1;

        });

        // CANVAS

        const thumbCanvas = div.querySelector('canvas.thumbnail');
        thumbCanvas.addEventListener('click', () => {
            this.c3d.shapeLayer.show(this);
        });


        // OPACITY

        await addOpacityControls(this.c3d, this, div.querySelector('img.opacity'));


        // BLEND MODES

        const blendModesList = document.createElement('div');
        blendModesList.classList.add('blend-modes')
        const blendModesButton = div.querySelector('img.blend-modes');
        BlendModes.createBlendModesList(this.c3d, blendModesList, this, blendModesButton);
        blendModesButton.addEventListener('click', () =>
        {
            this.c3d.contextMenu.setWidth('fit-content');
            this.c3d.contextMenu.setHTMLObj(blendModesList);
            this.c3d.contextMenu.show(blendModesButton);
        });


        // REMOVE

        div.querySelector('img.remove').addEventListener('click', () =>
        {
            if(this.input) this.input.remove();
            div.remove();
            this.c3d.shapeLayer.hide();
            if(this._mesh) this.c3d.render3d.removeLayer(this);
            this.c3d.three.render();
        });

        // ADD NEW MESH
        
        this.c3d.render3d.addShapeLayer(this);


        // ADD TO SORTABLE LIST

        if(this.root.__C3D_Sortable)
        {
            this.root.__C3D_Sortable.addElement(thumbCanvas);
        }

        //

        thumbCanvas.click();
        this.c3d.render3d.updateRenderOrder(this.name);
        
    }

}
