export const addOpacityControls = (c3d, layer, button) =>
{

    const div = document.createElement('div');
    div.innerHTML = `
        <div class="inputPercent" title="%">
            <input type="number" value="${layer.opacity}" style="display:block; width:50px; padding:0.25rem; margin-bottom: 0.5rem; font-size: 0.65rem;">
        </div>
        <input type="range" min="0" max="100" value="${layer.opacity}" style="display:block; width:50px;">
    `;
    const inputNumber = div.querySelector('input[type="number"');
    const inputRange = div.querySelector('input[type="range"');
    const update = async (value) =>
    {
        const layerType = button.parentNode.self.type;

        let val = parseInt(value || inputNumber.value);
        if(val < 0 || val > 100) val = 100;
        inputNumber.value = val;
        inputRange.value = val;
        layer.opacity = val;
        
        switch (layerType)
        {
            case 'solid':

                layer.updatePreview();

            break;

            case 'text':

                c3d.textLayer.show(layer);

            break;

            case 'image':
            case 'gradient':

                c3d.imageLayer.show(layer);
                
            break;

            case 'shape':

                c3d.shapeLayer.show(layer);

            break;

            default:

                console.warn("Unknown Layer Type!");
                
            break;
        }
    };

    div.addEventListener('keydown', (e) =>
    {
        if(e.key == 'Enter')
        {
            update();
            c3d.contextMenu.hide();
        }
    });

    button.addEventListener('click', () =>
    {
        c3d.contextMenu.setWidth('fit-content');
        c3d.contextMenu.setHTMLObj(div);
        c3d.contextMenu.show(button);
    });

    inputNumber.addEventListener('input', (e) => 
    {
        update(e.currentTarget.value);
    });

    inputNumber.addEventListener('focus', (e) => 
    {
        e.currentTarget.select();
    });

    inputRange.addEventListener('input', (e) => 
    {
        update(e.currentTarget.value);
    });


    return div;

};
