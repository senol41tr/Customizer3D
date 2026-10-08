import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=0.5.1';

export const applyFilter = (c3d, layer, layerName) =>
{
    if(!layer.image || !layer.canvas) return;
    
    try
    {
        const filters = Object.entries(layer.filters);
        const canvas = layer.canvas;
        const ctx = canvas.getContext('2d', {willReadFrequently: true});
        const printDims = getPrintDims(c3d, {name: layer.name}, c3d.settings.getRenderDPI());

        canvas.width = printDims.width;
        canvas.height = printDims.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(layer.image, 0, 0, canvas.width, canvas.height);

        const data = ctx.getImageData(0,0,canvas.width, canvas.height);

        for (let j = 0; j < filters.length; j++)
        {
            const filter = filters[j][0];
            const props = filters[j][1];
            
            JSManipulate[filter].filter(data, props);
        }
        ctx.putImageData(data,0,0);
        
        c3d[layerName].updatePreview();
    }
    catch (e)
    {
        alert("Filters.js:\n" + e);
        console.warn(e);
    }
};

export const createFiltersList = (c3d, root, layerName) =>
{
    const filters = Object.entries(JSManipulate);
    const layer = c3d[layerName].layer;

    root.innerHTML = '';
    
    for (let i = 0; i < filters.length; i++)
    {
        const filter = filters[i];
        const name = filter[0];
        const div = document.createElement('div');
        const checked = layer.filters[name] ? ' checked' : '';
        const propsVisibility = layer.filters[name] ? 'block' : 'none';

        div.style.cssText = 'display:flex; gap:0.25rem; white-space: nowrap;padding-bottom: 0.25rem;';

        let propsHTML = '';
        const props = Object.keys(JSManipulate[name].defaultValues);
        
        for (let j = 0; j < props.length; j++)
        {
            let value;
            const prop = props[j];
            if(layer.filters[name] && layer.filters[name][prop]) {
                value = layer.filters[name][prop];
            }
            else {
                value = JSManipulate[name].defaultValues[prop];
            }
            const minMax = JSManipulate[name].valueRanges[prop];
            const label = prop.substring(0,1).toUpperCase() + prop.substring(1);

            propsHTML += `
                <div>
                    <p style="font-size:0.65rem;">${label}</p>
                    <input type="range" min="${minMax.min}" max="${minMax.max}" value="${value}" step="${minMax.max / 100}" data-prop="${prop}" data-default-value="${JSManipulate[name].defaultValues[prop]}">
                </div>
            `;
        }
        
        div.innerHTML = `
            <div>
                <label style="display:flex; gap:0.25rem; align-items:center;">
                    <input type="checkbox" data-filter="${name}"${checked}>
                    ${filter[1].name}
                </label>
                <div class="props" style="display:${propsVisibility};padding-top:0.25rem;">${propsHTML}</div>
            </div>
        `;

        const propsDiv = div.querySelector('div.props');
        const checkbox = div.querySelector('input');
        const ranges = div.querySelectorAll('div.props input[type="range"]');

        if(ranges)
        {
            for (let z = 0; z < ranges.length; z++)
            {
                const range = ranges[z];

                range.addEventListener('change', () =>
                {
                    layer.filters[name][range.dataset.prop] = range.value;
                    applyFilter(c3d, layer, layerName);
                });
                
            }
        }

        checkbox.addEventListener('change', (e) =>
        {
            propsDiv.style.display = checkbox.checked ? 'block' : 'none';

            if(checkbox.checked) {
                layer.filters[name] = {};
            }
            else {
                delete layer.filters[name];
                for (let z = 0; z < ranges.length; z++)
                {
                    const range = ranges[z];
                    range.value = range.dataset.defaultValue;                    
                }
            }
            applyFilter(c3d, layer, layerName);
        });

        root.appendChild(div);
    }

};
