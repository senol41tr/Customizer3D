import {Size} from 'customizer3D_dir/utils/Size.js?c3d=0.6.0';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.6.0';

export const getPrintDims = (c3d, layer, DPI, isExport = false) =>
{
    let width = c3d.settings.MIN_TEXTURE_SIZE, height = c3d.settings.MIN_TEXTURE_SIZE, originalSize = 'unknown';
    
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
            const limits = getLimits(c3d);
            
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

    return {width, height, originalSize};
}

export const getLimits = (c3d) =>
{
    const maxTextureSize = c3d.settings.MAX_GPU_TEXTURE_SIZE;
    const maxPrintSize = c3d.settings.MAX_PRINT_SIZE;

    return {display: maxTextureSize, print: maxPrintSize };
}

export const calculateDynamicDPI = (c3d, size, unit = 'px', maxDPI = 300) =>
{
    const limits = getLimits(c3d);
    const BASE_PIXELS = limits.display;
    const BASE_DPI = 72;
    const K = BASE_PIXELS * BASE_DPI;

    if (!size || size <= 0) {
        return BASE_DPI;
    }

    const u = String(unit).toLowerCase().trim();
    let pxSize = size;

    switch (u) {
        case 'in':
            pxSize = size * BASE_DPI;
            break;
        case 'cm':
            pxSize = (size / 2.54) * BASE_DPI;
            break;
        case 'mm':
            pxSize = (size / 25.4) * BASE_DPI;
            break;
        case 'px':
        default:
            pxSize = size;
            break;
    }
    let calculatedDPI = K / pxSize;
    if (maxDPI && maxDPI > 0) {
        calculatedDPI = Math.min(calculatedDPI, maxDPI);
    }

    return Math.round(calculatedDPI);
}