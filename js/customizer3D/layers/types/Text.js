import {addOpacityControls} from 'customizer3D_dir/layers/utils/addOpacityControls.js?c3d=104';
import * as BlendModes from 'customizer3D_dir/layers/BlendModes/BlendModes.js?c3d=104';
import {ThreeDText} from 'customizer3D_dir/layers/types/ThreeDText.js?c3d=104';

export class Text
{
    constructor(root, c3d, data)
    {
        this.type = 'text';
        
        this.root = root;
        this.c3d = c3d;
        this.div = null;

        this.threeDTextOptions = data.threeDText || null;
        this.threeDText = null;

        this.text = data.text || 'Lorem';
        this.textPosition = data.textPosition || {x:0, y:0};
        this.font = data.font || 'ScotchDisplay-SemiBold';
        this.fontSize = data.fontSize ? parseFloat(data.fontSize) : 50;
        this.color = data.color || null;
        this.opacity = data.opacity || 100;
        this.rotation = data.rotation || 0;
        this.zoom = data.zoom || 100;
        this.material = data.material;
        this.materialOptions = data.materialOptions;
        this.repeatX = data.repeatX || 1;
        this.repeatY = data.repeatY || 1;
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
        return this.threeDText?.mesh ? true : false;
    }

    // PUBLIC METHODS

    setText(text)
    {
        if(text == '') text = this.c3d.lang['text'];
        this.div.querySelector('p.title').innerText = text;
    }

    converTo3D()
    {
        if(!this.is3D) this.threeDText = new ThreeDText(this.c3d, this);
        this.threeDText.show();
    }
    

    // PRIVATE METHODS

    async _init()
    {
        const div = document.createElement('div');
        div.setAttribute('class', this.type);
        this.root.prepend(div);

        div.self = this;
        this.div = div;

        div.innerHTML = `
            <img class="visibility" src="${C3D_SERVER}svg/show.svg?c3d=104" alt="Icon" style="opacity:1;">
            <p class="title">${this.c3d.lang['text']}</p>
            <img src="${C3D_SERVER}svg/opacity.svg?c3d=104" alt="Icon" title="${this.c3d.lang['opacity']}" class="opacity">
            <img src="${C3D_SERVER}svg/blend_modes.svg?c3d=104" alt="Icon" title="${this.c3d.lang['blend-modes']}" class="blend-modes">
            <img src="${C3D_SERVER}svg/delete-bin.svg?c3d=104" title="${this.c3d.lang['delete-layer']}" class="delete-layer">
        `;

        div.querySelector('p.title').addEventListener('click', () => {
            this.c3d.textLayer.show(this);
        });


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

        // OPACITY

        addOpacityControls(this.c3d, this, div.querySelector('img.opacity'));

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
            this.c3d.textLayer.hide();
            this.c3d.render3d.removeLayer(this);
            this.c3d.three.render();
        });
        
        // ADD NEW MESH
        this.c3d.render3d.addTextLayer(this);  
        
        //
        if(this.threeDTextOptions)
        {
            this.converTo3D();
            this.threeDText.bakeTextToLayer();
            this.threeDText.hide();
        }
        
        //
        if(this.root.__C3D_Sortable)
        {
            this.root.__C3D_Sortable.addElement(div.querySelector('p.title'));
        }

    }

}
