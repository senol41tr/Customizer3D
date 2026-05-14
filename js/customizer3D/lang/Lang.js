export class Lang
{
    constructor(c3d)
    {
        this.c3d = c3d;
    }

    async loadTranslationTable()
    {
        const availableLangs = Object.entries(JSON.parse(await (await fetch(C3D_SERVER + 'lang/langs.json?c3d=104')).text()));

        const lsLang = window.localStorage.getItem('language');
        let userLang = lsLang == null ? (navigator.language || navigator.userLanguage).substr(0, 2) : lsLang;
        let found = false;

        for (let i = 0; i < availableLangs.length; i++)
        {
            const availableLang = availableLangs[i][0];
            if(availableLang === userLang)
            {
                found = true;
                break;
            }
        }

        if(!found) userLang = 'en';

        const translationTable = JSON.parse(await (await fetch(C3D_SERVER + 'lang/'+ userLang +'.json?c3d=104')).text());

        // save to local storage
        window.localStorage.setItem('language', userLang);

        // set html lang
        document.documentElement.setAttribute('lang', userLang);

        return translationTable;
    }

    static getLang()
    {
        return window.localStorage.getItem('language');
    }

    static extend(self, lang, override = false)
    {
        if(!lang) return;
        
        const userLang = this.getLang();

        Object.keys(lang).forEach(item =>
        {
            if (self.lang.hasOwnProperty(item) && override == false)
            {
                console.warn("Item exist in lang object!\n item: " + item);  
            }
            else
            {
                self.lang[item] = lang[item][userLang];
            }
        });
    }

}
