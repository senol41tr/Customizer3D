import * as THREE from 'three';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js';
import {Texture} from 'customizer3D_dir/three/loaders/Texture.js';

export function lang()
{
    return {
        'cup-color':        {en: 'Cup Color',       de: 'Tassenfarbe',          tr: 'Kupa Rengi'},
        'cup-label-design': {en: 'Label Design',    de: 'Etiketten Design',      tr: 'Etiket Tasarım'},
        'cup-bottom-design': {en: 'Bottom Design',    de: 'Tassenboden Design',      tr: 'Alt Tasarım'}
    };
}


export function parameters(self)
{
    return {
        // unique name (module name) in models folder, the name is important for creating instance 
        // const {parameters, init, setView, onUnLoad} = await import('models/'+ data.modelName +'.js');  
        modelName: 'Cup',

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
                minDistance: 0.3,
                maxDistance: 1.5,
            },

            // set initial z position
            cameraOptions:
            {
                position:
                {
                    z: isMobile() ? 1 : 0.5
                }
            }
        },

        data:
        {
            model:
            {
                label: self.lang['cup-color'],
                materials:
                [
                    {colors:
                    [
                        '#ffffff', 
                        '#808080', 
                        '#000000', 
                        '#f8cfaf', 
                        '#77809f', 
                        '#709078', 
                        '#58784f', 
                        '#ffd461', 
                        '#ef783e', 
                        '#ea5455', 
                        '#2c4059'
                    ]}
                ]
            },
            
            label:
            {
                label: self.lang['cup-label-design'], 
                printSize: {width: '29cm', height: '13cm'}
            },

            bottom:
            {
                label: self.lang['cup-bottom-design'], 
                printSize: {width: '7cm', height: '7cm'}
            }
        }
    };
}

export async function init()
{
    // set default rotation
    this.three.rotateToAngle(0, 70, 0);

    // enable zoom with mouse or tap (2 fingers)
    this.enableAutoZoom();

    // set model material
    const model = this.glbScene.getObjectByName('model');
    model.material.dispose();
    const matcap = await new Texture({url: C3D_MODELS_DIR + 'Cup/matcap_base.png', preloader: this.preloader}).load();
    model.material = new THREE.MeshMatcapMaterial({matcap});

    const modelInner = this.glbScene.getObjectByName('inner');
    modelInner.material = new THREE.MeshMatcapMaterial({matcap});

}

// set model views
// op = 'to' or 'set' => to=animated, set for to take screenshot (by exporting PDF)
export function setView(view, fn = 'to')
{
    switch (view)
    {
        case 'label':
            this.three.rotateToAngle(0, 0, 0, fn);
        break;

        case 'bottom':
            this.three.rotateToAngle(90, 0, 180, fn);
        break;

        default:
        case 'model':
            this.three.rotateToAngle(0, 90, 0, fn);
        break;
    }

    this.three.controls.restoreSettings(fn);
}

// callback onUnLoad
export async function onUnLoad()
{

}
