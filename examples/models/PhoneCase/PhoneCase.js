import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=104';

export function lang(self)
{
    return {
        'pc-case':          {en: 'Case Color',      de: 'Hüllefarbe',       tr: 'Kılıf Rengi'},
        'pc-design_area':   {en: 'Design area',     de: 'Designbereich',    tr: 'Tasarım alanı'}
    };
}


export function parameters(self)
{
    return {

        // unique name (module name) in models folder, the name is important for creating instance 
        // const {parameters, init, setView, onUnLoad} = await import('models/'+ data.modelName +'.js'); 
        
        modelName: 'PhoneCase',

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
                minDistance: 0.5,
                maxDistance: 2.5,
            },

            // set initial z position
            cameraOptions:
            {
                position:
                {
                    z: isMobile() ? 1.75 : 1.25
                }
            }
        },

        data:
        {
            case:
            {
                label: self.lang['pc-case'],
                materials: [{colorOnly: true}]
            },

            design_area:
            {
                label: self.lang['pc-design_area'],
                printSize: {width: '14.83cm', height: '30cm'}
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
        case 'case':
            this.three.rotateToAngle(0, 180, 0, fn);
        break;

        case 'design_area':
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
