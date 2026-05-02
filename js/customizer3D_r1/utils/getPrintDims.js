import {Size} from 'customizer3D_dir/utils/Size.js';

export const getPrintDims = (c3d, layer, DPI) =>
{
    // parse print dims.
    let width, height, originalSize;

    if(typeof layer == 'string') layer = {name: layer}; // !!!
    
    if(c3d.props.data[layer.name] && c3d.props.data[layer.name].hasOwnProperty('printSize'))
    {
        originalSize = c3d.props.data[layer.name].printSize;
        width = new Size({size: originalSize.width, DPI}).px;
        height = new Size({size: originalSize.height, DPI}).px;
    }
    else // !!!
    {
        // const mesh = c3d.glbScene.getObjectByName(layer.name);
        // const options = {mesh, DPI, scale: mesh.scale, camera: c3d.three.camera, renderer: c3d.three.renderer};
        // const dims = Size.meshDims(mesh, false);        
        // options.size = dims.width;
        // width = new Size(options, true).px.width;
        // options.size = dims.height;
        // height = new Size(options, true).px.height;
        // originalSize = {width: width + 'px', height: height + 'px'};

        console.warn('unknown printSize!');
    }

    return {width, height, originalSize};
}
