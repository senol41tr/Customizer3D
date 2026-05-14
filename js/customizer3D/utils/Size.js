/*
 * 26.01.2026 19:30
 * @TODO check the calculations
 */


/*
    let s = '1481 px';
    // s = '10.2 cm';
    // s = '297 mm';
    // s = '5,254 TD';
    // s = Size.meshDims(this.glbScene, false);
    const size = new Size({
        size: s, 
        DPI:300, 
        js:true, 
        mesh:this.glbScene.getObjectByName('model'), 
        camera:this.three.camera, 
        canvas: this.three.renderer.domElement,
        renderer: this.three.renderer
    });
    console.log('DEFINED: ' + size.org);
    console.log('px: ' + size.px);
    console.log('mm: ' + size.mm);
    console.log('cm: ' + size.cm);
    console.log('td: ' + size.td);
*/



import * as THREE from 'three';

export class Size
{
    constructor(o)
    {
        this.o = Object.assign({
            DPI:72,
            js:true,
            size:'0px'
        }, o);

        this.size = this.o.size.replace(/\s/g, '').replace(',', '.').toLowerCase();
        this.DPI = this.o.DPI || 72;//Math.max(this.o.DPI, 72);
        this.js = this.o.js || false;
        
        if(this.size.indexOf('px') >= 0) // default unit
        {
            this.type = 'px';
            this.size = parseInt(this.size.replace(this.type, ''));
        }
        else if(this.size.indexOf('mm') >= 0)
        {
            this.type = 'mm';
            this.size = parseFloat(this.size.replace(this.type, ''));
        }
        else if(this.size.indexOf('cm') >= 0)
        {
            this.type = 'cm';
            this.size = parseFloat(this.size.replace(this.type, ''));
        }
        else if(this.size.indexOf('td') >= 0) // 3D
        {
            this.type = 'td';
            this.size = parseFloat(this.size.replace(this.type, ''));
        }
        else if(this.size.indexOf('pt') >= 0)
        {
            this.type = 'pt';
            this.size = parseFloat(this.size.replace(this.type, ''));
        }
        else
        {
            console.warn('Unknown Size!!');
        }

    }


    // Static methods

    static htmlDims(elm, js = true)
    {
        let width, height;
        
        if(typeof(elm) != 'undefined')
        {
            if(typeof(elm) == 'string') elm = document.querySelector(elm);
            const cs = window.getComputedStyle(elm);
            width = parseInt(cs.width);
            height = parseInt(cs.height);
        }

        if (!js)
        {
            width += 'px';
            height += 'px';
        }

        return {width, height};
    }



    // Getters

    get px()
    {
        return this._toPX();
    }

    get mm()
    {
        return this._toMM();
    }

    get cm()
    {
        return this._toCM();
    }

    get td()
    {
        return this._toTD();
    }

    get pt()
    {
        return this._toPT();
    }

    get org()
    {
        return this.o.size;
    }



    // Private Methods

    _toPX()
    {
        let size;

        if(this.type == 'mm')
        {
            size = this.size / 25.4 * this.DPI;
        }
        else if(this.type == 'cm')
        {
            size = this.size / 2.54 * this.DPI;
        }
        else if(this.type == 'td')
        {
            size = this._3dToPixel();
        }
        else if(this.type == 'pt')
        {
            size = this.size / 72 * this.DPI;
        }
        else
        {
            size = this.size;
        }

        return size;
    }

    _toMM()
    {
        let size;

        if(this.type == 'px')
        {
            size = this._pixelToMM();
        }
        else if(this.type == 'cm')
        {
            size = (this.size * 10);
        }
        else if(this.type == 'td')
        {
            size = this._mmToPixel();
            size = this._pixelToTD(size);
        }
        else if(this.type == 'pt')
        {
            size = this._mmToPT();
        }
        else
        {
            size = this.size;
        }

        return size;
    }

    _toCM()
    {
        let size;

        if(this.type == 'px')
        {
            size = this._pixelToCM();
        }
        else if(this.type == 'mm')
        {
            size = this._mmToPixel();
        }
        else if(this.type == 'td')
        {
            size = this._cmToPixel();
            size = this._pixelToTD(size);
        }
        else if(this.type == 'pt')
        {
            size = this.size * 2.54 / this.DPI;
        }
        else
        {
            size = this.size;
        }

        return size;
    }

    _toTD()
    {
        let size;

        if(this.type == 'px')
        {
            size = this._pixelToTD();
        }
        else if(this.type == 'cm')
        {
            size = this._cmToPixel();
            size = this._3dToPixel();
        }
        else if(this.type == 'mm')
        {
            size = this._mmToPixel();
            size = this._pixelToTD(size);
        }
        else if(this.type == 'pt')
        {
            size = this._3dToPixel();
            size = this.size * 72 / this.DPI;
        }
        else
        {
            size = this.size;
        }

        return size;
    }

    _toPT()
    {
        let size;

        if(this.type == 'px')
        {
            size = this.size * 72 / this.DPI;
        }
        else if(this.type == 'mm')
        {
            size = this._mmToPT();
        }
        else if(this.type == 'cm')
        {
            size = this._mmToPT() * 10;
        }
        else if(this.type == 'td')
        {
            size = this.size * 72 / this.DPI;
            size = this._pixelToTD(size);
        }
        else
        {
            size = this.size;
        }

        return size;
    }


    // https://stackoverflow.com/questions/54430842/how-can-i-get-dpi-from-image-in-js
    _pixelToCM()
    {
        return (this.size * 2.54 / this.DPI);
    }

    _pixelToMM()
    {
        return (this.size * 25.4 / this.DPI);
    }

    _cmToPixel()
    {
        return ((this.size / 2.54) * this.DPI);
    }

    _mmToPixel()
    {
        return ((this.size / 2.54) * this.DPI);
    }


    _pixelToTD(size = this.size)
    {
        const {camera, canvas, mesh} = this.o;


        const {height} = this.constructor.htmlDims(canvas);
        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const visibleHeight = 2 * Math.tan(vFOV / 2) * (camera.position.z - mesh.position.z);
        const worldUnitPerPixel = visibleHeight / height;
        const width = size * worldUnitPerPixel;
        
        if(!this.js) return 'width:' + width + 'td';
        return width;
    }

    _3dToPixel()
    {
        let {mesh, scale, camera, renderer} = this.o;

        if(!scale) scale = mesh.scale;

        camera.updateMatrixWorld();

        const box = new THREE.Box3().setFromObject(mesh);
        
        const min = box.min;
        const max = box.max;
    
        const minPoint = min.clone();
        const maxPoint = max.clone();
    
        minPoint.project(camera);
        maxPoint.project(camera);
    
        const viewportWidth = renderer.domElement.clientWidth;
        const viewportHeight = renderer.domElement.clientHeight;
        
        const minPixelX = (minPoint.x * 0.5 + 0.5) * viewportWidth;
        const minPixelY = (-minPoint.y * 0.5 + 0.5) * viewportHeight;
    
        const maxPixelX = (maxPoint.x * 0.5 + 0.5) * viewportWidth;
        const maxPixelY = (-maxPoint.y * 0.5 + 0.5) * viewportHeight;
        
        const pixelWidth = Math.abs(maxPixelX - minPixelX * scale.x); // !!!
        const pixelHeight = Math.abs(maxPixelY - minPixelY * scale.x); // !!!

        if(!this.js) return 'width:' + pixelWidth + ', height:' + pixelHeight;
        return {width: pixelWidth, height: pixelHeight};
    }

    /*
    _pixelDimToTD()
    {
        const desiredWidthInPixels = 150;
        const desiredHeightInPixels = 75;
        
        const canvasSize = new THREE.Vector2();
        renderer.getSize(canvasSize);
        const canvasPixelHeight = canvasSize.height;
        
        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const distance = camera.position.z - mesh.position.z;
        const visibleHeight = 2 * Math.tan(vFOV / 2) * distance;
        
        const worldUnitsPerPixel = visibleHeight / canvasPixelHeight;
        
        const worldWidth = desiredWidthInPixels * worldUnitsPerPixel;
        const worldHeight = desiredHeightInPixels * worldUnitsPerPixel;
        
        console.log(`Gerekli Dünya Birimi Boyutları: ${worldWidth} x ${worldHeight}`);
        mesh.scale.set(worldWidth, worldHeight, 1);
    }
    */

    _mmToPT()
    {
        return this.size * 72 / 25.4;
    }

    _ptToMM()
    {
        return this.size / 72 * 25.4;
    }

}


