export const langs = async (c3d, container) =>
{
    const div = document.createElement('div');
    div.classList.add('language');
    div.style.gap = '0.2rem';
    div.style.paddingBottom = '1rem';
    div.innerHTML = `
        <p class="title">${c3d.lang['change-language']}</p>
        <div class="langs" style="padding-bottom:0.5rem;"></div>
        <a href="php/language.php" target="_blank" title="Language Administration">Language Administration</a>
    `;
    
    const langs = div.querySelector('div.langs');

    const availableLangs = Object.entries(JSON.parse(await (await fetch(C3D_SERVER + 'lang/langs.json?c3d=101')).text()));
    const activeLang = c3d.localStorage.get('language');

    for (let i = 0; i < availableLangs.length; i++)
    {
        const availLang = availableLangs[i][0];
        if(activeLang.toLowerCase() != availLang.toLowerCase())
        {
            const a = document.createElement('a');
            a.innerText = availLang.toUpperCase();
            a.setAttribute('title', availableLangs[i][1]);
            a.setAttribute('href', 'javascript:void(0)');
            a.addEventListener('click', (e) => {
                e.preventDefault();
                if(confirm(c3d.lang['lose-changes']))
                {
                    c3d.localStorage.set('language', availLang);
                    document.location.reload();
                }
            });
            langs.appendChild(a);
        }
    }

    container.appendChild(div);
}
