import * as THREE from 'three';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=104';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=104';
import {Size} from 'customizer3D_dir/utils/Size.js?c3d=104';
import {getCorrectedAxis} from 'customizer3D_dir/layers/utils/getCorrectedAxis.js?c3d=104';
import {getMaxLayers, getTexureSize} from 'customizer3D_dir/settings/GPUInfo.js?c3d=104';
import {getDummyCanvas, getDummyCanvasTexture} from 'customizer3D_dir/three/materials/Materials.js?c3d=104';

export class Render3D
{
    constructor(c3d)
    {
        this.c3d = c3d;
        this.textureSlots = {};
    }

    renderView(meshName)
    {
        const renderer = this.c3d.glbScene.getObjectByName(meshName);

        if(!renderer || renderer.material.type != 'RawShaderMaterial') return;

        const layersDiv = document.querySelector(this.c3d.props.layers);
        const layers = layersDiv.querySelectorAll('[data-mesh=\'' + meshName + '\'] > div.content > div.layers > div');
        const groupName = meshName + '_group';

        // remove layer (material) group
        const group = this.c3d.glbScene.getObjectByName(groupName);

        if(group)
        {
            this.c3d.three._clearThree(group);
            this.c3d.three.scene.remove(group);
        }

        // set default material
        this._setEditAreaMaterial(renderer);

        // recreate slots
        if(group) this.textureSlots[meshName] = {index: 0, blankSlots: []};

        for (let i = layers.length - 1; i >= 0; i--)
        {

            const layer = layers[i].self;
            const printSize = this.c3d.props.data[layer.name]?.printSize;

            if(layer.type == 'colorOnly') layer._mesh = renderer;
            else if(!layer.material) layer._mesh = this._addNewMesh(layer);

            if(printSize && !layer.material)
            {
                switch (layer.type.toLowerCase())
                {
                    case 'solid':

                        this.renderSolidLayer(layer);

                    break;
        
                    case 'text':
                        
                        this.c3d.textLayer.show(layer);
                        this.renderTextLayer(layer);
                        this.c3d.textLayer.hide();

                    break;
        
                    case 'image':

                        this.renderImageLayer(layer);
                        this.c3d.imageLayer.show(layer);
                        this.c3d.imageLayer.hide();

                    break;
                }

                this.setVisibility(layer, !layer.visible);
            }
            else if(layer.image)
            {
                const layersDivContent = document.querySelector(this.c3d.props.layers + ' > div.content');
                const materialButtons = layersDivContent.querySelector('div.'+ layer.name +' > div.content > div.buttons > img.active');
                if(materialButtons) materialButtons.click();
            }

        }

        if(renderer) this.updateRenderOrder(meshName);
        this.c3d.three.render();

    }

    renderAll()
    {
        const meshNames = Object.keys(this.c3d.props.data);
        
        for (let i = 0; i < meshNames.length; i++)
        {
            const meshName = meshNames[i];
            this.renderView(meshName);
        }

        this.c3d.three.render();
        
    }

    
    renderSolidLayer(layer)
    {
        if(!layer._mesh) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const dims = getTexureSize(this.c3d, layer.name);
        canvas.width = dims.width;
        canvas.height = dims.height;

        const ce = this.c3d.colorEngine;
        ce.hex(layer.color, false);
        
        ctx.fillStyle = ce.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.updateLayerTexture(layer, canvas);
    }

    renderImageLayer(layer)
    {
        if(!layer._mesh) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const dims = getTexureSize(this.c3d, layer.name);
        
        canvas.width = Math.min(this.c3d.MAX_IMAGE_SIZE, dims.width);
        canvas.height = Math.min(this.c3d.MAX_IMAGE_SIZE, dims.height);

        if(layer.detectedFileType == 'image/svg+xml' && layer.is3D)
        {
            const threeDSVGCanvas = layer.threeDSVG.bakeImageToLayer(dims.width, dims.height, true);
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(THREE.MathUtils.degToRad(layer.rotation));
            ctx.drawImage(threeDSVGCanvas, -dims.width / 2, -dims.height / 2, dims.width, dims.height);
            // ctx.drawImage(threeDSVGCanvas, 0, 0, dims.width, dims.height);
        }
        else if(layer.detectedFileType == 'model/gltf-binary' && layer.is3D)
        {
            const threeDCanvas = layer.threeD.bakeImageToLayer(dims.width, dims.height, true);
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(THREE.MathUtils.degToRad(layer.rotation));
            ctx.drawImage(threeDCanvas, -dims.width / 2, -dims.height / 2, dims.width, dims.height);
            // ctx.drawImage(threeDCanvas, 0, 0, dims.width, dims.height); 
        }
        else if(layer.type == 'gradient' && layer.gradient)
        {
            const gradientCanvas = layer.gradient.bakeImageToLayer(dims.width, dims.height, true);
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.drawImage(gradientCanvas, -dims.width / 2, -dims.height / 2, dims.width, dims.height);
            // ctx.drawImage(gradientCanvas, 0, 0, dims.width, dims.height); 
        }
        else
        {
            const imgDims = calculateAspectRatioFit(layer.image.naturalWidth, layer.image.naturalHeight, canvas.width, canvas.height);
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(THREE.MathUtils.degToRad(layer.rotation));
            ctx.drawImage(layer.image, -imgDims.width / 2, -imgDims.height / 2, imgDims.width, imgDims.height);
        }
        
        this.updateLayerTexture(layer, canvas);
    }


    renderTextLayer(layer)
    {
        if(!layer._mesh) return;
        
        const previewCanvas = this.c3d.textLayer.canvas;
        const ratio = previewCanvas.width / Size.htmlDims(this.c3d.textLayer.htmlEl.querySelector('canvas.preview')).width;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const dims = getTexureSize(this.c3d, layer.name);
        canvas.width = dims.width;
        canvas.height = dims.height;

        if(layer.is3D)
        {
            const threeDTextCanvas = layer.threeDText.bakeTextToLayer(dims.width, dims.height, true);
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(THREE.MathUtils.degToRad(layer.rotation));
            ctx.drawImage(threeDTextCanvas, -dims.width / 2, -dims.height / 2, dims.width, dims.height);
            // ctx.drawImage(threeDTextCanvas, 0, 0, dims.width, dims.height);
        }
        else
        {
            ctx.fillStyle = layer.color;
            ctx.font = ((layer.fontSize * 96 / 300) * canvas.width / previewCanvas.width * ratio) + 'pt ' + layer.font;
            const metrics = ctx.measureText(layer.text);
            const actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.fillText(layer.text, layer.textPosition.x * canvas.width - (metrics.width / 2), -layer.textPosition.y * canvas.height + (actualHeight / 2));
            // ctx.fillText(layer.text, -metrics.width / 2, actualHeight / 2);
        }

        this.updateLayerTexture(layer, canvas);

    }


    renderShapeLayer(layer)
    {
        const previewCanvas = this.c3d.shapeLayer.htmlEl.querySelector('canvas.preview');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const dims = getTexureSize(this.c3d, layer.name);

        canvas.width = dims.width;
        canvas.height = dims.height;

        const ratio = canvas.width / previewCanvas.width;

        ctx.save();
        if(layer.fillColor != null) ctx.fillStyle = layer.fillColor;
        if(layer.strokeColor != null) ctx.strokeStyle = layer.strokeColor;
        ctx.lineWidth = layer.lineWidth * ratio;
        ctx.lineJoin = layer.lineJoin;

        ctx.translate(
            canvas.width / 2 + (layer.shapePosition.x * canvas.width), 
            canvas.height / 2 - (layer.shapePosition.y * canvas.height)
        );

        ctx.rotate(THREE.MathUtils.degToRad(layer.rotation));
        ctx.globalAlpha = layer.opacity / 100;

        ctx.beginPath();
        this.c3d.shapeLayer.drawShape(ctx, layer.radius * ratio);
        ctx.closePath();

        if(layer.strokeColor != null) ctx.stroke();
        if(layer.fillColor != null) ctx.fill();

        ctx.restore();

        this.updateLayerTexture(layer, canvas);
    }


    addSolidLayer(layer)
    {
        this._addNewMesh(layer);
    }


    addTextLayer(layer)
    {
        this._addNewMesh(layer);
    }


    addImageLayer(layer)
    {
        this._addNewMesh(layer);
    }


    addShapeLayer(layer)
    {
        this._addNewMesh(layer);
    }

    
    removeLayer(layer)
    {
        const slot = layer._mesh.userData.index;

        // remove mesh
        layer._mesh.removeFromParent();
        layer._mesh = null;

        // update edit area
        const groupName = layer.name + '_group';
        const group = this.c3d.glbScene.getObjectByName(groupName);
        const renderer = this.c3d.glbScene.getObjectByName(layer.name);
        renderer.material.uniforms.tBase.value = getDummyCanvasTexture(1, 1, group.children.length == 0 ? '#000000' : null);

        // reserve slot
        this.textureSlots[layer.name].blankSlots.push(slot);

        // update render order
        this.updateRenderOrder(layer.name);
    }


    updateRenderOrder(side)
    {
        const renderer = this.c3d.glbScene.getObjectByName(side);
        if(!renderer || renderer.material.type != 'RawShaderMaterial') return;

        const layersDiv = document.querySelector(this.c3d.props.layers);
        const layers = layersDiv.querySelectorAll('[data-mesh=\'' + side + '\'] > div.content > div.layers > div');
        const uniforms = renderer.material.uniforms;

        uniforms.uActiveLayerCount.value = layers.length;

        for (let i = layers.length - 1; i >= 0; i--)
        {
            const layer = layers[i].self;
            if(!layer._mesh) continue;

            const PARAMS_PER_LAYER = 5;
            const oldOrder = layer._mesh.userData.index;
            const data = uniforms.uData.value.image.data;
            const offset = oldOrder * PARAMS_PER_LAYER * 4;

            uniforms.uRenderOrder.value[i] = oldOrder;

            // P0

            data[offset + 0] = (layer.zoom ?? 100) / 100; // zoom
            data[offset + 1] = THREE.MathUtils.degToRad(layer.rotation ?? 0); // rotation
            data[offset + 2] = 0.0; // offsetX
            data[offset + 3] = 0.0; // offsetY

            // P1

            data[offset + 4] = 1.0; // uBrightness
            data[offset + 5] = 1.0; // uContrast
            data[offset + 6] = 0.0; // uHue
            data[offset + 7] = 1.0; // uSaturation

            // P2

            data[offset + 8] = 0.0; // uSepia
            data[offset + 9] = 0.0; // uInvert
            data[offset + 10] = 0.0; // uGrainAmount
            data[offset + 11] = 0.0; // uVignette

            // P3

            data[offset + 12] = 0.0; // TINT R
            data[offset + 13] = 0.0; // TINT G
            data[offset + 14] = 0.0; // TINT B
            data[offset + 15] = 0.0; // Tint Amount

            // P4

            data[offset + 16] = 0.0; // uChromaticAmount.value.x
            data[offset + 17] = 0.0; // uChromaticAmount.value.y
            data[offset + 18] = layer.blendMode || 0; // blendMode
            data[offset + 19] = (layer.opacity ?? 100) / 100; // alpha


            if(layer.type === 'image') {
                data[offset + 2] = layer.imagePosition.x;
                data[offset + 3] = -layer.imagePosition.y;
            }

            const lu = layer.uniforms;
            if(lu.uBrightness !== undefined) data[offset + 4] = lu.uBrightness;
            if(lu.uContrast !== undefined)   data[offset + 5] = lu.uContrast;
            if(lu.uHue !== undefined)        data[offset + 6] = lu.uHue;
            if(lu.uSaturation !== undefined) data[offset + 7] = lu.uSaturation;

            if(lu.uSepia !== undefined)       data[offset + 8] = lu.uSepia;
            if(lu.uInvert !== undefined)      data[offset + 9] = lu.uInvert;
            if(lu.uGrainAmount !== undefined) data[offset + 10] = lu.uGrainAmount;
            if(lu.uVignette !== undefined)    data[offset + 11] = lu.uVignette;

            if(layer.color && !layer.is3D) {
                const ce = this.c3d.colorEngine;
                ce.hex(layer.color, false);
                const c = new THREE.Color(ce.color);
                data[offset + 12] = c.r;
                data[offset + 13] = c.g;
                data[offset + 14] = c.b;
                data[offset + 15] = 1.0;
            }

            if(lu.uChromaticAmount) {
                data[offset + 16] = lu.uChromaticAmount.x;
                data[offset + 17] = lu.uChromaticAmount.y;
            }
            
            uniforms.uData.value.needsUpdate = true;

        }

    }


    setVisibility(layer, hide)
    {
        if(hide)
        {
            const renderer = this.c3d.glbScene.getObjectByName(layer.name);
            const tex = renderer.material.uniforms.uLayerTextures.value;
            const canvas = getDummyCanvas(tex.image.width, tex.image.height);

            this.updateLayerTexture(layer, canvas);
        }
        else
        {
            switch (layer.type)
            {
                case 'solid': this.renderSolidLayer(layer); break;
                case 'text': this.renderTextLayer(layer); break;
                case 'image': case 'gradient': this.renderImageLayer(layer); break;
                case 'shape': this.renderShapeLayer(layer); break;
                default: console.warn('Unknown Layer type!'); break;
            }
        }

        this.c3d.three.render();
    }


    getLayerTexture(layer)
    {
        const renderer = this.c3d.glbScene.getObjectByName(layer.name);
        if (!renderer) return null;

        const tex = renderer.material.uniforms.uLayerTextures.value;
        const layerSize = tex.image.width * tex.image.height * 4;
        const startByte = layer._mesh.userData.index * layerSize;
        const endByte = startByte + layerSize;
        const layerData = tex.image.data.slice(startByte, endByte);

        return {
            data: layerData,
            width: tex.image.width,
            height: tex.image.height
        };
    }



    updateLayerTexture(layer, canvas, index)
    {
        const renderer = this.c3d.glbScene.getObjectByName(layer.name);
        if(!renderer || renderer.material.type != 'RawShaderMaterial') return;

        const ctx = canvas.getContext('2d');
        const tex = renderer.material.uniforms.uLayerTextures.value;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const startByte = (typeof index == 'number' ? index : layer._mesh.userData.index) * (tex.image.width * tex.image.height * 4);
        
        try { 
            tex.image.data.set(imageData, startByte); 
            tex.needsUpdate = true;
        }
        catch(e) {
            alert("Unable to set Texture data!\n" + e);
        }

    }


    async getImage(layer, DPI)
    {
        const container = layer.type == 'text' ? this.c3d.textLayer : this.c3d.imageLayer;
        const three = container.three;
        
        // VARIABLES
        const oldBlendMode = layer.blendMode;

        // CALCULATE IMAGE SIZE

        let printDims = getPrintDims(this.c3d, layer.name, DPI);

        if(printDims.width > this.c3d.MAX_IMAGE_SIZE || printDims.height > this.c3d.MAX_IMAGE_SIZE) {
            console.warn("The print dimensions are larger than " + this.c3d.MAX_IMAGE_SIZE + "px!\nPerhaps the rendering won't be correct!\nFile size reduced.");
            printDims = calculateAspectRatioFit(printDims.width, printDims.height, this.c3d.MAX_IMAGE_SIZE, this.c3d.MAX_IMAGE_SIZE);
        }

        let width = Math.floor(printDims.width);
        let height = Math.floor(printDims.height);

        // RENDER LAYER

        layer.blendMode = 0;
        three.renderer.setPixelRatio(1);

        this.c3d.setView(layer.name, 'set');
        three._onResize(null, width, height);

        let bigCanvas;

        if(layer.is3D)
        {
            if(layer.type == 'text')
            {
                bigCanvas = layer.threeDText.bakeTextToLayer(width, height, true, true);
            }
            else if(layer.type == 'image')
            {
                let obj;

                if(layer.detectedFileType == 'model/gltf-binary') obj = 'threeD';
                else if(layer.threeDSVG?.mesh) obj = 'threeDSVG';
                else console.warn('Unknown layer object!');

                bigCanvas = layer[obj].bakeImageToLayer(width, height, true, true);
            }
            else
            {
                console.warn('Unknown layer type!');
            }
        }
        else if(layer.type == 'gradient')
        {
            bigCanvas = layer.gradient.bakeImageToLayer(width, height, true, true);
            width /= this.c3d.PIXEL_RATIO;
            height /= this.c3d.PIXEL_RATIO;
        }

        container.show(layer, width, height);
        container.updatePreview(bigCanvas, true, false);

        three.render();

        const blob = await new Promise(resolve => three.getCanvas().toBlob(resolve, 'image/png', 1.0));

        /*
        const fileBlob = new Blob( [blob] , {type:'image/png'});
        const a = document.createElement('a');
        const blobUrl = URL.createObjectURL(fileBlob);
        a.href = blobUrl;
        a.download = this.c3d.props.modelName + '_Screenshot.png';
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        */

        // RESTORE SETTINGS AND VARIABLES

        container.show(layer);
        layer.blendMode = oldBlendMode;
        this.c3d.setView('', 'set');
        three.render();
        container.hide();

        return blob;

    }



    checkLayersLength(name)
    {
        if(!name) return false;

        const group = this.c3d.glbScene.getObjectByName(name + '_group');
        if(!group) return true;

        const maxLayers = getMaxLayers(this.c3d);
        
        if(group.children.length >= maxLayers)
        {
            const msg = 'There are more than ' + maxLayers + ' layers!' + "\nMesh Name: " + name + "\nPlease reduce the Texture size!";
            console.warn(msg);
            alert(msg);
            return false;
        }

        return true;
    }



    _addNewMesh(layer)
    {        
        const meshName = layer.name;
        const renderer = this.c3d.glbScene.getObjectByName(meshName);
        
        if(!renderer || renderer.material.type != 'RawShaderMaterial') return;
        if(!this.checkLayersLength(layer ? meshName : null)) return;

        const groupName = meshName + '_group';
        let group = this.c3d.glbScene.getObjectByName(groupName);

        if(!group)
        {
            group = new THREE.Group();
            group.name = groupName;
            group.visible = false;
            this.c3d.glbScene.add(group);
        }

        // update edit area
        if(group.children.length == 0) this._setEditAreaMaterial(renderer, true);


        if(!this.textureSlots[meshName]) {
            this.textureSlots[meshName] = {index: 0, blankSlots: []};
        }

        const textureSlot = this.textureSlots[meshName];
        const slot = textureSlot.blankSlots.length ? textureSlot.blankSlots.shift() : textureSlot.index++;

        const newMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), new THREE.MeshBasicMaterial());
        group.add(newMesh);
        
        layer._mesh = newMesh;
        layer._mesh.name = 'layer_' + layer.type + '_' + slot;
        layer._mesh.userData.index = slot;

        return layer._mesh;
    }

    _setEditAreaMaterial(renderer, visible)
    {
        renderer.material.uniforms.tBase.value = getDummyCanvasTexture(1, 1, visible ? null : '#000000');
    }
}
