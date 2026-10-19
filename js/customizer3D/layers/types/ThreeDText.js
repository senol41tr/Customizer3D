import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.5.5';
import {BlendModes, createBlendModesList} from 'customizer3D_dir/layers/BlendModes/BlendModes.js?c3d=0.5.5';
import {addOpacityControls} from 'customizer3D_dir/layers/utils/addOpacityControls.js?c3d=0.5.5';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=0.5.5';

export class ThreeDText
{
    constructor(root, c3d, data)
    {
        this.type = 'threeDText';

        this.root = root;
        this.c3d = c3d;
        this.div = null;

        this.text = 'Q';
        this.image = document.createElement('canvas');
        this.canvas = document.createElement('canvas');
        this.effectsCanvas = document.createElement('canvas');
        this.imagePosition = data.imagePosition || {x:0, y:0};
        this.rotation = data.rotation || 0;
        this.opacity = data.opacity || 100;
        this.zoom = data.zoom || 100;
        this.material = data.material;
        this.materialOptions = data.materialOptions;
        this.repeatX = data.repeatX;
        this.repeatY = data.repeatY;
        this.blendMode = data.blendMode || BlendModes.normal.canvas;
        this.filters = data.filters || {};
        this.effects = data.effects || {};
        this.visible = typeof data.visible == 'boolean' ? data.visible : true;
        this.options = data.options || {};

        this.__baked = false;

        this._insertHTML();
    }

    // GETTERS

    get name()
    {
        return this.root.parentNode.parentNode.dataset.mesh;
    }

    // PUBLIC METHODS

    updateThumbnail(previewCanvas)
    {
        const canvas = this.div.querySelector('canvas.thumbnail');
        const ctx = canvas.getContext('2d');
        const width = 50;
        const height = 50;

        const imgDims = calculateAspectRatioFit(previewCanvas.width, previewCanvas.height, width, height);

        canvas.width = imgDims.width;
        canvas.height = imgDims.height;
        canvas.style.width = imgDims.width + 'px';
        canvas.style.height = imgDims.height + 'px';

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(previewCanvas, (canvas.width - imgDims.width) / 2, (canvas.height - imgDims.height) / 2, imgDims.width, imgDims.height);
    }

    destroy()
    {
        this.div.remove();
    }
    
    // PRIVATE METHODS


    _insertHTML()
    {
        const printDims = getPrintDims(this.c3d, {name: this.name}, this.c3d.settings.getRenderDPI());
        this.canvas.width = printDims.width;
        this.canvas.height = printDims.height;

        const div = document.createElement('div');
        div.setAttribute('class', this.type);
        div.self = this;
        this.root.prepend(div);
        this.div = div;

        div.innerHTML = `
            <img class="visibility" src="${C3D_SERVER}svg/visibility.svg?c3d=0.5.5" alt="Icon" style="opacity:1;width: 12px;">
            <canvas class="thumbnail" oncontextmenu="return false;"></canvas>
            <div style="width:100%;"></div>
            <img src="${C3D_SERVER}svg/opacity.svg?c3d=0.5.5" alt="Icon" title="${this.c3d.lang['opacity']}" class="opacity">
            <img src="${C3D_SERVER}svg/blend_modes.svg?c3d=0.5.5" alt="Icon" title="${this.c3d.lang['blend-modes']}" class="blend-modes">
            <img src="${C3D_SERVER}svg/delete-bin.svg?c3d=0.5.5" title="${this.c3d.lang['delete-layer']}" class="remove">
        `;

        // CANVAS

        div.querySelector('canvas.thumbnail').addEventListener('click', () =>
        {
            this.c3d.threeDTextLayer.show(this);
        });

        // OPACITY

        const opacityButton = div.querySelector('img.opacity');
        addOpacityControls(this.c3d, this, opacityButton, 'imageLayer');


        // BLEND MODE

        const blendModesList = document.createElement('div');
        blendModesList.classList.add('blend-modes');
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
            this.c3d.threeDTextLayer.hide();
            this.c3d.render3d.renderView(this.name);
            this.c3d.render2d.renderView(this.name);
            this.c3d.three.render();
        });

        // VISIBILITY

        div.querySelector('img.visibility').addEventListener('click', (e) =>
        {
            const img = e.currentTarget;
            const isHidden = this.visible;

            img.style.opacity = isHidden ? 0.5 : 1;
            this.visible = !isHidden;
            this.div.style.opacity = isHidden ? 0.5 : 1;

            this.c3d.render3d.renderView(this.name);
            this.c3d.render2d.renderView(this.name);

        });
        div.querySelector('img.visibility').style.opacity = this.visible ? 1 : 0.5;
        div.style.opacity = this.visible ? 1 : 0.5;

        //
        
        if(this.root.__C3D_Sortable)
        {
            this.root.__C3D_Sortable.addElement(div.querySelector('canvas.thumbnail'));
        }

        // DRAW IMAGE

        if(this.options.material)
        {
            const l = this.c3d.threeDTextLayer;
            l.show(this);
            l.showGUI();

            if(this.options?.materialOptions?.matcap) // !!!
            {
                l._create(true);
            }
            else
            {
                l._create();
                l.bakeImageToLayer();
            }
        }

    }

    updateCanvas()
    {
        const printDims = getPrintDims(this.c3d, {name: this.name}, this.c3d.settings.getRenderDPI());
        const ctx = this.canvas.getContext('2d', {willReadFrequently: true});
        const fx = Object.keys(this.effects).length > 0;
        
        this.canvas.width = printDims.width;
        this.canvas.height = printDims.height;        

        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(fx ? this.effectsCanvas : this.image, 0, 0);
        ctx.restore();
    }

}

