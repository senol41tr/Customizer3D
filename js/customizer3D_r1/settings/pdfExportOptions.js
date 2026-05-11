export const initialize = async (c3d, container) =>
{
    let options = c3d.localStorage.getObject('pdfExportOptions');
    
    if(!options)
    {
        options = {convertToOutline: 1, addFonts: 0};
        c3d.localStorage.setObject('pdfExportOptions', options);
    }

    const addFonts = options.addFonts == 1 ? ' checked' : '';
    const convertToOutline = options.convertToOutline == 1 ? ' checked' : '';

    const div = document.createElement('div');
    div.classList.add('options');
    div.innerHTML = `
        <div class="title">
            <img src="${C3D_SERVER}svg/plus.svg?c3d=102" alt="Icon" class="icon">
            <p>${c3d.lang['pdf-export-options']}</p>
        </div>

        <div>
            <div style="display:flex; gap:0.3rem; padding-top:1rem;">
                <input id="C3D_Settings_Export_Options_AF" type="checkbox" data-value="addFonts"${addFonts} title="${c3d.lang['add-fonts-to-zip']}">
                <label for="C3D_Settings_Export_Options_AF">${c3d.lang['add-fonts-to-zip']}</label>
            </div>
            <div style="display:flex; gap:0.3rem; padding-bottom:0.5rem;">
                <input id="C3D_Settings_Export_Options_CO" type="checkbox" data-value="convertToOutline"${convertToOutline} title="${c3d.lang['convert-texts-to-outline']}">
                <label for="C3D_Settings_Export_Options_CO">${c3d.lang['convert-texts-to-outline']}</label>
            </div>
        </div>
    `;
    
    const checkboxes = div.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox =>
    {
        checkbox.addEventListener('change', (e) =>
        {
            const options = c3d.localStorage.getObject('pdfExportOptions');
            options[e.currentTarget.dataset.value] = e.currentTarget.checked ? 1 : 0;
            c3d.localStorage.setObject('pdfExportOptions', options);
        });
    });

    container.appendChild(div);
}

export const getOptions = (c3d) =>
{
    return c3d.localStorage.getObject('pdfExportOptions');
}
