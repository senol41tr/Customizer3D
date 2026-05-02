import * as THREE from 'three';
import {GLTFLoader} from 'three_dir/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three_dir/loaders/DRACOLoader.js';

export class DefaultLoader
{
    constructor(o)
    {
        this.props = o;
    }

    async load()
    {
        switch (this.props.loader)
        {
            case 'glb':
                const dracoLoader = new DRACOLoader();
                dracoLoader.setDecoderPath(C3D_SERVER + 'js/three/libs/draco/');
                this.loader = new GLTFLoader();
                this.loader.setDRACOLoader(dracoLoader);
            break;

            default:
                const manager = new THREE.LoadingManager();
                manager.onProgress = (url) => { this.props.preloader.set(url); };
                manager.onError = (url) => { this.props.preloader.set('Error loading: ' + url); };
                manager.onLoad = () => { this.props.preloader.hide(); };
                manager.onStart = () => { this.props.preloader.show(); };
                this.loader = new THREE.TextureLoader(manager);
            break;
        }

        switch (this.props.loader)
        {
            case 'glb':
                this.obj = await this.loader.loadAsync(this.props.url, (p) => this._setProgress(p));
            break;

            default:
                this.obj = await this.loader.loadAsync(this.props.url);
            break;
        }

        this._init();
        
        return this.obj;
    }

    _setProgress(p)
    {
        const percent = (p.loaded / p.total * 100).toFixed(1);
        if(typeof(this.props.callback) == 'function')
        {
            this.props.callback({
                url:this.props.url,
                loaded:p.loaded,
                total:p.total,
                percent
            });
        }
        this.props.preloader.set(this.props.url + '... ' + percent);
    }

    _init()
    {
    }

}
