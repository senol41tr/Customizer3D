import * as fflate from 'base/fflate@0.8.2/fflate.esm.js';

export class SaveAs
{
    constructor(c3d)
    {
        this.c3d = c3d;
    }

    async save()
    {
        const toggleWindows = (hide) =>
        {
            const v = hide ? 'hidden' : 'visible';
            document.querySelector(this.c3d.props.layers).style.visibility = v;
            document.querySelector(this.c3d.props.textLayer).style.visibility = v;
            document.querySelector(this.c3d.props.imageLayer).style.visibility = v;
        };
        toggleWindows(true);

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

                        const imageName = 'img' + imageIndex;

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
                            visible: layer.visible
                        });

                        const response = await fetch(layer.image.src);
                        const blob = await response.blob();
                        const uint8Array = await this.c3d.imageLayer.toUint8Array(blob);

                        filesToZip[imageName] = [uint8Array];

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

        toggleWindows(false);      
    }

}
