import * as THREE from 'three';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.6.2';
import {Loader} from 'customizer3D_dir/three/loaders/Loader.js?c3d=0.6.2';

export function lang()
{
    return {
        'vase-texture': {en: 'Vase Texture', de: 'Vasenstruktur', tr: 'Vazo Dokusu'}
    };
}


export function parameters(self)
{
    const root = C3D_MODELS_DIR + 'Vase/';

    return {
        // unique name (module name) in models folder, the name is important for creating instance 
        // const {parameters, init, setView, onUnLoad} = await import('models/'+ data.modelName +'.js');
        modelName: 'Vase',

        container:      'section.customizer',
        preloader:      'section.customizer > div.preloader',
        settings:       'section.customizer > div.settings',
        contextMenu:    'section.customizer > div.contextMenu',
        help:           'section.customizer > div.help',
        layers:         'section.customizer > div.layers',
        
        canvas2d:       'section.customizer > div.webgl_2d_canvas',

        // Three.js options
        three:
        {
            // set zoom-in, zoom-out limit
            orbitControlOptions: 
            {
                minDistance: isMobile() ? 0.25 : 0.5,
                maxDistance: 3
            },

            // set initial z position
            cameraOptions:
            {
                position:
                {
                    z: isMobile() ? 2 : 1.3
                }
            },

            //
            rendererOptions:
            {
                canvas: 'section.customizer > div.webgl_3d_canvas > canvas.webgl_3d'
            }
        },

        data:
        {
            vase:
            {
                label: self.lang['vase-texture'],
                printSize: {width: '10cm', height: '10cm'},
                materials: 
                [
                    {url: root + 'textures/5.jpg?c3d=0.6.2', repeatX: 2, repeatY: 2},
                    {url: root + 'textures/1.jpg?c3d=0.6.2', repeatX: 4, repeatY: 4},
                    {url: root + 'textures/2.jpg?c3d=0.6.2', repeatX: 4, repeatY: 4},
                    {url: root + 'textures/3.jpg?c3d=0.6.2', repeatX: 4, repeatY: 4},
                    {url: root + 'textures/4.jpg?c3d=0.6.2', repeatX: 4, repeatY: 4},
                    {url: root + 'textures/6.jpg?c3d=0.6.2', repeatX: 2, repeatY: 2},
                    {url: root + 'textures/7.jpg?c3d=0.6.2', repeatX: 2, repeatY: 2}
                ]
            }
        }
    };
}

// modify all wanted things
export async function init()
{
    const root = C3D_MODELS_DIR + 'Vase/';

    // set mesh materials
    const soilMap = await new Loader({type:'jpg', url: root + 'maps/Plant-Set-002-grass.jpg?c3d=0.6.2', preloader: this.preloader}).load();
    soilMap.colorSpace = THREE.SRGBColorSpace;

    this.glbScene.getObjectByName('vase').material = new THREE.MeshPhysicalMaterial({map:soilMap, metalness: 0.3, roughness: 0.5});
    
    this.glbScene.getObjectByName('soil').material = new THREE.MeshBasicMaterial({map: soilMap, side: THREE.DoubleSide});
    
    const leavesMap = await new Loader({type:'jpg', url: root + 'maps/03.jpg?c3d=0.6.2', preloader: this.preloader}).load();
    leavesMap.flipY = false;
    leavesMap.colorSpace = THREE.SRGBColorSpace;

    const leavesAlphaMap = await new Loader({type:'jpg', url: root + 'maps/03_Opacity.jpg?c3d=0.6.2', preloader: this.preloader}).load();
    leavesAlphaMap.flipY = false;
    leavesAlphaMap.colorSpace = THREE.SRGBColorSpace;
    
    const leavesNormalMap = await new Loader({type:'jpg', url: root + 'maps/03_Normal.jpg?c3d=0.6.2', preloader: this.preloader}).load();
    leavesNormalMap.flipY = false;
    leavesNormalMap.colorSpace = THREE.SRGBColorSpace;
    
    this.glbScene.getObjectByName('leaves').material = new THREE.MeshStandardMaterial({
        map: leavesMap, 
        alphaMap: leavesAlphaMap, 
        normalMap: leavesNormalMap, 
        transparent: true, 
        alphaTest: 0.5, 
        side: THREE.DoubleSide, 
        metalness: 0, 
        roughness: 1
    });
}

// set model views
// op = 'to' or 'set' => to=animated, set for to take screenshot (by exporting PDF)
export function setView(view, fn = 'to')
{
    switch (view)
    {
        case 'vase':
            this.three.rotateToAngle(0, 0, 0, fn);
        break;
    }

    this.three.controls.restoreSettings(fn);
}

// callback onUnLoad
export async function onUnLoad()
{

}
