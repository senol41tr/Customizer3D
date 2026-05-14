import jsColorEngine from 'base/jsColorEngine@1.0.4/jscolorengine.min.esm.js';

export class ColorEngine
{
    constructor(c3d)
    {
        this.c3d = c3d;

        this.rgbToCmyk = null;
        this.cmykToRgb = null;
        this.color = null;
        this.js = null;
    }

    async _init()
    {
        const icc = C3D_SERVER + 'js/jsColorEngine@1.0.4/U.S.-Web-Coated-(SWOP)-v2.icm';
        const sRGB = new jsColorEngine.Profile();
        sRGB.load('*sRGB');

        const cmykProfile = new jsColorEngine.Profile();

        this.c3d.preloader.show();
        this.c3d.preloader.set(icc);
        await cmykProfile.loadPromise(icc);
        this.c3d.preloader.hide();

        this.rgbToCmyk = new jsColorEngine.Transform();
        this.rgbToCmyk.create(sRGB, cmykProfile, jsColorEngine.eIntent.relative);

        this.cmykToRgb = new jsColorEngine.Transform();
        this.cmykToRgb.create(cmykProfile, sRGB, jsColorEngine.eIntent.relative);
    }

    hex(color, js = true)
    {
        this.color = color;
        this.js = js;
        const jsState = this.js;
        
        this.js = true;
        this.__toCMYK();
        this.js = jsState;
        
        this.__toHEX();

        return this.color;
    }

    rgb(color, js = true)
    {
        this.color = color;
        this.js = js;

        const jsState = this.js;
        
        this.js = true;
        this.__toCMYK();
        this.js = jsState;

        this.__toRGB();
        
        return this.color;
    }

    cmyk(color, js = true)
    {
        this.color = color;
        this.js = js;
        const jsState = this.js;
        
        this.js = true;
        this.__toCMYK();
        this.js = jsState;

        return this.color;
    }

    // https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color
    invert(color, bw = true, js = true)
    {
        let r, g, b;

        this.color = color;
        this.js = js;
        const jsState = this.js;
        
        this.js = true;
        this.__toCMYK();
        this.__toRGB();
        this.js = jsState;
        
        r = this.color.r;
        g = this.color.g;
        b = this.color.b;
        
        // https://stackoverflow.com/a/3943023/112731
        if(bw)
        {
            if((r * 0.299 + g * 0.587 + b * 0.114) > 186)
            {
                if(this.js) this.color = 0x0;
                else this.color = "#000000";
            }
            else
            {
                if(this.js) this.color = 0xffffff;
                else this.color = "#FFFFFF";
            }
        }
        else
        {        
            // invert color components
            r = (255 - r).toString(16);
            g = (255 - g).toString(16);
            b = (255 - b).toString(16);
            
            // pad each with zeros and return
            if(this.js) this.color = parseInt(r + g + b, 16);
            else this.color = "#" + this.__padZero(r) + this.__padZero(g) + this.__padZero(b);
        }

    }


    setBrightness(color, js = true, percent)
    {
        this.color = color;
        this.js = js;
        const jsState = this.js;
        
        this.js = true;
        this.__formatToRGB();
        this.js = jsState;

        let {r,g,b} = this.color;

        r = this.__padZero(Math.max(0, Math.min(255, Math.round(r + (r * (percent / 100))))));
        g = this.__padZero(Math.max(0, Math.min(255, Math.round(g + (g * (percent / 100))))));
        b = this.__padZero(Math.max(0, Math.min(255, Math.round(b + (b * (percent / 100))))));

        
        if(this.js) this.color = parseInt(r + g + b, 16);
        else this.color = `#${r}${g}${b}`;
    }


    __toHEX()
    {
        
        let r, g, b;
        
        const jsState = this.js;
        
        this.js = true;
        this.__toRGB();
        this.js = jsState;

        r = this.__padZero(this.color.r.toString(16));
        g = this.__padZero(this.color.g.toString(16)); 
        b = this.__padZero(this.color.b.toString(16));

        if(this.js) this.color = parseInt(r + g + b, 16);
        else this.color = `#${r}${g}${b}`;
    }

    __toRGB()
    {
        let {C, M, Y, K} = this.color;
        
        const {R, G, B} = this.cmykToRgb.transform(jsColorEngine.color.CMYK(C * 100, M * 100, Y * 100, K * 100));

        if(this.js) this.color = { r: R, g: G, b: B };
        else this.color = `rgb(${R}, ${G}, ${B})`;
    }


    __toCMYK()
    {
        
        this.__formatToRGB();
        
        let cmyk = this.rgbToCmyk.transform(jsColorEngine.color.RGB(this.color.r, this.color.g, this.color.b));
        delete cmyk.type;

        cmyk.C /= 100;
        cmyk.M /= 100;
        cmyk.Y /= 100;
        cmyk.K /= 100;
        
        if(this.js) this.color = cmyk;
        else this.color = `C: ${cmyk.C}, M: ${cmyk.M}, Y: ${cmyk.Y}, K: ${cmyk.K}`;
    }


    __formatToRGB()
    {
        let r, g, b;

        // INTEGER

        if(!isNaN(this.color))
        {
            if(this.color < 0 || this.color > 0xffffff) {
                console.warn('Invalid length of the input integer value!');
            }

            const c = this.__padZero(this.color.toString(16), 6);
            r = parseInt(c.substring(0,2),16); 
            g = parseInt(c.substring(2,4),16); 
            b = parseInt(c.substring(4,6),16);

        }

        // HEX

        else if(this.color.indexOf('#') >= 0)
        {
            this.color = this.color.substr(1);

            if(this.color.length == 3) // #RGB
            {
                this.color = this.color.charAt(0) + this.color.charAt(0) + this.color.charAt(1) + this.color.charAt(1) + this.color.charAt(2) + this.color.charAt(2);
            }

            if (this.color.length != 6) {
                this.color = this.__padZero(this.color, 6);
            }
            if (/[0-9a-f]{6}/i.test(this.color) != true) {
                console.warn('Invalid digits in the input hex value!');
            }

            r = parseInt(this.color.substring(0,2),16); 
            g = parseInt(this.color.substring(2,4),16); 
            b = parseInt(this.color.substring(4,6),16);
        }

        // RGB

        else if(this.color.indexOf(',') >= 0)
        {
            this.color = this.color.replace(/\s/ig, '');
            if((/rgb\(\d{1,3},\d{1,3},\d{1,3}\)/ig).test(this.color) === false) {
                console.warn('Unknown Color Format!! Correct Format is: rgb(0-255, 0-255, 0-255)');
            }
            this.color = this.color.replace(/rgb\(|\)/ig, '', this.color);
            const c = this.color.split(',', 3);
            
            r = parseInt(c[0]);
            g = parseInt(c[1]);
            b = parseInt(c[2]);
        }

        // UNKNOWN

        else
        {
            console.warn('Unknown Color Type!!');
        }

        if(this.js) this.color = {r, g, b};
        else this.color = `rgb(${r}, ${g}, ${b})`;

    }


    __padZero(str, len = 2)
    {
        const zeros = new Array(len).join('0');
        return (zeros + str).slice(-len);
    }

}