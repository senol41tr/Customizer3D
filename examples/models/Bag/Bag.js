import {isMobile} from 'customizer3D_dir/utils/isMobile.js';

export function lang()
{
    return {
        'bag-texture':  {en: 'Bag Texture',     de: 'Taschentextur',    tr: 'Çanta Dokusu'},
        'bag-front':    {en: 'Front Design',    de: 'Vorne Design',     tr: 'Ön Tasarım'},
        'bag-back':     {en: 'Back Design',     de: 'Hinten Design',    tr: 'Arka Tasarım'}
    };
}


export function parameters(self)
{
    const root = C3D_MODELS_DIR + 'Bag/';

    return {
        // unique name (module name) in models folder, the name is important for creating instance 
        // const {parameters, init, setView, onUnLoad} = await import('models/'+ data.modelName +'.js'); 
        modelName: 'Bag',

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
                minDistance: 8,
                maxDistance: 70,
            },

            // set initial z position
            cameraOptions:
            {
                position:
                {
                    z: isMobile() ? 60 : 35
                }
            }
        },

        data:
        {
            model:
            {
                label: self.lang['bag-texture'],
                materials:
                [
                    {url: root + 'Fabric067_2K-JPG_Color.jpg', repeatX: 2, repeatY: 2},
                    {url: root + 'Fabric018_2K-JPG_Color.jpg', repeatX: 3, repeatY: 3},
                    {url: root + 'Fabric061_2K-JPG_Color.jpg', repeatX: 3, repeatY: 3},
                    {url: root + 'Fabric026_2K-JPG_Color.jpg', repeatX: 3, repeatY: 3},
                    {url: root + 'Fabric039_1K-JPG_Color.jpg', repeatX: 3, repeatY: 3},
                    {url: root + 'Fabric024_2K-JPG_Color.jpg', repeatX: 3, repeatY: 3}
                ]
            },
            front:
            {
                label: self.lang['bag-front'],
                printSize:  {width: '20.9cm', height: '21.7cm'}
            },
            back:
            {
                label: self.lang['bag-back'],
                printSize:  {width: '20.9cm', height: '21.7cm'}
            }
        }
    };
}

export async function init()
{
    
}

// fn = 'to' or 'set' => to=animated, set=instant
export function setView(view, fn = 'to')
{
    switch (view)
    {
        case 'model':
        case 'front':
            this.three.rotateToAngle(0, 0, 0, fn);
        break;

        case 'back':
            this.three.rotateToAngle(0, 180, 0, fn);
        break;
    }

    this.three.controls.restoreSettings(fn);
}

// callback onUnLoad
export async function onUnLoad()
{

}
