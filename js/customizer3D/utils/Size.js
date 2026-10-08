/*
    const size = new Size({size: '1024px', DPI: 72});
    // s = Size.meshDims(this.glbScene, false);
    // s = Size.htmlDims('#canvas_id', false);
    console.log('DEFINED: ' + size.org);
    console.log('px: ' + size.px);
    console.log('mm: ' + size.mm);
    console.log('cm: ' + size.cm);
    console.log('pt: ' + size.pt);
    console.log('in: ' + size.in);
 */
import * as THREE from 'three';

export class Size {
    constructor(o) {
        
        this.o = o;

        const rawSize = String(this.o.size || '0px').replace(/\s/g, '').replace(',', '.').toLowerCase();
        this.DPI = this.o.DPI || 72;
        this.js = this.o.js || false;

        // Unit Extraction
        if (rawSize.includes('px')) {
            this.type = 'px';
            this.size = parseFloat(rawSize.replace('px', '')) || 0;
        } else if (rawSize.includes('mm')) {
            this.type = 'mm';
            this.size = parseFloat(rawSize.replace('mm', '')) || 0;
        } else if (rawSize.includes('cm')) {
            this.type = 'cm';
            this.size = parseFloat(rawSize.replace('cm', '')) || 0;
        } else if (rawSize.includes('pt')) {
            this.type = 'pt';
            this.size = parseFloat(rawSize.replace('pt', '')) || 0;
        } else if (rawSize.includes('in')) {
            this.type = 'in';
            this.size = parseFloat(rawSize.replace('in', '')) || 0;
        } else {
            this.type = 'px';
            this.size = parseFloat(rawSize) || 0;
            console.warn('Unknown Size Unit! Defaulting to px.');
        }
    }

    // Static Methods
    static meshDims(mesh, js = true) {
        const bb = new THREE.Box3().setFromObject(mesh);
        let width = bb.max.x - bb.min.x;
        let height = bb.max.y - bb.min.y;
        let depth = bb.max.z - bb.min.z;

        return { width, height, depth };
    }

    static htmlDims(elm, js = true) {
        let width = 0, height = 0;

        if (typeof elm !== 'undefined') {
            const element = typeof elm === 'string' ? document.querySelector(elm) : elm;
            if (element) {
                const cs = window.getComputedStyle(element);
                width = parseFloat(cs.width) || 0;
                height = parseFloat(cs.height) || 0;
            }
        }

        if (!js) {
            return {
                width: width + 'px',
                height: height + 'px'
            };
        }

        return { width, height };
    }

    // Getters
    get px() { return this._toPX(); }
    get mm() { return this._toMM(); }
    get cm() { return this._toCM(); }
    get pt() { return this._toPT(); }
    get in() { return this._toIN(); }
    get org() { return this.o.size; }

    // Private Conversion Methods
    _toPX() {
        if (this.type === 'mm') return (this.size / 25.4) * this.DPI;
        if (this.type === 'cm') return (this.size / 2.54) * this.DPI;
        if (this.type === 'pt') return (this.size / 72) * this.DPI;
        if (this.type === 'in') return this.size * this.DPI;
        return this.size;
    }

    _toMM() {
        if (this.type === 'px') return (this.size * 25.4) / this.DPI;
        if (this.type === 'cm') return this.size * 10;
        if (this.type === 'pt') return (this.size / 72) * 25.4;
        if (this.type === 'in') return this.size * 25.4;
        return this.size;
    }

    _toCM() {
        if (this.type === 'px') return (this.size * 2.54) / this.DPI;
        if (this.type === 'mm') return this.size / 10;
        if (this.type === 'pt') return (this.size / 72) * 2.54;
        if (this.type === 'in') return this.size * 2.54;
        return this.size;
    }

    _toPT() {
        if (this.type === 'px') return (this.size / this.DPI) * 72;
        if (this.type === 'mm') return (this.size / 25.4) * 72;
        if (this.type === 'cm') return (this.size / 2.54) * 72;
        if (this.type === 'in') return this.size * 72;
        return this.size;
    }

    _toIN() {
        if (this.type === 'px') return this.size / this.DPI;
        if (this.type === 'mm') return this.size / 25.4;
        if (this.type === 'cm') return this.size / 2.54;
        if (this.type === 'pt') return this.size / 72;
        return this.size;
    }
}