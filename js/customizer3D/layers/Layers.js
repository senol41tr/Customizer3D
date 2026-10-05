import {Image} from 'customizer3D_dir/layers/types/Image.js?c3d=0.5.0';
import {Solid} from 'customizer3D_dir/layers/types/Solid.js?c3d=0.5.0';
import {Text} from 'customizer3D_dir/layers/types/Text.js?c3d=0.5.0';
import {Shape} from 'customizer3D_dir/layers/types/Shape.js?c3d=0.5.0';

export class Layers
{
    constructor(c3d)
    {
        this.c3d = c3d;
    }

    async addImage(root, data = {})
    {
        return new Image(root, this.c3d, data);
    }

    async addSolid(root, data = {})
    {
        const layer = new Solid(root, this.c3d, data);
        this.c3d._setNavActive(layer.name, false);

        return layer;
    }

    async addText(root, data = {})
    {
        const layer = new Text(root, this.c3d, data);
        await this.c3d.textLayer.show(layer);
        this.c3d._setNavActive(layer.name, false);

        return layer;
    }

    async addShape(root, data = {})
    {
        const layer = new Shape(root, this.c3d, data);
        layer._init();
        this.c3d.shapeLayer.show(layer);
        this.c3d._setNavActive(layer.name, false);
        layer.updateCanvas();

        return layer;
    }
    
}
