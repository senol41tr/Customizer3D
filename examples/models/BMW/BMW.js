import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.5.0';
import {degToRad} from 'customizer3D_dir/utils/degToRad.js?c3d=0.5.0';

export function lang(self)
{
    return {};
}


export function parameters(self)
{
    return {
        // unique name (module name) in models folder, the name is important for creating instance 
        // const {parameters, init, setView, onUnLoad} = await import('models/'+ data.modelName +'.js'); 
        modelName: 'BMW',

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
            '*': { materials: [{colorOnly: true}]}
        }
    };
}

export async function init(self)
{
    // default view
    this.three.rotateToAngle(0, 30, 0);

    // this.glbScene.position.x =  isMobile() ? 0 : 4;
    // this.glbScene.position.y =  isMobile() ? -4 : -20;

    // enable zoom with mouse or tap (2 fingers)
    this.enableAutoZoom();

}

// set model views
// op = 'to' or 'set' => to=animated
export function setView(view, fn = 'to')
{
}


// callback onUnLoad
export async function onUnLoad()
{

}
