import {Image} from 'customizer3D_dir/layers/types/Image.js?c3d=101';
import {Solid} from 'customizer3D_dir/layers/types/Solid.js?c3d=101';
import {Text} from 'customizer3D_dir/layers/types/Text.js?c3d=101';
import {Shape} from 'customizer3D_dir/layers/types/Shape.js?c3d=101';

export class Layers
{
    constructor(c3d)
    {
        this.c3d = c3d;
    }

    async addImage(root, data = {})
    {
        if(!this.c3d.render3d.checkLayersLength(root.parentNode.parentNode.dataset.mesh)) return;
        const layer = new Image(root, this.c3d, data);
        await layer._init();

        this.c3d.imageLayer.show(layer);
        // this.c3d.imageLayer.hide();

        return layer;
    }

    async addSolid(root, data = {})
    {        
        if(!this.c3d.render3d.checkLayersLength(root.parentNode.parentNode.dataset.mesh)) return;
        const layer = new Solid(root, this.c3d, data);
        await layer._init();

        if(layer.type == 'colorOnly' || layer.type == 'color') return layer; 

        this.c3d.render3d.addSolidLayer(layer);
        this.c3d.render3d.renderSolidLayer(layer);
        layer.updatePreview();
        this.c3d.render3d.updateRenderOrder(layer.name);

        return layer;
    }

    async addText(root, data = {})
    {
        if(!this.c3d.render3d.checkLayersLength(root.parentNode.parentNode.dataset.mesh)) return;

        const layer = new Text(root, this.c3d, data);
        await layer._init();

        // this.c3d.render3d.addTextLayer(layer);
        this.c3d.textLayer.show(layer);
        // this.c3d.textLayer.hide();

        this.c3d.render3d.renderTextLayer(layer);
        this.c3d.render3d.updateRenderOrder(layer.name);
        this.c3d.three.render();

        return layer;
    }

    async addShape(root, data = {})
    {
        const layer = new Shape(root, this.c3d, data);
        await layer._init();

        return layer;
    }
    
}
