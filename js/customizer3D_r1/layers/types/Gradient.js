import * as THREE from 'three';
import ColorPicker from 'base/jscolorpicker/colorpicker.js?c3d=101';

export class Gradient
{
    constructor(c3d, layer)
    {
        this.MAX_GRADIENT_COLORS = 5;

        this.c3d = c3d;
        this.layer = layer;

        this._colorPickers = new Array(this.MAX_GRADIENT_COLORS);
        if(this.layer.gradientOptions) this.options = this.layer.gradientOptions;
        else this.layer.gradientOptions = this.options = {
            colors: new Array(this.MAX_GRADIENT_COLORS),
            isRadial: false,
            angle: 0.0,
            scale: 0.0
        };

    }

    hide()
    {
        const three = this.c3d.imageLayer.three;
        const renderer = three.scene.getObjectByName('texture');
        const uniforms = renderer.material.uniforms;

        uniforms.uIsGradient.value = 0;
    }

    show()
    {
        this._createOptions();
        if(!this.options.colors[0]) this.randomize();
    }

    update()
    {
        const canvas = this.bakeImageToLayer(null, null, true);
        this.layer.image = canvas;

        this.c3d.imageLayer.updatePreview(null, true, false);
        this.c3d.three.render();
    }

    randomize()
    {
        const gradientDiv = this.c3d.imageLayer.htmlEl.querySelector('div.content > div.menu > div.gradient');
        gradientDiv.querySelector('button.randomize').click();
    }


    bakeImageToLayer(width, height, getCanvas = false, exportToPDF = false)
    {
        const three = this.c3d.imageLayer.three;
        const renderer = three.scene.getObjectByName('texture');

        const tex = renderer.material.uniforms.tDiffuse.value;
        const w = width ? Math.round(width) : tex.image.width;
        const h = height ? Math.round(height) : tex.image.height;

        const oldCanvasSize = {...three._canvasDims};

        three.renderer.setPixelRatio(1);
        three._onResize(null, w, h);

        this.setUniforms();
        
        three.render();

        // COPY CANVAS
        const textureCanvas = three.getCanvas();
        const canvasImage = document.createElement('canvas');
        const canvasImageCtx = canvasImage.getContext('2d');
        canvasImage.width = w;
        canvasImage.height = h;
        canvasImageCtx.drawImage(textureCanvas, 0, 0, w, h);

        // RESTORE
        three.renderer.setPixelRatio(this.c3d.PIXEL_RATIO);
        three._onResize(null, oldCanvasSize.width, oldCanvasSize.height);

        if(getCanvas || exportToPDF) {
            return canvasImage;
        }
    }

    setUniforms()
    {
        const three = this.c3d.imageLayer.three;
        const renderer = three.scene.getObjectByName('texture');
        const uniforms = renderer.material.uniforms;

        let colorsLength = 0;

        for (let i = 0; i < this.options.colors.length; i++)
        {
            let c = this.options.colors[i];
            if(c) colorsLength++;
            uniforms.uGradientColors.value[i] = new THREE.Color(c || 0x0);
        }
        
        uniforms.uIsGradient.value = 1;
        uniforms.uGradientCount.value = colorsLength;
        uniforms.uGradientIsRadial.value = this.options.isRadial;
        uniforms.uGradientScale.value = this.options.scale;
        uniforms.uGradientAngle.value = this.options.angle;

        three.render();

    }

    _createOptions()
    {
        const gradientDiv = this.c3d.imageLayer.htmlEl.querySelector('div.content > div.menu > div.gradient');
        const buttonCSS = 'border:none; outline:none; padding: 0.25rem; color: var(--customizerColorText); font-size: 0.7rem; background-color: transparent;';

        gradientDiv.style.width = '130px';

        gradientDiv.innerHTML = `
            <div style="display:flex; flex-direction:column; gap: 0.25rem;">
                
                <div style="display:flex; gap: 0.25rem; align-items: center;">
                    <p style="font-size: 0.65rem; opacity: 0.6; flex-basis: 40%;">Gradient Type</p>
                    <button class="type_linear" style="${buttonCSS} opacity: 0.5;">Linear</button>
                    <button class="type_radial" style="${buttonCSS}">Radial</button>
                </div>

                <div style="display:flex; gap: 0.25rem; align-items: center;">
                    <p style="font-size: 0.65rem; opacity: 0.6; flex-basis: 40%;">Rotation</p>
                    <input class="angle" type="range" min="0" max="360" value="${this.options.angle}" step="0.5" style="width:100px;">
                </div>

                <div style="display:flex; gap: 0.25rem; align-items: center;">
                    <p style="font-size: 0.65rem; opacity: 0.6; flex-basis: 40%;">Scale</p>
                    <input class="scale" type="range" min="0" max="5" value="${this.options.scale}" step="0.01" style="width:100px;">
                </div>

                <div style="display:flex; gap: 0.25rem;">
                    <p style="font-size: 0.65rem; opacity: 0.6; flex-basis: 40%;">Colors</p>
                    <div style="display:flex; gap: 0.5rem;">
                        <div class="color_picker color_picker_0"></div>
                        <div class="color_picker color_picker_1"></div>
                        <div class="color_picker color_picker_2"></div>
                        <div class="color_picker color_picker_3"></div>
                        <div class="color_picker color_picker_4"></div>
                    </div>
                </div>

                <div style="padding: 0.75rem 0; display:flex; flex-direction: column; gap: 0.5rem; align-items: center;">
                    <button class="randomize">Randomize Gradient</button>
                    <button class="reset">Reset</button>
                </div>

            </div>
        `;

        const type_linear = gradientDiv.querySelector('button.type_linear');
        const type_radial = gradientDiv.querySelector('button.type_radial');
        const angle = gradientDiv.querySelector('input.angle');
        const scale = gradientDiv.querySelector('input.scale');
        const randomize = gradientDiv.querySelector('button.randomize');
        const reset = gradientDiv.querySelector('button.reset');

        const _update = () =>
        {
            this.update();
            this.setUniforms();
        };

        type_linear.addEventListener('click', () => {
            type_linear.style.opacity = 1;
            type_radial.style.opacity = 0.5;
            this.options.isRadial = false;
            _update();
        });
        if(!this.options.isRadial) type_linear.click();

        type_radial.addEventListener('click', () => {
            type_radial.style.opacity = 1;
            type_linear.style.opacity = 0.5;
            this.options.isRadial = true;
            _update();
        });
        if(this.options.isRadial) type_radial.click();

        angle.addEventListener('input', () => {
            this.options.angle = parseFloat(angle.value);
            this.setUniforms();
        });
        angle.addEventListener('change', () => _update());
        
        scale.addEventListener('input', () => {
            this.options.scale = parseFloat(scale.value);
            this.setUniforms();
        });
        scale.addEventListener('change', () => _update());

        for (let i = 0; i < this.options.colors.length; i++)
        {
            const color = typeof this.options.colors[i] == 'object' ? this.options.colors[i] : new THREE.Color(this.options.colors[i]);
            const colorPicker = new ColorPicker(gradientDiv.querySelector('div.color_picker_' + i), {
                color: color ? '#' + color.getHexString() : null,
                submitMode: 'instant',
                enableEyedropper:true,
                enableAlpha:false,
                loadLocalSwatches:true,
                localStorage: this.c3d.localStorage,
                c3d: this.c3d
            });

            colorPicker.on('pick', (color) => {
                this.options.colors[i] = new THREE.Color(color.string('hex'));
                this.setUniforms();
            });

            colorPicker.on('close', () => {
                _update();
            });

            this._colorPickers[i] = colorPicker;
        }

        randomize.addEventListener('click', () => {

            const randomScale = (Math.random() * parseFloat(scale.max)).toFixed(2);
            this.options.scale = randomScale;
            scale.value = randomScale;

            const randomAngle = (Math.random() * parseFloat(angle.max)).toFixed(2);
            this.options.angle = randomAngle;
            angle.value = randomAngle;

            const randomIsRadial = Math.random() > 0.5;
            this.options.isRadial = randomIsRadial;

            for (let i = 0; i < this.options.colors.length; i++)
            {
                this.options.colors[i] = new THREE.Color(Math.random() * 0xffffff);
                this._colorPickers[i].setColor('#' + this.options.colors[i].getHexString());                
            }

            if(randomIsRadial) type_linear.click();
            else type_radial.click();

            _update();

        });


        reset.addEventListener('click', () => {

            this.options =
            {
                colors: new Array(this.MAX_GRADIENT_COLORS),
                isRadial: false,
                angle: 0.0,
                scale: 0.0
            };

            this._createOptions();

        });

    }

}
