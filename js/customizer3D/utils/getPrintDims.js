import {Size} from 'customizer3D_dir/utils/Size.js?c3d=0.5.5';

export const getPrintDims = (c3d, layer, DPI, unit = 'px') =>
{
    let width = 1024, height = 1024, originalSize = 'unknown';
    
    if(c3d.props.data[layer.name] && c3d.props.data[layer.name].hasOwnProperty('printSize'))
    {
        originalSize = c3d.props.data[layer.name].printSize;
        width = new Size({size: originalSize.width, DPI})[unit];
        height = new Size({size: originalSize.height, DPI})[unit];
    }
    else if(c3d.props.data[layer.name]?.materials[0].hasOwnProperty('url'))
    {
        console.log("Print size is undefined! Layer: " + layer.name);
    }
    else
    {
        console.log("Print size is undefined! Layer: " + layer.name);
    }

    return {width, height, originalSize};
}
