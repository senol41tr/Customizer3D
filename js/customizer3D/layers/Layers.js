import {Image} from 'customizer3D_dir/layers/types/Image.js?c3d=0.5.5';
import {Solid} from 'customizer3D_dir/layers/types/Solid.js?c3d=0.5.5';
import {Text} from 'customizer3D_dir/layers/types/Text.js?c3d=0.5.5';
import {Shape} from 'customizer3D_dir/layers/types/Shape.js?c3d=0.5.5';
import {ThreeDText} from 'customizer3D_dir/layers/types/ThreeDText.js?c3d=0.5.5';

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
        this.c3d._setNavActive(layer.name, false, false); // update css maxHeight

        return layer;
    }

    async addText(root, data = {})
    {
        const layer = new Text(root, this.c3d, data);
        await this.c3d.textLayer.show(layer);
        this.c3d._setNavActive(layer.name, false, false);

        return layer;
    }

    async addShape(root, data = {})
    {
        const layer = new Shape(root, this.c3d, data);
        layer._init();
        this.c3d.shapeLayer.show(layer);
        layer.updateCanvas();
        this.c3d.shapeLayer.updatePreview();
        this.c3d._setNavActive(layer.name, false, false);

        return layer;
    }

    async addThreeDText(root, data = {})
    {
        const layer = new ThreeDText(root, this.c3d, data);
        this.c3d.threeDTextLayer.show(layer);
        this.c3d._setNavActive(layer.name, false, false);
        
        return layer;
    }
    
}
