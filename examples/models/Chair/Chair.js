import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.5.1';
import {degToRad} from 'customizer3D_dir/utils/degToRad.js?c3d=0.5.1';
import gsap from 'base/gsap@3.13.0/gsap@3.13.0.esm.js';

export function lang()
{
    return {
        'chair-feet':           {en: 'Chair Feet',      de: 'Stuhlfüße',        tr: 'Sandalye Ayakları'},
        'chair-back-cushion':   {en: 'Back Cushion',    de: 'Rückenpolster',    tr: 'Sırt Yastığı'},
        'chair-front-cushion':  {en: 'Front Cushion',   de: 'Vorderes Kissen',  tr: 'Ön Minder'}
    };
}


export function parameters(self)
{
    const root =  C3D_MODELS_DIR + 'Chair/';

    return {
        // unique name (module name) in models folder, the name is important for creating instance 
        // const {parameters, init, setView, onUnLoad} = await import('models/'+ data.modelName +'.js'); 
        modelName: 'Chair',

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
                minDistance: isMobile() ? 2 : 1,
                maxDistance: 5
            },

            // set initial z position
            cameraOptions:
            {
                position:
                {
                    z: isMobile() ? 4 : 2
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
            feet:
            {
                label: self.lang['chair-feet'],
                printSize: {width: '10cm', height: '10cm'},
                materials:
                [
                    {
                        url: root + 'feet/white_metal.png?c3d=0.5.1', 
                        material:'MeshMatcapMaterial'
                    },
                    {
                        url: root + 'feet/metal.png?c3d=0.5.1', 
                        material:'MeshMatcapMaterial'
                    },
                    {
                        url: root + 'feet/green_metal.png?c3d=0.5.1', 
                        material:'MeshMatcapMaterial'
                    },
                    {
                        url: root + 'feet/gold.png?c3d=0.5.1', 
                        material:'MeshMatcapMaterial'
                    },
                    {
                        url: root + 'feet/orange_metal.png?c3d=0.5.1', 
                        material:'MeshMatcapMaterial'
                    },
                    {
                        url: root + 'feet/red_metal.png?c3d=0.5.1', 
                        material:'MeshMatcapMaterial'
                    }
                ]
            },
            
            back_cushion:
            {
                label: self.lang['chair-back-cushion'], 
                printSize: {width: '10cm', height: '10cm'},
                materials: 
                [
                    {
                        url: root + 'cushion/gingham_check_diff_2k.jpg?c3d=0.5.1', 
                        material:'MeshBasicMaterial', 
                        repeatX: 3, 
                        repeatY: 3
                    },
                    {
                        url: root + 'cushion/hessian_230_diff_2k.jpg?c3d=0.5.1', 
                        material:'MeshBasicMaterial', 
                        repeatX: 3, 
                        repeatY: 3
                    },
                    {
                        url: root + 'cushion/curly_teddy_checkered_diff_2k.jpg?c3d=0.5.1', 
                        material:'MeshBasicMaterial', 
                        repeatX: 10, 
                        repeatY: 10
                    },
                    {
                        url: root + 'cushion/wool_boucle_diff_2k.jpg?c3d=0.5.1', 
                        material:'MeshBasicMaterial', 
                        repeatX: 3, 
                        repeatY: 3
                    },
                    {
                        url: root + 'cushion/denim_fabric_diff_2k.jpg?c3d=0.5.1', 
                        material:'MeshBasicMaterial', 
                        repeatX: 3, 
                        repeatY: 3
                    }
                ]
            },
            
            front_cushion:
            {
                label: self.lang['chair-front-cushion'], 
                printSize: {width: '10cm', height: '10cm'},
                materials: 
                [
                    {
                        url: root + 'cushion/gingham_check_diff_2k.jpg?c3d=0.5.1', 
                        material:'MeshBasicMaterial', 
                        repeatX: 3, 
                        repeatY: 3
                    },
                    {
                        url: root + 'cushion/hessian_230_diff_2k.jpg?c3d=0.5.1', 
                        material:'MeshBasicMaterial', 
                        repeatX: 3, 
                        repeatY: 3
                    },
                    {
                        url: root + 'cushion/curly_teddy_checkered_diff_2k.jpg?c3d=0.5.1', 
                        material:'MeshBasicMaterial', 
                        repeatX: 10, 
                        repeatY: 10
                    },
                    {
                        url: root + 'cushion/wool_boucle_diff_2k.jpg?c3d=0.5.1', 
                        material:'MeshBasicMaterial', 
                        repeatX: 3, 
                        repeatY: 3
                    },
                    {
                        url: root + 'cushion/denim_fabric_diff_2k.jpg?c3d=0.5.1', 
                        material:'MeshBasicMaterial', 
                        repeatX: 3, 
                        repeatY: 3
                    }
                ]
            }
        }
    };
}

// modify all wanted things
export async function init()
{
    // default view
    this.three.rotateToAngle(10, 30, 0);

    // enable zoom with mouse or tap (2 fingers)
    this.enableAutoZoom();

    // reset position by click
    this.userData.onClick = () =>
    {
        this.setView('feet');
        window.removeEventListener('click', this.userData.onClick);
        delete this.userData.onClick;
    };
    window.addEventListener('click', this.userData.onClick);

}

// set model views
// op = 'to' or 'set' => to=animated, set for to take screenshot (by exporting PDF)
export function setView(view, fn = 'to')
{
    switch (view)
    {
        case 'back_cushion':
            this.three.rotateToAngle(25, 0, 0, fn);
        break;

        case 'front_cushion':
            this.three.rotateToAngle(60, 0, 0, fn);
        break;

        case 'feet':
        default:
            this.three.rotateToAngle(0, 0, 0, fn);
        break;
    }

    this.three.controls.restoreSettings(fn);
}

// callback onUnLoad
export async function onUnLoad()
{
    
}
