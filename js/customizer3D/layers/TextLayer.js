import * as opentype from "base/opentype/opentype.esm.js";
import ColorPicker from 'base/jscolorpicker/colorpicker.js?c3d=0.5.1';
import {Dragable} from 'customizer3D_dir/dragable/Dragable.js?c3d=0.5.1';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.5.1';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.5.1';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=0.5.1';
import {createFiltersList, applyFilter} from 'customizer3D_dir/layers/Filters/Filters.js?c3d=0.5.1';

export class TextLayer
{
    constructor(c3d)
    {
        this.c3d = c3d;
        this.htmlEl = document.querySelector(this.c3d.props.textLayer);

        this.customFonts = [];
        this.builtInFonts = [];
        this.layer = {};
        this._customFontInputID = 'C3D_loadCustomFontInput' + new Date().getTime(); // <input id=

        let el;

        this.htmlEl.innerHTML = `
        <div class="title">
            <p class="label" draggable="false">${this.c3d.lang['add-text-layer']}</p>
            <div class="buttons">
                <img src="${C3D_SERVER}svg/arrow-drop-down.svg?c3d=0.5.1" alt="Icon" class="rollup" draggable="false" style="rotate:-180deg;">
                <img src="${C3D_SERVER}svg/plus.svg?c3d=0.5.1" alt="Icon" class="icon" draggable="false" style="rotate:45deg;">
            </div>
        </div>

        <div class="content">
            <input type="text" class="text" placeholder="${this.c3d.lang['enter-your-text']}">
            <div class="menu">
                <div class="builtInFonts">
                    <div class="button" title="${this.c3d.lang['font']}"><img src="${C3D_SERVER}svg/font_family.svg?c3d=0.5.1" alt="Icon"></div>
                    <div class="list"></div>
                </div>
                <div class="fontSizes">
                    <div class="button" title="${this.c3d.lang['size']}"><img src="${C3D_SERVER}svg/font_size.svg?c3d=0.5.1" alt="Icon"></div>
                    <!-- change Text.js if default font size change -->
                    <div class="list">
                        <div class="inputPercent" data-icon="pt"><input type="number" min="1" max="500" value="30"></div>
                        <input type="range" min="1" max="500" value="30" step="1">
                    </div>
                </div>
                <div class="color_picker" title="${this.c3d.lang['color']}"></div>
                <div class="rotate">
                    <div class="button" title="${this.c3d.lang['rotate']}"><img src="${C3D_SERVER}svg/rotate.svg?c3d=0.5.1" alt="Icon"></div>
                    <div class="list">
                        <div class="inputPercent" data-icon="°" title="${this.c3d.lang['degree']}"><input type="number" min="-180" max="180" value="0"></div>
                        <input type="range" min="-180" max="180" value="0" step="0.1">
                    </div>
                </div>
                <div class="filters">
                    <div class="button" title="${this.c3d.lang['filter-gallery']}"><img src="${C3D_SERVER}svg/filters.svg?c3d=0.5.1" alt="Icon"></div>
                    <div class="list">
                    </div>
                </div>
            </div>
            <canvas class="preview" oncontextmenu="return false;"></canvas>
            <div class="input">
                <div class="list"></div>
                <a href="https://convertio.co" target="_blank" class="convertURL">${this.c3d.lang['convert-font-to-ttf']}</a>
            </div>
        </div>`;

        const canvasPreview = this.htmlEl.querySelector('canvas.preview');

        const ce = this.c3d.colorEngine;
        ce.invert('#eeff00', false, false);
        this.colorPicker = new ColorPicker(this.htmlEl.querySelector('div.color_picker'), {
            color: ce.color,
            submitMode: 'instant',
            enableEyedropper:true,
            enableAlpha:false,
            loadLocalSwatches:true,
            localStorage: this.c3d.localStorage,
            c3d: this.c3d
        });
        
        this.colorPicker.on('pick', (color) => {
            ce.invert(color.string('hex'), true, false);
            canvasPreview.style.backgroundColor = ce.color;
            this.layer.color = color.string('hex');
            this.layer.updateCanvas();
            this.updatePreview();
        });


        const canvasMouseMove = (e) =>
        {
            // https://stackoverflow.com/a/69023543
            const touch = (e.touches && e.touches[0]) || (e.pointerType && e.pointerType === 'touch' && e);
            const clientX = (touch || e).clientX;
            const clientY = (touch || e).clientY;
            const bb = canvasPreview.getBoundingClientRect();

            this.layer.textPosition =
            {
                x: -canvasPreview.width / 2 + clientX - bb.x, 
                y: -canvasPreview.height / 2 + clientY - bb.y
            };

            this.layer.updateCanvas();
            this.updatePreview(true);
        };

        const canvasMouseUp = () =>
        {
            const container = document.querySelector(this.c3d.props.container);
            if(isMobile())
            {
                container.removeEventListener('touchend', canvasMouseUp);
                container.removeEventListener('touchmove', canvasMouseMove);
                document.body.style.overflow = 'auto';
            }
            else
            {
                container.removeEventListener('pointermove', canvasMouseMove);
                container.removeEventListener('pointerup', canvasMouseUp);
            }

            this.updatePreview(false);
        };

        const canvasMouseDown = (e) => 
        {
            canvasMouseMove(e);
            const container = document.querySelector(this.c3d.props.container);
            if(isMobile())
            {
                document.body.style.overflow = 'hidden';
                container.addEventListener('touchend', canvasMouseUp);
                container.addEventListener('touchmove', canvasMouseMove);
            }
            else
            {
                container.addEventListener('pointermove', canvasMouseMove);
                container.addEventListener('pointerup', canvasMouseUp);
            }
        };

        if(isMobile()) canvasPreview.addEventListener('touchstart', canvasMouseDown);
        else canvasPreview.addEventListener('pointerdown', canvasMouseDown);

        
        const dragable = new Dragable({
            dragEl: this.htmlEl.querySelector('div.title'),
            container: this.htmlEl,
            root: document.querySelector(this.c3d.props.container),
            c3d: this.c3d
        });

        this.htmlEl.querySelector('div.title > div.buttons > img.rollup').addEventListener('click', (e) => {
            const content = this.htmlEl.querySelector('div.content');
            const visible = content.style.display == 'none' || content.style.display == '';
            content.style.display = visible ? 'flex' : 'none';
            e.currentTarget.style.rotate = visible ? '-180deg' : '0deg';
        });

        this.htmlEl.querySelector('div.title > div.buttons > img.icon').addEventListener('click', () => {
            this.hide();
        });

        this.htmlEl.querySelector('div.content > input.text').addEventListener('input', (e) => {
            this.layer.text = e.currentTarget.value;
            this.layer.textPosition = {x: 0, y: 0};
            this.layer.updateCanvas();
            this.updatePreview();
        });
        this.htmlEl.querySelector('div.content > input.text').addEventListener('focus', (e) => e.currentTarget.select());

        const _listOnclick = (e) => {
            const divList = e.currentTarget.parentNode.querySelector('div.list');
            divList.style.display = divList.style.display == '' || divList.style.display == 'none' ? 'block' : 'none';
        };

        this.htmlEl.querySelector('div.builtInFonts > div.button').addEventListener('click', _listOnclick.bind(this));
        this.htmlEl.querySelector('div.fontSizes > div.button').addEventListener('click', _listOnclick.bind(this));
        this.htmlEl.querySelector('div.rotate > div.button').addEventListener('click', _listOnclick.bind(this));
        
        // FONT SIZE

        el = this.htmlEl.querySelector('div.fontSizes input[type="number"]');
        el.addEventListener('input', (e) => {
            let val = parseInt(e.currentTarget.value);
            if(isNaN(val)) return;
            e.currentTarget.value = val;
            this.htmlEl.querySelector('div.fontSizes input[type="range"]').value = val;
            this.layer.fontSize = val;
            this.layer.updateCanvas();
            this.updatePreview();
        });
        el.addEventListener('focus', (e) => e.currentTarget.select());
        el.addEventListener('keydown', (e) => 
            {
                if (e.keyCode === 13)
                {
                    e.preventDefault();
                    const input = this.htmlEl.querySelector('div.fontSizes input[type="number"]');
                    if(input.value < parseInt(input.min)) input.value = input.min;
                    if(input.value > parseInt(input.max)) input.value = input.max;
                    this.htmlEl.querySelector('div.fontSizes input[type="range"]').value = input.value;
                    this.layer.fontSize = input.value;
                    this.layer.updateCanvas();
                    this.updatePreview();
                    input.parentNode.parentNode.style.display = 'none'; // hide list
                }
            }
        );
        
        this.htmlEl.querySelector('div.fontSizes input[type="range"]').addEventListener('input', (e) => {
            this.layer.fontSize = e.currentTarget.value;
            this.htmlEl.querySelector('div.fontSizes input[type="number"]').value = e.currentTarget.value;
            this.layer.updateCanvas();
            this.updatePreview();
        });


        // ROTATION

        el = this.htmlEl.querySelector('div.rotate input[type="number"]');
        el.addEventListener('input', (e) => {
            let val = parseInt(e.currentTarget.value);
            if(isNaN(val)) return;
            e.currentTarget.value = val;
            this.htmlEl.querySelector('div.rotate input[type="range"]').value = val;
            this.layer.rotation = parseFloat(val);
            this.layer.updateCanvas();
            this.updatePreview();
        });
        el.addEventListener('focus', (e) => e.currentTarget.select());
        el.addEventListener('keydown', (e) => 
            {
                if (e.keyCode === 13)
                {
                    e.preventDefault();
                    const input = this.htmlEl.querySelector('div.rotate input[type="number"]');
                    if(input.value < parseInt(input.min)) input.value = input.min;
                    if(input.value > parseInt(input.max)) input.value = input.max;
                    this.htmlEl.querySelector('div.rotate input[type="range"]').value = input.value;
                    this.layer.rotation = parseFloat(input.value);
                    this.layer.updateCanvas();
                    this.updatePreview();
                    input.parentNode.parentNode.style.display = 'none'; // hide list
                }
            }
        );
        
        this.htmlEl.querySelector('div.rotate input[type="range"]').addEventListener('input', (e) => {
            this.layer.rotation = parseFloat(e.currentTarget.value);
            this.htmlEl.querySelector('div.rotate input[type="number"]').value = e.currentTarget.value;
            this.layer.updateCanvas();
            this.updatePreview();
        });


        // FILTERS
        
        el = this.htmlEl.querySelector('div.filters > div.button');
        el.addEventListener('click', _listOnclick);
        el.addEventListener('click', () => {
            createFiltersList(
                this.c3d, 
                this.htmlEl.querySelector('div.filters > div.list'), 
                'textLayer'
            );
        });



        const _listClickOutside = (e) =>
        {
            if(!this.htmlEl.querySelector('div.builtInFonts > div.list').contains(e.target) && !this.htmlEl.querySelector('div.builtInFonts > div.button').contains(e.target))
            {
                this.htmlEl.querySelector('div.builtInFonts > div.list').style.display = 'none';
            }
            if(!this.htmlEl.querySelector('div.fontSizes > div.list').contains(e.target) && !this.htmlEl.querySelector('div.fontSizes > div.button').contains(e.target))
            {
                this.htmlEl.querySelector('div.fontSizes > div.list').style.display = 'none';
            }
            if(!this.htmlEl.querySelector('div.rotate > div.list').contains(e.target) && !this.htmlEl.querySelector('div.rotate > div.button').contains(e.target))
            {
                this.htmlEl.querySelector('div.rotate > div.list').style.display = 'none';
            }
            if(!this.htmlEl.querySelector('div.filters > div.list').contains(e.target) && !this.htmlEl.querySelector('div.filters > div.button').contains(e.target))
            {
                this.htmlEl.querySelector('div.filters > div.list').style.display = 'none';
            }
        };
        window.addEventListener('click', _listClickOutside);
        window.addEventListener('touchstart', _listClickOutside);

 
        this._addCustomFontInput(); // add custom font input

    }


    async show(layer)
    {
        // load builtInFonts
        if(this.builtInFonts.length == 0)
        {
            await this._loadBuiltInFonts();
        }

        // set top of window
        this.htmlEl.style.zIndex = this.c3d.zIndex.index;

        //
        document.querySelector(this.c3d.props.layers).style.opacity = 0.25;

        // as default show window
        this.htmlEl.querySelector('div.content').style.display = 'flex'; // show content
        this.htmlEl.querySelector('div.title > div.buttons > img.rollup').style.rotate = '180deg';

        // set active layer and preview canvas
        this.layer = layer;
        const canvasPreview = this.htmlEl.querySelector('canvas.preview');

        // parse print dims.
        const printDims = getPrintDims(this.c3d, this.layer, 72);
        const printWidth = printDims.width;
        const printHeight = printDims.height;
        
        // set preview canvas dims.
        const previewDims = calculateAspectRatioFit(printWidth, printHeight, 150, 150);
        canvasPreview.style.width = Math.floor(previewDims.width) + 'px';
        canvasPreview.style.height = Math.floor(previewDims.height) + 'px';
        canvasPreview.width = previewDims.width;
        canvasPreview.height = previewDims.height;

        // set window position
        const bb = document.querySelector(this.c3d.props.layers).getBoundingClientRect();
        const bbContainer = document.querySelector(this.c3d.props.container).getBoundingClientRect();
        const top = bb.top - bbContainer.y + (isMobile() ? 32 : 0);
        const left = bb.left + (isMobile() ? 32 : bb.width + 16);

        this.c3d.imageLayer.hide();
        this.c3d.shapeLayer.hide();

        this.htmlEl.style.left = left + 'px';
        this.htmlEl.style.top = top + 'px';
        this.htmlEl.style.display = 'block';

        // reset window vars
        this.htmlEl.querySelector('div.fontSizes input[type="range"]').value = this.layer.fontSize;
        this.htmlEl.querySelector('div.fontSizes input[type="number"]').value = this.layer.fontSize;
        this.htmlEl.querySelector('div.rotate input[type="range"]').value = this.layer.rotation;
        this.htmlEl.querySelector('div.rotate input[type="number"]').value = this.layer.rotation;
        this.htmlEl.querySelector('div.content > input.text').value = this.layer.text;

        // set class vars
        if(!this.layer.color)
        {
            const ce = this.c3d.colorEngine;
            ce.invert('#eeff00', false, false);
            this.layer.color = ce.color;
            this.colorPicker.setColor(ce.color);
        }
        else
        {
            this.colorPicker.setColor(this.layer.color);
        }
        
        this.updatePreview();
    }

    hide()
    {
        this.htmlEl.style.display = 'none';
        document.querySelector(this.c3d.props.layers).style.opacity = 1;
    }

    async addBase64Font(o)
    {
        if(this._checkIfFontExists(o.postscript_name)) return;

        const listDiv = this.htmlEl.querySelector('div.builtInFonts > div.list');
        const data = await (await fetch(o.base64)).arrayBuffer(); // https://stackoverflow.com/questions/21797299/how-can-i-convert-a-base64-string-to-arraybuffer/41106346#comment124033543_49273187
        const font = new FontFace(o.postscript_name, data);

        // add to doc
        await font.load();
        document.fonts.add(font);
        
        // add to custom fonts array
        this.customFonts.push({
            postscript_name: o.postscript_name,
            name: o.name,
            base64: o.base64
        }); 

        // add to html div
        this._addFontToList(listDiv, {name: o.name, postscript_name: o.postscript_name}, true);

        // set active font
        this.layer.font = o.postscript_name;

    }

    getFontData(postscript_name)
    {
        const fonts = this.builtInFonts.concat(this.customFonts);
        
        for (let i = 0; i < fonts.length; i++)
        {
            if(fonts[i].postscript_name == postscript_name)
            {
                return fonts[i];
            }
        }
    }

    isCustomFont(postscript_name)
    {        
        for (let i = 0; i < this.customFonts.length; i++)
        {
            if(this.customFonts[i].postscript_name == postscript_name)
            {
                return true;
            }
        }

        return false;
    }



    updatePreview(drawLines = false)
    {
        if(!this.layer.textPosition) return;

        const canvas = this.htmlEl.querySelector('canvas.preview');
        const ctx = canvas.getContext('2d');
        const layer = this.layer;
        const snapX = Math.abs(layer.textPosition.x) < 5;
        const snapY = Math.abs(layer.textPosition.y) < 5;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.globalAlpha = layer.opacity / 100;
        ctx.drawImage(layer.canvas, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        if(drawLines)
        {
            const ce = this.c3d.colorEngine;
            ce.invert(canvas.style.backgroundColor, true, false);
            ctx.beginPath();
            ctx.setLineDash([3, 2]);
            ctx.strokeStyle = ce.color;
            ctx.lineWidth = 1;
            if(snapY)
            {
                ctx.moveTo(0, Math.round(canvas.height / 2));
                ctx.lineTo(canvas.width, Math.round(canvas.height / 2));
            }
            if(snapX)
            {
                ctx.moveTo(Math.round(canvas.width / 2), 0);
                ctx.lineTo(Math.round(canvas.width / 2), canvas.height);
            }
            ctx.stroke();
        }

        this.layer.updateThumbnail(canvas);
        this.c3d.render3d.renderView(this.layer.name);
        this.c3d.render2d.renderView(this.layer.name);
    }



    // https://stackoverflow.com/a/71536843
    async _loadFont(name, url)
    {
        const font = new FontFace(name, 'url(' + C3D_SERVER + url + ')');
        await font.load();
        document.fonts.add(font);
    }

    // https://stackoverflow.com/a/42272155
    async _loadBuiltInFonts()
    {
        const url = 'fonts/fonts.json?c3d=0.5.1'; // load all built-in fonts
        
        this.c3d.preloader.show();
        this.c3d.preloader.set(url);

        const listDiv = this.htmlEl.querySelector('div.builtInFonts > div.list');
        const response = await fetch(C3D_SERVER + url);
        const json = await response.json();
        
        for (let i = 0; i < json.length; i++)
        {
            const data = json[i];
            
            if(this._checkIfFontExists(data.postscript_name)) continue;

            const url = 'fonts/' + data.url;
            
            this.c3d.preloader.set(url);
            
            // add to doc
            await this._loadFont(data.postscript_name, url);

            // get uint8Array (https://stackoverflow.com/a/77388622)
            const response = await fetch(C3D_SERVER + url);
            const blob = await response.blob();
            json[i]['base64'] = await new Promise((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result)
                reader.readAsDataURL(blob)
            });

            // add to list
            this._addFontToList(listDiv, json[i]);

            // add to builtInFonts
            this.builtInFonts.push(data);
        }

        this.c3d.preloader.hide();
    }

    _addFontToList(listDiv, data, prepend = false)
    {
        const p = document.createElement('p');
        p.innerText = data.name;
        p.style.fontFamily = data.postscript_name;
        p.addEventListener('click', (e) => {
            this.layer.font = data.postscript_name;
            e.currentTarget.parentNode.style.display = 'none'; // hide list
            this.layer.updateCanvas();
            this.updatePreview();
        });
        listDiv[prepend ? 'prepend' : 'append'](p);
    }


    _addCustomFontInput()
    {
        const list = this.htmlEl.querySelector('div.content > div.input > div.list');

        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', '.ttf, .otf');
        input.setAttribute('id', this._customFontInputID);
        
        list.prepend(input);

        const label = document.createElement('label');
        label.setAttribute('for', this._customFontInputID);
        label.innerText = this.c3d.lang['load-custom-font'];
        list.prepend(label);

        input.addEventListener('change', this._customFontInputHandler.bind(this));

    }

    async _customFontInputHandler(e)
    {
        e.preventDefault();

        const file = e.currentTarget.files[0];

        if(!file) return;
        
        // check file type
        let header = '';
        const arrayBuffer = await file.arrayBuffer();
        const fileSignature = new Uint8Array(arrayBuffer).subarray(0, 4).forEach((v) => header+=v.toString(16));
        
        if(header != '0100' && header != '4f54544f')
        {
            alert('File Type mismatch!!\nSupported file type is [.ttf, .otf]');
            return;
        }
        
        const reader = new FileReader();
        const self = this;
        
        reader.onloadend = async function(e)
        {
            const listDiv = self.htmlEl.querySelector('div.builtInFonts > div.list');
            const data = await file.arrayBuffer(); // https://stackoverflow.com/a/61644025
            const fontData = opentype.parse(data);
            const name = fontData.names.fontFamily.en;
            const postscript_name = fontData.names.postScriptName.en;
            
            // check if exist
            if(self._checkIfFontExists(postscript_name))
            {
                // set active font
                self.layer.font = postscript_name;

                // update preview
                self.updatePreview();

                return;
            }
            
            self.customFonts.push({
                postscript_name,
                name,
                base64: this.result   
            });

            const font = new FontFace(postscript_name, data);
            await font.load();
            document.fonts.add(font);

            // add to list
            self._addFontToList(listDiv, {name, postscript_name}, true);
            
            // set active font
            self.layer.font = postscript_name;

            // update preview
            self.updatePreview();
            self.layer.updateCanvas();
        }

        reader.readAsDataURL(file);
    }

    _checkIfFontExists(postscript_name)
    {
        const fonts = this.builtInFonts.concat(this.customFonts);
        
        for (let i = 0; i < fonts.length; i++)
        {
            if(fonts[i].postscript_name == postscript_name)
            {
                return true;
            }
        }

        return false;
    }

}
