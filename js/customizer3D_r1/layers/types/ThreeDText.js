import * as THREE from 'three';
import {TTFLoader} from 'customizer3D_dir/three/loaders/TTFLoader.js';
import {Font} from 'customizer3D_dir/three/loaders/FontLoader.js';
import {TextGeometry} from 'customizer3D_dir/three/geometries/TextGeometry.js';
import {Controls} from 'customizer3D_dir/layers/utils/Controls.js';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js';
import {fitMeshToScreen} from 'customizer3D_dir/utils/fitMeshToScreen.js';

export class ThreeDText
{
    constructor(c3d, layer)
    {
        this.c3d = c3d;
        this.layer = layer;
        
        this.controls = null;
        this.mesh = null;
        this.div = null;
        this.options = this.layer.threeDTextOptions;

        this.__mouseUp = this._mouseUp.bind(this);
        this.__resize = this._onResize.bind(this);

        this._options =
        {
            geometry:
            {
                size: {value: 500, min: 100, max: 1000, step: 30, type: 'number'},
                curveSegments: {value: 16, min: 1, max: 64, step: 1, type: 'number'},
                bevelEnabled: {value: true, type: 'boolean'},
                bevelThickness: {value: 10, min: 0, max: 1000, step: 1, type: 'number'},
                bevelSize: {value: 5, min: 0.01, max: 50, step: 0.01, type: 'number'},
                bevelSegments: {value: 3, min: 1, max: 32, step: 1, type: 'number'}
            },
            material:
            {
                MeshStandardMaterial:
                {
                    name: 'MeshStandardMaterial',
                    roughness: {value: 0.35, min: 0, max: 1, step: 0.01, type: 'number'},
                    metalness: {value: 0.6, min: 0, max: 1, step: 0.01, type: 'number'},
                    wireframe: {value: false, type: 'boolean'}
                },
                MeshMatcapMaterial:
                {
                    name: 'MeshMatcapMaterial',
                    matcaps: {value:
                        [
                            'matcap-1764731458681.jpg', 
                            'matcap-1764731550075.jpg', 
                            'matcap-1764731647559.jpg', 
                            'matcap-1764787557882.jpg',
                            'matcap-1776615703860.jpg',
                            'matcap-1776615686768.jpg'
                        ], type: 'image_array'}
                }
            }
        };
    }

    hide()
    {

        this._hideOptions();

        window.removeEventListener(isMobile() ? 'touchend' : 'mouseup', this.__mouseUp);
        if(!isMobile()) window.removeEventListener('wheel', this.__mouseUp);
        window.removeEventListener('resize', this.__resize);

        if(this.mesh) {
            this.mesh.visible = false;
        }

        this.c3d.glbScene.visible = true;
        this.c3d.three.controls.orbit.enabled = true;
        document.querySelector(this.c3d.props.layers).style.visibility = 'visible';
        this.c3d.textLayer.htmlEl.style.visibility = 'visible';
        this.c3d.imageLayer.htmlEl.style.visibility = 'visible';

        if(isMobile())
        {
            this.controls.removeTouchEvents();
            window.removeEventListener('touchend', this.__mouseUp);
        }
        else
        {
            this.controls.removeEventListeners();
            window.removeEventListener('mouseup', this.__mouseUp);
        }

        this.c3d.three.controls.restoreSettings('set');
        this.c3d.three.render();
    }

    show()
    {
        this.c3d.three.controls.restoreSettings('set');
        this.c3d.three.controls.orbit.enabled = false;
        this.c3d.glbScene.visible = false;
        document.querySelector(this.c3d.props.layers).style.visibility = 'hidden';
        this.c3d.textLayer.htmlEl.style.visibility = 'hidden';
        this.c3d.imageLayer.htmlEl.style.visibility = 'hidden';

        if(!this.controls) {
            this.controls = new Controls(this.mesh, this.c3d.three.getCanvas());
        }

        if(isMobile()) this.controls.addTouchEvents();
        else this.controls.addEventListeners();

        if(this.mesh) {
            this.mesh.visible = true;
            this._onResize();
        }
        else this._create();

        this._showOptions();
        this.c3d.three.render();

        window.addEventListener(isMobile() ? 'touchend' : 'mouseup', this.__mouseUp);
        if(!isMobile()) window.addEventListener('wheel', this.__mouseUp);
        window.addEventListener('resize', this.__resize);
    }

    update(updateOnly = false)
    {
        this._removeMesh();
        this._create();
        if(updateOnly) this.mesh.visible = false;
    }

    bakeTextToLayer(width, height, getCanvas = false, exportToPDF = false)
    {
        const canvasText = document.createElement('canvas');

        const renderer = this.c3d.glbScene.getObjectByName(this.layer.name);
        if(!renderer) { alert('renderer not found!'); return canvasText; }
        
        const oldGLBVisible = this.c3d.glbScene.visible;
        const oldMeshVisible = this.mesh.visible;

        this.c3d.three.controls.restoreSettings('set');
        this.c3d.glbScene.visible = false;
        this.mesh.visible = true;

        const tex = renderer.material.uniforms.uLayerTextures.value;
        const w = width ? Math.floor(width) : tex.image.width;
        const h = height ? Math.floor(height) : tex.image.height;
        const c3d = this.c3d;
        const target = new THREE.WebGLRenderTarget(w, h,
        {
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType,
            colorSpace: THREE.SRGBColorSpace,
            samples: 4
        });

        const oldCanvasSize = {...c3d.three._canvasDims};

        c3d.three.renderer.setRenderTarget(target);
        c3d.three.renderer.setPixelRatio(1);
        c3d.three._onResize(null, w, h);

        const oldCamPos = c3d.three.camera.position.clone();
        
        fitMeshToScreen(this.c3d.three.camera, this.mesh, 1.3);

        c3d.three.render();

        const pixels = new Uint8Array(w * h * 4);
        c3d.three.renderer.readRenderTargetPixels(target, 0, 0, w, h, pixels);

        canvasText.width = w;
        canvasText.height = h;
        const ctxText = canvasText.getContext('2d');
        const imageData = ctxText.createImageData(w, h);

        for (let y = 0; y < h; y++)
        {
            const sourceRow = y * w * 4;
            const targetRow = (h - 1 - y) * w * 4;
            imageData.data.set(pixels.subarray(sourceRow, sourceRow + w * 4), targetRow);
        }
        ctxText.putImageData(imageData, 0, 0);

        c3d.three.renderer.setRenderTarget(null);
        c3d.three.renderer.setPixelRatio(c3d.PIXEL_RATIO);
        c3d.three._onResize(null, oldCanvasSize.width, oldCanvasSize.height);

        this.c3d.glbScene.visible = oldGLBVisible;
        this.mesh.visible = oldMeshVisible;
        c3d.three.camera.position.copy(oldCamPos);

        target.dispose();
        
        if(getCanvas || exportToPDF) {
            return canvasText;
        }

        c3d.render3d.updateLayerTexture(this.layer, canvasText);
        c3d.textLayer.show(this.layer);
    }





    
    _create()
    {
        const geoOptions =
        {
            font: this.options && this.options.geometry.font == this.layer.font ? this.options.geometry.font : this.layer.font,
            size: this.options ? this.options.geometry.size : this._options.geometry.size.value,
            height: 0.01, //this.options ? this.options.geometry.height : this._options.geometry.height.value,
            curveSegments: this.options ? this.options.geometry.curveSegments : this._options.geometry.curveSegments.value,
            bevelEnabled: this.options ? this.options.geometry.bevelEnabled : this._options.geometry.bevelEnabled.value,
            bevelThickness: this.options ? this.options.geometry.bevelThickness : this._options.geometry.bevelThickness.value,
            bevelSize: this.options ? this.options.geometry.bevelSize : this._options.geometry.bevelSize.value,
            bevelSegments: this.options ? this.options.geometry.bevelSegments : this._options.geometry.bevelSegments.value
        };

        const base64 = this.c3d.textLayer.getFontData(geoOptions.font).base64.split(',')[1];
        const uint8Array = Uint8Array.fromBase64(base64);
        const arrayBuffer = uint8Array.buffer;

        let geo;

        try
        {
            const ttfLoader = new TTFLoader();
            const json = ttfLoader.parse(arrayBuffer);

            const meshGeoOptions = {...geoOptions};
            meshGeoOptions.font = new Font(json);
            geo = new TextGeometry(this.layer.text, meshGeoOptions);
            geo.center();
        }
        catch(e)
        {
            alert("An error occurred while converting the text to 3D!\nMessage: " + err.message);
            this._removeMesh();
            this.c3d.render3d.renderTextLayer(this.layer);
            this.options = null;
            this.c3d.textLayer.show(this.layer);
            this.c3d.onResize();
            this.hide();
            return;
        }


        const ce = this.c3d.colorEngine;
        const color = this.options && this.options.color ? this.options.color : this.layer.color;
        ce.hex(color, false);
        const color2 = ce.color;
        ce.setBrightness(color, false, -100);
        const emissive = ce.color;

        
        let matOptions;

        if(this.options)
        {
            matOptions = this.options.material;
            matOptions.color = color2;
            if(matOptions.name == 'MeshStandardMaterial')
            {
                matOptions.emissive = emissive;
                delete matOptions.matcap;
            }
            else if(matOptions.name == 'MeshMatcapMaterial')
            {                
                delete matOptions.roughness;
                delete matOptions.metalness;
                delete matOptions.wireframe;
                delete matOptions.emissive;
            }
        }
        else
        {
            matOptions =
            {
                name: 'MeshStandardMaterial',
                color: color2,
                roughness: this._options.material.MeshStandardMaterial.roughness.value,
                metalness: this._options.material.MeshStandardMaterial.metalness.value,
                flatShading: false,
                wireframe: this._options.material.MeshStandardMaterial.wireframe.value
            };
            this.options = {geometry: geoOptions, material: matOptions};
        }

        const meshMatOptions = {...matOptions};
        if(meshMatOptions.name == 'MeshStandardMaterial')
        {
            meshMatOptions.emissive = new THREE.Color(emissive);
        }
        else if(meshMatOptions.name == 'MeshMatcapMaterial')
        {
            
            if(this.options.material.matcap)
            {
                const loader = new THREE.TextureLoader();
                loader.load(this._getMatcapURL(this.options.material.matcap), (matcap) => {                
                    this.mesh.material.matcap = matcap;
                    this.mesh.material.needsUpdate = true;
                    this.c3d.render3d.renderTextLayer(this.layer);
                    this.c3d.textLayer.updatePreview(null, true, false);
                    this._onResize();
                    this.c3d.three.render();
                });
            }
            meshMatOptions.matcap = null;
        }

        const matName = meshMatOptions.name;
        delete meshMatOptions.name;
        const mat = new THREE[matName](meshMatOptions);

        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.name = 'threeDText_layer_' + Math.max(0, this.layer._mesh.userData.index - 1);

        if(this.options?.state)
        {
            this.mesh.rotation.set(
                this.options.state.rotation.x,
                this.options.state.rotation.y,
                this.options.state.rotation.z
            );
        }
        else this.mesh.rotation.set(0, Math.PI / 8, 0);

        this.mesh.scale.setScalar(0.001);
        this._onResize();

        this.controls.mesh = this.mesh;
        this.c3d.three.scene.add(this.mesh);
    }






    _mouseUp()
    {
        if(this.mesh)
        {
            this.options.state =
            {
                rotation:
                {
                    x: this.mesh.rotation.x,
                    y: this.mesh.rotation.y,
                    z: this.mesh.rotation.z
                }
            };
        }
    }

    _onResize()
    {
        fitMeshToScreen(this.c3d.three.camera, this.mesh, 2);
    }

    _hideOptions()
    {
        this.c3d.contextMenu.hide();
    }

    _showOptions()
    {
        const button = this.c3d.textLayer.htmlEl.querySelector('div.threeD > div.button');
        
        if(this.div)
        {
            this.c3d.contextMenu.setHTMLObj(this.div);
            this.c3d.contextMenu.show(button, false);
            this.c3d.contextMenu.setPosition(16, 16);
            this.c3d.contextMenu.setWidth(180);
            return;
        }

        this.div = document.createElement('div');

        let html = '';
        const toUpper = (str) => str.charAt(0).toUpperCase() + str.substring(1);

        for (const key in this._options)
        {
            const props = this._options[key];

            html += '<div style="display:flex; flex-direction:column; gap: 0.25rem; border: 1px solid rgba(0, 0, 0, 0.15);border-radius: 8px; padding: 0.35rem; margin: 0.1rem; margin-bottom:0.5rem;">';
            html += '<p style="font-weight:bold; font-size:0.75rem;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display == \'\' || this.nextElementSibling.style.display == \'block\' ? \'none\' : \'block\';">+ ' + toUpper(key) + '</p>';

            switch(key)
            {
                // GEOMETRY

                case 'geometry':

                    html += '<div>';

                        for (const prop in props)
                        {
                            const item = props[prop];

                            if(!item.type) continue;

                            html += '<div style="padding: 0 0.5rem;">';
                            html += '<p>' + toUpper(prop) + '</p>';

                            switch (item.type)
                            {
                                case 'boolean':

                                    html += '<input type="checkbox" class="' + key + ', ' + prop + '"' + (item.value ? ' checked' : '') + '>';

                                break;

                                case 'number':

                                    html += '<input type="range" class="' + key + ', ' + prop + '" min="' + item.min + '" max="' + item.max + '" step="' + item.step + '" value="' + item.value + '">';

                                break;
                            }

                            html += '</div>';
                        }

                    html += '</div>';

                break;


                // GEOMETRY

                case 'material':

                    html += '<div>';
                        for (const prop in props)
                        {
                            const item = props[prop];

                            html += '<div class="' + prop + 'Container" style="display:flex; flex-direction:column; gap: 0.25rem;">';
                            html += '<p onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display == \'\' || this.nextElementSibling.style.display == \'none\' ? \'block\' : \'none\';" style="font-size:0.75rem; cursor:pointer;">+ ' + toUpper(prop) + '</p>';

                                html += '<div class="' + prop + '" style="display:' + (this.options.material.name == prop ? 'block' : 'none') + ';">';
                                for (const subProp in item)
                                {
                                    const subItem = item[subProp];
                                    
                                    if(!subItem.type) continue;

                                    html += '<div style="padding-left: 0.5rem;">';
                                    html += '<p>' + toUpper(subProp) + '</p>';
                                    
                                    switch (subItem.type)
                                    {
                                        case 'boolean':

                                            html += '<input type="checkbox" class="' + key + ', ' + subProp + '"' + (subItem.value ? ' checked' : '') + '>';

                                        break;
                                    
                                        case 'color':

                                            html += '<div class="color, ' + key + ', ' + subProp + '">COLOR PICKER</div>';

                                        break;

                                        case 'image_array':

                                            let subHtml = '';
                                            for (let i = 0; i < subItem.value.length; i++)
                                            {
                                                const img = subItem.value[i];
                                                subHtml += '<img data-image="' + img + '" src="'+ this._getMatcapURL(img) +'" alt="matcap image" style="width: 40px; cursor:pointer;">';
                                            }
                                            html += '<div style="display:flex; gap:0.25rem; flex-wrap:wrap;" class="' + key + ', ' + subProp + '">' + subHtml + '</div>';

                                        break;

                                        case 'number':

                                            html += '<input type="range" class="' + key + ', ' + subProp + '" min="' + subItem.min + '" max="' + subItem.max + '" step="' + subItem.step + '" value="' + subItem.value + '">';

                                        break;
                                    }

                                    html += '</div>';

                                }

                                html += '</div>';
                                
                            html += '</div>';
                        }
                    html += '</div>';
                
                break;

            }

            html += '</div>';
        }

        html += '<div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">';
        html += '<button class="cancel">To 2D</button>';
        html += '<button class="render">RENDER</button>';
        html += '</div>';

        this.div.innerHTML = html;


        const inputs = this.div.querySelectorAll('input[type="checkbox"], input[type="range"]');

        inputs.forEach(input =>
        {
            const classList = input.getAttribute('class');

            if(classList.indexOf(this.options.material.name))
            {
                const props = classList.split(', ');
                
                let objStr = '';
                for (let i = 0; i < props.length - 1; i++)
                {
                    objStr += '["' + props[i] + '"]';
                }

                const prop = eval('this.options' + objStr);

                input.addEventListener('input', () =>
                {
                    if(input.type == 'range')
                    {
                        prop[props[props.length - 1]] = input.step.indexOf('.') >= 0 ? parseFloat(input.value) : parseInt(input.value);
                    }
                    else // checkbox
                    {
                        prop[props[props.length - 1]] = input.checked;
                    }

                    this.update();
                    this.c3d.three.render();
                    
                });

            }

        });


        const matcapsDiv = this.div.querySelector('.matcaps');
        const matcaps = matcapsDiv.querySelectorAll('img');

        matcaps.forEach(matcap => 
        {
            matcap.addEventListener('click', () =>
            {
                this.c3d.textLayer.colorPicker.setColor('#ffffff');
                this.options.material.matcap = matcap.dataset.image;
                this.update();
            })
        });



        // !!!
        const div1 = this.div.querySelector('.MeshMatcapMaterialContainer');
        const div2 = this.div.querySelector('.MeshStandardMaterialContainer');
        div1.addEventListener('click', () => {
            this.options.material.name = 'MeshMatcapMaterial';
            div2.querySelector('div').style.display = 'none';
        });
        div2.addEventListener('click', () => {
            this.options.material.name = 'MeshStandardMaterial';
            div1.querySelector('div').style.display = 'none';
        });



        this.div.querySelector('button.cancel').addEventListener('click', () => {

            this.layer.zoom = 100;
            this.layer.textPosition = {x: 0, y: 0};
            this.c3d.render3d.renderTextLayer(this.layer);
            this.c3d.textLayer.show(this.layer);
            
            this.c3d.three.controls.restoreSettings('set');
            this.c3d.three.render();

            this.hide();
            this._removeMesh();
            this.options = null;

            this.c3d.render3d.renderTextLayer(this.layer);
            this.c3d.textLayer.updatePreview(null, true, false);

        });
        this.div.querySelector('button.render').addEventListener('click', () => {
            
            this.hide();
            this.bakeTextToLayer();

            this.c3d.textLayer.updatePreview(null, true, false);

            this.c3d.three.controls.restoreSettings('set');
            this.c3d.three.render();
        });



        this.c3d.contextMenu.setHTMLObj(this.div);
        this.c3d.contextMenu.show(button, false);
        this.c3d.contextMenu.setPosition(16, 16);
        this.c3d.contextMenu.setWidth(180);


    }

    _removeMesh()
    {
        this.mesh.material.dispose();
        this.mesh.geometry.dispose();
        this.mesh.removeFromParent();
        this.mesh = null;
    }

    _getMatcapURL(image)
    {
        return C3D_SERVER + 'js/customizer3D_r1/layers/assets/' + image;
    }

}
