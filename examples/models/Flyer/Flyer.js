import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=102';

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
        canvas3d:       'section.customizer > div.webgl_3d_canvas > canvas.webgl_3d',

        // Three.js options
        three:
        {
            // set zoom-in, zoom-out limit
            orbitControlOptions: 
            {
                minDistance: 0.25,
                maxDistance: 4,
            }
        },

        data:
        {
            front:
            {
                label: self.lang['flyer-front'],
                printSize: {width: '24.26cm', height: '30.34cm'}
            },
            
            back:
            {
                label: self.lang['flyer-back'], 
                printSize: {width: '24.26cm', height: '30.34cm'}
            }
        }
    };
}

// module has been loaded, you can modify module elements in this function, if you wish
export async function init()
{
    // this == Customizer3D class
}

// set model views
export function setView(view, fn = 'to') // fn = 'to' => animated, 'set' => instant 
{
    switch (view)
    {
        default:
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
