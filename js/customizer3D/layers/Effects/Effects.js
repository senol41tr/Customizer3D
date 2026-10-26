import {PointCloud} from './PointCloud.js?c3d=0.6.0';
import {ColorAnalyzer} from './ColorAnalyzer.js?c3d=0.6.0';
import {applyFilters} from 'customizer3D_dir/layers/Filters/Filters.js?c3d=0.6.0';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=0.6.0';

const EffectsList =
{
    pointCloud: new PointCloud(),
    colorAnalyzer: new ColorAnalyzer()
};

export const applyEffects = (c3d, layer, layerName, isExport) =>
{
    if(!layer.effectsCanvas) return;

    const printDims = getPrintDims(c3d, {name: layer.name}, c3d.settings.getRenderDPI(), isExport);
    layer.effectsCanvas.width = printDims.width;
    layer.effectsCanvas.height = printDims.height;
    const ctx = layer.effectsCanvas.getContext('2d', {willReadFrequently: true});
    ctx.clearRect(0, 0, layer.effectsCanvas.width, layer.effectsCanvas.height);
    ctx.drawImage(layer.image, 0, 0, printDims.width, printDims.height);

    const effects = Object.entries(layer.effects);
    if(!effects.length) return;

    for (let j = 0; j < effects.length; j++)
    {
        const effect = effects[j][0];
        const fxClass = EffectsList[effect];

        fxClass.c3d = c3d;
        fxClass.layer = layer;
        fxClass.layerName = layerName;
        fxClass.show();
        fxClass.apply();
        fxClass.hide();
    }

};

export const createEffectsList = (c3d, root, layerName) =>
{
    const layer = c3d[layerName].layer;
    const effects = Object.entries(EffectsList);

    if(!layer.effects) return;

    root.innerHTML = '';
    
    for (let i = 0; i < effects.length; i++)
    {
        const effect = effects[i];
        const name = effect[0];
        const div = document.createElement('div');
        const checked = layer.effects[name] ? ' checked' : '';
        const _showSettigs = () =>
        {
            const fxClass = EffectsList[name];
            fxClass.c3d = c3d;
            fxClass.layer = layer;
            fxClass.layerName = layerName;
            fxClass.show();
        };

        div.style.cssText = 'display:flex; gap:0.25rem; white-space: nowrap;padding-bottom: 0.25rem;';
        div.innerHTML = `
            <div style="display:flex; gap:0.5rem; align-items:center;">
                <label style="gap:0.25rem; flex-direction:row;">
                    <input type="checkbox" data-effect="${name}"${checked}>
                    ${effect[1].label}
                </label>
                <img src="${C3D_SERVER}svg/settings.svg?c3d=0.6.0" alt="Icon" class="settings" draggable="false" style="height: auto; width:20px; cursor:pointer;" title="Edit Effect Settings">
            </div>
        `;

        const settings = div.querySelector('img.settings');
        settings.style.display = layer.effects[name] ? 'block' : 'none';
        settings.addEventListener('click', () => _showSettigs());

        const checkbox = div.querySelector('input');
        checkbox.addEventListener('change', (e) =>
        {
            if(checkbox.checked) {
                layer.effects[name] = {};
                root.style.display = 'none';
                _showSettigs();
            }
            else {
                settings.style.display = 'none';
                delete layer.effects[name];
                applyEffects(c3d, layer, layerName);
                applyFilters(c3d, layer, layerName);
                c3d[layerName].show(layer);
                c3d[layerName].updatePreview();
            }
        });

        root.appendChild(div);
    }

};
