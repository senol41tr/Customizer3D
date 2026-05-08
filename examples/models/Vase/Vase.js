import * as THREE from 'three';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=101';
import {Texture} from 'customizer3D_dir/three/loaders/Texture.js?c3d=101';


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
        textLayer:      'section.customizer > div.textLayer',
        imageLayer:     'section.customizer > div.imageLayer',
        shapeLayer:     'section.customizer > div.shapeLayer',
        controls:       'section.customizer > div.controls',
        canvas3d:       'section.customizer > div.webgl_3d_canvas > canvas.webgl_3d',

        // Three.js options
        three:
        {
            // set zoom-in, zoom-out limit
            orbitControlOptions: 
            {
                minDistance: 0.25,
                maxDistance: 3,
            },

            // set initial z position
            cameraOptions:
            {
                position:
                {
                    z: isMobile() ? 2.5 : 1.5
                }
            }
        },

        data:
        {
            vase:
            {
                label: self.lang['vase-texture'],
                materials: 
                [
                    {url: root + 'textures/5.jpg?c3d=101', repeatX: 2, repeatY: 2},
                    {url: root + 'textures/1.jpg?c3d=101', repeatX: 4, repeatY: 4},
                    {url: root + 'textures/2.jpg?c3d=101', repeatX: 4, repeatY: 4},
                    {url: root + 'textures/3.jpg?c3d=101', repeatX: 4, repeatY: 4},
                    {url: root + 'textures/4.jpg?c3d=101', repeatX: 4, repeatY: 4},
                    {url: root + 'textures/6.jpg?c3d=101', repeatX: 3, repeatY: 3},
                    {url: root + 'textures/7.jpg?c3d=101', repeatX: 2, repeatY: 2}
                ]
            }
        }
    };
}

// modify all wanted things
export async function init()
{
    const root = C3D_MODELS_DIR + 'Vase/';

    // enable zoom with mouse or tap (2 fingers)
    this.enableAutoZoom();

    // set mesh materials
    const soilMap = await new Texture({url: root + 'maps/Plant-Set-002-grass.jpg?c3d=101', preloader: this.preloader}).load();

    this.glbScene.getObjectByName('vase').material = new THREE.MeshPhysicalMaterial({map:soilMap, metalness: 0.3, roughness: 0.5});
    
    this.glbScene.getObjectByName('soil').material = new THREE.MeshBasicMaterial({map: soilMap, side: THREE.DoubleSide});
    
    const leavesMap = await new Texture({url: root + 'maps/03.jpg?c3d=101', preloader: this.preloader}).load();
    const leavesAlphaMap = await new Texture({url: root + 'maps/03_Opacity.jpg?c3d=101', preloader: this.preloader}).load();
    const leavesNormalMap = await new Texture({url: root + 'maps/03_Normal.jpg?c3d=101', preloader: this.preloader}).load();
    this.glbScene.getObjectByName('leaves').material = new THREE.MeshStandardMaterial({
        map: leavesMap, 
        alphaMap: leavesAlphaMap, 
        normalMap: leavesNormalMap, 
        transparent: true, 
        alphaTest: 0.5, 
        side: THREE.DoubleSide, 
        metalness: 0.85, 
        roughness: 0.75
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
