import { DefaultLoader } from './DefaultLoader.js?c3d=101';

export class GLB extends DefaultLoader
{
    constructor(o)
    {
        if(typeof(o) === 'string') o = {url:o};
        o.loader = 'glb';
        super(o);
    }

    _init()
    {

    }
}
