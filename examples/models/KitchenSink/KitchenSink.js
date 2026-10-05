import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.5.0';
import {degToRad} from 'customizer3D_dir/utils/degToRad.js?c3d=0.5.0';

export function lang()
{
    return {
        'ks-cabinet':   {en: 'Cabinet',     de: 'Schrank',      tr: 'Dolap'},
        'ks-doors':     {en: 'Doors',       de: 'Türe',         tr: 'Kapılar'},
        'ks-faucet':    {en: 'Faucet',      de: 'Wasserhahn',   tr: 'Musluk'},
        'ks-frame':     {en: 'Frame',       de: 'Rahmen',       tr: 'Çerçeve'},
        'ks-handles':   {en: 'Handles',     de: 'Griffe',       tr: 'Kulplar'},
        'ks-marble':    {en: 'Marble',      de: 'Marmour',      tr: 'Mermer'},
        'ks-pans':      {en: 'Pans',        de: 'Pfannen',      tr: 'Tavalar'},
        'ks-sink':      {en: 'Sink',        de: 'Waschbecken',  tr: 'Lavabo'},
        'ks-towel':     {en: 'Towel',       de: 'Handtuch',     tr: 'Havlu'}
    };
}


export function parameters(self)
{
    const root = C3D_MODELS_DIR + 'KitchenSink/';

    return {
        // unique name (module name) in models folder, the name is important for creating instance 
        // const {parameters, init, setView, onUnLoad} = await import('models/'+ data.modelName +'.js'); 
        modelName: 'KitchenSink',

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
                maxDistance: 3
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
                label: self.lang['ks-cabinet'],
                printSize: {width: '10cm', height: '10cm'},
                materials:
                [
                    {
                        url: root + 'cabinet/dark.jpg?c3d=0.5.0'
                    },
                    {
                        url: root + 'cabinet/middle.jpg?c3d=0.5.0' 
                    },
                    {
                        url: root + 'cabinet/light.jpg?c3d=0.5.0' 
                    }
                ]
            },

            doors:
            {
                label: self.lang['ks-doors'],
                materials:
                [
                    {
                        colorOnly: true
                    }
                ]
            },

            faucet:
            {
                label: self.lang['ks-faucet'],
                materials:
                [
                    {
                        colors:
                        [
                            '#FFFFFF',
                            '#C79271',
                            '#FFC939',
                            '#B8C4D1',
                            '#636363'
                        ]
                    }
                ]
            },

            frame:
            {
                label: self.lang['ks-frame'],
                materials:
                [
                    {
                        colors:
                        [
                            '#C79271',
                            '#FFC939',
                            '#B8C4D1',
                            '#636363'
                        ]
                    }
                ]
            },

            handles:
            {
                label: self.lang['ks-handles'],
                materials:
                [
                    {
                        colorOnly: true
                    }
                ]
            },
            
            marble:
            {
                label: self.lang['ks-marble'],
                printSize: {width: '10cm', height: '10cm'},
                materials:
                [
                    {
                        url: root + 'marmour/black_gold.jpg?c3d=0.5.0'
                    },
                    {
                        url: root + 'marmour/white_gold.jpg?c3d=0.5.0' 
                    },
                    {
                        url: root + 'marmour/middle.jpg?c3d=0.5.0'
                    },
                    {
                        url: root + 'marmour/black.jpg?c3d=0.5.0'
                    },
                    {
                        url: root + 'marmour/white.jpg?c3d=0.5.0'
                    }
                ]
            },
            
            pans:
            {
                label: self.lang['ks-pans'],
                materials:
                [
                    {
                        colors:
                        [
                            '#FFFFFF',
                            '#C79271',
                            '#FFC939',
                            '#B8C4D1',
                            '#636363'
                        ]
                    }
                ]
            },

            sink:
            {
                label: self.lang['ks-sink'],
                materials:
                [
                    {
                        colors:
                        [
                            '#FFFFFF',
                            '#C79271',
                            '#FFC939',
                            '#B8C4D1',
                            '#636363'
                        ]
                    }
                ]
            },

            towel:
            {
                label: self.lang['ks-towel'],
                materials:
                [
                    {
                        colorOnly: true
                    }
                ]
            }
        }
    };
}

// modify all wanted things
export async function init()
{
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
            this.three.rotateToAngle(0, 180, 0);
            this.three.moveToAngle(0, 0.1, 0.75);
        break;

        case 'doors':
        case 'handles':
            this.three.rotateToAngle(0, 0, 0);
            this.three.moveToAngle(0, 0.1, 0.75);
        break;

        case 'frame':
            this.three.rotateToAngle(0, 0, 0);
            this.three.moveToAngle(0, -0.1, 0.5);
        break;

        case 'faucet':
            this.three.rotateToAngle(30, 30, 0);
            this.three.moveToAngle(0.1, 0.05, 0.75);
        break;

        case 'pans':
            this.three.rotateToAngle(0, 0, 0);
            this.three.moveToAngle(0, -0.15, 0.75);
        break;

        case 'towel':
            this.three.rotateToAngle(0, 0, 0);
            this.three.moveToAngle(0.1, -0.1, 1);
        break;

        case 'marble':
        case 'sink':
            this.three.rotateToAngle(90, 0, 0);
            this.three.moveToAngle(0, 0, 0.75);
        break;

        default:
            this.three.rotateToAngle(0, 0, 0);
            this.three.moveToAngle(0, 0, 0);
        break;

    }

    this.three.controls.restoreSettings(fn);
}

// callback onUnLoad
export async function onUnLoad()
{

}
