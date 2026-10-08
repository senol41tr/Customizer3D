import * as fflate from 'base/fflate@0.8.2/fflate.esm.js';
import {mergeRecursive} from 'customizer3D_dir/utils/mergeRecursive.js?c3d=0.5.1';
import {Lang} from 'customizer3D_dir/lang/Lang.js?c3d=0.5.1';
import {fetchWithProgress} from 'customizer3D_dir/utils/fetchWithProgress.js?c3d=0.5.1';

export class Open
{
    constructor(c3d)
    {
        this.c3d = c3d;
    }

    async open(file)
    {
        // hide UI during processing
        this.c3d.showHideUI.hide();

        let arrayBuffer, header = '';

        this.c3d.preloader.show();
        this.c3d.preloader.set(this.c3d.lang['processing-c3d-file']);


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
                this.c3d.showHideUI.show();
                return;
            }
            arrayBuffer = await file.arrayBuffer();
        }
        
        // check file type
        const fileSignature = new Uint8Array(arrayBuffer).subarray(0, 4).forEach((v) => header+=v.toString(16)); // https://stackoverflow.com/a/29672957
        
        if(header != '504b34')
        {
            alert('File Type mismatch!!\nSupported file type is [.c3d, .zip]');
            this.c3d.showHideUI.show();
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
            this.c3d.showHideUI.show();
            return;
        }

        // call onUnload
        if(this.c3d.onUnLoad instanceof Function)
        {
            await this.c3d.onUnLoad();
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
        this.c3d.glbScene.visible = false;

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

            this.c3d.textLayer.addBase64Font
            ({
                name: data.customFonts[i].name,
                postscript_name: data.customFonts[i].postscript_name,
                base64
            });
        }

        // add layer(s)
        const layersDiv = document.querySelectorAll(this.c3d.props.layers + ' > div.content > div');

        // 
        for (let i = 0; i < layersDiv.length; i++)
        {
            const meshName = layersDiv[i].dataset.mesh;
            const layer = layersDiv[i].querySelector('div.content > div.layers');

            for (let j = data[meshName].length - 1; j >= 0; j--)
            {
                const layerData = data[meshName][j];
                
                // side with color
                if((layerData.hasOwnProperty('colors') || layerData.hasOwnProperty('color')) && layerData.hasOwnProperty('type') === false) 
                {
                    const color = layerData.color;
                    const spans = layersDiv[i].querySelectorAll('div.content > div.buttons > span');

                    for (let z = 0; z < spans.length; z++)
                    {
                        const span = spans[z];

                        if(span.style.backgroundColor === color)
                        {
                            span.classList.add('active');
                            span.click();
                        }
                        else
                        {
                            span.classList.remove('active');
                        }
                    }
                    
                    continue;
                }
                
                // add layers
                switch (layerData.type.toLowerCase())
                {

                    case 'coloronly':

                        const solidLayer = layer.querySelector('div.colorOnly').self;
                        solidLayer.color = layerData.color;
                        solidLayer.update();

                    break;

                    case 'solid':

                        await this.c3d.layers.addSolid(layer, layerData);


                    break;
                    
                    case 'text': 

                        await this.c3d.layers.addText(layer, layerData);

                    break;
        
                    case 'image':

                        const img = new Image();
                        const blob = new Blob([unzipped[layerData.image]], {type: layerData.detectedFileType});
                        try
                        {
                            await new Promise((resolve, reject) =>
                            {
                                img.decoding = 'async';
                                img.src = URL.createObjectURL(blob);
                                img.onload = () => {
                                img.decode()
                                    .then(() => {
                                        resolve(img);
                                    })
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

                        if(layerData.changeable)
                        {
                            layerData.image = img;
                            await this.c3d.layers.addImage(layer, layerData);
                        }
                        else
                        {
                            const imgLayer = layer.querySelector('div.image').self;
                            let fileName = layerData.fileName.substring(layerData.fileName.lastIndexOf('/') + 1);
                            if(fileName.indexOf('?') > -1) fileName = fileName.substring(0, fileName.indexOf('?'));

                            imgLayer.image = img;
                            imgLayer.fileName = fileName;
                            imgLayer.imagePosition = layerData.imagePosition;
                            imgLayer.rotation = layerData.rotation,
                            imgLayer.zoom = layerData.zoom,
                            imgLayer.detectedFileType = layerData.detectedFileType,
                            imgLayer.changeable = layerData.changeable,
                            imgLayer.material = layerData.material,
                            imgLayer.materialOptions = layerData.materialOptions,
                            imgLayer.repeatX = layerData.repeatX,
                            imgLayer.repeatY = layerData.repeatY;

                            // set as active
                            const textures = layersDiv[i].querySelectorAll('div.content > div.buttons > img.texture');
                            
                            for (let z = 0; z < textures.length; z++)
                            {
                                const texture = textures[z];
                                let fileName = texture.src.substring(texture.src.lastIndexOf('/') + 1);
                                if(fileName.indexOf('?') > -1) fileName = fileName.substring(0, fileName.indexOf('?'));
                                
                                if(fileName === imgLayer.fileName)
                                {
                                    texture.classList.add('active');
                                    texture.click();
                                    break;
                                }
                                else
                                {
                                    texture.classList.remove('active');
                                }
                            }
                            
                        }

                    break;

                    case 'shape': 

                        await this.c3d.layers.addShape(layer, layerData);

                    break;
                }

            }

        }

        this._reRender();

    }

    async loadModule(jsPath, glbPath)
    {
        // hide UI during processing
        this.c3d.showHideUI.hide();

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

        await this.c3d._loadGLB(glbPath);
        await this.c3d._createLayerData();

        this._reRender();
    }
    
    // gemini.google.com
    _getUint8ArrayFromFile(file)
    {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(new Uint8Array(e.target.result));
            reader.readAsArrayBuffer(file);
        });
    }

    _destroyUI()
    {
        document.querySelectorAll(this.c3d.props.layers + ' > div.content > div').forEach((div) => {
            div.querySelectorAll('div.image').forEach((imageDiv) => {
                const layer = imageDiv.self;
                if(layer && layer.image.src) URL.revokeObjectURL(layer.image.src);
            });
            div.remove();
        });
        document.querySelector(this.c3d.props.layers + ' > div.switchTo2D').remove();
        document.querySelector(this.c3d.props.layers + ' > div.fileMenu').remove();
        this.c3d.textLayer.hide();
        this.c3d.imageLayer.hide();
        this.c3d.three.destroy();
        this.c3d.render2d.destroy();
    }

    _reRender()
    {

        if(this.c3d.props.three.cameraOptions) mergeRecursive(this.c3d.three.camera, this.c3d.props.three.cameraOptions);
        if(this.c3d.props.three.orbitControlOptions) mergeRecursive(this.c3d.three.controls.orbit, this.c3d.props.three.orbitControlOptions);

        this.c3d.three.controls.restoreSettings('set');
        this.c3d.three.updateOptions();

        // show Switch to 3D Button
        const canvas3DDiv = this.c3d.three.getCanvas().parentNode; // div
        const display = window.getComputedStyle(canvas3DDiv)['display'];
        if(display == 'none')
        {
            document.querySelector(this.c3d.props.layers + ' > div.switchTo2D > button.button').click();
            this.c3d.setView();
        }

        //this.c3d.onResize(); // resize model to window
        this.c3d.three.setupLights();
        this.c3d.three.start(); // start render again
        this.c3d.preloader.hide();
        this.c3d.showHideUI.show();
        this.c3d._setNavActive();
        this.c3d.glbScene.visible = true;

        setTimeout(() => {
            this.c3d.textLayer.hide();
            this.c3d.imageLayer.hide();
            this.c3d.shapeLayer.hide();
            this.c3d.three.render();
        }, 500);  
        
    }

}
