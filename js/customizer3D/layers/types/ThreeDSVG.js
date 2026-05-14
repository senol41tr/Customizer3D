import * as THREE from 'three';
import {SVGLoader} from 'three_dir/loaders/SVGLoader.js?c3d=104';
import {Controls} from 'customizer3D_dir/layers/utils/Controls.js?c3d=104';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=104';
import {fitMeshToScreen} from 'customizer3D_dir/utils/fitMeshToScreen.js?c3d=104';

export class ThreeDSVG
{
    constructor(c3d, layer)
    {
        this.c3d = c3d;
        this.layer = layer;
        
        this.controls = null;
        this.mesh = null;
        this.div = null;
        this.options = this.layer.threeDSVGOptions;
        this.svgString = null;

        this.__mouseUp = this._mouseUp.bind(this);
        this.__resize = this._onResize.bind(this);

        this._options =
        {
            geometry:
            {
                curveSegments: {value: 16, min: 1, max: 64, step: 1, type: 'number'},
                steps: {value: 12, min: 1, max: 128, step: 1, type: 'number'},
                depth: {value: 1.5, min: 1, max: 256, step: 1, type: 'number'},
                bevelEnabled: {value: true, type: 'boolean'},
                bevelThickness: {value: 7, min: 0, max: 64, step: 1, type: 'number'},
                bevelSize: {value: 2, min: 0, max: 12, step: 1, type: 'number'},
                // bevelOffset: {value: 0, min: 0, max: 50, step: 1, type: 'number'},
                bevelSegments: {value: 16, min: 1, max: 64, step: 1, type: 'number'}
            },
            material:
            {
                MeshStandardMaterial:
                {
                    name: 'MeshStandardMaterial',
                    roughness: {value: 0.25, min: 0, max: 1, step: 0.01, type: 'number'},
                    metalness: {value: 0.4, min: 0, max: 1, step: 0.01, type: 'number'},
                    wireframe: {value: false, type: 'boolean'}
                },
                MeshMatcapMaterial:
                {
                    name: 'MeshMatcapMaterial',
                    matcaps: {value:
                        [
                            'matcap-1764731458681.jpg?c3d=104', 
                            'matcap-1764731550075.jpg?c3d=104', 
                            'matcap-1764731647559.jpg?c3d=104', 
                            'matcap-1764787557882.jpg?c3d=104',
                            'matcap-1776615703860.jpg?c3d=104',
                            'matcap-1776615686768.jpg?c3d=104'
                        ], type: 'image_array'}
                }
            }
        };
    }


    // LOAD AND PARSE SVG

    async loadSVGString()
    {
        const response = await fetch(this.layer.image.src);
        this.svgString = await response.text();
    }

    hide()
    {
        this._hideOptions();

        if(this.mesh)
        {
            this.mesh.position.set(0,0,0);
            this.mesh.visible = false;
        }

        this.c3d.glbScene.visible = true;
        this.c3d.three.controls.orbit.enabled = true;
        document.querySelector(this.c3d.props.layers).style.visibility = 'visible';
        this.c3d.textLayer.htmlEl.style.visibility = 'visible';
        this.c3d.imageLayer.htmlEl.style.visibility = 'visible';

        window.removeEventListener(isMobile() ? 'touchend' : 'mouseup', this.__mouseUp);
        if(!isMobile()) window.removeEventListener('wheel', this.__mouseUp);
        window.removeEventListener('resize', this.__resize);

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
        // Basic Check
        const errorsInSVG = this._checkSvgValidity(this.svgString);
        if(!errorsInSVG.isValid)
        {
            alert("SVG IS NOT VALID!\nCan not Convert to 3D\n" + errorsInSVG.errors.join("\n"));
            this.c3d.imageLayer.show(this.layer);
            this.c3d.imageLayer.updatePreview();
            return;
        }

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

        this[this.mesh ? 'update' : '_create']();

        this._showOptions();
        this._onResize();
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


    bakeImageToLayer(width, height, getCanvas = false, exportToPDF = false)
    {
        const canvasImage = document.createElement('canvas');
        
        const renderer = this.c3d.glbScene.getObjectByName(this.layer.name);
        if(!renderer) { alert('renderer not found!'); return canvasImage; }
        
        const oldGLBVisible = this.c3d.glbScene.visible;
        const oldMeshVisible = this.mesh.visible;

        this.c3d.three.controls.restoreSettings('set');
        this.c3d.glbScene.visible = false;
        this.mesh.visible = true;

        const tex = renderer.material.uniforms.uLayerTextures.value;
        const w = width ? Math.round(width) : tex.image.width;
        const h = height ? Math.round(height) : tex.image.height;
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
        
        if(this.options?.state)
        {
            this.mesh.rotation.set(
                this.options.state.rotation.x,
                this.options.state.rotation.y,
                this.options.state.rotation.z
            );
        }

        const oldCamPos = c3d.three.camera.position.clone();
        
        fitMeshToScreen(c3d.three.camera, this.mesh, 1.1);
        
        c3d.three.render();

        const pixels = new Uint8Array(w * h * 4);
        c3d.three.renderer.readRenderTargetPixels(target, 0, 0, w, h, pixels);

        c3d.three.renderer.setRenderTarget(null);
        c3d.three.renderer.setPixelRatio(c3d.PIXEL_RATIO);
        c3d.three._onResize(null, oldCanvasSize.width, oldCanvasSize.height);

        c3d.glbScene.visible = oldGLBVisible;
        this.mesh.visible = oldMeshVisible;
        c3d.three.camera.position.copy(oldCamPos);

        target.dispose();
        
        canvasImage.width = w;
        canvasImage.height = h;

        const canvasImageCtx = canvasImage.getContext('2d');
        const imageData = canvasImageCtx.createImageData(w, h);

        for (let y = 0; y < h; y++)
        {
            const sourceRow = y * w * 4;
            const targetRow = (h - 1 - y) * w * 4;
            imageData.data.set(pixels.subarray(sourceRow, sourceRow + w * 4), targetRow);
        }
        canvasImageCtx.putImageData(imageData, 0, 0);

        if(getCanvas || exportToPDF) {
            return canvasImage;
        }

        c3d.render3d.updateLayerTexture(this.layer, canvasImage);
        c3d.imageLayer.show(this.layer);
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

    _create()
    {
        const geoOptions =
        {
            curveSegments: this.options ? this.options.geometry.curveSegments : this._options.geometry.curveSegments.value,
            steps: this.options ? this.options.geometry.steps : this._options.geometry.steps.value,
            depth: this.options ? this.options.geometry.depth : this._options.geometry.depth.value,
            bevelEnabled: this.options ? this.options.geometry.bevelEnabled : this._options.geometry.bevelEnabled.value,
            bevelThickness: this.options ? this.options.geometry.bevelThickness : this._options.geometry.bevelThickness.value,
            bevelSize: this.options ? this.options.geometry.bevelSize : this._options.geometry.bevelSize.value,
            bevelOffset: 0, //this.options ? this.options.geometry.bevelOffset : this._options.geometry.bevelOffset.value,
            bevelSegments: this.options ? this.options.geometry.bevelSegments : this._options.geometry.bevelSegments.value
        };

        // CREATE MATERIAL AND GEO. OPTIONS
        
        let matOptions;

        if(this.options)
        {
            matOptions = this.options.material;
            if(matOptions.name == 'MeshStandardMaterial')
            {
                delete matOptions.matcap;
            }
            else if(matOptions.name == 'MeshMatcapMaterial')
            {
                delete matOptions.roughness;
                delete matOptions.metalness;
                delete matOptions.wireframe;
            }
        }
        else
        {
            matOptions =
            {
                name: 'MeshStandardMaterial',
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
        }
        else if(meshMatOptions.name == 'MeshMatcapMaterial')
        {
            if(this.options.material.matcap)
            {
                const loader = new THREE.TextureLoader();
                loader.load(this._getMatcapURL(this.options.material.matcap), (matcap) =>
                {
                    const SVGGroup = this.mesh.getObjectByName('SVG');

                    for (let i = 0; i < SVGGroup.children.length; i++)
                    {
                        const svgMesh = SVGGroup.children[i];
                        svgMesh.material.matcap = matcap;
                        svgMesh.material.needsUpdate = true;
                    }

                    this.c3d.render3d.renderImageLayer(this.layer);
                    this.c3d.imageLayer.updatePreview(null, true, false);
                    this._onResize();
                    this.c3d.three.render();
                });
            }
            meshMatOptions.matcap = null;
        }

        const matName = meshMatOptions.name;
        delete meshMatOptions.name;

        // CREATE SVG GROUP

        const group = new THREE.Group();
        group.name = 'SVG';

        const loader = new SVGLoader();
        const parsedSVGString = loader.parse(this.svgString);

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(this.svgString, "image/svg+xml");
        const styleMap = {};
        const styleElement = svgDoc.querySelector('style');

        if (styleElement) {
            const cssText = styleElement.textContent;
            const regex = /\.([a-zA-Z0-9_-]+)\s*\{\s*fill\s*:\s*([^;\}]+)\s*;?\s*\}/g;
            let match;
            
            while ((match = regex.exec(cssText)) !== null)
            {
                const className = match[1];
                const color = match[2].trim();
                styleMap[className] = color;
            }
        }

        parsedSVGString.paths.forEach((path, i) =>
        {
            const shapes = SVGLoader.createShapes(path);
            
            shapes.forEach((shape) =>
            {                
                if(matName == 'MeshStandardMaterial')
                {
                    const node = path.userData.node;
                    const cls = node.getAttribute('class');
                    const inlineFill = node.getAttribute('fill');
                    let pathColor;

                    if (cls && styleMap[cls]) pathColor = styleMap[cls];
                    else if (inlineFill && inlineFill !== 'none') pathColor = inlineFill;
                    else {
                        pathColor = `rgb(
                            ${Math.round(path.color.r * 255)}, 
                            ${Math.round(path.color.g * 255)}, 
                            ${Math.round(path.color.b * 255)}
                        )`;
                    }
                    
                    const ce = this.c3d.colorEngine;
                    const color = this.options && this.options.color ? this.options.color : pathColor;
                    ce.hex(color, false);
                    meshMatOptions.color = ce.color;
                    ce.setBrightness(color, false, -100);
                    meshMatOptions.emissive = ce.color;
                }

                const geometry = new THREE.ExtrudeGeometry(shape, geoOptions);
                const material = new THREE[matName](meshMatOptions);
                const msh = new THREE.Mesh(geometry, material);

                msh.name = group.name + '_path_' + i;
                msh.rotation.x = Math.PI;

                group.add(msh);

            });
        });




        // RESIZE LOADED SVG

        group.scale.setScalar(0.001); // !!!


        // CENTER SVG

        const box = new THREE.Box3().setFromObject(group);
        const center = new THREE.Vector3();
        box.getCenter(center);
        group.position.sub(center);

        this.mesh = new THREE.Group();
        this.mesh.name = 'threeDSVG_layer_' + Math.max(0, this.layer._mesh.userData.index - 1);
        this.mesh.add(group);

        // SET PREDEFINED ROTATION AND SCALE

        if(this.options?.state)
        {
            this.mesh.rotation.set(
                this.options.state.rotation.x,
                this.options.state.rotation.y,
                this.options.state.rotation.z
            );
        }
        else
        {
            this.mesh.rotateY(Math.PI / 8);
        }

        // ADD TO SCENE

        this.controls.mesh = this.mesh;
        this.c3d.three.scene.add(this.mesh);

    }

    _hideOptions()
    {
        this.c3d.contextMenu.hide();
    }

    _showOptions()
    {
        const button = this.c3d.imageLayer.htmlEl.querySelector('div.threeD > div.button');
        
        if(this.div)
        {
            this.c3d.contextMenu.setHTMLObj(this.div);
            this.c3d.contextMenu.show(button, false);
            this.c3d.contextMenu.setPosition(16, 16);
            this.c3d.contextMenu.setWidth(220);
            return;
        }

        this.div = document.createElement('div');
        this.div.style.cssText = 'display:flex; flex-direction:column; gap:0.5rem;';

        let html = '';
        const toUpper = (str) => str.charAt(0).toUpperCase() + str.substring(1);

        for (const key in this._options)
        {
            const props = this._options[key];

            html += '<div style="display:flex; flex-direction:column; gap: 0.85rem; border: 1px solid var(--customizerColorText); border-radius: 7px; padding: 0.85rem; margin: 0.1rem; margin-bottom:0.5rem;">';
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
                                                subHtml += '<img data-image="' + img + '" src="'+ this._getMatcapURL(img) +'" alt="matcap image" style="width: 40px; cursor:pointer; border-radius:6px;">';
                                            }
                                            html += '<div style="display:flex; gap:0.75rem; flex-wrap:wrap;" class="' + key + ', ' + subProp + '">' + subHtml + '</div>';

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

        html += '<div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:0.5rem; padding:0.5rem;">';
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
            this.hide();
            this._removeMesh();
            this.c3d.render3d.renderImageLayer(this.layer);
            this.options = null;
            this.c3d.imageLayer.show(this.layer);
            this.c3d.three.controls.restoreSettings('set');
            this.c3d.three.render();
        });
        this.div.querySelector('button.render').addEventListener('click', () => {
            this.hide();
            this.c3d.imageLayer.updatePreview(null, true, false);
            this.bakeImageToLayer();
            this.c3d.three.controls.restoreSettings('set');
            this.c3d.render3d.renderImageLayer(this.layer);
            this.c3d.three.render();
        });


        this.c3d.contextMenu.setHTMLObj(this.div);
        this.c3d.contextMenu.show(button, false);
        this.c3d.contextMenu.setPosition(16, 16);
        this.c3d.contextMenu.setWidth(220);


    }


    _removeMesh()
    {
        this.c3d.three._clearThree(this.mesh);
        this.mesh.removeFromParent();
        this.mesh = null;
    }

    _getMatcapURL(image)
    {
        return C3D_SERVER + 'js/customizer3D/layers/assets/' + image;
    }

    _checkSvgValidity(svgString)
    {
        const issues = [];
        
        if (svgString.includes('font-family:')) issues.push("Texts must be converted to outline!");
        if (svgString.includes('<image')) issues.push("An embedded bitmap has been detected!");
        if (svgString.includes('<filter')) issues.push("SVG filters (blur, shadow, etc.) are not supported!");
        if (svgString.includes('<gradient') || svgString.includes('Gradient>')) issues.push("Gradients cannot be directly transferred to 3D geometry!");

        const loader = new SVGLoader();
        const parsedSVGString = loader.parse(this.svgString);
        if(parsedSVGString.paths >= 256) issues.push("SVG has more than 256 paths!");
        
        return {
            isValid: issues.length === 0,
            errors: issues
        };
    }

}
