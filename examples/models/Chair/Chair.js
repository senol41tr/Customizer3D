import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=101';

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
        canvas3d:       'section.customizer > div.webgl_3d_canvas > canvas.webgl_3d',

        // Three.js options
        three:
        {
            // set zoom-in, zoom-out limit
            orbitControlOptions: 
            {
                minDistance: isMobile() ? 0.5 : 1,
                maxDistance: isMobile() ? 6 : 4,
            },

            // set initial z position
            cameraOptions:
            {
                position:
                {
                    z: isMobile() ? 5 : 2.5
                }
            }
        },

        data:
        {
            feet:
            {
                label: self.lang['chair-feet'],
                printSize: {width: '20cm', height: '20cm'},
                materials:
                [
                    {
                        url: root + 'feet/white_metal.jpg?c3d=101', 
                        material:'MeshMatcapMaterial'
                    },
                    {
                        url: root + 'feet/metal.jpg?c3d=101', 
                        material:'MeshMatcapMaterial'
                    },
                    {
                        url: root + 'feet/green_metal.jpg?c3d=101', 
                        material:'MeshMatcapMaterial'
                    },
                    {
                        url: root + 'feet/gold.jpg?c3d=101', 
                        material:'MeshMatcapMaterial'
                    },
                    {
                        url: root + 'feet/orange_metal.jpg?c3d=101', 
                        material:'MeshMatcapMaterial'
                    },
                    {
                        url: root + 'feet/red_metal.jpg?c3d=101', 
                        material:'MeshMatcapMaterial'
                    }
                ]
            },
            
            back_cushion:
            {
                label: self.lang['chair-back-cushion'], 
                printSize: {width: '20cm', height: '20cm'},
                materials: 
                [
                    {
                        url: root + 'cushion/gingham_check_diff_2k.jpg?c3d=101', 
                        material:'MeshBasicMaterial', 
                        repeatX: 3, 
                        repeatY: 3
                    },
                    {
                        url: root + 'cushion/hessian_230_diff_2k.jpg?c3d=101', 
                        material:'MeshBasicMaterial', 
                        repeatX: 3, 
                        repeatY: 3
                    },
                    {
                        url: root + 'cushion/curly_teddy_checkered_diff_2k.jpg?c3d=101', 
                        material:'MeshBasicMaterial', 
                        repeatX: 10, 
                        repeatY: 10
                    },
                    {
                        url: root + 'cushion/wool_boucle_diff_2k.jpg?c3d=101', 
                        material:'MeshBasicMaterial', 
                        repeatX: 3, 
                        repeatY: 3
                    },
                    {
                        url: root + 'cushion/denim_fabric_diff_2k.jpg?c3d=101', 
                        material:'MeshBasicMaterial', 
                        repeatX: 3, 
                        repeatY: 3
                    }
                ]
            },
            
            front_cushion:
            {
                label: self.lang['chair-front-cushion'], 
                printSize: {width: '20cm', height: '20cm'},
                materials: 
                [
                    {
                        url: root + 'cushion/gingham_check_diff_2k.jpg?c3d=101', 
                        material:'MeshBasicMaterial', 
                        repeatX: 3, 
                        repeatY: 3
                    },
                    {
                        url: root + 'cushion/hessian_230_diff_2k.jpg?c3d=101', 
                        material:'MeshBasicMaterial', 
                        repeatX: 3, 
                        repeatY: 3
                    },
                    {
                        url: root + 'cushion/curly_teddy_checkered_diff_2k.jpg?c3d=101', 
                        material:'MeshBasicMaterial', 
                        repeatX: 10, 
                        repeatY: 10
                    },
                    {
                        url: root + 'cushion/wool_boucle_diff_2k.jpg?c3d=101', 
                        material:'MeshBasicMaterial', 
                        repeatX: 3, 
                        repeatY: 3
                    },
                    {
                        url: root + 'cushion/denim_fabric_diff_2k.jpg?c3d=101', 
                        material:'MeshBasicMaterial', 
                        repeatX: 3, 
                        repeatY: 3
                    }
                ]
            }
        }
    };
}

export async function init()
{
    // set default rotation
    this.three.rotateToAngle(10, 30, 0);

    // enable zoom with mouse or tap (2 fingers)
    this.enableAutoZoom();

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
            this.three.rotateToAngle(0, 60, 0, fn);
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
