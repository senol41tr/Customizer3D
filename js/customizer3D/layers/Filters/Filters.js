export const applyFilters = (c3d, layer, layerName, isExport) =>
{
    if(!layer.canvas) return;
    const filtersCount = Object.keys(layer.filters).length;
    if(filtersCount == 0) return;

    layer.canvas.width = layer.image.width;
    layer.canvas.height = layer.image.height;

    const ctx = layer.canvas.getContext('2d', {willReadFrequently: true});
    layer.updateCanvas(isExport);

    const filters = Object.entries(layer.filters);

    if(filters.length > 0)
    {
        const data = ctx.getImageData(0,0,layer.canvas.width, layer.canvas.height);

        for (let j = 0; j < filters.length; j++)
        {
            const filter = filters[j][0];
            const props = filters[j][1];
            
            JSManipulate[filter].filter(data, props);
        }
        ctx.putImageData(data,0,0);

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
                <label style="gap:0.25rem; flex-direction:row;">
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
                    applyFilters(c3d, layer, layerName);
                    c3d[layerName].updatePreview();
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
            applyFilters(c3d, layer, layerName);
            c3d[layerName].updatePreview();
        });

        root.appendChild(div);
    }

};
