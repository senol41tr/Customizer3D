import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=101';

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
        canvas3d:       'section.customizer > div.webgl_3d_canvas > canvas.webgl_3d',

        // Three.js options
        three:
        {
            // set zoom-in, zoom-out limit
            orbitControlOptions: 
            {
                minDistance: isMobile() ? 0.6 : 0.3,
                maxDistance: isMobile() ? 2 : 2,
            },

            // set initial z position
            cameraOptions:
            {
                position:
                {
                    z: isMobile() ? 2 : 1.25
                }
            }
        },

        data:
        {
            cabinet:
            {
                label: self.lang['ks-cabinet'],
                materials:
                [
                    {
                        url: root + 'cabinet/dark.jpg?c3d=101', 
                        repatX: 4, 
                        repeatY: 4
                    },
                    {
                        url: root + 'cabinet/middle.jpg?c3d=101', 
                        repatX: 4, 
                        repeatY: 4
                    },
                    {
                        url: root + 'cabinet/light.jpg?c3d=101', 
                        repatX: 4, 
                        repeatY: 4
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
                materials:
                [
                    {
                        url: root + 'marmour/black_gold.jpg?c3d=101', 
                        material: 'MeshStandardMaterial'
                    },
                    {
                        url: root + 'marmour/white_gold.jpg?c3d=101', 
                        material: 'MeshStandardMaterial'
                    },
                    {
                        url: root + 'marmour/middle.jpg?c3d=101', 
                        material: 'MeshStandardMaterial'
                    },
                    {
                        url: root + 'marmour/black.jpg?c3d=101', 
                        material: 'MeshStandardMaterial'
                    },
                    {
                        url: root + 'marmour/white.jpg?c3d=101', 
                        material: 'MeshStandardMaterial'
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
        case 'marble':
        case 'sink':
            this.three.rotateToAngle(90, 0, 0, fn);
        break;

        default:
        case 'cabinet':
            this.three.rotateToAngle(0, 0, 0, fn);
        break;

    }

    this.three.controls.restoreSettings(fn);
}

// callback onUnLoad
export async function onUnLoad()
{

}
