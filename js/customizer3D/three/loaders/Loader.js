import * as THREE from 'three';
import {EXRLoader} from 'three_dir/loaders/EXRLoader.js?c3d=0.6.2';
import {GLTFLoader} from 'three_dir/loaders/GLTFLoader.js?c3d=0.6.2';
import {DRACOLoader} from 'three_dir/loaders/DRACOLoader.js?c3d=0.6.2';
import {OBJLoader} from 'three_dir/loaders/OBJLoader.js?c3d=0.6.2';
import {FBXLoader} from 'three_dir/loaders/FBXLoader.js?c3d=0.6.2';
import {STLLoader} from 'three_dir/loaders/STLLoader.js?c3d=0.6.2';

export class Loader
{
    constructor(o)
    {
        this.props = o;
    }

    loadNormal()
    {
        this._setLoader();

        this.obj = this.loader.load(
            this.props.url,
            (o) => {
                if(typeof this.props.onLoad == 'function') {
                    this.props.onLoad(o);
                } else {
                    this.props.preloader.hide();
                }
            }, 
            (event) => {
                if(typeof this.props.onProgress == 'function') {
                    this.props.onProgress(event);
                }
                else {
                    const percent = (event.loaded / event.total * 100).toFixed(1);
                    this.props.preloader.set(this.props.url + '... ' + percent);
                }
            }, 
            (o) => {
                if(typeof this.props.onError == 'function') {
                    this.props.onError(o);
                }
            }
        );
    }

    async load()
    {
        this._setLoader();
        this.obj = await this.loader.loadAsync(this.props.url);
        
        return this.obj;
    }

    _setLoader()
    {
        const manager = new THREE.LoadingManager(
            // onLoad
            () => {
                this.props.preloader.hide();
            },
            // onProgress
            (url, loaded, total) =>
            {
                const percent = (loaded / total * 100).toFixed(1);
                this.props.preloader.set(this.props.url + '... ' + percent);
            },
            // onError
            () => {this.props.preloader.set('Error loading: ' + this.props.url); }
        );
        manager.onStart = () => {
            this.props.preloader.show();
            this.props.preloader.set(this.props.url);
        };

        const extension = this.props.url.substring(this.props.url.lastIndexOf('.') + 1).toLowerCase();

        switch (this.props.type || extension)
        {
            case 'glb':
                const dracoLoader = new DRACOLoader();
                dracoLoader.setDecoderPath(C3D_SERVER + 'js/three/libs/draco/');
                this.loader = new GLTFLoader(manager);
                this.loader.setDRACOLoader(dracoLoader);
            break;

            case 'exr':
                this.loader = new EXRLoader(manager);
            break;

            case 'obj':
                this.loader = new OBJLoader(manager);
            break;

            case 'fbx':
                this.loader = new FBXLoader(manager);
            break;

            case 'stl':
                this.loader = new STLLoader(manager);
            break;

            default:
                this.loader = new THREE.TextureLoader(manager);
            break;
        }
    }

}
