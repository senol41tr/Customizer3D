import {Image} from 'customizer3D_dir/layers/types/Image.js?c3d=0.6.1';
import {Solid} from 'customizer3D_dir/layers/types/Solid.js?c3d=0.6.1';
import {Text} from 'customizer3D_dir/layers/types/Text.js?c3d=0.6.1';
import {Shape} from 'customizer3D_dir/layers/types/Shape.js?c3d=0.6.1';
import {ThreeDText} from 'customizer3D_dir/layers/types/ThreeDText.js?c3d=0.6.1';
import {ThreeDLogo} from 'customizer3D_dir/layers/types/ThreeDLogo.js?c3d=0.6.1';

export class Layers
{
    constructor(c3d)
    {
        this.c3d = c3d;
    }

    async addImage(root, data = {})
    {
        const layer = new Image(root, this.c3d, data);
        this.c3d.imageLayer.show(layer);
        layer.updateCanvas();
        // this.c3d.imageLayer.updatePreview(false, false);
        return layer;
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
        layer.updateCanvas();
        this.c3d._setNavActive(layer.name, false, false);

        return layer;
    }

    async addShape(root, data = {})
    {
        const layer = new Shape(root, this.c3d, data);
        layer._init();
        this.c3d.shapeLayer.show(layer);
        this.c3d._setNavActive(layer.name, false, false);

        return layer;
    }

    async addThreeDText(root, data = {})
    {
        const layer = new ThreeDText(root, this.c3d, data);
        const l = this.c3d.threeDTextLayer;

        l.show(layer);

        if(data.options?.material)
        {
            l.showGUI();
            l._create();

            if(data.options?.materialOptions?.matcap)
            {
                const tex = await l.textureLoader.loadAsync(data.options.materialOptions.matcap);
                layer.__matcap = tex;
                l.mesh.material.matcap = tex;
                l.mesh.material.needsUpdate = true;
            }

            l.bakeImageToLayer();
        }

        // this.c3d.threeDTextLayer.updatePreview(false, false);
        this.c3d._setNavActive(layer.name, false, false);
        
        return layer;
    }

    async addThreeDLogo(root, data = {})
    {
        const layer = new ThreeDLogo(root, this.c3d, data);
        const l = this.c3d.threeDLogoLayer;

        l.layer = layer;

        if(data.image) await l.loadSVGString();

        if(data.options?.material)
        {
            l.showGUI();
            l._create();

            if(data.options?.materialOptions?.matcap)
            {
                const matcap = await l.textureLoader.loadAsync(C3D_SERVER + data.options.materialOptions.matcap);
                layer.__matcap = matcap;
                l.mesh.getObjectByName('SVGGroup').children.forEach((child) =>
                {
                    const mat = child.material;
                    if(mat.matcap?.isTexture) mat.matcap.dispose();
                    mat.matcap = matcap;
                    mat.needsUpdate = true;
                });
            }

            l.bakeImageToLayer();
        }

        // l.show(layer);
        this.c3d._setNavActive(layer.name, false, false);
        
        return layer;
    }
    
}
