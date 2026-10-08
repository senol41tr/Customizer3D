import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.5.1';
import {degToRad} from 'customizer3D_dir/utils/degToRad.js?c3d=0.5.1';

export function lang()
{
    return {
        'cabinet-texture':      {en: 'Cabinet Texture', de: 'Schranktextur',    tr: 'Dolap Dokusu'},
        'marble-type':          {en: 'Marble Type',     de: 'Marmorart',        tr: 'Mermer Tipi'},
        'metal_pieces-texture': {en: 'Metal Pieces',    de: 'Metallteile',      tr: 'Metal Parçalar'}
    };
}


export function parameters(self)
{
    const root = C3D_MODELS_DIR + 'Sink/';

    return {
        // unique name (module name) in models folder, the name is important for creating instance 
        // const {parameters, init, setView, onUnLoad} = await import('models/'+ data.modelName +'.js'); 
        modelName: 'Sink',

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
                minDistance: isMobile() ? 1 : 0.5,
                maxDistance: 6,
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
            cabinet:
            {
                label: self.lang['cabinet-texture'],
                printSize: {width: '10cm', height: '10cm'},
                materials:
                [
                    {
                        url: root + 'cabinet/dark.jpg?c3d=0.5.1', 
                        repatX: 4, 
                        repeatY: 4, 
                        material: 'MeshStandardMaterial', 
                        materialOptions: 
                        {
                            metalness: 0.75, 
                            roughness: 0.5
                        }
                    },
                    {
                        url: root + 'cabinet/middle.jpg?c3d=0.5.1', 
                        repatX: 4, 
                        repeatY: 4, 
                        material: 'MeshStandardMaterial', 
                        materialOptions:
                        {
                            metalness: 0.75, 
                            roughness: 0.5
                        }
                    },
                    {
                        url: root + 'cabinet/light.jpg?c3d=0.5.1', 
                        repatX: 4, 
                        repeatY: 4, 
                        material: 'MeshStandardMaterial', 
                        materialOptions:
                        {
                            metalness: 0.75, 
                            roughness: 0.5
                        }
                    }
                ]
            },
            marmour:
            {
                label: self.lang['marble-type'],
                printSize: {width: '10cm', height: '10cm'},
                materials:
                [
                    {
                        url: root + 'marmour/black_gold.jpg?c3d=0.5.1', 
                        material: 'MeshStandardMaterial', 
                        materialOptions: 
                        {
                            metalness: 0.75, 
                            roughness: 0.5
                        }
                    },
                    {
                        url: root + 'marmour/white_gold.jpg?c3d=0.5.1', 
                        material: 'MeshStandardMaterial', 
                        materialOptions: 
                        {
                            metalness: 0.75, 
                            roughness: 0.5
                        }
                    },
                    {
                        url: root + 'marmour/middle.jpg?c3d=0.5.1', 
                        material: 'MeshStandardMaterial', 
                        materialOptions: 
                        {
                            metalness: 0.75, 
                            roughness: 0.5
                        }
                    },
                    {
                        url: root + 'marmour/black.jpg?c3d=0.5.1', 
                        material: 'MeshStandardMaterial', 
                        materialOptions: 
                        {
                            metalness: 0.75, 
                            roughness: 0.5
                        }
                    },
                    {
                        url: root + 'marmour/white.jpg?c3d=0.5.1', 
                        material: 'MeshStandardMaterial', 
                        materialOptions: 
                        {
                            metalness: 0.75, 
                            roughness: 0.5
                        }
                    }
                ]
            },
            metal_pieces:
            {
                label: self.lang['metal_pieces-texture'],
                printSize: {width: '10cm', height: '10cm'},
                materials:
                [
                    {
                        url: root + 'metal_pieces/gold.jpg?c3d=0.5.1', 
                        material: 'MeshMatcapMaterial'
                    },
                    {
                        url: root + 'metal_pieces/anthracite.jpg?c3d=0.5.1', 
                        material: 'MeshMatcapMaterial'
                    },
                    {
                        url: root + 'metal_pieces/metal.jpg?c3d=0.5.1', 
                        material: 'MeshMatcapMaterial'
                    },
                    {
                        url: root + 'metal_pieces/green_metal.jpg?c3d=0.5.1', 
                        material: 'MeshMatcapMaterial'
                    },
                    {
                        url: root + 'metal_pieces/orange_metal.jpg?c3d=0.5.1', 
                        material: 'MeshMatcapMaterial'
                    },
                    {
                        url: root + 'metal_pieces/red_metal.jpg?c3d=0.5.1', 
                        material: 'MeshMatcapMaterial'
                    },
                    {
                        url: root + 'metal_pieces/white_metal.jpg?c3d=0.5.1', 
                        material: 'MeshMatcapMaterial'
                    }
                ]
            }
        }
    };
}

// modify all wanted things
export async function init()
{
    // initial position
    this.three.rotateToAngle(30, 30, 0);

    // enable zoom with mouse or tap (2 fingers)
    this.enableAutoZoom();

}

// set model views
// op = 'to' or 'set' => to=animated, set for to take screenshot (by exporting PDF)
export function setView(view, fn = 'to')
{
    switch (view)
    {
        case 'cabinet':
            this.three.rotateToAngle(0, 0, 0, fn);
        break;

        case 'marmour':
            this.three.rotateToAngle(90, 0, 0, fn);
        break;

        case 'metal_pieces':
            this.three.rotateToAngle(30, 30, 0, fn);
        break;
    }

    this.three.controls.restoreSettings(fn);
}

// callback onUnLoad
export async function onUnLoad()
{

}
