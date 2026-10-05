import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.5.0';

export function lang()
{
    return {
        't-shirt-color':    {en: 'T-Shirt Color',   de: 'T-Shirt Farbe',    tr: 'T-Shirt Rengi'},
        'front-design':     {en: 'Front Design',    de: 'Vorne Design',     tr: 'Ön Tasarım'},
        'back-design':      {en: 'Back Design',     de: 'Hinten Design',    tr: 'Arka Tasarım'},
        'left-design':      {en: 'Left Design',     de: 'Links Design',     tr: 'Sol Tasarım'},
        'right-design':     {en: 'Right Design',    de: 'Rechts Design',    tr: 'Sağ Tasarım'}
    };
}

export function parameters(self)
{
    return {
        // unique name (module name) in models folder, the name is important for creating instance 
        // const {parameters, init, setView, onUnLoad} = await import('models/'+ data.modelName +'.js');
        modelName: 'TShirt',

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
                minDistance: isMobile() ? 0.25 : 0.5,
                maxDistance: 4
            },

            // set initial z position
            cameraOptions:
            {
                position:
                {
                    z: isMobile() ? 2 : 1
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
                label: self.lang['t-shirt-color'],
                materials:
                [
                    // available options: HEX: #RRGGBB, RGB: rgb(255,255,255) CMYK: 0% 0% 0% 100%
                    {
                        colors:
                        [
                            '#ffffff', 
                            '#808080', 
                            '#222222', 
                            '#000000', 
                            '#f8cfaf', 
                            '#77809f', 
                            '#709078', 
                            '#58784f', 
                            '#ffd461', 
                            '#ef783e', 
                            '#ea5455', 
                            '#2c4059'
                        ],
                        material: 'MeshPhongMaterial'
                    }
                ]
            },
            
            front:
            {
                label: self.lang['front-design'], 
                printSize: {width: '20cm', height: '20cm'}
            },

            back:
            {
                label: self.lang['back-design'], 
                printSize: {width: '20cm', height: '20cm'}
            },

            left:
            {
                label: self.lang['left-design'], 
                printSize: {width: '5cm', height: '5cm'}
            },

            right:
            {
                label: self.lang['right-design'], 
                printSize: {width: '5cm', height: '5cm'}
            }
        }
    };
}

// initialization callback
export async function init()
{
    // enable zoom with mouse or tap (2 fingers)
    this.enableAutoZoom();
}

// set model views
// op = 'to' or 'set' => to=animated, set=instantly for to take screenshot (by exporting PDF)
export function setView(view, fn = 'to')
{
    const multiplyer = isMobile() ? 1.5 : 1;

    switch (view)
    {
        case 'back':
            this.three.rotateToAngle(0, 180, 0, fn);
            this.three.moveToAngle(0, 0, 1, fn);
        break;

        case 'left':
            this.three.rotateToAngle(0, 90, 30, fn);
            this.three.moveToAngle(0, -0.05, 1, fn);
        break;

        case 'right':
            this.three.rotateToAngle(0, -90, -30, fn);
            this.three.moveToAngle(0, -0.05, 1, fn);
        break;

        case 'front':
            this.three.rotateToAngle(0, 0, 0, fn);
            this.three.moveToAngle(0, 0, 1, fn);
        break;

        default:
        case 'model':
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
