import {SVGFill, SVGFillColor} from 'customizer3D_dir/utils/SVGFill.js?c3d=101';

export const changeUIColors = (c3d, container) =>
{
    const customizerColorBG1 = 'customizerColorBG1', 
    customizerColorBG2 = 'customizerColorBG2', 
    customizerColorPrimary = 'customizerColorPrimary',
    customizerColorText = 'customizerColorText';

    const div = document.createElement('div');
    div.classList.add('colors');
    div.innerHTML = `
        <div class="title">
            <img src="${C3D_SERVER}svg/plus.svg?c3d=101" alt="Icon" class="icon">
            <p>${c3d.lang['change-ui-colors']}</p>
        </div>
        <div class="colors">
            <div style="padding-top:1rem;">
                <p class="title">${c3d.lang['change-background-color']}</p>
                <div>
                    <div class="color_picker bg_color1" data-css_id="${customizerColorBG1}"></div>
                    <div class="color_picker bg_color2" data-css_id="${customizerColorBG2}"></div>
                </div>
            </div>
            <div class="primary">
                <p class="title">${c3d.lang['change-primary-color']}</p>
                <div class="color_picker primary_color" data-css_id="${customizerColorPrimary}"></div>
            </div>
            <div class="text">
                <p class="title">${c3d.lang['change-text-color']}</p>
                <div class="color_picker text_color" data-css_id="${customizerColorText}"></div>
            </div>
            <div class="reset_colors" style="padding: 0.5rem 0;">
                <a href="javascript:void(0);" title="Reset Colors">${c3d.lang['reset-colors']}</a>
            </div>
        </div>
    `;

    // https://stackoverflow.com/questions/37801882/how-to-change-css-root-color-variables-in-javascript
    const root = document.querySelector(':root');
    const cs = window.getComputedStyle(root);

    const bg_color1 = c3d.localStorage.get(customizerColorBG1) || cs.getPropertyValue('--' + customizerColorBG1);
    const bg_color2 = c3d.localStorage.get(customizerColorBG2) || cs.getPropertyValue('--' + customizerColorBG2);
    const primary_color = c3d.localStorage.get(customizerColorPrimary) || cs.getPropertyValue('--' + customizerColorPrimary);
    let text_color = c3d.localStorage.get(customizerColorText) || cs.getPropertyValue('--' + customizerColorText);
    
    if(c3d.localStorage.get(customizerColorText) == null)
    {
        const ce = c3d.colorEngine;
        ce.invert(primary_color, false, false);
        text_color = ce.color;
    }

    c3d.localStorage.set(customizerColorBG1, bg_color1);
    c3d.localStorage.set(customizerColorBG2, bg_color2);
    c3d.localStorage.set(customizerColorPrimary, primary_color);
    c3d.localStorage.set(customizerColorText, text_color);

    root.style.setProperty('--' + customizerColorBG1, bg_color1);
    root.style.setProperty('--' + customizerColorBG2, bg_color2);
    root.style.setProperty('--' + customizerColorPrimary, primary_color);
    root.style.setProperty('--' + customizerColorText, text_color);


    div.querySelector('div.reset_colors > a').addEventListener('click', () =>
    {
        const root = document.querySelector(':root');
        const cs = window.getComputedStyle(root);

        div.querySelectorAll('div.color_picker').forEach(i =>
        {
            const id = i.dataset.css_id;
            root.style.removeProperty('--' + id);
            i.colorPicker.setColor(cs.getPropertyValue('--' + id));
            c3d.localStorage.delete(id);
            if(id == 'customizerColorText') tintSVG(i.colorPicker.color.string('hex'), c3d);
        });
    });

    container.appendChild(div);
}

export const tintSVG = (c, c3d) =>
{
    const ce = c3d.colorEngine;
    ce.rgb(c);
    const set_svgs_color = new SVGFill(new SVGFillColor(ce.color)).applyAll();
}
