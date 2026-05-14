import * as THREE from 'three';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=104';

export function lang(self)
{
    return {
        'shoes-hexagonalmat':       {en: 'Fabric Color', de: 'Stofffarbe', tr: 'Kumaş Rengi'},
        'shoes-blackmat':           {en: 'Base Color', de: 'Grundfarbe', tr: 'Temel Renk'},
        'shoes-solemat':            {en: 'Sole Color', de: 'Schuhsohlenfarbe', tr: 'Taban Rengi'},
        'shoes-sole2mat':           {en: 'Sole Color 2', de: 'Schuhsohlenfarbe 2', tr: 'Taban Rengi 2'},
        'shoes-sole3mat':           {en: 'Sole Color 3', de: 'Schuhsohlenfarbe 3', tr: 'Taban Rengi 3'},
        'shoes-tongue':             {en: 'Tongue Color', de: 'Zungenfarbe', tr: 'Dil Rengi'},
        'shoes-lacesmat':           {en: 'Laces Color', de: 'Schnürsenkelfarbe', tr: 'Bağcık Rengi'},
        'shoes-shinyblackwawemat':  {en: 'Black Wave Color', de: 'Schwarze Welle Farbe', tr: 'Siyah Dalga Rengi'},
        'shoes-shinyblackmat':      {en: 'Black Wave Color 2', de: 'Schwarze Welle Farbe 2', tr: 'Siyah Dalga Rengi 2'},
        'shoes-orangemat':          {en: 'Accent Color', de: 'Akzentfarbe', tr: 'Vurgu Rengi'},
        'shoes-nikelogobig':        {en: 'Nike Logo Color', de: 'Nike-Logo-Farbe', tr: 'Nike Logo Rengi'},
        'shoes-notice':             {en: 'Left Shoe is clickable!', de: 'Der linke Schuh ist anklickbar!', tr: 'Sol Ayakkabı tıklanabilir!'}
    };
}


export function parameters(self)
{
    return {
        
        // unique name (module name) in models folder, the name is important for creating instance 
        // const {parameters, init, setView, onUnLoad} = await import('models/'+ data.modelName +'.js'); 

        modelName: 'Shoes',

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
                maxDistance: 2
            },

            // set initial z position
            cameraOptions:
            {
                position:
                {
                    z: isMobile() ? 1.5 : 0.75
                }
            }
        },

        data:
        {
            // '*': { materials: [{colorOnly: true}], group:'NIKESHOE1'}
            Cube:
            {
                label: self.lang['shoes-hexagonalmat'],
                materials: [{colorOnly: true}],
                group: 'NIKESHOE1'
            },
            
            Cube_1:
            {
                label: self.lang['shoes-blackmat'],
                materials: [{colorOnly: true}],
                group: 'NIKESHOE1'
            },

            Cube_3:
            {
                label: self.lang['shoes-solemat'],
                materials: [{colorOnly: true}],
                group: 'NIKESHOE1'
            },

            Cube_4:
            {
                label: self.lang['shoes-sole2mat'],
                materials: [{colorOnly: true}],
                group: 'NIKESHOE1'
            },

            Cube_5:
            {
                label: self.lang['shoes-sole3mat'],
                materials: [{colorOnly: true}],
                group: 'NIKESHOE1'
            },

            Cube_6:
            {
                label: self.lang['shoes-tongue'],
                materials: [{colorOnly: true}],
                group: 'NIKESHOE1'
            },

            Cube_7:
            {
                label: self.lang['shoes-lacesmat'],
                materials: [{colorOnly: true}],
                group: 'NIKESHOE1'
            },

            Cube_8:
            {
                label: self.lang['shoes-shinyblackwawemat'],
                materials: [{colorOnly: true}],
                group: 'NIKESHOE1'
            },

            Cube_9:
            {
                label: self.lang['shoes-shinyblackmat'],
                materials: [{colorOnly: true}],
                group: 'NIKESHOE1'
            },
            
            Cube_10:
            {
                label: self.lang['shoes-orangemat'],
                materials: [{colorOnly: true}],
                group: 'NIKESHOE1'
            },

            Cube_11:
            {
                label: self.lang['shoes-nikelogobig'],
                materials: [{colorOnly: true}],
                group: 'NIKESHOE1'
            }
        }
    };
}

// modify all wanted things
export async function init()
{
    this.glbScene.position.y = -0.05;

    // set initial rotation
   this.three.rotateToAngle(0, 90, 0);

    // show notice
    const p = document.createElement('p');
    p.style.position = 'absolute';
    p.style.zIndex = this.zIndex.index;
    p.style.left = '50%';
    p.style.top = '80%';
    p.style.transform = 'translateX(-50%)';
    p.style.padding = '0.5rem';
    p.style.color = '#ffffff';
    p.style.backgroundColor = '#0081ff';
    p.style.borderRadius = '6px';
    p.innerText = this.lang['shoes-notice'];

    // append to container
    document.querySelector(this.props.container).appendChild(p);
    
    // remove after 10 seconds
    setTimeout(() => { p.remove(); delete this.userData.p;}, 10000);

    // enable zoom with mouse or tap (2 fingers)
    this.enableAutoZoom();

    // store as user data
    this.userData.p = p;
}

// set model views
// op = 'to' or 'set' => to=animated, set for to take screenshot (by exporting PDF)
export function setView(view, fn = 'to')
{
}


// callback onUnLoad
export async function onUnLoad()
{
    if(this.userData.p)
    {
        this.userData.p.remove();
        delete this.userData.p;
    }
}
