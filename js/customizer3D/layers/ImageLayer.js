import {Dragable} from 'customizer3D_dir/dragable/Dragable.js?c3d=0.5.7';
import {Size} from 'customizer3D_dir/utils/Size.js?c3d=0.5.7';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=0.5.7';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.5.7';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.5.7';
import {ExtractImages} from 'customizer3D_dir/layers/utils/ExtractImages.js?c3d=0.5.7';
import {createFiltersList, applyFilters} from 'customizer3D_dir/layers/Filters/Filters.js?c3d=0.5.7';
import {createEffectsList, applyEffects} from 'customizer3D_dir/layers/Effects/Effects.js?c3d=0.5.7';
import {degToRad} from 'customizer3D_dir/utils/degToRad.js?c3d=0.5.7';

export class ImageLayer
{
    constructor(c3d)
    {
        this.c3d = c3d;

        this.htmlEl = document.createElement('div');
        this.htmlEl.classList.add('imageLayer');
        document.querySelector(this.c3d.props.container).append(this.htmlEl);

        this.layer = null; // active layer (new Image(): Image.js)
        this._selectImageIDIncrement = 0; // <input id=
        this._selectImageID = 'C3D_selectImageInput'; // <input id= id + increment

        let el;

        this.htmlEl.innerHTML = `
        <div class="title">
            <p class="label" draggable="false">${this.c3d.lang['add-image-layer']}</p>
            <div class="buttons">
                <img src="${C3D_SERVER}svg/arrow-drop-down.svg?c3d=0.5.7" alt="Icon" class="rollup" draggable="false" style="rotate:-180deg;">
                <img src="${C3D_SERVER}svg/plus.svg?c3d=0.5.7" alt="Icon" class="icon" draggable="false" style="rotate:45deg;">
            </div>
        </div>

        <div class="content">
            <div class="menu">
                <div class="selectImage">
                    <label class="selectImage"><img src="" alt="Icon"></label>
                    <div class="inputs"></div>
                </div>
                <div class="rotate">
                    <div class="button" title="${this.c3d.lang['rotate']}"><img src="${C3D_SERVER}svg/rotate.svg?c3d=0.5.7" alt="Icon"></div>
                    <div class="list">
                        <div class="inputPercent" data-icon="°" title="${this.c3d.lang['degree']}">
                            <input type="number" min="-180" max="180" value="0">
                        </div>
                        <input type="range" min="-180" max="180" value="0" step="1">
                    </div>
                </div>
                <div class="zoom">
                    <div class="button" title="${this.c3d.lang['zoom']}"><img src="${C3D_SERVER}svg/zoom.svg?c3d=0.5.7" alt="Icon"></div>
                    <div class="list">
                        <div class="inputPercent" data-icon="%"><input type="number" min="1" max="2000" value="100"></div>
                        <input type="range" min="1" max="2000" value="100" step="0.5">
                    </div>
                </div>
                <div class="filters">
                    <div class="button" title="${this.c3d.lang['filter-gallery']}"><img src="${C3D_SERVER}svg/filters.svg?c3d=0.5.7" alt="Icon"></div>
                    <div class="list">
                    </div>
                </div>
                <div class="effects">
                    <div class="button" title="${this.c3d.lang['effects-gallery']}"><img src="${C3D_SERVER}svg/effects.svg?c3d=0.5.7" alt="Icon"></div>
                    <div class="list">
                    </div>
                </div>
            </div>
            <canvas class="preview" oncontextmenu="return false;"></canvas>
            <p class="smaller-than-preffered"></p>
        </div>`;

        const dragable = new Dragable({
            dragEl: this.htmlEl.querySelector('div.title'),
            container: this.htmlEl,
            root: document.querySelector(this.c3d.props.container),
            c3d: this.c3d
        });

        this.htmlEl.querySelector('div.title > div.buttons > img.rollup').addEventListener('click', (e) => {
            const content = this.htmlEl.querySelector('div.content');
            const visible = content.style.display == 'none' || content.style.display == '' ;
            content.style.display = visible ? 'flex' : 'none';
            e.currentTarget.style.rotate = visible ? '-180deg' : '0deg';
        });

        this.htmlEl.querySelector('div.title > div.buttons > img.icon').addEventListener('click', () => {
            this.hide();
        });

        // Click outside of element

        const _listClickOutside = (e) => // !!!
        {
            if(!this.htmlEl.querySelector('div.rotate > div.list').contains(e.target) && !this.htmlEl.querySelector('div.rotate > div.button').contains(e.target))
            {
                this.htmlEl.querySelector('div.rotate > div.list').style.display = 'none';
            }

            if(!this.htmlEl.querySelector('div.zoom > div.list').contains(e.target) && !this.htmlEl.querySelector('div.zoom > div.button').contains(e.target))
            {
                this.htmlEl.querySelector('div.zoom > div.list').style.display = 'none';
            }

            if(!this.htmlEl.querySelector('div.filters > div.list').contains(e.target) && !this.htmlEl.querySelector('div.filters > div.button').contains(e.target))
            {
                this.htmlEl.querySelector('div.filters > div.list').style.display = 'none';
            }

            if(!this.htmlEl.querySelector('div.effects > div.list').contains(e.target) && !this.htmlEl.querySelector('div.effects > div.button').contains(e.target))
            {
                this.htmlEl.querySelector('div.effects > div.list').style.display = 'none';
            }
        };
        window.addEventListener('click', _listClickOutside);
        window.addEventListener('touchstart', _listClickOutside);


        const _listOnclick = (e) =>
        {
            const divList = e.currentTarget.parentNode.querySelector('div.list');
            divList.style.display = divList.style.display == '' || divList.style.display == 'none' ? 'block' : 'none';
        };



        // ROTATION

        this.htmlEl.querySelector('div.rotate > div.button').addEventListener('click', _listOnclick);
        el = this.htmlEl.querySelector('div.rotate input[type="number"]');
        el.addEventListener('input', (e) => {
            let val = parseFloat(e.currentTarget.value);
            if(isNaN(val)) return;
            e.currentTarget.value = val;
            this.htmlEl.querySelector('div.rotate input[type="range"]').value = val;
            this.layer.rotation = val;
            this.updatePreview();
        });
        el.addEventListener('focus', (e) => e.currentTarget.select());
        el.addEventListener('keydown', (e) => {
            if (e.keyCode === 13)
            {
                e.preventDefault();
                const input = this.htmlEl.querySelector('div.rotate input[type="number"]');
                if(input.value < parseInt(input.min)) input.value = input.min;
                if(input.value > parseInt(input.max)) input.value = input.max;
                this.htmlEl.querySelector('div.rotate input[type="range"]').value = input.value;
                this.layer.rotation = parseFloat(input.value);
                input.parentNode.parentNode.style.display = 'none'; // hide list
                this.updatePreview();
            }
        });
        
        this.htmlEl.querySelector('div.rotate input[type="range"]').addEventListener('input', (e) => {
            this.layer.rotation = parseFloat(e.currentTarget.value);
            this.htmlEl.querySelector('div.rotate input[type="number"]').value = e.currentTarget.value;
            this.updatePreview();
        });

        // ZOOM

        this.htmlEl.querySelector('div.zoom > div.button').addEventListener('click', _listOnclick);
        el = this.htmlEl.querySelector('div.zoom input[type="number"]');
        el.addEventListener('input', (e) => {
            let val = parseFloat(e.currentTarget.value);
            if(isNaN(val)) return;
            e.currentTarget.value = val;
            this.htmlEl.querySelector('div.zoom input[type="range"]').value = val;
            this.layer.zoom = val;
            this.updatePreview();
        });
        el.addEventListener('focus', (e) => e.currentTarget.select());
        el.addEventListener('keyup', (e) => {
            const input = this.htmlEl.querySelector('div.zoom input[type="number"]');
            if(parseInt(input.value) < parseInt(input.min)) input.value = input.min;
            if(parseInt(input.value) > parseInt(input.max)) input.value = input.max;
            this.htmlEl.querySelector('div.zoom input[type="range"]').value = input.value;
            this.layer.zoom = parseFloat(input.value);
            this.updatePreview();
            if(e.keyCode === 13) input.parentNode.parentNode.style.display = 'none'; // hide list
        });
        
        this.htmlEl.querySelector('div.zoom input[type="range"]').addEventListener('input', (e) => {
            this.layer.zoom = parseFloat(e.currentTarget.value);
            this.htmlEl.querySelector('div.zoom input[type="number"]').value = e.currentTarget.value;
            this.updatePreview();
        });


        // FILTERS
        
        el = this.htmlEl.querySelector('div.filters > div.button');
        el.addEventListener('click', _listOnclick);
        el.addEventListener('click', () => {
            createFiltersList(
                this.c3d, 
                this.htmlEl.querySelector('div.filters > div.list'), 
                'imageLayer'
            );
        });


        // EFFECTS
        
        el = this.htmlEl.querySelector('div.effects > div.button');
        el.addEventListener('click', _listOnclick);
        el.addEventListener('click', () => {
            createEffectsList(
                this.c3d, 
                this.htmlEl.querySelector('div.effects > div.list'), 
                'imageLayer'
            );
        });


        // CANVAS

        const canvasPreview = this.htmlEl.querySelector('canvas.preview');

        const canvasMouseMove = (e) =>
        {
            // https://stackoverflow.com/a/69023543
            const touch = (e.touches && e.touches[0]) || (e.pointerType && e.pointerType === 'touch' && e);
            const clientX = (touch || e).clientX;
            const clientY = (touch || e).clientY;
            const bb = canvasPreview.getBoundingClientRect();

            this.layer.imagePosition =
            {
                x: -canvasPreview.width / 2 + ((clientX - bb.x) * this.c3d.PIXEL_RATIO), 
                y: -canvasPreview.height / 2 + ((clientY - bb.y) * this.c3d.PIXEL_RATIO)
            };
            
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
             this.updatePreview();
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

        // show preferred size notice
        const smallerThanPreffered = this.c3d.lang['smaller-than-preffered'].replace('[warningIcon]', '<img src="' + C3D_SERVER + 'svg/warning.svg?c3d=0.5.7" alt="Icon">');
        this.htmlEl.querySelector('p.smaller-than-preffered').innerHTML = smallerThanPreffered;
        
    }


    show(layer)
    {
        // set active layer
        if(layer) this.layer = layer;
        const canvasPreview = this.htmlEl.querySelector('canvas.preview');

        //
        this.c3d.showHideUI.hideSubWindows();
        document.querySelector(this.c3d.props.layers).style.opacity = 0.25;


        this.htmlEl.querySelector('div.rotate').style.display = 'block';
        this.htmlEl.querySelector('div.rotate input[type="range"]').value = this.layer.rotation;
        this.htmlEl.querySelector('div.rotate input[type="number"]').value = this.layer.rotation;

        this.htmlEl.querySelector('div.zoom').style.display = 'block';
        this.htmlEl.querySelector('div.zoom input[type="range"]').value = this.layer.zoom;
        this.htmlEl.querySelector('div.zoom input[type="number"]').value = this.layer.zoom;

        this.htmlEl.querySelector('div.filters').style.display = 'block';
        this.htmlEl.querySelector('div.effects').style.display = 'block';
        canvasPreview.style.display = 'block';

        // hide notice
        this.htmlEl.querySelector('p.smaller-than-preffered').style.display = 'none';
        
        // set top of window
        this.htmlEl.style.zIndex = this.c3d.zIndex.index;

        // 
        const printDims = getPrintDims(this.c3d, this.layer, 72);
        const printWidth = printDims.width;
        const printHeight = printDims.height;

        // extract image(s)
        if(this.layer.image != null && this.layer.detectedFileType != 'image/svg+xml')
        {            
            // show notice when file dimensions are small
            const pixelWidth = Math.round(new Size({size:printDims.originalSize.width, DPI:300}).px);
            const pixelHeight = Math.round(new Size({size:printDims.originalSize.height, DPI:300}).px);
            
            if(this.layer.image.naturalWidth < pixelWidth || this.layer.image.naturalHeight < pixelHeight)
            {
                this.htmlEl.querySelector('p.smaller-than-preffered').style.display = 'flex';
                setTimeout(() => {
                    this.htmlEl.querySelector('p.smaller-than-preffered').style.display = 'none';
                }, 10000);
            }
            else
            {
                this.htmlEl.querySelector('p.smaller-than-preffered').style.display = 'none';
            }
        }

        // as default show window
        this.htmlEl.querySelector('div.content').style.display = 'flex'; // show content
        this.htmlEl.querySelector('div.title > div.buttons > img.rollup').style.rotate = '180deg';


        // add input for layer
        if(layer.input == null) this.layer.input = this._addSelectImageInput();
        if(!layer.image)
        {
            canvasPreview.style.display = 'none';
            this.htmlEl.querySelector('div.effects').style.display = 
            this.htmlEl.querySelector('div.rotate').style.display = 
            this.htmlEl.querySelector('div.zoom').style.display = 
            this.htmlEl.querySelector('div.filters').style.display = 'none';
        }


        // set window position
        const bb = document.querySelector(this.c3d.props.layers).getBoundingClientRect();
        const bbContainer = document.querySelector(this.c3d.props.container).getBoundingClientRect();
        const top = bb.top - bbContainer.y + 32;
        let left = bb.left;
        if(bb.width + bb.x > bbContainer.width + bbContainer.x) left = bbContainer.width + bbContainer.x - bb.width;
        // this.htmlEl.style.left = left + 'px';
        this.htmlEl.style.top = top + 'px';
        this.htmlEl.style.display = 'block';

        // set preview canvas dims.
        const previewDims = calculateAspectRatioFit(printWidth, printHeight, 150, 150);
        canvasPreview.style.width = Math.floor(previewDims.width) + 'px';
        canvasPreview.style.height = Math.floor(previewDims.height) + 'px';
        canvasPreview.width = previewDims.width * this.c3d.PIXEL_RATIO;
        canvasPreview.height = previewDims.height * this.c3d.PIXEL_RATIO;
        
        // update or add image
        const selectImage = this.htmlEl.querySelector('div.selectImage > label.selectImage');
        selectImage.title = this.c3d.lang[this.layer.image ? 'change-image' : 'select-images'];
        selectImage.querySelector('img').src = C3D_SERVER + 'svg/' + (this.layer.image ? 'change_image' : 'image') + '.svg';
        selectImage.setAttribute('for', this.layer.input.id);

        this.updatePreview();
    }

    hide()
    {
        this.htmlEl.style.display = 'none';
        document.querySelector(this.c3d.props.layers).style.opacity = 1;
    }


    updatePreview(drawLines = false, render = true)
    {
        if(!this.layer || !this.layer.image) return;

        const canvas = this.htmlEl.querySelector('canvas.preview');
        const ctx = canvas.getContext('2d', {willReadFrequently: true});
        const layer = this.layer;
        const snapX = Math.abs(layer.imagePosition.x) < 5;
        const snapY = Math.abs(layer.imagePosition.y) < 5;
        const multiplyer = Math.max(1, layer.zoom / 100);
        const x = layer.imagePosition.x * multiplyer;
        const y = layer.imagePosition.y * multiplyer;
        const fx = Object.keys(layer.effects).length > 0;
        const source = fx ? layer.effectsCanvas : layer.image;
        const textureDims = calculateAspectRatioFit(
            source[fx ? 'width' : 'naturalWidth'], 
            source[fx ? 'height' : 'naturalHeight'], 
            canvas.width,
            canvas.height
        );
        
        if(snapX && drawLines) layer.imagePosition.x = 0;
        if(snapY && drawLines) layer.imagePosition.y = 0;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.globalCompositeOperation = layer.blendMode;
        ctx.globalAlpha = layer.opacity / 100;
        ctx.translate(canvas.width / 2 + x, canvas.height / 2 + y);
        ctx.rotate(degToRad(layer.rotation));
        ctx.scale(layer.zoom / 100, layer.zoom / 100);
        ctx.drawImage(
            layer.canvas, 
            -textureDims.width / 2, 
            -textureDims.height / 2, 
            textureDims.width, 
            textureDims.height
        );
        ctx.restore();

        if(drawLines)
        {        
            ctx.beginPath();
            ctx.setLineDash([5, 3]);
            ctx.strokeStyle = '#000';
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
        
        if(render)
        {
            this.c3d.render3d.renderView(this.layer.name);
            this.c3d.render2d.renderView(this.layer.name);
        }

    }





    // PRIVATE METHODS

    async _selectImageInputHandler(e)
    {
        e.preventDefault();

        if(!e.target.files) return;

        document.querySelector(this.c3d.props.layers).style.visibility = 'hidden';

        const layerName = this.layer.name; // blender mesh name 
        const layersDivContent = document.querySelector(this.c3d.props.layers + ' > div.content');
        const layers = layersDivContent.querySelector('div.'+ layerName +' > div.content > div.layers');
        const extractImages = new ExtractImages({c3d: this.c3d});

        if(!this.layer.image) this.layer.root.querySelector('img.remove').click(); // delete empty layer

        for(let i = 0; i < e.target.files.length; i++)
        {
            const file = e.target.files[i];
            const blobArray = (await extractImages.extract(file)).reverse();
            
            this.c3d.preloader.show();

            for(let j = 0; j < blobArray.length; j++)
            {                
                const data = blobArray[j]; // {blob, detectedFileType}

                this.c3d.preloader.set(
                    this.c3d.lang['getting-image-data'] + ' ' + 
                    this.c3d.lang['file'] + ': ' + 
                    ((j + 1) + ' - ' + blobArray.length)
                );

                // create new image set class var.
                const img = new Image();
                img.src = URL.createObjectURL(data.blob);
                await img.decode();
                // img.onload = () => URL.revokeObjectURL(img.src);
                
                // add layer
                if(this.layer.image && e.target.files.length == 1 && blobArray.length == 1)
                {
                    this.layer.image = img;
                    this.layer.detectedFileType = data.detectedFileType;
                    this.layer.fileName = file.name;
                }
                else
                {
                    this.layer = await this.c3d.layers.addImage(layers, {
                        image: img, 
                        detectedFileType: data.detectedFileType, 
                        fileName: file.name
                    });
                }
                
                // update UI
                document.querySelector(this.c3d.props.layers).style.visibility = 'visible';
                this.c3d._setNavActive(layerName, false, false); // update only style.maxHeight
                this.show(this.layer);
                applyEffects(this.c3d, this.layer, 'imageLayer');
                applyFilters(this.c3d, this.layer, 'imageLayer');
                this.updatePreview();
                
            }
        }

        if(e.target.files.length > 1) this.hide();
        this.c3d.preloader.hide();
        document.querySelector(this.c3d.props.layers).style.visibility = 'visible';
    }

    _addSelectImageInput()
    {
        const id = this._selectImageID + this._selectImageIDIncrement;
        const inputs = this.htmlEl.querySelector('div.selectImage > div.inputs');
        
        const input = document.createElement('input');
        input.setAttribute('id', id);
        input.setAttribute('multiple', '');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*, application/pdf');
        input.addEventListener('change', this._selectImageInputHandler.bind(this));
        input.addEventListener('cancel', () => {
            if(!this.layer.image) this.layer.root.querySelector('img.remove').click();
        });
        inputs.appendChild(input);

        this._selectImageIDIncrement++;

        return input;
    }

}
