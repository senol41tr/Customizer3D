import * as THREE from 'three';
import { DefaultLoader } from './DefaultLoader.js?c3d=102';

export class Texture extends DefaultLoader
{
    constructor(o)
    {
        if(typeof(o) === 'string') o = {url:o};
        super(o);
    }

    _init()
    {
        this.obj.colorSpace = THREE.SRGBColorSpace;
        if(!this.props.flipY) this.obj.flipY = false;
    }
}
