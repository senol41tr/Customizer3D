import {Dragable} from 'customizer3D_dir/dragable/Dragable.js?c3d=0.5.1';
import {SVGFill, SVGFillColor} from 'customizer3D_dir/utils/SVGFill.js?c3d=0.5.1';
import ColorPicker from 'base/jscolorpicker/colorpicker.js?c3d=0.5.1';

export class Settings
{
    constructor(c3d)
    {
        this.c3d = c3d;        
        this.htmlEl = document.querySelector(this.c3d.props.settings);

        this._init();
    }

    getRenderDPI()
    {
        const range = this.htmlEl.querySelector('div.content > div.renderDPI input[type="range"]');
        return parseInt(range.value);
    }

    async _init()
    {
        const availableLangs = Object.entries(JSON.parse(await (await fetch(C3D_SERVER + 'lang/langs.json?c3d=0.5.1')).text()));
        let availableLangsDiv = document.createElement('div');
        const activeLang = this.c3d.localStorage.get('language');

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
                    if(confirm(this.c3d.lang['lose-changes']))
                    {
                        this.c3d.localStorage.set('language', availLang);
                        document.location.reload();
                    }
                });
                availableLangsDiv.appendChild(a);
            }
        }

        const ce = this.c3d.colorEngine;
        const customizerColorBG1 = 'customizerColorBG1', 
        customizerColorBG2 = 'customizerColorBG2', 
        customizerColorPrimary = 'customizerColorPrimary',
        customizerColorText = 'customizerColorText';

        // https://stackoverflow.com/questions/37801882/how-to-change-css-root-color-variables-in-javascript
        const root = document.querySelector(':root');
        const cs = window.getComputedStyle(root);

        const bg_color1 = this.c3d.localStorage.get(customizerColorBG1) || cs.getPropertyValue('--' + customizerColorBG1);
        const bg_color2 = this.c3d.localStorage.get(customizerColorBG2) || cs.getPropertyValue('--' + customizerColorBG2);
        const primary_color = this.c3d.localStorage.get(customizerColorPrimary) || cs.getPropertyValue('--' + customizerColorPrimary);
        let text_color = this.c3d.localStorage.get(customizerColorText) || cs.getPropertyValue('--' + customizerColorText);
        
        if(this.c3d.localStorage.get(customizerColorText) == null)
        {
            ce.invert(primary_color, true, false);
            text_color = ce.color;
        }

        this.c3d.localStorage.set(customizerColorBG1, bg_color1);
        this.c3d.localStorage.set(customizerColorBG2, bg_color2);
        this.c3d.localStorage.set(customizerColorPrimary, primary_color);
        this.c3d.localStorage.set(customizerColorText, text_color);

        root.style.setProperty('--' + customizerColorBG1, bg_color1);
        root.style.setProperty('--' + customizerColorBG2, bg_color2);
        root.style.setProperty('--' + customizerColorPrimary, primary_color);
        root.style.setProperty('--' + customizerColorText, text_color);

        let renderDPI = this.c3d.localStorage.get('renderDPI');
        
        if(renderDPI == null)
        {
            renderDPI = 96;
            this.c3d.localStorage.set('renderDPI', renderDPI);
        } 
        

        this.htmlEl.innerHTML = `
        <div class="title">
            <div class="title">
                <img src="${C3D_SERVER}svg/settings.svg?c3d=0.5.1" alt="Icon" class="icon" draggable="false">
            </div>
        </div>

        <div class="content">

            <div class="language" style="padding-bottom: 0.5rem;gap:0.2rem;">
                <p class="title">${this.c3d.lang['change-language']}</p>
                <div class="langs">
                    <a href="lang/language.php" target="_blank" title="Language Administration" style="background-color:blue;color:white;padding:0.25rem;text-decoration:none;font-size:0.65rem;">ADMIN</a>
                </div>
            </div>

            <div class="colors">
                <div class="title">
                    <img src="${C3D_SERVER}svg/plus.svg?c3d=0.5.1" alt="Icon" class="icon">
                    <p>${this.c3d.lang['change-ui-colors']}</p>
                </div>
                <div class="colors">
                    <div>
                        <p class="title">${this.c3d.lang['change-background-color']}</p>
                        <div>
                            <div class="color_picker bg_color1" data-css_id="${customizerColorBG1}"></div>
                            <div class="color_picker bg_color2" data-css_id="${customizerColorBG2}"></div>
                        </div>
                    </div>
                    <div class="primary">
                        <p class="title">${this.c3d.lang['change-primary-color']}</p>
                        <div class="color_picker primary_color" data-css_id="${customizerColorPrimary}"></div>
                    </div>
                    <div class="text">
                        <p class="title">${this.c3d.lang['change-text-color']}</p>
                        <div class="color_picker text_color" data-css_id="${customizerColorText}"></div>
                    </div>
                    <div class="reset_colors" style="padding: 0.5rem 0;">
                        <a href="javascript:void(0);" title="Reset Colors">${this.c3d.lang['reset-colors']}</a>
                    </div>
                </div>

            </div>

            <div class="renderDPI">
                <div class="title">
                    <img src="${C3D_SERVER}svg/plus.svg?c3d=0.5.1" alt="Icon" class="icon">
                    <p>${this.c3d.lang['render-quality']}</p>
                </div>

                <div>
                    <div>
                        <div style="display:flex;align-items: center;gap: 0.35rem;">
                            <span>Min.</span>
                            <input type="range" value="${renderDPI}" min="36" max="300" title="${this.c3d.lang['render-quality']}">
                            <span>Max.</span>
                        </div>
                        <p style="text-align:center;">${renderDPI} DPI</p>
                    </div>
                </div>
            </div>

            <div class="takeAScreenshot" style="padding: 0.5rem 0;">
                <a href="javascript:void(0);" title="">${this.c3d.lang['take-a-screenshot']}</a>
            </div>

            <div class="about">
                <button class="about">About</button>
                <button class="update">Check For Updates</button>
            </div>

            <div class="updateStatus" style="padding:0.5rem;">
            </div>

        </div>`;


        this.htmlEl.querySelectorAll('section.customizer > div.settings > div.content > div > div.title').forEach(title =>
        {
            title.addEventListener('click', () =>    
            {
                const content = title.nextElementSibling;
                const hidden = content.style.maxHeight == '' || content.style.maxHeight == '0px';                
                content.style.maxHeight = (hidden ? content.scrollHeight + 2 : 0) + 'px';
                title.querySelector('img').style.rotate = hidden ? '45deg' : '0deg';
            });
        });

        this.htmlEl.querySelector('div.content > div.language > div.langs').prepend(availableLangsDiv);

        const dragable = new Dragable({
            dragEl: this.htmlEl.querySelector('div.title'),
            container: this.htmlEl,
            root: document.querySelector(this.c3d.props.container),
            c3d: this.c3d
        });

        this.htmlEl.querySelector('div.title > div.title > img.icon').addEventListener('click', this._onClick.bind(this));
        
        const self = this;
        this.htmlEl.querySelectorAll('div.content div.color_picker').forEach(i => {
            
            const color = i.getAttribute('class').replace('color_picker ', '');            
            i.colorPicker = new ColorPicker(i, {
                color: eval(color),
                submitMode: 'instant',
                enableEyedropper:true,
                enableAlpha:false,
                c3d: this.c3d
            });
            
            i.colorPicker.on('pick', (c) => {
                self._onColorInput(self, i.colorPicker, i.dataset.css_id);
            });
        });

        this.htmlEl.querySelector('div.content div.reset_colors > a').addEventListener('click', () => {
            self._resetColors();
        });


        // 3D RENDER DPI

        const range = this.htmlEl.querySelector('div.content > div.renderDPI input[type="range"]');
        range.addEventListener('change', () =>
        {
            let val = parseInt(range.value);
            if(val < range.min) val = range.min;
            if(val > range.max) val = range.max;
            range.parentNode.parentNode.querySelector('p').innerText = val + ' DPI';
            this.c3d.render3d.renderAll();
            this.c3d.render2d.renderAll();
            this.c3d.localStorage.set('renderDPI', val);
        });



        // TAKE A SCREENSHOT 

        const takeAScreenshotA = this.htmlEl.querySelector('div.content > div.takeAScreenshot > a');
        takeAScreenshotA.addEventListener('click', async () =>
        {
            // disable UI during processing
            const container = document.querySelector(this.c3d.props.container);
            container.style.pointerEvents = 'none';
            container.style.opacity = 0.5;

            this.c3d.preloader.show();
            this.c3d.preloader.set(this.c3d.lang['take-a-screenshot']);
            
            this.c3d.three.render();

            const canvasBlob = await new Promise(resolve => this.c3d.three.renderer.domElement.toBlob(resolve, 'image/png', 1.0));
            const blob = new Blob( [canvasBlob], {type:'image/png'});

            const a = document.createElement('a');
            const blobUrl = URL.createObjectURL(blob);
            a.href = blobUrl;
            a.download = this.c3d.props.modelName + '_Screenshot.png';
            a.click();
            a.remove();
            setTimeout(() =>
            {
                URL.revokeObjectURL(blobUrl);
                container.style.pointerEvents = 'all';
                container.style.opacity = 1;
                this.c3d.preloader.hide();

            }, 200);
        });


        // ABOUT

        const container = document.querySelector(this.c3d.props.container);
        const aboutContainer = document.createElement('div');
        aboutContainer.setAttribute('class', 'about');
        aboutContainer.innerHTML = `
            <img src="${C3D_SERVER}svg/customizer_3D_logo.svg?c3d=0.5.1" alt="Customizer3D Logo" class="logo">
            <p class="title">Used Libraries:</p>
            <div>
                <p>Three.js</p>
                <a href="https://threejs.org" target="_blank">#</a>
            </div>
            <div>
                <p>jsPDF</p>
                <a href="https://parall.ax/products/jspdf" target="_blank">#</a>
            </div>
            <div>
                <p>PDF.js</p>
                <a href="https://mozilla.github.io/pdf.js?c3d=0.5.1" target="_blank">#</a>
            </div>
            <div>
                <p>fflate</p>
                <a href="https://101arrowz.github.io/fflate" target="_blank">#</a>
            </div>
            <div>
                <p>JS Color Picker</p>
                <a href="https://www.jscolorpicker.com?c3d=0.5.1" target="_blank">#</a>
            </div>
            <div>
                <p>opentype.js</p>
                <a href="https://opentype.js.org?c3d=0.5.1" target="_blank">#</a>
            </div>
            <div>
                <p>jsColorEngine</p>
                <a href="https://github.com/glennwilton/jsColorEngine" target="_blank">#</a>
            </div>
            <div>
                <p>JSManipulate</p>
                <a href="http://www.joelb.me" target="_blank">#</a>
            </div>
            <div>
                <p>GSAP 3</p>
                <a href="https://gsap.com" target="_blank">#</a>
            </div>
            <div class="thanks">
                <p>Also, many thanks to the people who shared your knowledge on <a href="https://stackoverflow.com" target="_blank">stackoverflow.com</a></p>
            </div>
            <p class="title">3D Model, Material Providers:</p>
            <div>
                <p>free3d</p>
                <a href="https://free3d.com" target="_blank">#</a>
            </div>
            <div>
                <p>cgtrader</p>
                <a href="https://www.cgtrader.com" target="_blank">#</a>
            </div>
            <div>
                <p>sketchfab</p>
                <a href="https://sketchfab.com" target="_blank">#</a>
            </div>
            <div>
                <p>ambientCG</p>
                <a href="https://ambientcg.com" target="_blank">#</a>
            </div>
            <p class="title">AI</p>
            <div>
                <p>gemini</p>
                <a href="https://gemini.google.com" target="_blank">#</a>
            </div>
        `;
        container.appendChild(aboutContainer);

        aboutContainer.addEventListener('click', () => {
            aboutContainer.style.display = 'none';
        });

        this.htmlEl.querySelector('div.content > div.about > button.about').addEventListener('click', () => {
            aboutContainer.style.display = 'flex';
            aboutContainer.style.zIndex = this.c3d.zIndex.index; // move to top
        });


        this.htmlEl.querySelector('div.content > div.about > button.update').addEventListener('click', async () => {
            await this.checkForUpdates();
        });


        // tint SVG's
        this._tintSVG(text_color);
    }

    _resetColors = () =>
    {
        const root = document.querySelector(':root');
        const cs = window.getComputedStyle(root);

        this.htmlEl.querySelectorAll('div.content div.color_picker').forEach(i => {
            const id = i.dataset.css_id;
            root.style.removeProperty('--' + id);
            i.colorPicker.setColor(cs.getPropertyValue('--' + id));
            this.c3d.localStorage.delete(id);
            if(id == 'customizerColorText') this._tintSVG(i.colorPicker.color.string('hex'));
        });
    }

    _onColorInput = (self, colorPicker, id) =>
    {
        const root = document.querySelector(':root');
        if(id == 'customizerColorPrimary')
        {
            self.c3d.colorEngine.invert(colorPicker.color.string('hex'), true, false);
            const text_color = self.c3d.colorEngine.color;
            root.style.setProperty('--customizerColorText', text_color);
            self.c3d.localStorage.set('customizerColorText', text_color);
            self._tintSVG(text_color);
        }
        root.style.setProperty('--' + id, colorPicker.color.string('hex'));
        self.c3d.localStorage.set(id, colorPicker.color.string('hex'));
    }

    _onClick(e)
    {
        e.preventDefault();

        const content = this.htmlEl.querySelector('div.content');
        const visible = content.style.display == 'none' || content.style.display == '' ;
        content.style.display = visible ? 'flex' : 'none';
        this.htmlEl.querySelector('div.title > div.title > img.icon').src = C3D_SERVER + 'svg/' + (visible ? 'plus' : 'settings') + '.svg';
    }

    _tintSVG(c)
    {
        const ce = this.c3d.colorEngine;
        ce.rgb(c);
        const set_svgs_color = new SVGFill(new SVGFillColor(ce.color)).applyAll();
        this.htmlEl.querySelector('div.content div.text_color').value = c;
    }

    async checkForUpdates()
    {
        const VERSION_CHECK_URL = 'https://raw.githubusercontent.com/senol41tr/Customizer3D/main/version.json';
        const updateBtn = this.htmlEl.querySelector('div.content > div.about > button.update');
        const updateStatus = this.htmlEl.querySelector('div.content > div.updateStatus');
        const isNewerVersion = (remoteVersion, currentVersion) =>
        {
            const vRemote = remoteVersion.split('.').map(Number);
            const vCurrent = currentVersion.split('.').map(Number);

            for (let i = 0; i < Math.max(vRemote.length, vCurrent.length); i++) {
                const r = vRemote[i] || 0;
                const c = vCurrent[i] || 0;
                if (r > c) return true;
                if (r < c) return false;
            }
            return false;
        };

        try {
            updateBtn.disabled = true;
            updateStatus.innerText = "Checking for updates...";

            const response = await fetch(`${VERSION_CHECK_URL}?t=${Date.now()}`);
            if (!response.ok) throw new Error("Server response failed.");

            const remoteData = await response.json();

            if (isNewerVersion(remoteData.version, this.c3d.CURRENT_VERSION)) {
                updateStatus.innerHTML = `
                    <span style="font-size:2rem;">🎉</span>
                    <strong>New Version Available! (v${remoteData.version})</strong>
                    <em>${remoteData.releaseNotes}</em>
                    <a href="${remoteData.downloadUrl}" target="_blank">Download Now</a>
                `;
                updateBtn.style.display = 'none';
            } else {
                updateStatus.innerText = `✅ Your application is up to date! (v${this.c3d.CURRENT_VERSION})`;
            }
        } catch (error) {
            alert(error);
            updateStatus.innerText = "❌ Update check failed. Please check your network connection.";
        } finally {
            updateBtn.disabled = false;
        }
    }

}
