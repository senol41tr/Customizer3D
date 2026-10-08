import {BlendModes, createBlendModesList} from 'customizer3D_dir/layers/BlendModes/BlendModes.js?c3d=0.5.1';
import {addOpacityControls} from 'customizer3D_dir/layers/utils/addOpacityControls.js?c3d=0.5.1';
import {applyFilter} from 'customizer3D_dir/layers/Filters/Filters.js?c3d=0.5.1';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=0.5.1';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.5.1';

export class Text
{
    constructor(root, c3d, data)
    {
        this.type = 'text';
        
        this.root = root;
        this.c3d = c3d;
        this.div = null;
        this.canvas = document.createElement('canvas');
        this.visible = typeof data.visible == 'boolean' ? data.visible : true;
        this.image = document.createElement('canvas');
        this.text = data.text || 'TXT';
        this.textPosition = data.textPosition || {x:0, y:0};
        this.font = data.font || 'ScotchDisplay-SemiBold';
        this.fontSize = data.fontSize || 30;
        this.color = data.color || null;
        this.opacity = data.opacity || 100;
        this.rotation = data.rotation || 0;
        this.blendMode = data.blendMode || BlendModes.normal.canvas;
        this.filters = data.filters || {};
        this.material = data.material;
        this.materialOptions = data.materialOptions;
        this.repeatX = data.repeatX;
        this.repeatY = data.repeatY;

        this.updateCanvas();
        this._insertHTML();
        applyFilter(this.c3d, this, 'textLayer');
    }

    // GETTERS

    get name()
    {
        return this.root.parentNode.parentNode.dataset.mesh;
    }


    // PUBLIC METHODS

    toUint8Array(base64)
    {
        return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    }

    updateCanvas()
    {
        const ctx = this.image.getContext('2d', {willReadFrequently: true});
        const printDims = getPrintDims(this.c3d, {name: this.name}, this.c3d.settings.getRenderDPI());
        const canvas = this.c3d.textLayer.htmlEl.querySelector('canvas.preview');

        this.image.width = printDims.width;
        this.image.height = printDims.height;

        ctx.clearRect(0, 0, this.image.width, this.image.height);

        ctx.fillStyle = this.color;
        ctx.font = (this.image.width / canvas.width * this.fontSize) + 'pt ' + this.font;
        const metrics = ctx.measureText(this.text);

        ctx.save();
        ctx.translate(this.image.width / 2 + (this.textPosition.x * (this.image.width / canvas.width)), this.image.height / 2 + (this.textPosition.y * (this.image.height / canvas.height)));
        ctx.rotate(this.rotation * (Math.PI / 180));
        ctx.fillText(
            this.text, 
            -metrics.width / 2, 
            (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2
        );
        ctx.restore();

        applyFilter(this.c3d, this, 'textLayer');
    }

    updateThumbnail(previewCanvas)
    {
        const canvas = this.div.querySelector('canvas.thumbnail');
        const ctx = canvas.getContext('2d');
        const width = 50;
        const height = 50;

        const imgDims = calculateAspectRatioFit(previewCanvas.width, previewCanvas.height, width, height);

        canvas.style.backgroundColor = previewCanvas.style.backgroundColor;
        canvas.width = imgDims.width;
        canvas.height = imgDims.height;
        canvas.style.width = imgDims.width + 'px';
        canvas.style.height = imgDims.height + 'px';

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(previewCanvas, (canvas.width - imgDims.width) / 2, (canvas.height - imgDims.height) / 2, imgDims.width, imgDims.height);
    }

    // PRIVATE METHODS

    _insertHTML()
    {
        const div = document.createElement('div');
        div.setAttribute('class', this.type);
        div.self = this;
        this.div = div;

        div.innerHTML = `
            <img class="visibility" src="${C3D_SERVER}svg/visibility.svg?c3d=0.5.1" alt="Icon" style="opacity:1;width: 12px;">
            <canvas class="thumbnail" oncontextmenu="return false;"></canvas>
            <div style="width:100%;"></div>
            <img src="${C3D_SERVER}svg/opacity.svg?c3d=0.5.1" alt="Icon" title="${this.c3d.lang['opacity']}" class="opacity">
            <img src="${C3D_SERVER}svg/blend_modes.svg?c3d=0.5.1" alt="Icon" title="${this.c3d.lang['blend-modes']}" class="blend-modes">
            <img src="${C3D_SERVER}svg/delete-bin.svg?c3d=0.5.1" title="${this.c3d.lang['delete-layer']}" class="delete-layer">
        `;

        div.querySelector('canvas.thumbnail').addEventListener('click', async () =>
        {
            await this.c3d.textLayer.show(this);
        });

        // OPACITY

        const opacityButton = div.querySelector('img.opacity');
        addOpacityControls(this.c3d, this, opacityButton, 'textLayer');


        // BLEND MODES

        const blendModesList = document.createElement('div');
        blendModesList.classList.add('blend-modes')
        const blendModesButton = div.querySelector('img.blend-modes');
        createBlendModesList(this.c3d, blendModesList, this, blendModesButton);
        blendModesButton.addEventListener('click', async () =>
        {
            this.c3d.contextMenu.setWidth('fit-content');
            this.c3d.contextMenu.setHTMLObj(blendModesList);
            this.c3d.contextMenu.show(blendModesButton);
        });


        // REMOVE

        div.querySelector('img.delete-layer').addEventListener('click', () => {
            div.remove();
            this.c3d.textLayer.hide();
            this.c3d.render3d.renderView(this.name);
            this.c3d.render2d.renderView(this.name);
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
        
        this.root.prepend(div);

    }

}
