import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=103';

export function lang()
{
    return {
        'package-top': {en: 'Top Design', de: 'Oben Design', tr: 'Üst Tasarım'},
        'package-front': {en: 'Front Design', de: 'Vorne Design', tr: 'Ön Tasarım'},
        'package-left': {en: 'Left Design', de: 'Links Design', tr: 'Sol Tasarım'},
        'package-right': {en: 'Right Design', de: 'Rechts Design', tr: 'Sağ Tasarım'},
    };
}


export function parameters(self)
{
    return {

        // unique name (module name) in models folder, the name is important for creating instance 
        // const {parameters, init, setView, onUnLoad} = await import('models/'+ data.modelName +'.js');

        modelName: 'Package',

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
                minDistance: 0.75,
                maxDistance: 5,
            },

            // set initial z position
            cameraOptions:
            {
                position:
                {
                    z: isMobile() ? 5 : 2.5
                }
            }
        },

        data:
        {
            top:
            {
                label: self.lang['package-top'],
                printSize: {width: '14cm', height: '14cm'},
                materials: [{image: true}, {solid: true}]
            },

            front:
            {
                label: self.lang['package-front'],
                printSize: {width: '22.5cm', height: '4.5cm'},
                materials: [{text: true}]
            },
            
            left:
            {
                label: self.lang['package-left'],
                printSize: {width: '14.5cm', height: '4.5cm'},
                materials: [{image: true}, {text: true}]
            },
            
            right:
            {
                label: self.lang['package-right'],
                printSize: {width: '14.5cm', height: '4.5cm'},
                materials: [{image: true}, {text: true}]
            }
        }
    };
}

export async function init()
{
    // set initial rotation
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
        case 'top':
            this.three.rotateToAngle(90, 0, 0, fn);
        break;

        case 'front':
            this.three.rotateToAngle(0, 0, 0, fn);
        break;

        case 'left':
            this.three.rotateToAngle(0, 90, 0, fn);
        break;

        case 'right':
            this.three.rotateToAngle(0, -90, 0, fn);
        break;

        default:
            this.three.rotateToAngle(30, 30, 0, fn);
        break;
    }

    this.three.controls.restoreSettings(fn);
}

// callback onUnLoad
export async function onUnLoad()
{

}
