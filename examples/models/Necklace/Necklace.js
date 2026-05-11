import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=102';

export function lang()
{
    return {
        'necklace-chain': {en: 'Chain Color', de: 'Kettenfarbe', tr: 'Zincir Rengi'},
        'necklace-heart': {en: 'Heart Color', de: 'Herzfarbe', tr: 'Kalp Rengi'}
    };
}


export function parameters(self)
{
    const root = C3D_MODELS_DIR + 'Necklace/';

    return {

        // unique name (module name) in models folder, the name is important for creating instance 
        // const {parameters, init, setView, onUnLoad} = await import('models/'+ data.modelName +'.js'); 

        modelName: 'Necklace',

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
                minDistance: isMobile() ? 1 : 0.5,
                maxDistance: 4,
            },

            // set initial z position
            cameraOptions:
            {
                position:
                {
                    z: isMobile() ? 2.5 : 2
                }
            }
        },

        data:
        {
            chain:
            {
                label: self.lang['necklace-chain'],
                materials:
                [
                    {url:root + 'matcap-1764731458681.jpg?c3d=102', material:'MeshMatcapMaterial'},
                    {url:root + 'matcap-1764731647559.jpg?c3d=102', material:'MeshMatcapMaterial'},
                    {url:root + 'matcap-1764787557882.jpg?c3d=102', material:'MeshMatcapMaterial'}
                ]
            },
            heart:
            {
                label: self.lang['necklace-heart'],
                materials:
                [
                    {url:root + 'matcap-1764731458681.jpg?c3d=102', material:'MeshMatcapMaterial'},
                    {url:root + 'matcap-1764731647559.jpg?c3d=102', material:'MeshMatcapMaterial'},
                    {url:root + 'matcap-1764787557882.jpg?c3d=102', material:'MeshMatcapMaterial'},
                    {url:root + 'matcap-1764731550075.jpg?c3d=102', material:'MeshMatcapMaterial'}
                ]
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
        case 'chain':

            this.three.moveToAngle(0, 0, 2.5, fn);
            this.three.controls.orbit.enabled = true;

        break;

        case 'heart':

            this.three.moveToAngle(0, 25, 80, fn);
            this.three.controls.orbit.enabled = false;
            
        break;
    }

    this.three.controls.restoreSettings(fn);
}

// callback onUnLoad
export async function onUnLoad()
{

}
