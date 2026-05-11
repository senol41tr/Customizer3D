import * as Materials from 'customizer3D_dir/three/materials/Materials.js?c3d=101';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=101';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=101';

export const GPUInfo = async (c3d, container) =>
{
    const ua = navigator.userAgent;
    // const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

    const limits = _getHardwareLimits();
    // const maxUniformVectors = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
    // const gpuInfo = gl.getExtension('WEBGL_debug_renderer_info') ? gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL) : "Unknown GPU";

    const infos =
    {
        textureSize: limits.defaultRes,//_getIdealTextureSize(gl.getParameter(gl.MAX_TEXTURE_SIZE)),
        maxTextureSize: limits.maxRes, //gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxLayers: limits.maxLayers //gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS)
    };


    // HTML STUFF

    const div = document.createElement('div');
    div.classList.add('GPUInfo');

    let html = `
        <div class="title">
            <img src="${C3D_SERVER}svg/plus.svg?c3d=101" alt="Icon" class="icon">
            <p>${c3d.lang['render-quality']}</p>
        </div>
        <div class="content">
    `;

    const maxLayers = _calculateMaxLayers(c3d, infos.textureSize, infos.textureSize);
    html += `<p class="maxLayers" style="padding-top:0.75rem;">Max Layers per Slot<br><span style="font-size:1.2rem;">${maxLayers}</span></p>`;

    const onInput = (e) =>
    { 
        const range = e.currentTarget;
        range.parentNode.querySelector('p.textureSize').innerText = 'Texture Size: ' + range.value + ' px';
        
        // disable UI during processing
        c3d.preloader.show();
        c3d.preloader.set('Processing...');
        c3d.showHideUI.hide();
    };

    const onChange = (e) =>
    {
        const range = e.currentTarget;
        const meshName = range.dataset.mesh_name;
        const renderer = c3d.glbScene.getObjectByName(meshName);

        try
        {
            if(!renderer)
            {
                console.warn('Renderer not found!');
                throw new Error('Can\'t find renderer!');
            }

            renderer.material = Materials.setMainMaterial(c3d, renderer);
            c3d.render3d.renderView(meshName);

            range.parentNode.querySelector('p.textureSize').innerText = 'Texture Size: ' + range.value + ' px';
        }
        catch(e)
        {
            alert("Unable to resize Texture!\n" + e);
        }

        // Enable UI
        c3d.preloader.hide();
        c3d.showHideUI.show();
        c3d.three.render();
    };

    let renderQuality = c3d.localStorage.get('renderQuality');

    if(!renderQuality) renderQuality = 1;

    html += `
        <div style="padding-bottom:0.5rem;">
            <div>
                <p class="sub_title">${c3d.lang['render-quality']}</p>
                <div style="display:flex; gap:0.3rem; align-items:center;padding-top:0.5rem;">
                    <span>Min.</span>
                    <input type="range" min="0" max="2" value="${renderQuality}" step="1" title="${c3d.lang['render-quality']}" class="renderQuality">
                    <span>Max.</span>
                </div>
            </div>
        </div>
        <div style="padding-bottom:0.5rem;">
            <a href="javascript:void(0);" class="renderQualityEachSlot">${c3d.lang['render-quality-each-slot']}</a>
        </div>
    `;

    const meshNames = Object.keys(c3d.props.data);

    html += '<div style="display:none;" class="slots">';

    for (let i = 0; i < meshNames.length; i++)
    {
        const meshName = meshNames[i];
        const label = c3d.props.data[meshName]?.label || meshName;
        const materials = c3d.props.data[meshName]?.materials || [];
        const printSize = c3d.props.data[meshName]?.printSize;
                
        if(!printSize || typeof materials[0]?.material == 'string') continue;

        html += `
            <div style="padding-bottom:0.5rem;">
                <div>
                    <p class="sub_title">${label}</p>
                    <input type="range" title="${c3d.lang['render-quality']}" data-mesh_name="${meshName}">
                    <p class="textureSize" style="padding-top:0.25rem;"></p>
                </div>
            </div>
        `;
    }
    html += '</div>';

    html += '</div>';

    div.innerHTML = html;


    // check if model has only color, url or colorOnly material
    const textureSize = div.querySelector('p.textureSize');
    if(!textureSize)
    {
        div.style.opacity = 0.5;
        div.style.pointerEvents = 'none';
    }


    const renderQualityEachSlot = div.querySelector('a.renderQualityEachSlot');
    renderQualityEachSlot.addEventListener('click', () =>
    {
        const slots = renderQualityEachSlot.parentNode.nextElementSibling;
        const isVisible = slots.style.display == '' || slots.style.display == 'block' ? true : false;
        slots.style.display = isVisible ? 'none' : 'block';
        
        const title = div.querySelector('div.title');
        title.click(); title.click(); // !!!
    });


    const ranges = div.querySelectorAll('input[type="range"]:not(.renderQuality)');

    const renderQualityRange = div.querySelector('input[type="range"].renderQuality');
    
    renderQualityRange.addEventListener('input', () =>
    {
        // disable UI during processing
        c3d.preloader.show();
        c3d.preloader.set('Processing...');
        c3d.showHideUI.hide();
    });

    renderQualityRange.addEventListener('change', () =>
    {
        ranges.forEach(range =>
        {
            let value = range.value;

            switch (parseInt(renderQualityRange.value))
            {
                case 0: value = range.min; break;
                case 1: value = range.max / 2; break;
                case 2: value = range.max; break;
            }

            range.value = value;
            c3d.localStorage.set('renderQuality', renderQualityRange.value);
            range.dispatchEvent(new Event('change'));

        });

        // Enable UI
        c3d.preloader.hide();
        c3d.showHideUI.show();
        
    });

    ranges.forEach(range =>
    {
        const {width, height} = getPrintDims(c3d, range.dataset.mesh_name, 72);
        const size = _calculateOptimalTextureSize(width, height, ranges.length);
        const textureSize = Math.max(size.width, size.height);

        range.max = textureSize;
        range.min = isMobile ? 256 : 512;
        range.step = 128;

        let renderQualityVal;
        switch (c3d.localStorage.get('renderQuality'))
        {
            case '0': renderQualityVal = range.min; break;
            case '1': renderQualityVal = range.max / 2; break;
            case '2': renderQualityVal = range.max; break;
            default: renderQualityVal = range.max / 1.5; break;
        }

        range.value = renderQualityVal;
        

        range.parentNode.querySelector('p.textureSize').innerHTML = `Texture Size: ${range.value} px`;

        range.addEventListener('input', onInput);
        range.addEventListener('change', onChange);
    });

    container.appendChild(div);
}

export const getTexureSize = (c3d, name) =>
{
    const settings = document.querySelector(c3d.props.settings);
    const GPUInfoDiv = settings.querySelector('div.GPUInfo');
    const range = GPUInfoDiv.querySelector('[data-mesh_name="' + name + '"]');
    const textureSize = parseInt(range.value);
    const printDims = getPrintDims(c3d, name, 72);
    const dims = calculateAspectRatioFit(printDims.width, printDims.height, textureSize, textureSize);
    
    dims.width = Math.round(dims.width);
    dims.height = Math.round(dims.height);
    
    return dims;
}


export const getMaxLayers = (c3d) =>
{
    const infos = _getHardwareLimits();
    return infos.maxLayers;
}


const _getHardwareLimits = () =>
{
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

    let maxRes = 1536;
    let defaultRes = 1536;
    let maxLayers = _calculateMaxLayers(null, defaultRes, defaultRes); 

    if (isIOS)
    {
        maxRes = 1536;
        defaultRes = 1024;
        maxLayers = _calculateMaxLayers(null, defaultRes, defaultRes);
    }
    else if (isMobile)
    {
        maxRes = 1536;
        defaultRes = 1024;
        maxLayers = _calculateMaxLayers(null, defaultRes, defaultRes);
    }

    // const canvas = document.createElement('canvas');
    // const gl = canvas.getContext('webgl2');

    // if (!gl) alert("WebGL 2 not supported!");

    return { maxLayers, maxRes, defaultRes };
};


const _calculateMaxLayers = (c3d, width, height) =>
{
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

    let maxLayers = 36; 

    if (isIOS) maxLayers = 24;
    else if (isMobile) maxLayers = 24;

    return maxLayers;

    // console.log("Mem. Limit: " + (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + " MB");
    // console.log("Used: " + (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + " MB");

    // const texureSize = getTexureSize(c3d, 'front');
    // console.log(texureSize);
    
    // const limitMB = 512;
    // const singleLayerByte = width * height * 4;
    // const limitByte = limitMB * 1024 * 1024;
    // const maxLayers = Math.floor(limitByte / singleLayerByte);
    
    // return Math.max(1, maxLayers);

};

const _calculateOptimalTextureSize = (planeWidth, planeHeight, layerCount = 1) => {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

    let basePPB = 4;

    if (isIOS) basePPB = 2;
    else if (isMobile) basePPB = 2.5;

    let layerPenalty = 1.0;
    if (layerCount > 5) {

        layerPenalty = Math.max(0.5, 1.0 - (layerCount - 5) * 0.03);
    }

    const pixelsPerUnit = basePPB * layerPenalty;

    let targetWidth = planeWidth * pixelsPerUnit;
    let targetHeight = planeHeight * pixelsPerUnit;

    const maxLimit = (isMobile || isIOS) ? 2048 : 2560;

    let potSizes = [];
    for (let i = 1; i <= 16; i++) {
        let size = 128 * i;
        if (size <= maxLimit) potSizes.push(size);
    }

    const findNearestPOT = (size) => {
        return potSizes.reduce((prev, curr) => 
            Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev
        );
    };

    return {
        width: findNearestPOT(targetWidth),
        height: findNearestPOT(targetHeight),
        currentPPU: pixelsPerUnit 

    };
};