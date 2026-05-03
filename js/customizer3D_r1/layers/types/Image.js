import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js';
import {addOpacityControls} from 'customizer3D_dir/layers/utils/addOpacityControls.js';
import * as BlendModes from 'customizer3D_dir/layers/BlendModes/BlendModes.js';
import {ThreeD} from 'customizer3D_dir/layers/types/ThreeD.js';
import {ThreeDSVG} from 'customizer3D_dir/layers/types/ThreeDSVG.js';
import {Gradient} from 'customizer3D_dir/layers/types/Gradient.js';
import {Size} from 'customizer3D_dir/utils/Size.js';

export class Image
{
    constructor(root, c3d, data)
    {
        this.type = data.type || 'image';
        
        this.root = root;
        this.c3d = c3d;
        this.div = null;
        this.input = null;
        
        this.threeDSVGOptions = data.threeDSVG || null;
        this.threeDSVG = null;
        
        this.threeDOptions = data.threeD || {};
        this.threeD = null;

        this.gradientOptions = data.gradient || null;
        this.gradient = null;
        
        this.image = data.image || null;
        this.fileName = data.fileName || null;
        this.detectedFileType = data.detectedFileType || null;
        this.mimeType = data.mimeType || 'image/*, application/pdf';
        this.imagePosition = data.imagePosition || {x:0, y:0};
        this.rotation = data.rotation || 0;
        this.opacity = data.opacity || 100;
        this.zoom = data.zoom || 100;
        this.changeable = typeof data.changeable == 'boolean' ? data.changeable : true;
        this.material = data.material;
        this.materialOptions = data.materialOptions;
        this.repeatX = data.repeatX || 1;
        this.repeatY = data.repeatY || 1;
        this.uniforms = data.uniforms || {};
        this.blendMode = typeof data.blendMode == 'number' ? data.blendMode : 0;
        this.uniforms = data.uniforms || {};
        this.visible = typeof data.visible == 'boolean' ? data.visible : true;

        this._mesh = null;
        
    }

    // GETTERS

    get name()
    {
        return this.root.parentNode.parentNode.dataset.mesh;
    }

    get is3D()
    {
        return this.threeDSVG?.mesh || this.threeD?.mesh ? true : false;
    }


    // PUBLIC METHODS

    updateThumbnail()
    {
        const previewCanvas = this.c3d.imageLayer.htmlEl.querySelector('canvas.preview');
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

    converTo3D()
    {
        if(this.detectedFileType == 'image/svg+xml')
        {
            this.threeDSVG.show();
        }
        else if(this.detectedFileType == 'model/gltf-binary')
        {
            this.threeD.show();
        }
    }


    destroy()
    {
        // this.div.remove();
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
            <img class="visibility" src="${C3D_SERVER}svg/show.svg" alt="Icon" style="opacity:1;">
            <canvas class="thumbnail" oncontextmenu="return false;"></canvas>
            <div style="width:100%;"></div>
            <img src="${C3D_SERVER}svg/opacity.svg" alt="Icon" title="${this.c3d.lang['opacity']}" class="opacity">
            <img src="${C3D_SERVER}svg/blend_modes.svg" alt="Icon" title="${this.c3d.lang['blend-modes']}" class="blend-modes">
            <img src="${C3D_SERVER}svg/delete-bin.svg" title="${this.c3d.lang['delete-layer']}" class="remove">
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
            this.c3d.imageLayer.show(this);
            if(this.gradient) this.gradient.show();
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
            this.c3d.imageLayer.hide();
            if(this._mesh) this.c3d.render3d.removeLayer(this);
            this.c3d.three.render();
            if(this.gradient) this.gradient.destroy();
        });

        // ADD NEW MESH
        
        this.c3d.render3d.addImageLayer(this);


        // RENDER LAYER

        if(this.image && this.detectedFileType != 'model/gltf-binary')
        {
            this.c3d.render3d.renderImageLayer(this);
        }

        // EXTRUDE SVG

        if(this.detectedFileType == 'image/svg+xml')
        {
            this.threeDSVG = new ThreeDSVG(this.c3d, this);
            await this.threeDSVG.loadSVGString();

            if(this.threeDSVGOptions)
            {
                this.threeDSVG.show();
                this.threeDSVG.bakeImageToLayer();
                this.threeDSVG.hide();
            }
        }

        // 3D MODEL

        if(this.detectedFileType == 'model/gltf-binary')
        {
            this.threeD = new ThreeD(this.c3d, this);
            await this.threeD.loadGLB();
            this.threeD.show();

            if(this.threeDOptions)
            {
                this.threeD.bakeImageToLayer();
                this.threeD.hide();
            }
        }

        // GRADIENT

        if(this.type == 'gradient')
        {
            this.gradient = new Gradient(this.c3d, this);
            this.gradient.show();

            if(this.gradientOptions)
            {
                this.gradient.hide();
            }
        }

        // ADD TO SORTABLE LIST

        if(this.root.__C3D_Sortable)
        {
            this.root.__C3D_Sortable.addElement(thumbCanvas);
        }

        
        if (this.changeable || this.gradientOptions || this.gradient) thumbCanvas.click();
        else this.div.style.display = 'none';

        this.c3d.render3d.updateRenderOrder(this.name);
        
    }
}
