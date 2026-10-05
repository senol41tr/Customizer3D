export const BlendModes = 
{
    normal:         {canvas: 'normal',          label: 'Normal'},
    multiply:       {canvas: 'multiply',        label: 'Multiply'},
    screen:         {canvas: 'screen',          label: 'Screen'},
    overlay:        {canvas: 'overlay',         label: 'Overlay'},
    darken:         {canvas: 'darken',          label: 'Darken'},
    lighten:        {canvas: 'lighten',         label: 'Lighten'},
    lighter:        {canvas: 'lighter',         label: 'Lighter'},
    colorDodge:     {canvas: 'color-dodge',     label: 'Color Dodge'},
    colorBurn:      {canvas: 'color-burn',      label: 'Color Burn'},
    hardLight:      {canvas: 'hard-light',      label: 'Hard Light'},
    softLight:      {canvas: 'soft-light',      label: 'Soft Light'},
    difference:     {canvas: 'difference',      label: 'Difference'},
    exclusion:      {canvas: 'exclusion',       label: 'Exclusion'},
    sourceOver:     {canvas: 'source-over',     label: 'Source Over'},
    sourceIn:       {canvas: 'source-in',       label: 'Source In'},
    sourceOut:      {canvas: 'source-out',      label: 'Source Out'},
    sourceAtop:     {canvas: 'source-atop',     label: 'Source Atop'},
    destinationOver:{canvas: 'destination-over',label: 'Destination Over'},
    destinationIn:  {canvas: 'destination-in',  label: 'Destination In'},
    destinationOut: {canvas: 'destination-out', label: 'Destination Out'},
    destinationAtop:{canvas: 'destination-atop',label: 'Destination Atop'},
    xor:            {canvas: 'xor',             label: 'XOR'}
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

    const blendModes = Object.entries(BlendModes);
    
    for (let i = 0; i < blendModes.length; i++)
    {
        const blendMode = blendModes[i];
        const p = document.createElement('p');
        p.dataset.blendMode = blendMode[1].canvas;
        p.innerText = blendMode[1].label;

        p.addEventListener('mouseover', () =>
        {
            layer.blendMode = blendMode[1].canvas;
            
            root.style.display = 'block';
            root.querySelector('p.active').classList.remove('active');
            p.classList.add('active');

            c3d.render3d.renderView(layer.name);
            c3d.render2d.renderView(layer.name);
        });

        p.addEventListener('click', () =>
        {
            c3d.contextMenu.hide();
        });

        root.appendChild(p);
    }

};
