import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.5.0';

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
        canvas2d:       'section.customizer > div.webgl_2d_canvas',

        // Three.js options
        three:
        {
            // set zoom-in, zoom-out limit
            orbitControlOptions: 
            {
                minDistance: isMobile() ? 1 : 0.5,
                maxDistance: 4
            },

            // set initial z position
            cameraOptions:
            {
                position:
                {
                    z: isMobile() ? 3 : 2
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
            model:
            {
                label: self.lang['bag-texture'],
                printSize:  {width: '20cm', height: '20cm'},
                materials:
                [
                    {url: root + 'Fabric067_2K-JPG_Color.jpg?c3d=0.5.0', repeatX: 2, repeatY: 2},
                    {url: root + 'Fabric018_2K-JPG_Color.jpg?c3d=0.5.0', repeatX: 2, repeatY: 2},
                    {url: root + 'Fabric061_2K-JPG_Color.jpg?c3d=0.5.0', repeatX: 2, repeatY: 2},
                    {url: root + 'Fabric026_2K-JPG_Color.jpg?c3d=0.5.0', repeatX: 2, repeatY: 2},
                    {url: root + 'Fabric024_2K-JPG_Color.jpg?c3d=0.5.0', repeatX: 2, repeatY: 2},
                ]
            },
            front:
            {
                label: self.lang['bag-front'],
                printSize:  {width: '20cm', height: '20cm'}
            },
            back:
            {
                label: self.lang['bag-back'],
                printSize:  {width: '20cm', height: '20cm'}
            }
        }
    };
}

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
        case 'front':
            this.three.rotateToAngle(0, 0, 0, fn);
            this.three.moveToAngle(0, 0.1, 0.8, fn);
        break;

        case 'back':
            this.three.rotateToAngle(0, 180, 0, fn);
            this.three.moveToAngle(0, 0.1, 0.8, fn);
        break;

        default:
            this.three.rotateToAngle(0, 0, 0, fn);
            this.three.moveToAngle(0, 0, 0, fn);
        break;
    }

    this.three.controls.restoreSettings(fn);
}

// callback onUnLoad
export async function onUnLoad()
{

}
