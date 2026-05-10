import * as THREE from 'three';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=101';
import {getPrintDims} from 'customizer3D_dir/utils/getPrintDims.js?c3d=101';
import {Size} from 'customizer3D_dir/utils/Size.js?c3d=101';
import {getCorrectedAxis} from 'customizer3D_dir/layers/utils/getCorrectedAxis.js?c3d=101';
import {getMaxLayers, getTexureSize} from 'customizer3D_dir/settings/GPUInfo.js?c3d=101';
import {getDummyCanvas, getDummyCanvasTexture} from 'customizer3D_dir/three/materials/Materials.js?c3d=101';

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
        
        canvas.width = Math.min(4096, dims.width);
        canvas.height = Math.min(4096, dims.height);

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

            const oldOrder = layer._mesh.userData.index;

            uniforms.uRenderOrder.value[i] = oldOrder;

            uniforms.uBlendModes.value[oldOrder] = 0;
            uniforms.uAlphas.value[oldOrder] = 1.0;
            // uniforms.uOffset.value[oldOrder].set(0,0);
            uniforms.uZoom.value[oldOrder] = 1.0;
            // uniforms.uRotation.value[oldOrder] = 0.0;
            uniforms.uBrightness.value[oldOrder] = 1.0;
            uniforms.uContrast.value[oldOrder] = 1.0;
            uniforms.uHue.value[oldOrder] = 0.0;
            uniforms.uSaturation.value[oldOrder] = 1.0;
            uniforms.uSepia.value[oldOrder] = 0.0;
            uniforms.uChromaticAmount.value[oldOrder].set(0,0);
            uniforms.uInvert.value[oldOrder] = 0.0;
            uniforms.uVignette.value[oldOrder] = 0.0;
            uniforms.uGrainAmount.value[oldOrder] = 0.0;
            uniforms.uTint.value[oldOrder].set(0,0,0);
            uniforms.uTintAmount.value[oldOrder] = 0.0;

            uniforms.uBlendModes.value[oldOrder] = layer.blendMode;
            uniforms.uAlphas.value[oldOrder] = (layer.opacity ?? 100) / 100;
            // !!! (text layer)
            if(layer.type == 'image')
            {
                // let correctedAxis = getCorrectedAxis(THREE.MathUtils.degToRad(layer.rotation), layer.imagePosition.x, -layer.imagePosition.y);
                // uniforms.uOffset.value[oldOrder].set(correctedAxis.x, correctedAxis.y);
                uniforms.uOffset.value[oldOrder].set(layer.imagePosition.x, -layer.imagePosition.y);
            }
            else if(layer.type == 'text')
            {
                // uniforms.uOffset.value[oldOrder].set(layer.textPosition.x, -layer.textPosition.y);
            }
            if(layer.zoom) uniforms.uZoom.value[oldOrder] = (layer.zoom ?? 100) / 100;
            // if(layer.rotation) uniforms.uRotation.value[oldOrder] = THREE.MathUtils.degToRad(layer.rotation);
            if(layer.uniforms.uBrightness) uniforms.uBrightness.value[oldOrder] = layer.uniforms.uBrightness;
            if(layer.uniforms.uContrast) uniforms.uContrast.value[oldOrder] = layer.uniforms.uContrast;
            if(layer.uniforms.uHue) uniforms.uHue.value[oldOrder] = layer.uniforms.uHue;
            if(layer.uniforms.uSaturation) uniforms.uSaturation.value[oldOrder] = layer.uniforms.uSaturation;
            if(layer.uniforms.uSepia) uniforms.uSepia.value[oldOrder] = layer.uniforms.uSepia;
            if(layer.uniforms.uChromaticAmount) uniforms.uChromaticAmount.value[oldOrder].set(layer.uniforms.uChromaticAmount.x, layer.uniforms.uChromaticAmount.y);
            if(layer.uniforms.uInvert) uniforms.uInvert.value[oldOrder] = layer.uniforms.uInvert;
            if(layer.uniforms.uVignette) uniforms.uVignette.value[oldOrder] = layer.uniforms.uVignette;
            if(layer.uniforms.uGrainAmount) uniforms.uGrainAmount.value[oldOrder] = layer.uniforms.uGrainAmount;
            if(layer.color && !layer.is3D)
            {
                const ce = this.c3d.colorEngine;
                ce.hex(layer.color, false);
                const c = new THREE.Color(ce.color);
                
                uniforms.uTint.value[oldOrder].set(c.r, c.g, c.b);
                uniforms.uTintAmount.value[oldOrder] = layer.opacity / 100;
            }

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

        if(printDims.width > 4096 || printDims.height > 4096) {
            alert("The print dimensions are larger than 4096px!\nPerhaps the rendering won't be correct!\nFile size reduced.");
            printDims = calculateAspectRatioFit(printDims.width, printDims.height, 4096, 4096);
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
        }
        else
        {
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
