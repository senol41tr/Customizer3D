
export const names = 
{
    normal:     {value: 0,  label: 'Normal', pdf: 'Normal'},
    multiply:   {value: 1,  label: 'Multiply', pdf: 'Multiply'},
    screen:     {value: 2,  label: 'Screen', pdf: 'Screen'},
    overlay:    {value: 3,  label: 'Overlay', pdf: 'Overlay'},
    darken:     {value: 4,  label: 'Darken', pdf: 'Darken'},
    lighten:    {value: 5,  label: 'Lighten', pdf: 'Lighten' },
    colorDodge: {value: 6,  label: 'Color Dodge', pdf: 'ColorDodge'},
    colorBurn:  {value: 7,  label: 'Color Burn', pdf: 'ColorBurn' },
    hardLight:  {value: 8,  label: 'Hard Light', pdf: 'HardLight' },
    softLight:  {value: 9,  label: 'Soft Light', pdf: 'SoftLight' },
    difference: {value: 10, label: 'Difference', pdf: 'Difference' },
    exclusion:  {value: 11, label: 'Exclusion', pdf: 'Exclusion'},
    hue:        {value: 12, label: 'HUE', pdf: 'Hue'},
    saturation: {value: 13, label: 'Saturation', pdf: 'Saturation' },
    color:      {value: 14, label: 'Color', pdf: 'Color'},
    luminosity: {value: 15, label: 'Luminosity', pdf: 'Luminosity'}
};

export const createBlendModesList = (c3d, root, layer, button) =>
{
    button.addEventListener('click', () =>
    {
        const ps = root.querySelectorAll('p');

        for (let j = 0; j < ps.length; j++)
        {
            const p = ps[j]; 
                               
            if(layer.blendMode == p.dataset.blendMode)
            {
                p.classList.add('active');
            }
            else
            {
                p.classList.remove('active');
            }
        }
    });

    const blendModes = Object.entries(names);
    
    for (let i = 0; i < blendModes.length; i++)
    {
        const blendMode = blendModes[i];
        const p = document.createElement('p');
        p.dataset.blendMode = blendMode[1].value;
        p.innerText = blendMode[1].label;

        const handler = () =>
        {
            layer.blendMode = blendMode[1].value;
            
            const active = root.querySelector('p.active');
            if(active) active.classList.remove('active');
            p.classList.add('active');

            const layerMeshUniforms = c3d.glbScene.getObjectByName(layer.name).material.uniforms;
            const index = layer._mesh.userData.index;
            const PARAMS_PER_LAYER = 5;
            const data = layerMeshUniforms.uData.value.image.data;
            const offset = index * PARAMS_PER_LAYER * 4;
            data[offset + 18] = parseFloat(layer.blendMode);
            layerMeshUniforms.uData.value.needsUpdate = true;

            c3d.three.render();
        };

        p.addEventListener('click', () => {
            handler();
            c3d.contextMenu.hide();
        });
        p.addEventListener('mouseover', handler);

        root.appendChild(p);
    }

}

export const getName = (value) =>
{
    const data = Object.entries(names);
    
    for (let i = 0; i < data.length; i++)
    {
        const blendMode = data[i][1];
        if(blendMode.value == value) return blendMode.pdf;
    }

    return 'Normal';
}