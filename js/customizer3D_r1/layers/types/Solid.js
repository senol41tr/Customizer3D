import * as THREE from 'three';
import ColorPicker from 'base/jscolorpicker/colorpicker.js?c3d=102';
import {addOpacityControls} from 'customizer3D_dir/layers/utils/addOpacityControls.js?c3d=102';
import * as BlendModes from 'customizer3D_dir/layers/BlendModes/BlendModes.js?c3d=102';

export class Solid
{
    constructor(root, c3d, data)
    {
        this.type = data.type || 'solid';

        this.root = root;
        this.c3d = c3d;

        this.div = null;
        this.color = data.color || '#e2f119';
        this.opacity = data.opacity || 100;
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

    // PUBLIC METHODS

    update()
    {
        this.colorPicker.setColor(this.color);
    }

    // PRIVATE METHODS

    async _init()
    {
        const div = document.createElement('div');
        div.setAttribute('class', this.type);
        div.self = this;
        this.div = div;
        
        div.innerHTML = `
            <img class="visibility" src="${C3D_SERVER}svg/show.svg?c3d=102" alt="Icon" style="opacity:1;">
            <div class="color_picker"></div>
            <img src="${C3D_SERVER}svg/opacity.svg?c3d=102" alt="Icon" title="${this.c3d.lang['opacity']}" class="opacity">
            <img src="${C3D_SERVER}svg/blend_modes.svg?c3d=102" alt="Icon" title="${this.c3d.lang['blend-modes']}" class="blend-modes">
            <img src="${C3D_SERVER}svg/delete-bin.svg?c3d=102" alt="Icon" title="${this.c3d.lang['delete-layer']}" class="delete-layer">
        `;

        if(this.type == 'color')
        {
            div.style.display = 'none';
            this.root.style.border = 'none';
        }
        else if(this.type == 'colorOnly')
        {
            this.root.style.border = 'none';
            div.querySelector('img.opacity').style.display = 
            div.querySelector('img.blend-modes').style.display = 
            div.querySelector('img.visibility').style.display = 
            div.querySelector('img.delete-layer').style.display = 'none';
        }


        // VISIBILITY

        div.querySelector('img.visibility').addEventListener('click', (e) =>
        {
            const img = e.currentTarget;
            const isHidden = parseFloat(img.style.opacity) == 1;

            img.style.opacity = isHidden ? 0.5 : 1;
            this.c3d.render3d.setVisibility(this, isHidden);
            this.visible = !isHidden;
            div.style.opacity = isHidden ? 0.5 : 1;

        });

        // COLOR PICKER

        this.colorPicker = new ColorPicker(div.querySelector('div.color_picker'), {
            color: this.color,
            submitMode: 'instant',
            enableEyedropper:true,
            enableAlpha:false,
            loadLocalSwatches:true,
            localStorage: this.c3d.localStorage,
            c3d: this.c3d
        });
        
        this.colorPicker.on('pick', (color) => {
            this.color = color.string('hex');
            this.updatePreview();
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

        div.querySelector('img.delete-layer').addEventListener('click', () => {
            div.remove();
            this.c3d.render3d.removeLayer(this);
            this.updatePreview();
            this.c3d.three.render();
        });

        // ADD TO LAYERS DIV
        
        this.root.prepend(div);

        //
        if(this.type == 'solid') this.c3d.render3d.renderSolidLayer(this);
        
        //
        if(this.root.__C3D_Sortable)
        {
            this.root.__C3D_Sortable.addElement(div.querySelector('div.color_picker'));
        }

    }

    updatePreview()
    {
        this._updateParams();
    }

    _updateParams()
    {
        if((this.type == 'colorOnly' || this.type == 'color') && this._mesh)
        {
            this._mesh.material.color = new THREE.Color(this.color);
            // this._mesh.material.needsUpdate = true;
        }
        else if(this._mesh)
        {
            const rendererUniforms = this.c3d.glbScene.getObjectByName(this.name).material.uniforms;

            const ro = this._mesh.userData.index;
            const ce = this.c3d.colorEngine;
            ce.hex(this.color, false);
            const c = new THREE.Color(ce.color);

            rendererUniforms.uTint.value[ro].set(c.r, c.g, c.b);
            rendererUniforms.uAlphas.value[ro] = this.opacity / 100;
            rendererUniforms.uTintAmount.value[ro] = this.opacity / 100;   
        }

        this.c3d.three.render();

    }

}
