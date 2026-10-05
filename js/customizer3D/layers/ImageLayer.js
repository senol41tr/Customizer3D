import {Dragable} from 'customizer3D_dir/dragable/Dragable.js?c3d=0.5.0';
import {Size} from 'customizer3D_dir/utils/Size.js?c3d=0.5.0';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=0.5.0';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.5.0';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.5.0';
import {ExtractImages} from 'customizer3D_dir/layers/utils/ExtractImages.js?c3d=0.5.0';
import {createFiltersList} from 'customizer3D_dir/layers/Filters/Filters.js?c3d=0.5.0';
import {degToRad} from 'customizer3D_dir/utils/degToRad.js?c3d=0.5.0';

export class ImageLayer
{
    constructor(c3d)
    {
        this.c3d = c3d;
        this.htmlEl = document.querySelector(this.c3d.props.imageLayer);

        this.layer = null; // active layer (new Image(): Image.js)
        this._selectImageIDIncrement = 0; // <input id=
        this._selectImageID = 'C3D_selectImageInput'; // <input id= id + increment

        let el;

        this.htmlEl.innerHTML = `
        <div class="title">
            <p class="label" draggable="false">${this.c3d.lang['add-image-layer']}</p>
            <div class="buttons">
                <img src="${C3D_SERVER}svg/arrow-drop-down.svg?c3d=0.5.0" alt="Icon" class="rollup" draggable="false" style="rotate:-180deg;">
                <img src="${C3D_SERVER}svg/plus.svg?c3d=0.5.0" alt="Icon" class="icon" draggable="false" style="rotate:45deg;">
            </div>
        </div>

        <div class="content">
            <div class="menu">
                <div class="selectImage">
                    <label class="selectImage"><img src="" alt="Icon"></label>
                    <div class="inputs"></div>
                </div>
                <div class="rotate">
                    <div class="button" title="${this.c3d.lang['rotate']}"><img src="${C3D_SERVER}svg/rotate.svg?c3d=0.5.0" alt="Icon"></div>
                    <div class="list">
                        <div class="inputPercent" data-icon="°" title="${this.c3d.lang['degree']}">
                            <input type="number" min="-180" max="180" value="0">
                        </div>
                        <input type="range" min="-180" max="180" value="0" step="1">
                    </div>
                </div>
                <div class="zoom">
                    <div class="button" title="${this.c3d.lang['zoom']}"><img src="${C3D_SERVER}svg/zoom.svg?c3d=0.5.0" alt="Icon"></div>
                    <div class="list">
                        <div class="inputPercent" data-icon="%"><input type="number" min="10" max="2000" value="100"></div>
                        <input type="range" min="10" max="2000" value="100" step="1">
                    </div>
                </div>
                <div class="filters">
                    <div class="button" title="${this.c3d.lang['filter-gallery']}"><img src="${C3D_SERVER}svg/filters.svg?c3d=0.5.0" alt="Icon"></div>
                    <div class="list">
                    </div>
                </div>
            </div>
            <canvas class="preview" oncontextmenu="return false;"></canvas>
            <p class="description"></p>
            <p class="smaller-than-preffered"></p>
            <p class="convert-to-cmyk"></p>
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

        const _listClickOutside = (e) =>
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
                x: -canvasPreview.width / 2 + ((clientX - bb.x) * 2), 
                y: -canvasPreview.height / 2 + ((clientY - bb.y) * 2)
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

        // show preferred size notice
        const smallerThanPreffered = this.c3d.lang['smaller-than-preffered'].replace('[warningIcon]', '<img src="' + C3D_SERVER + 'svg/warning.svg?c3d=0.5.0" alt="Icon">');
        this.htmlEl.querySelector('p.smaller-than-preffered').innerHTML = smallerThanPreffered;
        
    }


    show(layer)
    {
        // set active layer
        if(layer) this.layer = layer;
        const canvasPreview = this.htmlEl.querySelector('canvas.preview');

        //
        document.querySelector(this.c3d.props.layers).style.opacity = 0.25;

        // hide notice
        this.htmlEl.querySelector('p.smaller-than-preffered').style.display = 'none';
        this.htmlEl.querySelector('p.description').style.display = 'none';
        
        // set top of window
        this.htmlEl.style.zIndex = this.c3d.zIndex.index;

        // 
        const printDims = getPrintDims(this.c3d, this.layer, 72);
        const printWidth = printDims.width;
        const printHeight = printDims.height;
        const originalSize = printDims.originalSize;

        // extract image(s)
        if(this.layer.image != null && this.layer.detectedFileType != 'image/svg+xml')
        {            
            // show notice when file dimensions are small
            const pixelWidth = Math.round(new Size({size:printDims.originalSize.width, DPI:300}).px);
            const pixelHeight = Math.round(new Size({size:printDims.originalSize.height, DPI:300}).px);

            const info = this.c3d.lang['preferred-image-size']
            .replace('[printSize]', originalSize.width + ' x ' + originalSize.height)
            .replace('[pixelWidth]', pixelWidth)
            .replace('[pixelHeight]', pixelHeight)
            .replace('[DPI]', 72);
            this.htmlEl.querySelector('p.description').innerHTML = info;
            
            if(this.layer.image.naturalWidth < pixelWidth || this.layer.image.naturalHeight < pixelHeight)
            {
                this.htmlEl.querySelector('p.description').style.display = 'block';
                this.htmlEl.querySelector('p.smaller-than-preffered').style.display = 'flex';
                setTimeout(() => {
                    this.htmlEl.querySelector('p.description').style.display = 'none';
                    this.htmlEl.querySelector('p.smaller-than-preffered').style.display = 'none';
                }, 10000);
            }
            else
            {
                this.htmlEl.querySelector('p.description').style.display = 'none';
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
            this.htmlEl.querySelector('div.rotate').style.display = 
            this.htmlEl.querySelector('div.zoom').style.display = 
            this.htmlEl.querySelector('div.filters').style.display = 'none';
        }


        // set window position
        const bb = document.querySelector(this.c3d.props.layers).getBoundingClientRect();
        const bbContainer = document.querySelector(this.c3d.props.container).getBoundingClientRect();
        const top = bb.top - bbContainer.y + (isMobile() ? 32 : 0);
        const left = bb.left + (isMobile() ? 32 : bb.width + 16);

        this.c3d.textLayer.hide();
        this.c3d.shapeLayer.hide();

        this.htmlEl.style.left = left + 'px';
        this.htmlEl.style.top = top + 'px';
        this.htmlEl.style.display = 'block';

        // set preview canvas dims.
        const previewDims = calculateAspectRatioFit(printWidth, printHeight, 150, 150);
        canvasPreview.style.width = Math.floor(previewDims.width) + 'px';
        canvasPreview.style.height = Math.floor(previewDims.height) + 'px';
        canvasPreview.width = previewDims.width * 2;
        canvasPreview.height = previewDims.height * 2;
        
        // update or add image
        const selectImage = this.htmlEl.querySelector('div.selectImage > label.selectImage');
        selectImage.title = this.c3d.lang[this.layer.image ? 'change-image' : 'select-images'];
        selectImage.querySelector('img').src = C3D_SERVER + 'svg/' + (this.layer.image ? 'change_image' : 'image') + '.svg';
        selectImage.setAttribute('for', this.layer.input.id);

        if(this.layer.image) this.updatePreview();
    }

    hide()
    {
        this.htmlEl.style.display = 'none';
        document.querySelector(this.c3d.props.layers).style.opacity = 1;
    }

    async toUint8Array(blob)
    {
        
        const uint8Array = await new Promise((resolve, reject) =>
        {

            const reader = new FileReader();

            reader.onload = () =>
            {
                const arrayBuffer = reader.result;
                const uint8Array = new Uint8Array(arrayBuffer);
                resolve(uint8Array);
            };

            reader.readAsArrayBuffer(blob);

        });

        return uint8Array;
    }

    async canvasToBlob(canvas)
    {        
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1));
        return blob;
    }


    updatePreview(drawLines = false)
    {
        if(this.layer == null) return;

        const canvasPreview = this.htmlEl.querySelector('canvas.preview');
        canvasPreview.style.display = 'block';
        
        this.htmlEl.querySelector('div.rotate').style.display = 'block';
        this.htmlEl.querySelector('div.rotate input[type="range"]').value = this.layer.rotation;
        this.htmlEl.querySelector('div.rotate input[type="number"]').value = this.layer.rotation;

        this.htmlEl.querySelector('div.zoom').style.display = 'block';
        this.htmlEl.querySelector('div.zoom input[type="range"]').value = this.layer.zoom;
        this.htmlEl.querySelector('div.zoom input[type="number"]').value = this.layer.zoom;

        this.htmlEl.querySelector('div.filters').style.display = 'block';

        const canvas = this.htmlEl.querySelector('canvas.preview');
        const ctx = canvas.getContext('2d', { willReadFrequently: true});
        const layer = this.layer;
        const snapX = Math.abs(layer.imagePosition.x) < 5;
        const snapY = Math.abs(layer.imagePosition.y) < 5;

        const {width, height} = calculateAspectRatioFit(layer.image.width, layer.image.height, canvasPreview.width, canvasPreview.height);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if(snapX && drawLines)
        {
            layer.imagePosition.x = 0;
        }

        if(snapY && drawLines)
        {
            layer.imagePosition.y = 0;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.globalAlpha = layer.opacity / 100;
        ctx.translate(canvas.width / 2 + layer.imagePosition.x, canvas.height / 2 + layer.imagePosition.y);
        ctx.rotate(degToRad(layer.rotation));
        ctx.scale(layer.zoom / 100, layer.zoom / 100);
        ctx.drawImage(layer.canvas, -width / 2, -height / 2, width, height);
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
        this.c3d.render3d.renderView(this.layer.name);
        this.c3d.render2d.renderView(this.layer.name);
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

        this.layer.root.querySelector('img.remove').click(); // delete empty layer

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
                this.layer = await this.c3d.layers.addImage(layers, {
                    input: file, 
                    image: img, 
                    detectedFileType: data.detectedFileType, 
                    fileName: file.name
                });

                // update UI
                document.querySelector(this.c3d.props.layers).style.visibility = 'visible';
                this.c3d._setNavActive(layerName, false); // update only style.maxHeight
                this.show(this.layer);
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
        input.addEventListener('cancel', () =>
        {
            if(!this.layer.image) 
            {
                this.layer.root.querySelector('img.remove').click();
            }
        });
        inputs.appendChild(input);

        this._selectImageIDIncrement++;

        return input;
    }

}
