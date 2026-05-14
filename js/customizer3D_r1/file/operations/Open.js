import * as THREE from 'three';
import * as fflate from 'base/fflate@0.8.2/fflate.esm.js';
import {mergeRecursive} from 'customizer3D_dir/utils/mergeRecursive.js?c3d=103';
import {Lang} from 'customizer3D_dir/lang/Lang.js?c3d=103';
import gsap from 'base/gsap@3.13.0/gsap@3.13.0.esm.js';
import {fitMeshToScreen} from 'customizer3D_dir/utils/fitMeshToScreen.js?c3d=103';
import {fetchWithProgress} from 'customizer3D_dir/utils/fetchWithProgress.js?c3d=103';

export class Open
{
    constructor(c3d)
    {
        this.c3d = c3d;
    }

    async open(file)
    {
        let arrayBuffer, header = '';

        this.c3d.preloader.show();
        this.c3d.showHideUI.hide();

        if(typeof file == 'string') // load .c3d
        {
            try {
                arrayBuffer = await fetchWithProgress(file, (percent) => this.c3d.preloader.set(this.c3d.lang['processing-c3d-file'] + '<br><b>' + percent + '%</b>'));
            }
            catch(e) {
                this.c3d.showHideUI.show();
                this.c3d.preloader.hide();
                return;
            }
        }
        else
        {
            file = file.currentTarget.files[0];
            if(!file)
            {
                this.c3d.preloader.hide();
                return;
            }
            arrayBuffer = await file.arrayBuffer();
        }
        
        // check file type
        const fileSignature = new Uint8Array(arrayBuffer).subarray(0, 4).forEach((v) => header+=v.toString(16)); // https://stackoverflow.com/a/29672957
        
        if(header != '504b34')
        {
            alert('File Type mismatch!!\nSupported file type is [.c3d]');
            return;
        }

        const modelName = 'model.c3d';
        const zipFileData = new Uint8Array(arrayBuffer);
        const unzipped = fflate.unzipSync(zipFileData);

        // first file must be 'model.c3d'
        if(!unzipped.hasOwnProperty(modelName))
        {
            alert("Model not Found!");
            this.c3d.preloader.hide();
            return;
        }

        // call onUnload
        if(this.c3d.onUnLoad instanceof Function)
        {
            await this.c3d.onUnLoad(this.c3d);
        }

        // json data
        const data = JSON.parse(fflate.strFromU8(unzipped[modelName]));
        
        // check model name
        if(!data.hasOwnProperty('modelName'))
        {
            alert("Model name (e.g TShirt) not Found!");
            this.c3d.preloader.hide();
            return;
        }
        
        // destroy ui
        this._destroyUI();
        
        // import model methods and options
        const {lang, parameters, init, setView, onUnLoad} = await import(C3D_MODELS_DIR + data.modelName + '/' + data.modelName +'.js');

        // renew translation table
        this.c3d.lang = await new Lang(this).loadTranslationTable();

        // extend language
        Lang.extend(this.c3d, lang(), true);
        
        // replace class vars and functions        
        this.c3d.props = parameters(this.c3d);
        this.c3d.modelInit = init;
        this.c3d.setView = setView;
        this.c3d.onUnLoad = onUnLoad;

        // load GLB
        await this.c3d._loadGLB(C3D_MODELS_DIR + data.modelName + '/' + data.modelName +'.glb');

        // update texture size etc.
        await this.c3d.settings.init();

        // init three
        this.c3d.three.updateOptions();
        this.c3d.three.setupLights();
        this.c3d.three.start();

        // create layers data
        await this.c3d._createLayerData();

        // add custom Font(s)
        for (let i = 0; i < data.customFonts.length; i++)
        {
            const base64 = fflate.strFromU8(unzipped[data.customFonts[i].ttf]);
            
            if(!base64)
            {
                console.warn("Font data not found!\nFont name:" + data.customFonts[i].name);
                continue;
            }

            await this.c3d.textLayer.addBase64Font
            ({
                name: data.customFonts[i].name,
                postscript_name: data.customFonts[i].postscript_name,
                base64
            });
        }

        // add layer(s)
        const layersDiv = document.querySelectorAll(this.c3d.props.layers + ' > div.content > div');
        this.c3d.preloader.show();
        let notChangeable = {};

        // 
        for (let i = 0; i < layersDiv.length; i++)
        {
            const meshName = layersDiv[i].dataset.mesh;
            const layer = layersDiv[i].querySelector('div.content > div.layers');

            for (let j = data[meshName].length - 1; j >= 0; j--)
            {
                const layerData = data[meshName][j];

                this.c3d.preloader.set(this.c3d.lang['getting-image-data'] + '<br><b>' + meshName + '</b>');
                
                // add layers
                switch (layerData.type.toLowerCase())
                {
                    case 'color':
                        
                        notChangeable[meshName] = layerData.color;

                    break;

                    case 'coloronly':

                        notChangeable[meshName] = layerData.color;

                    break;

                    case 'solid':

                        await this.c3d.layers.addSolid(layer, layerData);

                    break;
                    
                    case 'text': 

                        await this.c3d.layers.addText(layer, layerData);

                    break;

                    case 'gradient':         
                    case 'image':
                        
                        const blob = new Blob([unzipped[layerData.image]], {type: layerData.detectedFileType});

                        if((layerData.changeable && layerData.detectedFileType != 'model/gltf-binary') || layerData.type == 'gradient')
                        {
                            const img = new Image();

                            try
                            {
                                await new Promise((resolve, reject) =>
                                {
                                    img.decoding = 'async';
                                    img.src = URL.createObjectURL(blob);
                                    img.onload = () => {
                                    img.decode()
                                        .then(() => resolve(img))
                                        .catch((err) => reject(err));
                                    };
                                    img.onerror = (err) => reject(err);
                                });
                            }
                            catch (e)
                            {
                                alert(e.message);
                                console.error(e);
                            }

                            // img.onload = () => URL.revokeObjectURL(img.src);

                            layerData.image = img;
                            await this.c3d.layers.addImage(layer, layerData);
                        }
                        else if(layerData.detectedFileType == 'model/gltf-binary')
                        {
                            layerData.image = URL.createObjectURL(blob);
                            await this.c3d.layers.addImage(layer, layerData);
                        }
                        else if(!layerData.changeable)
                        {
                            notChangeable[meshName] = layerData.fileName;
                        }

                    break;
                }

            }

        }

        // SET LOADED TEXT, IMAGE POSITIONS AND UNIFORMS etc.

        const layersDivMain = document.querySelector(this.c3d.props.layers);
        const layersData = Object.keys(this.c3d.props.data);
        for (const meshName in layersData)
        {
            const view = layersData[meshName];
            const layers = layersDivMain.querySelectorAll('[data-mesh=\'' + view + '\'] > div.content > div.layers > div');

            // set default material
            if(layers.length == 0)
            {
                const mesh = this.c3d.glbScene.getObjectByName(view);
                this.c3d.render3d._setEditAreaMaterial(mesh, false);
                continue;
            }

            for (let i = 0; i < layers.length; i++)
            {
                const layer = layers[i].self;

                if(layer.type == 'image')
                {
                    if(!layer.changeable && notChangeable[view])
                    {
                        const preTextureButton = layersDivMain.querySelector('[data-mesh=\'' + view + '\'] > div.content > div.buttons > img[data-image_src = "' + notChangeable[view] + '"');
                        if(preTextureButton) preTextureButton.click();
                    }
                    else
                    {
                        this.c3d.imageLayer.show(layer);
                        this.c3d.imageLayer.hide();
                    }                    
                }
                else if(layer.type == 'text')
                {
                    this.c3d.textLayer.show(layer);
                    this.c3d.textLayer.hide();
                }
                else if(layer.type == 'color' || layer.type == 'colorOnly')
                {
                    layer.color = notChangeable[view];
                    layer.update();

                    const color = new THREE.Color(layer.color);
                    gsap.to(layer._mesh.material.color, {
                        r: color.r,
                        g: color.g,
                        b: color.b,
                        duration: 0.75,
                        ease: "power2.inOut",
                        onUpdate: () => {
                            this.c3d.three.render();
                        }
                    });
                }

                // Set visibility
                if(!layer.visible) layer.div.querySelector('img.visibility').click();
            }
        }

        // 
        this.c3d.textLayer.hide();
        this.c3d.imageLayer.hide();
        this.c3d.preloader.hide();
        this.c3d.showHideUI.show();
        setTimeout(() => {
            this.c3d.three.controls.restoreSettings('set');
            this.c3d.three.render();
        }, 250); // !!!
    }

    async loadModule(jsPath, glbPath)
    {

        // destroy ui
        this._destroyUI();

        // show preloader, set text
        this.c3d.preloader.show();
        this.c3d.preloader.set(this.c3d.lang['please-wait']);

        // call onUnload
        if(this.c3d.onUnLoad instanceof Function)
        {
            await this.c3d.onUnLoad();
        }

        // import model methods and options
        const {lang, parameters, init, setView, onUnLoad} = await import(jsPath);

        // renew translation table
        this.c3d.lang = await new Lang(this).loadTranslationTable();

        // extend language
        Lang.extend(this.c3d, lang(), true);
        
        // replace class vars and functions        
        this.c3d.props = parameters(this.c3d);
        this.c3d.modelInit = init;
        this.c3d.setView = setView;
        this.c3d.onUnLoad = onUnLoad;

        // load GLB
        await this.c3d._loadGLB(glbPath);

        //
        await this.c3d.settings.init();

        // ini three
        mergeRecursive(this.c3d.three.camera, this.c3d.props.three.cameraOptions);
        mergeRecursive(this.c3d.three.controls.orbit, this.c3d.props.three.orbitControlOptions);

        this.c3d.three.updateOptions();
        this.c3d.three.setupLights();
        this.c3d.three.start(); // start render again

        // 
        await this.c3d._createLayerData();        

        this.c3d.preloader.hide();

    }

    _destroyUI()
    {
        document.querySelectorAll(this.c3d.props.layers + ' > div.content > div').forEach((e) => e.remove());
        document.querySelector(this.c3d.props.layers + ' > div.fileMenu').remove();
        this.c3d.textLayer.hide();
        this.c3d.imageLayer.hide();
        this.c3d.three.destroy();
    }

}
