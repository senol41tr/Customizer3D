import * as THREE from 'three';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=0.5.5';
import {drawLayerToCTX} from 'customizer3D_dir/layers//utils/drawLayerToCTX.js';

export class Render3D
{
    constructor(c3d)
    {
        this.c3d = c3d;

        this._preDPI = c3d.settings.getRenderDPI();
    }

    renderView(side)
    {
        const layersDiv = document.querySelector(this.c3d.props.layers);
        const layers = layersDiv.querySelectorAll('[data-mesh=\'' + side + '\'] > div.content > div.layers > div');
        const msh = this.c3d.glbScene.getObjectByName(side);

        const groupName = side + '_group';

        let newMsh;
        
        // remove layer (material) group
        let group = this.c3d.glbScene.getObjectByName(groupName);
        if(group)
        {
            group.clear();
            this.c3d.glbScene.remove(group);
        }

        if(layers.length > 0)
        {
            group = new THREE.Group();
            group.name = groupName;
            this.c3d.glbScene.add(group);
            msh.visible = false;
        }
        else if(msh)
        {
            msh.visible = true;
        }

        if(layers.length == 0 || !msh) return;
        
        newMsh = msh.clone();
        newMsh.visible = true;
        newMsh.name = side;
        group.add(newMsh);
        
        const printDims = getPrintDims(this.c3d, {name: side}, this.c3d.settings.getRenderDPI());
        const canvas = document.createElement('canvas');
        
        canvas.width = printDims.width;
        canvas.height = printDims.height;

        const texture = new THREE.CanvasTexture(canvas);
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;
        // texture.minFilter = texture.magFilter = THREE.NearestFilter;

        let material, color, materialOptions;

        for (let i = layers.length - 1; i >= 0; i--)
        {



            const layer = layers[i].self;

            // disable first layer blendmode
            const blendModesButton = layer.div.querySelector('img.blend-modes');
            blendModesButton.style.opacity = i != layers.length - 1 ? 1 : 0.25;
            blendModesButton.style.pointerEvents = i != layers.length - 1 ? 'all' : 'none';            

            if(!layer.visible) continue;

            material = layer.material; // !!!
            materialOptions = layer.materialOptions;
            
            if(layer.type == 'colorOnly')
            {
                material = layer.type;
                color = layer.color;
                break;
            }

            if(layer.repeatX || layer.repeatY)
            {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.offset.set(0, 0);
                texture.repeat.set(layer.repeatX, layer.repeatY);  
            }
            
            // draw image to canvas
            drawLayerToCTX(this.c3d, canvas, layer);

        }

        switch (material)
        {
            case 'colorOnly':

                newMsh.material.color = new THREE.Color(color);

            break;

            case 'MeshMatcapMaterial':

                if(newMsh.material.matcap) newMsh.material.matcap.dispose();
                newMsh.material.matcap = texture;

            break;

            case 'MeshBasicMaterial': 
            case 'MeshLambertMaterial':  
            case 'MeshPhongMaterial': 
            case 'MeshStandardMaterial':  
            case 'MeshPhysicalMaterial': 

                if(newMsh.material.map) newMsh.material.map.dispose();
                newMsh.material.map = texture;

            break;

            default:

                if(newMsh.material.map) newMsh.material.map.dispose();
                newMsh.material = new THREE.MeshBasicMaterial({map: texture, transparent:true, alphaTest: 0.05});

            break;
        
        }

        this.c3d.three.render();
    }

    renderAll()
    {
        const data = Object.entries(this.c3d.props.data);

        for (let i = 0; i < data.length; i++)
        {
            const meshName = data[i][0];
            this.renderView(meshName);
        }
    }

}
