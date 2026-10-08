import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.5.1';
import {degToRad} from 'customizer3D_dir/utils/degToRad.js?c3d=0.5.1';

export function lang()
{
    return {
        'flyer-front':  {en: 'Front Design',    de: 'Vorne Design',     tr: 'Ön Tasarım'},
        'flyer-back':   {en: 'Back Design',     de: 'Hinten Design',    tr: 'Arka Tasarım'}
    };
}


export function parameters(self)
{
    return {
        // unique name (module name) in models folder, the name is important for creating instance 
        // const {parameters, init, setView, onUnLoad} = await import('models/'+ data.modelName +'.js');  
        modelName: 'Flyer',

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
                minDistance: isMobile() ? 1 : 0.25,
                maxDistance: 4
            },

            // set initial z position
            cameraOptions:
            {
                position:
                {
                    z: isMobile() ? 1.5 : 0.75
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
            front:
            {
                label: self.lang['flyer-front'],
                printSize: {width: '12.13cm', height: '15.17cm'}
            },
            
            back:
            {
                label: self.lang['flyer-back'], 
                printSize: {width: '12.13cm', height: '15.17cm'}
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
        default:
        case 'front':
            this.three.rotateToAngle(0, 0, 0);
        break;

        case 'back':
            this.three.rotateToAngle(0, 180, 0);
        break;
    }

    this.three.controls.restoreSettings(fn);
}

// callback onUnLoad
export async function onUnLoad()
{

}
