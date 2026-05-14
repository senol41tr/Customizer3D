import * as fflate from 'base/fflate@0.8.2/fflate.esm.js';
import {BlobtoUint8Array} from 'customizer3D_dir/utils/BlobtoUint8Array.js?c3d=104';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=104';

export class SaveAs
{
    constructor(c3d)
    {
        this.c3d = c3d;
    }

    async save()
    {
        // disable UI during processing
        const container = document.querySelector(this.c3d.props.container);
        container.style.pointerEvents = 'none';
        container.style.opacity = 0.5;

        this.c3d.showHideUI.hide();
        this.c3d.preloader.show();
        this.c3d.preloader.set(this.c3d.lang['creating-file']);

        const layersDiv = document.querySelectorAll(this.c3d.props.layers + ' > div.content > div');
        const json = {};
        const filesToZip = {};

        // model
        json['modelName'] = this.c3d.props.modelName;
        
        // add custom fonts
        let fontIndex = 0;
        json['customFonts'] = [];

        // 
        let imageIndex = 0;

        for (let i = 0; i < layersDiv.length; i++)
        {
            const meshName = layersDiv[i].dataset.mesh;
            
            const layers = layersDiv[i].querySelectorAll('div.content > div.layers > div');

            json[meshName] = [];

            for (let j = 0; j < layers.length; j++)
            {
                const layer = layers[j].self;

                const label = this.c3d.props.data[layer.name]?.label || this.c3d.lang[layer.name] || layer.name;
                this.c3d.preloader.set(this.c3d.lang['creating-file'] + '<br><b>' + label + '...</b><br>' + (j / layers.length * 100).toFixed(0) + '%');
                
                switch (layer.type)
                {

                    case 'color':
                    case 'colorOnly':
    
                        json[meshName].push({
                            type: layer.type,
                            color: layer.color
                        });
                        
                    break;

                    case 'solid':
    
                        json[meshName].push({
                            type: layer.type,
                            color: layer.color, 
                            opacity:layer.opacity,
                            blendMode: layer.blendMode,
                            uniforms: layer.uniforms,
                            visible: layer.visible
                        });
                        
                    break;
        
                    case 'text':
                        
                        if(layer.text == '') continue;

                        // add custom font(s)
                        if(this.c3d.textLayer.isCustomFont(layer.font))
                        {
                            let fontInZIP = false;
                            for (let z = 0; z < json['customFonts'].length; z++)
                            {
                                const font = json['customFonts'][z];
                                if (font.postscript_name == layer.font)
                                {
                                    fontInZIP = true;
                                    break;    
                                }
                            }

                            if (!fontInZIP)
                            {
                                const customFont = this.c3d.textLayer.getFontData(layer.font);
                                const customFontsName = customFont.postscript_name + fontIndex;
                                json['customFonts'].push({
                                    name: customFont.name,
                                    postscript_name: customFont.postscript_name,
                                    ttf: customFontsName
                                });
                                filesToZip[customFontsName] = [fflate.strToU8(customFont.base64)];
                                fontIndex++;                                    
                            }
                        }
                        
                        json[meshName].push({
                            type: layer.type,
                            text:layer.text,
                            textPosition:layer.textPosition,
                            font:layer.font,
                            fontSize:layer.fontSize,
                            color:layer.color,
                            opacity:layer.opacity,
                            rotation:layer.rotation,
                            zoom:layer.zoom,
                            material: layer.material,
                            materialOptions: layer.materialOptions,
                            repeatX: layer.repeatX,
                            repeatY: layer.repeatY,
                            blendMode: layer.blendMode,
                            uniforms: layer.uniforms,
                            threeDText: layer.threeDText?.options,
                            visible: layer.visible
                        });

                    break;

                    case 'image':
                    case 'gradient':

                        if(!layer.image) continue;

                        let blob, fileName;

                        if(layer.is3D && layer.detectedFileType == 'model/gltf-binary')
                        {
                            const response = await fetch(layer.image);
                            blob = await response.blob();
                            fileName = 'glb' + imageIndex;
                        }
                        else if(layer.gradient && layer.type == 'gradient')
                        {
                            const gradientDims = calculateAspectRatioFit(layer.image.width, layer.image.height, this.c3d.MAX_IMAGE_SIZE, this.c3d.MAX_IMAGE_SIZE);
                            const gradientCanvas = layer.gradient.bakeImageToLayer(gradientDims.width, gradientDims.height, true, true);
                            blob = await new Promise(resolve => gradientCanvas.toBlob(resolve, 'image/png', 1.0));
                            fileName = 'gradient' + imageIndex;
                        }
                        else
                        {
                            if((layer.image.naturalWidth >= this.c3d.MAX_IMAGE_SIZE || layer.image.naturalHeight >= this.c3d.MAX_IMAGE_SIZE))
                            {
                                const newDims = calculateAspectRatioFit(layer.image.naturalWidth, layer.image.naturalHeight, this.c3d.MAX_IMAGE_SIZE, this.c3d.MAX_IMAGE_SIZE);
                                const canvas = document.createElement('canvas');
                                const ctx = canvas.getContext('2d');

                                canvas.width = newDims.width;
                                canvas.height = newDims.height;

                                ctx.translate(canvas.width / 2, canvas.height / 2);
                                ctx.drawImage(layer.image, - canvas.width / 2, - canvas.height / 2, canvas.width, canvas.height);

                                blob = await new Promise(resolve => canvas.toBlob(resolve, layer.detectedFileType, 1.0));
                                fileName = 'img' + imageIndex;
                            }
                            else
                            {
                                const response = await fetch(layer.image.src);
                                blob = await response.blob();
                                fileName = 'img' + imageIndex;
                            }
                        }

                        json[meshName].push({
                            type: layer.type,
                            image: fileName, 
                            fileName: layer.fileName, 
                            imagePosition: layer.imagePosition, 
                            rotation: layer.rotation,
                            zoom: layer.zoom,
                            opacity:layer.opacity,
                            detectedFileType: layer.detectedFileType,
                            mimeType: layer.mimeType,
                            changeable: layer.changeable,
                            material: layer.material,
                            materialOptions: layer.materialOptions,
                            repeatX: layer.repeatX,
                            repeatY: layer.repeatY,
                            blendMode: layer.blendMode,
                            uniforms: layer.uniforms,
                            threeD: layer.threeDOptions,
                            threeDSVG: layer.threeDSVG?.options,
                            visible: layer.visible,
                            gradient: layer.gradientOptions
                        });

                        const uint8Array = await BlobtoUint8Array(blob);
                        filesToZip[fileName] = [uint8Array];

                        imageIndex++;

                    break;


                    case 'shape':
                        
                        json[meshName].push({
                            type: layer.type,
                            shapePosition:layer.shapePosition,
                            opacity:layer.opacity,
                            rotation:layer.rotation,
                            radius:layer.radius,
                            lineWidth:layer.lineWidth,
                            lineJoin:layer.lineJoin,
                            shapeType:layer.shapeType,
                            fillColor: layer.fillColor,
                            strokeColor: layer.strokeColor,
                            blendMode: layer.blendMode,
                            visible: layer.visible,
                            uniforms: layer.uniforms
                        });

                    break;

                }
            }
        }

        filesToZip['model.c3d'] = [fflate.strToU8(JSON.stringify(json))];

        const blob = new Blob([
            fflate.zipSync(filesToZip, {
                level:9, 
                mem:12
            })
        ], {type:'application/x-customizer3d'});

        const date = new Date();
        const a = document.createElement('a');
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.download = json['modelName'] + '_'+ (date.getMonth() + 1) + '.' + date.getDate() +'.c3d';
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);

        this.c3d.preloader.set(this.c3d.lang['downloading-file']);
        setTimeout(() => this.c3d.preloader.hide(), 1000);

        // Enable UI
        this.c3d.showHideUI.show();
        container.style.pointerEvents = 'all';
        container.style.opacity = 1;
    }

}
