import * as fflate from 'base/fflate@0.8.2/fflate.esm.js';

export class SaveAs
{
    constructor(c3d)
    {
        this.c3d = c3d;
    }

    async save()
    {
        this.c3d.showHideUI.hide();
        this.c3d.showHideUI.hideSubWindows();
        this.c3d.preloader.show();
        this.c3d.preloader.set(this.c3d.lang['creating-file']);

        const layersDiv = document.querySelectorAll(this.c3d.props.layers + ' > div.content > div');
        const json = {};
        const filesToZip = {};

        // model
        json['modelName'] = this.c3d.props.modelName;

        //
        if(this.c3d.props.modelName == 'C2D')
        {
            json['printSize'] = this.c3d.props.data.area.printSize;
            json['unit'] = this.c3d.props.data.area.unit;
        }
        
        // add custom fonts
        let fontIndex = 0, arrayBuffer, response;
        
        json['customFonts'] = [];

        // 
        let imageIndex = 0, uint8Array, imageName;

        for (let i = 0; i < layersDiv.length; i++)
        {
            const meshName = layersDiv[i].dataset.mesh;
            const layers = layersDiv[i].querySelectorAll('div.content > div.layers > div');

            json[meshName] = [];
            
            // limited colors (available colors)
            const activeSpan = layersDiv[i].querySelector('div.content > div.buttons > span.active');
            if(activeSpan != null)
            {
                json[meshName].push({color: activeSpan.style.backgroundColor});
                continue;
            }

            for (let j = 0; j < layers.length; j++)
            {
                const layer = layers[j].self;
                
                switch (layer.type)
                {
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
                            blendMode:layer.blendMode,
                            material: layer.material,
                            materialOptions: layer.materialOptions,
                            repeatX: layer.repeatX,
                            repeatY: layer.repeatY,
                            filters: layer.filters,
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
                            rotation:layer.rotation,
                            blendMode:layer.blendMode,
                            material: layer.material,
                            materialOptions: layer.materialOptions,
                            repeatX: layer.repeatX,
                            repeatY: layer.repeatY,
                            filters: layer.filters,
                            visible: layer.visible
                        });

                    break;
        
                    case 'image':

                        if(!layer.image) continue;

                        imageName = 'img' + imageIndex;

                        json[meshName].push({
                            type: layer.type,
                            image: imageName, 
                            fileName: layer.fileName, 
                            imagePosition: layer.imagePosition, 
                            rotation: layer.rotation,
                            zoom: layer.zoom,
                            detectedFileType: layer.detectedFileType,
                            changeable: layer.changeable,
                            blendMode:layer.blendMode,
                            material: layer.material,
                            materialOptions: layer.materialOptions,
                            repeatX: layer.repeatX,
                            repeatY: layer.repeatY,
                            filters: layer.filters,
                            visible: layer.visible,
                            effects: layer.effects
                        });

                        uint8Array = await this._prepareImageForZip(layer.image.src, layer.detectedFileType);
                        filesToZip[imageName] = uint8Array;
                        uint8Array = null;

                        imageIndex++;

                    break;

                    case 'shape':
    
                        json[meshName].push({
                            type: layer.type,
                            shapePosition: layer.shapePosition,
                            opacity: layer.opacity, 
                            rotation:layer.rotation,
                            radius:layer.radius,
                            lineWidth: layer.lineWidth,
                            lineJoin: layer.lineJoin,
                            shapeType: layer.shapeType,
                            fillColor: layer.fillColor,
                            strokeColor: layer.strokeColor,
                            blendMode: layer.blendMode,
                            visible: layer.visible,
                            material: layer.material,
                            materialOptions: layer.materialOptions,
                            repeatX: layer.repeatX,
                            repeatY: layer.repeatY,
                            filters: layer.filters
                        });
                        
                    break;

                    case 'threeDText':
    
                        json[meshName].push({
                            type: layer.type,
                            text: layer.text,
                            imagePosition: layer.imagePosition,
                            rotation:layer.rotation,
                            opacity: layer.opacity, 
                            zoom: layer.zoom, 
                            material: layer.material,
                            materialOptions: layer.materialOptions,
                            repeatX: layer.repeatX,
                            repeatY: layer.repeatY,
                            blendMode: layer.blendMode,
                            filters: layer.filters,
                            effects: layer.effects,
                            visible: layer.visible,
                            options: layer.options
                        });
                        
                    break;

                    case 'threeDLogo':
    
                        imageName = 'img' + imageIndex;

                        json[meshName].push({
                            type: layer.type,
                            image: imageName,
                            imagePosition: layer.imagePosition,
                            rotation:layer.rotation,
                            opacity: layer.opacity, 
                            zoom: layer.zoom, 
                            material: layer.material,
                            materialOptions: layer.materialOptions,
                            detectedFileType: layer.detectedFileType,
                            fileName: layer.fileName,
                            repeatX: layer.repeatX,
                            repeatY: layer.repeatY,
                            blendMode: layer.blendMode,
                            filters: layer.filters,
                            effects: layer.effects,
                            visible: layer.visible,
                            options: layer.options
                        });

                        uint8Array = await this._prepareImageForZip(layer.sourceImage.src, layer.detectedFileType);
                        filesToZip[imageName] = uint8Array;
                        uint8Array = null;

                        imageIndex++;
                        
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

        this.c3d.showHideUI.show();
    }


    async _prepareImageForZip(imageSrc, detectedFileType = 'image/png')
    {
        try {
            const response = await fetch(imageSrc);
            if (!response.ok) {
                throw new Error(`Görsel çekilemedi! HTTP Kodu: ${response.status}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();

            if (detectedFileType === 'image/svg+xml' || imageSrc.includes('.svg') || imageSrc.startsWith('data:image/svg+xml')) {
                const decoder = new TextDecoder('utf-8');
                let svgText = decoder.decode(arrayBuffer);

                if (!svgText.includes('xmlns=')) {
                    svgText = svgText.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
                }

                const encoder = new TextEncoder();
                return encoder.encode(svgText);
            }

            return new Uint8Array(arrayBuffer);

        } catch (error) {
            console.error("prepareImageForZip Erorr!", error);
            throw error;
        }
    }

}
