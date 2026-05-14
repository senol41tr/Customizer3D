
export const stats = async (c3d, container) =>
{
    const div = document.createElement('div');
    div.classList.add('stats');
    div.style.cssText = 'display:flex; gap: 0.35rem; margin:0.25rem; padding:0.35rem;';
    div.innerHTML = `
        <input type="checkbox" id="__C3D_Settings_stats">
        <label for="__C3D_Settings_stats" title="Toggle">Show Stats</label>
    `;
    
    const checkbox = div.querySelector('input');
    checkbox.addEventListener('change', () =>
    {
        c3d.three.stats.dom.style.display = checkbox.checked ? 'block' : 'none';
        c3d.localStorage.set('settings_stats', checkbox.checked ? 1 : 0);
    });

    const settings_stats = parseInt(c3d.localStorage.get('settings_stats'));
    if(settings_stats == 1)
    {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
    }

    container.appendChild(div);
}