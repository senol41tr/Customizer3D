import {Size} from 'customizer3D_dir/utils/Size.js?c3d=0.5.0';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.5.0';
import {degToRad} from 'customizer3D_dir/utils/degToRad.js?c3d=0.5.0';
import {BlendModes, createBlendModesList} from 'customizer3D_dir/layers/BlendModes/BlendModes.js?c3d=0.5.0';
import {addOpacityControls} from 'customizer3D_dir/layers/utils/addOpacityControls.js?c3d=0.5.0';
import {applyFilter} from 'customizer3D_dir/layers/Filters/Filters.js?c3d=0.5.0';

export class Image
{
    constructor(root, c3d, data)
    {
        this.type = 'image';
        
        this.root = root;
        this.c3d = c3d;
        this.div = null;

        this.image = data.image || null;
        this.canvas = document.createElement('canvas');
        this.fileName = data.fileName || null;
        this.detectedFileType = data.detectedFileType || null;
        this.imagePosition = data.imagePosition || {x:0, y:0};
        this.rotation = data.rotation || 0;
        this.opacity = data.opacity || 100;
        this.zoom = data.zoom || 100;
        this.changeable = typeof data.changeable == 'boolean' ? data.changeable : true;
        this.material = data.material;
        this.materialOptions = data.materialOptions;
        this.repeatX = data.repeatX;
        this.repeatY = data.repeatY;
        this.blendMode = data.blendMode || BlendModes.normal.canvas;
        this.filters = data.filters || {};
        this.visible = typeof data.visible == 'boolean' ? data.visible : true;

        this.input = null;
        this.previewCanvas = null;
        
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
        if(this.image) URL.revokeObjectURL(this.image.src);
    }

    getCanvas(crop = false)
    {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const orgPrintSize = this.c3d.props.data[this.name].printSize;

        let dims;
        if(orgPrintSize) dims = [orgPrintSize.width, orgPrintSize.height];
        else dims = [this.image.naturalWidth + 'px', this.image.naturalWidth + 'px'];

        const printWidth = new Size({size:dims[0], DPI:300}).px;
        const printHeight = new Size({size:dims[1], DPI:300}).px;
        const imgDims = calculateAspectRatioFit(this.image.width, this.image.height, printWidth, printHeight);
        
        // CROP CANVAS
        if(crop)
        {
            const width = this.previewCanvas ? this.previewCanvas.width : this.image.naturalWidth;
            const height = this.previewCanvas ? this.previewCanvas.height : this.image.naturalHeight;

            canvas.width = printWidth;
            canvas.height = printHeight;

            const x = canvas.width / width * this.imagePosition.x;
            const y = canvas.height / height * this.imagePosition.y;
            
            ctx.save();
            ctx.translate(canvas.width / 2 + x, canvas.height / 2 + y);
            ctx.rotate(degToRad(this.rotation));
            ctx.scale(this.zoom / 100, this.zoom / 100);
            ctx.drawImage(this.image, -imgDims.width / 2, -imgDims.height / 2, imgDims.width, imgDims.height);
            ctx.restore();

        }
        else
        {
            if(this.detectedFileType == 'image/svg+xml')
            {
                const imgDims = calculateAspectRatioFit(this.image.naturalWidth, this.image.naturalHeight, printWidth, printHeight);
                canvas.width = imgDims.width;
                canvas.height = imgDims.height;
            }
            else
            {
                canvas.width = this.image.naturalWidth;
                canvas.height = this.image.naturalHeight;    
            }

            ctx.drawImage(this.image, 0, 0);

        }

        return canvas;

    }

    
    // PRIVATE METHODS


    _insertHTML()
    {
        const div = document.createElement('div');
        div.setAttribute('class', this.type);
        div.self = this;
        this.root.prepend(div);
        this.div = div;

        div.innerHTML = `
            <img class="visibility" src="${C3D_SERVER}svg/visibility.svg?c3d=0.5.0" alt="Icon" style="opacity:1;width: 12px;">
            <canvas class="thumbnail" oncontextmenu="return false;"></canvas>
            <div style="width:100%;"></div>
            <img src="${C3D_SERVER}svg/opacity.svg?c3d=0.5.0" alt="Icon" title="${this.c3d.lang['opacity']}" class="opacity">
            <img src="${C3D_SERVER}svg/blend_modes.svg?c3d=0.5.0" alt="Icon" title="${this.c3d.lang['blend-modes']}" class="blend-modes">
            <img src="${C3D_SERVER}svg/delete-bin.svg?c3d=0.5.0" title="${this.c3d.lang['delete-layer']}" class="remove">
        `;

        // CANVAS

        div.querySelector('canvas.thumbnail').addEventListener('click', () =>
        {
            this.c3d.imageLayer.show(this);
        });        

        if(this.changeable) {
            div.querySelector('canvas.thumbnail').click();
        } else {
            this.div.style.display = 'none';
        }

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
            if(this.input) this.input.remove();
            div.remove();
            URL.revokeObjectURL(this.image);
            this.c3d.imageLayer.hide();
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

        // DRAW IMAGE

        if(this.changeable) applyFilter(this.c3d, this, 'imageLayer');

    }
}
