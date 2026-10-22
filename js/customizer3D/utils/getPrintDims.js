import {Size} from 'customizer3D_dir/utils/Size.js?c3d=0.5.7';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.5.7';

export const MIN_TEXTURE_SIZE = 512;
export const MAX_TEXTURE_SIZE = 2048;
export const MAX_PRINT_SIZE = 5079; // mm

export const getPrintDims = (c3d, layer, DPI, isExport = false) =>
{
    let width = MIN_TEXTURE_SIZE, height = MIN_TEXTURE_SIZE, originalSize = 'unknown';
    
    if(c3d.props.data[layer.name] && c3d.props.data[layer.name].hasOwnProperty('printSize'))
    {
        originalSize = c3d.props.data[layer.name].printSize;
        width = new Size({size: originalSize.width, DPI:600}).px;
        height = new Size({size: originalSize.height, DPI:600}).px;

        if(!isExport)
        {               
            const newDims = calculateAspectRatioFit(width, height, window.screen.width, window.screen.height);
            const minMaxDPI = c3d.settings.getMinMaxDPI();
            const ratio = minMaxDPI.max / c3d.settings.getRenderDPI();
            
            newDims.width /= ratio;
            newDims.height /= ratio;
            
            width = newDims.width;
            height = newDims.height;
        }
        else
        {
            const limits = getLimits();
            
            if(width > limits.display || height > limits.display)
            {
                
                const newDims = calculateAspectRatioFit(width, height, limits.display, limits.display);
                width = newDims.width;
                height = newDims.height;
            }
        }
    }
    else if(c3d.props.data[layer.name]?.materials[0].hasOwnProperty('url'))
    {
        console.log("Print size is undefined! Layer: " + layer.name);
    }
    else
    {
        console.log("Print size is undefined! Layer: " + layer.name);
    }
// console.log(width, height);

    return {width, height, originalSize};
}

export const getLimits = () =>
{
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) alert('WebGL is not supported by the browser!');

    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || MAX_TEXTURE_SIZE;
    const maxPrintSize = MAX_PRINT_SIZE;

    return {display: maxTextureSize, print: maxPrintSize };
}
