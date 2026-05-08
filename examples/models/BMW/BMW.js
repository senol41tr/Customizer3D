import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=101';

export function lang(self)
{
    return {
        'body':         {en: 'Body Color',      de: 'Karosserie Farbe',         tr: 'Gövde Rengi'},
        'bumper':       {en: 'Bumper Color',    de: 'Stoßstange Farbe',         tr: 'Tampon Rengi'},
        'sideskirt':    {en: 'Sideskirt Color', de: 'Seitenschweller Farbe',    tr: 'Etek Rengi'},
        'wheels':       {en: 'Wheels Color',    de: 'Felgen Farbe',             tr: 'Jant Rengi'}
    };
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
        canvas3d:       'section.customizer > div.webgl_3d_canvas > canvas.webgl_3d',

        // Three.js options
        three:
        {
            // set zoom-in, zoom-out limit
            orbitControlOptions: 
            {
                minDistance: isMobile() ? 2 : 1,
                maxDistance: isMobile() ? 4 : 2,
                minPolarAngle: Math.PI / 2,
                maxPolarAngle: Math.PI / 2
            },

            // set initial z position
            cameraOptions:
            {
                position:
                {
                    z: isMobile() ? 4 : 2
                }
            },
        },

        data:
        {
            'body': { materials: [{colorOnly: true}]},
            'bumper': { materials: [{colorOnly: true}]},
            'sideskirt': { materials: [{colorOnly: true}]},
            'wheels': { materials: [{colorOnly: true}]}
        }
    };
}

export async function init()
{
    this.three.rotateToAngle(0, 40, 0);

    // enable zoom with mouse or tap (2 fingers)
    this.enableAutoZoom();

    // disable pan
    this.three.controls.orbit.enablePan = false;

}

// set model views
// op = 'to' or 'set' => to=animated, set=instant
export function setView(view, fn = 'to')
{
    switch (view)
    {
        case 'bumper':
            this.three.rotateToAngle(0, 180, 0, fn);
        break;

        case 'sideskirt':
            this.three.rotateToAngle(0, -90, 0, fn);
        break;

        case 'wheels':
            this.three.rotateToAngle(0, 90, 0, fn);
        break;

        case 'body':
        default:
            this.three.rotateToAngle(0, 40, 0, fn);
        break;
    }

    this.three.controls.restoreSettings(fn);
}


// callback onUnLoad
export async function onUnLoad()
{
    // restore changed settings
    this.three.controls.orbit.minPolarAngle = 0;
    this.three.controls.orbit.maxPolarAngle = Math.PI;
    this.three.controls.orbit.enablePan = true;
}
