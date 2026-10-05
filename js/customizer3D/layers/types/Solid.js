import ColorPicker from 'base/jscolorpicker/colorpicker.js?c3d=0.5.0';
import {BlendModes, createBlendModesList} from 'customizer3D_dir/layers/BlendModes/BlendModes.js?c3d=0.5.0';
import {addOpacityControls} from 'customizer3D_dir/layers/utils/addOpacityControls.js?c3d=0.5.0';

export class Solid
{
    constructor(root, c3d, data)
    {
        this.type = data.type || 'solid';

        this.root = root;
        this.c3d = c3d;

        this.color = data.color || '#eeff00';
        this.opacity = data.opacity || 100;
        this.blendMode = data.blendMode || BlendModes.normal.canvas;
        this.material = data.material;
        this.materialOptions = data.materialOptions;
        this.repeatX = data.repeatX;
        this.repeatY = data.repeatY;
        this.filters = data.filters || {};
        this.visible = typeof data.visible == 'boolean' ? data.visible : true;
        this.div = null;
        
        this._insertHTML();

    }

    get name()
    {
        return this.root.parentNode.parentNode.dataset.mesh;
    }

    update()
    {
        this.colorPicker.setColor(this.color);
    }

    _insertHTML()
    {
        const div = document.createElement('div');
        div.setAttribute('class', this.type);
        div.self = this;
        this.div = div;
        
        div.innerHTML = `
            <img class="visibility" src="${C3D_SERVER}svg/visibility.svg?c3d=0.5.0" alt="Icon" style="opacity:1;width: 12px;">
            <div class="color_picker"></div>
            <div style="width:100%;"></div>
            <img src="${C3D_SERVER}svg/opacity.svg?c3d=0.5.0" alt="Icon" title="${this.c3d.lang['opacity']}" class="opacity">
            <img src="${C3D_SERVER}svg/blend_modes.svg?c3d=0.5.0" alt="Icon" title="${this.c3d.lang['blend-modes']}" class="blend-modes">
            <img src="${C3D_SERVER}svg/delete-bin.svg?c3d=0.5.0" alt="Icon" title="${this.c3d.lang['delete-layer']}" class="delete-layer">
        `;

        if(this.type == 'colorOnly')
        {
            div.querySelector('img.opacity').style.display = 
            div.querySelector('img.blend-modes').style.display = 
            div.querySelector('img.visibility').style.display = 
            div.querySelector('img.delete-layer').style.display = 'none';
        }

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
            this._updatePreview();
        });

        if(this.type == 'colorOnly') {
            div.querySelector('div.color_picker').style.cssText = 'min-width: auto;width: 100%;max-height: unset;height: 20px;';
        }


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

        div.querySelector('img.delete-layer').addEventListener('click', () => {
            div.remove();
            this._updatePreview();
        });


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

        //
        
        if(this.root.__C3D_Sortable)
        {
            this.root.__C3D_Sortable.addElement(div.querySelector('div.color_picker'));
        }

        this.root.prepend(div);
        this._updatePreview();
    }

    _updatePreview()
    {
        this.c3d.render3d.renderView(this.name);
        this.c3d.render2d.renderView(this.name);
    }

}
