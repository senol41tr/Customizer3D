import ColorPicker from 'base/jscolorpicker/colorpicker.js?c3d=105';
import {langs} from './langs.js?c3d=105';
import {changeUIColors, tintSVG} from './changeUIColors.js?c3d=105';
import {GPUInfo} from './GPUInfo.js?c3d=105';
import * as PDFExportOptions from './pdfExportOptions.js?c3d=105';
import {takeAScreenshot} from './takeAScreenshot.js?c3d=105';
import {about} from './about.js?c3d=105';
import {stats} from './stats.js?c3d=105';

export class Settings
{
    constructor(c3d)
    {
        this.c3d = c3d;        
        this.htmlEl = document.querySelector(this.c3d.props.layers + ' > div.settings');
    }

    async init()
    {

        this.htmlEl.innerHTML = `
            <div class="content"></div>
        `;

        const container = this.htmlEl.querySelector('div.content');


        // ADD LANGUAGES
        await langs(this.c3d, container);

        // ADD UI COLORS
        changeUIColors(this.c3d, container);

        // TEXTURE SIZE
        GPUInfo(this.c3d, container);
        
        // ADD Export Options
        PDFExportOptions.initialize(this.c3d, container);
        const GPUInfoDiv = this.htmlEl.querySelector('div.GPUInfo');
        if(GPUInfoDiv.style.opacity == '0.5')
        {
            const optionsDiv = this.htmlEl.querySelector('div.options');
            optionsDiv.style.opacity = 0.5;
            optionsDiv.style.pointerEvents = 'none';
        }

        // SHOW STATS
        stats(this.c3d, container);

        // TAKE A SCREENSHOT 
        takeAScreenshot(this.c3d, container);
        
        // ABOUT
        about(this.c3d, container);


        // ADD EVENT LISTENERS

        this.htmlEl.querySelectorAll('div.content > div > div.title').forEach(title =>
        {
            title.addEventListener('click', () =>    
            {
                const content = title.nextElementSibling;
                const hidden = content.style.maxHeight == '' || content.style.maxHeight == '0px';                
                content.style.maxHeight = (hidden ? content.scrollHeight + 2 : 0) + 'px';
                title.querySelector('img').style.rotate = hidden ? '45deg' : '0deg';
                title.querySelector('p').classList[hidden ? 'add' : 'remove']('active');

                this.htmlEl.style.maxHeight = (container.scrollHeight + content.scrollHeight) + 'px';                
            });
        });

        this.htmlEl.querySelectorAll('div.content div.color_picker').forEach(i => {
            
            i.colorPicker = new ColorPicker(i, {
                color: this.c3d.localStorage.get(i.dataset.css_id),
                submitMode: 'instant',
                enableEyedropper:true,
                enableAlpha:false,
                c3d: this.c3d
            });
            
            i.colorPicker.on('pick', (c) =>
            {
                const root = document.querySelector(':root');
                if(i.dataset.css_id == 'customizerColorPrimary')
                {
                    const ce = this.c3d.colorEngine;
                    ce.invert(i.colorPicker.color.string('hex'), true, false);

                    const text_color = ce.color;
                    root.style.setProperty('--customizerColorText', text_color);
                    this.c3d.localStorage.set('customizerColorText', text_color);
                    tintSVG(text_color, this.c3d);
                }
                root.style.setProperty('--' + i.dataset.css_id, i.colorPicker.color.string('hex'));
                this.c3d.localStorage.set(i.dataset.css_id, i.colorPicker.color.string('hex'));

            });
        });

        tintSVG(this.c3d.localStorage.get('customizerColorText'), this.c3d);

    }

    getExportOptions()
    {
        return PDFExportOptions.getOptions(this.c3d);
    }

}
