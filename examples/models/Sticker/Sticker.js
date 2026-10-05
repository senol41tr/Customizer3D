import * as THREE from 'three';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.5.0';
import {degToRad} from 'customizer3D_dir/utils/degToRad.js?c3d=0.5.0';
import {Texture} from 'customizer3D_dir/three/loaders/Texture.js?c3d=0.5.0';


export function lang()
{
    return {
        'sticker-top': {en: 'Top Design', de: 'Oben Design', tr: 'Üst Tasarım'},
        'sticker-front': {en: 'Front Design', de: 'Vorne Design', tr: 'Ön Tasarım'},
        'sticker-left': {en: 'Left Design', de: 'Links Design', tr: 'Sol Tasarım'},
        'sticker-right': {en: 'Right Design', de: 'Rechts Design', tr: 'Sağ Tasarım'},
    };
}


export function parameters(self)
{
    return {
        // unique name (module name) in models folder, the name is important for creating instance 
        // const {parameters, init, setView, onUnLoad} = await import('models/'+ data.modelName +'.js');
        modelName: 'Sticker',

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
        canvas2d:       'section.customizer > div.webgl_2d_canvas',

        // Three.js options
        three:
        {
            // set zoom-in, zoom-out limit
            orbitControlOptions: 
            {
                minDistance: isMobile() ? 0.25 : 0.5,
                maxDistance: 5
            },

            // set initial z position
            cameraOptions:
            {
                position:
                {
                    z: isMobile() ? 2 : 1
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
            top:
            {
                label: self.lang['sticker-top'],
                printSize: {width: '14cm', height: '14cm'},
                materials: [{image: true}]
            },

            front:
            {
                label: self.lang['sticker-front'],
                printSize: {width: '22.5cm', height: '4.5cm'},
                materials: [{image: true}]
            },
            
            left:
            {
                label: self.lang['sticker-left'],
                printSize: {width: '22.5cm', height: '4.5cm'},
                materials: [{image: true}]
            },
            
            right:
            {
                label: self.lang['sticker-right'],
                printSize: {width: '22.5cm', height: '4.5cm'},
                materials: [{image: true}]
            }
        }
    };
}

export async function init()
{
    // set initial rotation
    this.three.rotateToAngle(30, 30, 0);

    // enable zoom with mouse or tap (2 fingers)
    this.enableAutoZoom();

    // set model material
    const box = this.glbScene.getObjectByName('box');
    const boxTexture = await new Texture({url: C3D_MODELS_DIR + 'Sticker/baseColor.jpg?c3d=0.5.0', preloader: this.preloader}).load();
    box.material = new THREE.MeshStandardMaterial({map:boxTexture, roughness:0.5, metalness:0.75});
    
    const top = this.glbScene.getObjectByName('top');
    const front = this.glbScene.getObjectByName('front');
    const left = this.glbScene.getObjectByName('left');
    const right = this.glbScene.getObjectByName('right');

    const materialOptions =
    {
        map: boxTexture,
        transparent: true,
        roughness: 0.5,
        clearcoat: 0.5,
        metalness: 1
    };

    top.material = 
    front.material = 
    left.material = 
    right.material = new THREE.MeshPhysicalMaterial(materialOptions);
}

// set model views
// op = 'to' or 'set' => to=animated, set for to take screenshot (by exporting PDF)
export function setView(view, fn = 'to')
{
    switch (view)
    {
        case 'top':
            this.three.rotateToAngle(90, 0, 0);
        break;

        case 'front':
            this.three.rotateToAngle(0, 0, 0);
        break;

        case 'left':
            this.three.rotateToAngle(0, 90, 0);
        break;

        case 'right':
            this.three.rotateToAngle(0, -90, 0);
        break;

        default:
            this.three.rotateToAngle(30, 30, 0);
        break;
    }

    this.three.controls.restoreSettings(fn);
}

// callback onUnLoad
export async function onUnLoad()
{

}
