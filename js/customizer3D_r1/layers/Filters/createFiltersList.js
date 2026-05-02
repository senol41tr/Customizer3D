import * as THREE from 'three';
import {uniforms2} from 'customizer3D_dir/three/materials/Shaders.js';

// container: ImageLayer or TextLayer
export const createFiltersList = (c3d, container, button) =>
{
    if(container.layer._C3D_Filter_Div) return;
    
    const div = document.createElement('div');
    div.classList.add('filters');
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.gap = '0.5rem';

    container.layer._C3D_Filter_Div = div;
    
    let html = '';
    let i = 0;
    const uniforms = THREE.UniformsUtils.clone(uniforms2);

    for(const filter in uniforms)
    {
        const data = uniforms[filter];

        if(!data.label) continue;

        const checkboxID = 'C3D_filter_' + (new Date().getTime()) + '_' + i;

        html += `
            <div data-filter="${filter}">
                <div style="display:flex; gap:0.2rem;">
                    <input type="checkbox" title="Activate" id="${checkboxID}" class="${filter}">
                    <label for="${checkboxID}" style="white-space:nowrap;">${data.label}</label>
                </div>
                <div class="uniforms" style="padding: 0.5rem; display:none;">
                <div>
        `;

        if(typeof data.value == 'object')
        {
            for (const value in data.value)
            {
                if(typeof data.value[value] !== 'number') continue;
                
                html += `
                    <div style="display:flex; gap:0.25rem; align-items:center;">
                        <input type="range" title="${value}" value="${data.value[value]}" min="${data.min}" max="${data.max}" step="${data.step}" data-filter="${filter}" data-value="${value}" class="${filter}" style="width: 90px;">
                        <p class="value" style="font-size:0.65rem;">${data.value[value] * 100}</p>
                    </div>
                `;
            }
        }
        else
        {
            html += `
                <div style="display:flex; gap:0.25rem; align-items:center;">
                    <input type="range" title="${filter}" value="${data.value}" min="${data.min}" max="${data.max}" step="${data.step}" data-filter="${filter}" class="${filter}" style="width: 90px;">
                    <p class="value" style="font-size:0.65rem;">${data.value * 100}</p>
                </div>
            `;
        }

        html += '</div>';
        html += '</div>'; // </ class="uniforms"
        html += '</div>'; // </ class="filter"

        i++;
    }

    div.innerHTML = html;

    // ENABLE OR DISABLE FILTER

    div.querySelectorAll('input[type="checkbox"]').forEach(input =>
    {
        input.addEventListener('change', (e) =>
        {
            const uniformsDiv = input.parentNode.nextElementSibling;
            // const hasUniforms = uniformsDiv.childNodes.length > 1;

            uniformsDiv.style.display = e.currentTarget.checked ? 'block' : 'none';

            if(!e.currentTarget.checked)
            {
                const filter = input.getAttribute('class');
                // container.layer._mesh.material.uniforms[filter].value = uniforms[filter].value;

                if(typeof uniforms[filter].value == 'object')
                {
                    const ranges = uniformsDiv.querySelectorAll('input[type="range"].' + filter);
                    ranges.forEach(range =>
                    {
                        range.value = uniforms[filter].value[range.dataset.value];
                        range.nextElementSibling.innerText = Math.floor(range.value * 100).toFixed(0);
                    });
                    
                }
                else
                {
                    const range = uniformsDiv.querySelector('input[type="range"].' + filter);
                    range.value = uniforms[filter].value;
                    range.nextElementSibling.innerText = Math.floor(range.value * 100).toFixed(0);
                }
                

                delete container.layer.uniforms[filter];
                container.updatePreview(null, false, false);
                c3d.three.render();
            }
        });
        
    });

    // 
    div.querySelectorAll('input[type="range"]').forEach(input =>
    {
        input.addEventListener('input', (e) =>
        {
            if(!container.layer._mesh) return;
            
            const filter = input.getAttribute('class');
            const p = input.nextElementSibling;
            const val = parseFloat(e.currentTarget.value);
            const type = container.layer.type == 'image' || container.layer.type == 'gradient' ? 'image' : container.layer.type;

            const uniformValue = c3d[type + 'Layer'].three.scene.getObjectByName('texture').material.uniforms[filter];

            p.innerText = Math.floor(val * 100).toFixed(0);
            
            if(typeof uniformValue.value == 'object')
            {
                if(!container.layer.uniforms[filter]) container.layer.uniforms[filter] = {...uniformValue.value};
                container.layer.uniforms[filter][e.currentTarget.dataset.value] = val;
            }
            else
            {
                container.layer.uniforms[filter] = val;
            }

            container.updatePreview(null, false, false);
        });
    });
    
    button.addEventListener('click', () =>
    {
        c3d.contextMenu.setWidth('fit-content');
        c3d.contextMenu.setHTMLObj(container.layer._C3D_Filter_Div);
        c3d.contextMenu.show(button);
    });

    for(const filter in container.layer.uniforms)
    {
        const value = container.layer.uniforms[filter];
        const checkbox = div.querySelector('input[type="checkbox"].' + filter);
        
        if(checkbox)
        {
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change'));
            
            if(typeof value == 'object')
            {
                const ranges = div.querySelectorAll('input[type="range"].' + filter);
                ranges.forEach(range =>
                {
                    range.value = value[range.dataset.value];
                    range.nextElementSibling.innerText = Math.floor(range.value * 100).toFixed(0);
                });
            }
            else
            {
                const range = div.querySelector('input[type="range"].' + filter);
                range.value = value;
                range.nextElementSibling.innerText = Math.floor(range.value * 100).toFixed(0);
            }
        }
    }

}
