import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.5.9';
import {degToRad} from 'customizer3D_dir/utils/degToRad.js?c3d=0.5.9';

export function lang()
{
    return {
        'artboard':  {en: 'Artboard',    de: 'Zeichenfläche',     tr: 'Tasarım Alanı'}
    };
}


export function parameters(self)
{
    return {
        // unique name (module name) in models folder, the name is important for creating instance 
        // const {parameters, init, setView, onUnLoad} = await import('models/'+ data.modelName +'.js');  
        modelName: 'C2D',

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
                minDistance: 0.2,
                maxDistance: 2,
                minPolarAngle: degToRad(5),
                maxPolarAngle: degToRad(170),
                minAzimuthAngle: degToRad(-85),
                maxAzimuthAngle: degToRad(85)
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
            area:
            {
                label: self.lang['artboard'],
                printSize: {width: null, height: null}
            }
        }
    };
}

export async function init()
{
    
}

// set model views
// op = 'to' or 'set' => to=animated, set for to take screenshot (by exporting PDF)
export function setView(view, fn = 'to')
{
    switch (view)
    {
        case 'area':
            this.three.rotateToAngle(0, 0, 0);
        break;
    }

    this.three.controls.restoreSettings(fn);
}

// callback onUnLoad
export async function onUnLoad()
{
    // revert orbit control options
    const oc = this.three.controls.orbit;
    oc.minPolarAngle = 0;
    oc.maxPolarAngle = Math.PI;
    oc.minAzimuthAngle = -Infinity;
    oc.maxAzimuthAngle = -Infinity;
}
