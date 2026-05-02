import {isMobile} from 'customizer3D_dir/utils/isMobile.js';

export function lang()
{
    return {
        'notebook-front': {en: 'Front Design', de: 'Vorne Design', tr: 'Ön Tasarım'}
    };
}


export function parameters(self)
{
    return {

        // unique name (module name) in models folder, the name is important for creating instance 
        // const {parameters, init, setView, onUnLoad} = await import('models/'+ data.modelName +'.js');

        modelName: 'NoteBook',

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
                minDistance: 0.25,
                maxDistance: 1,
            },

            // set initial z position
            cameraOptions:
            {
                position:
                {
                    z: isMobile() ? 0.75 : 0.5
                }
            }
        },

        data:
        {
            front:
            {
                label: self.lang['notebook-front'],
                printSize: {width: '11.8cm', height: '19.6cm'}
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
            this.three.rotateToAngle(0, 0, 0, fn);
        break;
    }

    this.three.controls.restoreSettings(fn);
}

// callback onUnLoad
export async function onUnLoad()
{

}
