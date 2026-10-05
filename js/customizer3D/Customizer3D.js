import * as THREE from 'three';
import gsap from 'base/gsap@3.13.0/gsap@3.13.0.esm.js';
import {File} from 'customizer3D_dir/file/File.js?c3d=0.5.0';
import {Three} from 'customizer3D_dir/three/Three.js?c3d=0.5.0';
import {Render3D} from 'customizer3D_dir/three/Render3D.js?c3d=0.5.0';
import {Render2D} from 'customizer3D_dir/render2d/Render2D.js?c3d=0.5.0';
import {GLB} from 'customizer3D_dir/three/loaders/GLB.js?c3d=0.5.0';
import {EventsManager} from 'customizer3D_dir/events/EventsManager.js?c3d=0.5.0';
import {LocalStorage} from 'customizer3D_dir/cookie/LocalStorage.js?c3d=0.5.0';
import {Preloader} from 'customizer3D_dir/preloader/Preloader.js?c3d=0.5.0';
import {Settings} from 'customizer3D_dir/settings/Settings.js?c3d=0.5.0';
import {Layers} from 'customizer3D_dir/layers/Layers.js?c3d=0.5.0';
import {TextLayer} from 'customizer3D_dir/layers/TextLayer.js?c3d=0.5.0';
import {ImageLayer} from 'customizer3D_dir/layers/ImageLayer.js?c3d=0.5.0';
import {ShapeLayer} from 'customizer3D_dir/layers/ShapeLayer.js?c3d=0.5.0';
import {Dragable} from 'customizer3D_dir/dragable/Dragable.js?c3d=0.5.0';
import {ContextMenu} from 'customizer3D_dir/contextMenu/ContextMenu.js?c3d=0.5.0';
import {Help} from 'customizer3D_dir/help/Help.js?c3d=0.5.0';
import {Size} from 'customizer3D_dir/utils/Size.js?c3d=0.5.0';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.5.0';
import {isIOS} from 'customizer3D_dir/utils/isMobile.js?c3d=0.5.0';
import {ZIndex} from 'customizer3D_dir/utils/ZIndex.js?c3d=0.5.0';
import {Lang} from 'customizer3D_dir/lang/Lang.js?c3d=0.5.0';
import {WebXR} from 'customizer3D_dir/three/WebXR.js?c3d=0.5.0';
import {ShowHideUI} from 'customizer3D_dir/utils/ShowHideUI.js?c3d=0.5.0';
import {fitMeshToScreen} from 'customizer3D_dir/utils/fitMeshToScreen.js?c3d=0.5.0';
import {ColorEngine} from 'customizer3D_dir/ColorEngine/ColorEngine.js?c3d=0.5.0';
import {Sortable} from 'customizer3D_dir/sortable/Sortable.js?c3d=0.5.0';

export class Customizer3D
{
    constructor(glbPath, jsPath)
    {
        this.PIXEL_RATIO = 2;
        this.MAX_IMAGE_SIZE = 4096;

        if(glbPath && jsPath) this.initialize(glbPath, jsPath);
    }

    // PUBLIC METHODS

    async initialize(glbPath, jsPath)
    {
        // 
        this.userData = {};

        // load translation table
        this.lang = await new Lang(this).loadTranslationTable();

        // import model methods and options
        const {lang, parameters, init, setView, onUnLoad} = await import(jsPath);

        // extend language
        Lang.extend(this, lang());

        // set class variables
        this.props = parameters(this);
        this.modelInit = init;
        this.setView = setView;
        this.onUnLoad = onUnLoad;

        //
        this.preloader = new Preloader(this);

        // initialize Color Engine
        this.colorEngine = new ColorEngine(this);
        await this.colorEngine._init();

        // set class variables
        this.file = new File(this);
        this.contextMenu = new ContextMenu(this);
        this.help = new Help(this);
        this.localStorage = new LocalStorage(this);
        this.textLayer = new TextLayer(this);
        this.imageLayer = new ImageLayer(this);
        this.shapeLayer = new ShapeLayer(this);

        // show secure decription
        if(this.localStorage.get('secureText') == null)
        {
            const secureDiv = document.createElement('div');
            secureDiv.setAttribute('class', 'secure');
            secureDiv.addEventListener('click', () => {
                this.localStorage.set('secureText', true);
                secureDiv.remove();
            });
            secureDiv.innerHTML = this.lang['secure-text'];
            secureDiv.innerHTML += '<img src="' + C3D_SERVER + 'svg/plus.svg?c3d=0.5.0" alt="Icon" class="close">';
            document.querySelector(this.props.container).appendChild(secureDiv);
        }

        // load builtInFonts
        if(this.textLayer.builtInFonts.length == 0)
        {
            await this.textLayer._loadBuiltInFonts();
        }

        //
        this.three = new Three(this);
        this.three.addControls(this.props.orbitControlOptions);

        //
        this.eventsManager = new EventsManager({
            c3d: this
        });


        // init. layers
        this.layers = new Layers(this);

        // 
        this.render2d = new Render2D(this);
        this.render3d = new Render3D(this);

        // load model
        await this._loadGLB(glbPath);

        // set html, options, tint all loaded svg's etc.
        this.settings = new Settings(this);
        await this.settings._init();

        // 
        // HTML STUFF
        //

        const layersDiv = document.querySelector(this.props.layers);

        layersDiv.innerHTML = `
        <div class="title">
            <img src="${C3D_SERVER}svg/arrow-drop-down.svg?c3d=0.5.0" alt="Icon" class="icon" draggable="false">
            <div class="title">
                <img src="${C3D_SERVER}svg/layers.svg?c3d=0.5.0" alt="Icon" class="icon" draggable="false">
                <p class="title">${this.lang['layers']}</p>
            </div>
        </div>

        <div class="content"></div>`;

        const dragable = new Dragable({
            dragEl: layersDiv.querySelector('div.title'),
            container: layersDiv,
            root: document.querySelector(this.props.container),
            c3d: this
        });

        layersDiv.addEventListener('mouseup', () =>
        {
            document.querySelector(this.props.layers).style.opacity = 1;
        });

        document.querySelector('div.title > img.icon').addEventListener('click', (e) =>
        {
            const layers = document.querySelector(this.props.layers);
            const content = layers.querySelector('div.content');
            const fileMenu = layers.querySelector('div.fileMenu');
            const switchTo2D = layers.querySelector('div.switchTo2D');

            const visible = content.style.display == 'none';

            e.currentTarget.style.rotate = visible ? '180deg' : '0deg';
            content.style.display = 
            fileMenu.style.display = 
            switchTo2D.style.display = visible ? 'flex' : 'none';
            
            layers.dataset.minHeight = window.getComputedStyle(layers)['minHeight'];
            layers.style.minHeight = visible ? layers.dataset.minHeight : 'auto';
        });

        // set controls
        const controlsDiv = document.querySelector(this.props.controls);
        const deviceIcon = isMobile() ? 'tap' : 'mouse';
        controlsDiv.innerHTML = `
            <img src="${C3D_SERVER}svg/zoom-out.svg?c3d=0.5.0" class="zoomOut" draggable="false">
            <div class="inputDiv">
                <input type="checkbox" class="checkbox" checked>
                <img src="${C3D_SERVER}svg/${deviceIcon}.svg?c3d=0.5.0" class="deviceIcon" draggable="false">
            </div>
            <img src="${C3D_SERVER}svg/zoom-in.svg?c3d=0.5.0" class="zoomIn" data-factor="0.01" draggable="false">
        `;

        const dragableControls = new Dragable({
            dragEl: controlsDiv,
            container: controlsDiv,
            root: document.querySelector(this.props.container),
            c3d: this
        });

        controlsDiv.querySelector('img.zoomIn').addEventListener('click', (e) =>
        {
            if(this.three.camera.position.z <= this.three.controls.orbit.minDistance) return;
            this.three.camera.position.z -= 0.5;
        });

        controlsDiv.querySelector('img.zoomOut').addEventListener('click', (e) =>
        {
            if(this.three.camera.position.z >= this.three.controls.orbit.maxDistance) return;
            this.three.camera.position.z += 0.5;
        });
        
        const zoomCheckBox = controlsDiv.querySelector('input.checkbox');
        zoomCheckBox.addEventListener('click', () =>
        {
            const checked = zoomCheckBox.checked;
            if(isMobile()) {
                this.three.getCanvas().style.pointerEvents = checked ? 'all' : 'none';
            }
            else {
                this.three.controls.orbit.enableZoom = checked;
            }
            controlsDiv.querySelector('img.zoomIn').style.display = 
            controlsDiv.querySelector('img.zoomOut').style.display = checked ? 'none' : 'block';
        });

        // WebXR
        const webXRDiv = document.createElement('div');
        webXRDiv.className = 'webXR';
        webXRDiv.innerHTML = `
            <img src="${C3D_SERVER}svg/xr.svg?c3d=0.5.0" class="button" alt="XR Button" draggable="false">
        `;
        document.querySelector(this.props.container).appendChild(webXRDiv);

        const dragableWebXR = new Dragable({
            dragEl: webXRDiv,
            container: webXRDiv,
            root: document.querySelector(this.props.container),
            c3d: this
        });
        

        // z-index manager
        this.zIndex = new ZIndex(this);

        // XR manager
        this.webXR = new WebXR(this);

        // 
        this.showHideUI = new ShowHideUI(this);

        // create layer(s) data
        await this._createLayerData();


        // render all views
        this.render3d.renderAll();

        // add onResize event
        // this.onResize();
        if(!isMobile()) window.addEventListener('resize', this.onResize.bind(this));

        // 
        this.three.start();
        this._setNavActive();
    }


    switchTo2D()
    {
        this._set2D3DView(false);
    }

    switchTo3D()
    {
        this._set2D3DView();
    }

    _set2D3DView(state = true)
    {
        const button = document.querySelector(this.props.layers + ' > div.switchTo2D > button');
        this.render2d[state ? 'hide' : 'show']();
        button.classList[state ? 'remove' : 'add']('threeD');
        button.innerHTML = this.lang[state ? 'design-in-2d' : 'back-to-3d'];
        this.textLayer.hide();
        this.imageLayer.hide();
        this.shapeLayer.hide();
    }
    

    enableAutoZoom()
    {
        this._setAutoZoom(true);
    }

    disableAutoZoom()
    {
        this._setAutoZoom(false);
    }

    onResize()
    {
        // if (this.props.three?.cameraOptions?.position?.z) return;
        fitMeshToScreen(this.three.camera, this.glbScene, 1.5);
        this.three.controls.saveSettings();
        setTimeout(() => { // !!!
            this.three.controls.update();
            this.three.render();
        }, 100);
    }


    // PRIVATE METHODS


    _setAutoZoom(auto = true)
    {
        const setZoomCheckbox = document.querySelector(this.props.controls).querySelector('input.checkbox');
        setZoomCheckbox.checked = !auto; // true: manuel zoom, false: auto (default: auto)
        setZoomCheckbox.click();
    }

    async _loadGLB(path)
    {
        const glbLoader = new GLB({url: path, camera: this.three.camera, preloader: this.preloader});
        const glb = await glbLoader.load();

        this.glbScene = glb.scene;
        this.glbScene.userData.dims = Size.meshDims(this.glbScene);
        this.three.scene.add(this.glbScene);
    }

    _setNavActive(name, rotate = true)
    {
        const layersDivContent = document.querySelector(this.props.layers + ' > div.content');
        const layers = layersDivContent.querySelectorAll('div.layer');

        for (let i = 0; i < layers.length; i++)
        {
            const layer = layers[i];
            const title = layer.querySelector('div.title');
            const content = layer.querySelector('div.content');
            const icon = title.querySelector('img.icon');

            if(layer.classList.contains(name))
            {
                title.classList.add('active');
                icon.style.opacity = 0;
                content.style.display = 'block';
                content.style.maxHeight = (content.scrollHeight + 2) + 'px';
                if(rotate) this.setView(name);
                // title.scrollIntoView();
            }
            else
            {
                title.classList.remove('active');
                icon.style.opacity = 1;
                content.style.display = 'none';
                content.style.maxHeight = null;
            }
        }
    }

    async _createLayerData()
    {
        // hide UI
        this.showHideUI.hide();

        // enable raycaster
        const layersDiv = document.querySelector(this.props.layers);
        layersDiv.dispatchEvent(new MouseEvent('mouseleave'));


        const layersDivContent = layersDiv.querySelector('div.content');
        const data = Object.entries(this.props.data);
        
        for (let i = 0; i < data.length; i++)
        {
            const label = data[i][1].label || data[i][0];
            const group = data[i][1].group;
            const materials = data[i][1].materials;
            const meshName = data[i][0];

            // create layers bottom
            if(meshName == '*') continue;

            const layer = document.createElement('div');
            layer.className = 'layer ' + meshName;
            layer.dataset.mesh = meshName;
            layer.innerHTML = `
                <div class="title">
                    <img src="${C3D_SERVER}svg/plus.svg?c3d=0.5.0" alt="Icon" class="icon" draggable="false">
                    <p class="name">${label}</p>
                </div>
                <div class="content">
                    <div class="layers"></div>
                    <div class="buttons"></div>
                </div>`;
            
            layersDivContent.appendChild(layer);
            
            // add button listener
            layer.querySelector('div.title').addEventListener('click', () =>
            {
                this.render2d.scrollTo(meshName);
                this._setNavActive(meshName);
                document.querySelector(this.props.textLayer).style.display = 
                document.querySelector(this.props.imageLayer).style.display = 
                document.querySelector(this.props.shapeLayer).style.display = 'none';
            });

            // create material data
            const mesh = group ? this.glbScene.getObjectByName(group).getObjectByName(meshName) : this.glbScene.getObjectByName(meshName);

            if(!mesh)
            {
                console.warn("mesh name in data section not found!\ndefined: " + meshName);
            }

            this.eventsManager.addEventListener({
                mesh, 
                event:'mouseup', 
                callback:(o) => {
                    this._setNavActive(mesh.name, false);
                }
            });
            
            await this._createMaterials(mesh, materials);


            //
            if(!materials)
            {
                const layers = layersDivContent.querySelector('div.'+ meshName +' > div.content > div.layers');
                layers.__C3D_Sortable = new Sortable(this, layers, {onDragEnd: () => {
                    this.render3d.renderView(meshName);
                    this.render2d.renderView(meshName);
                }});
            }

        }

        // SWITCH TO 2D

        const switchTo2DDiv = document.createElement('div');
        switchTo2DDiv.className = 'switchTo2D';
        switchTo2DDiv.innerHTML = `
            <button class="button">${this.lang['design-in-2d']}</button>
        `;
        const switchTo2DButton = switchTo2DDiv.querySelector('button.button');
        switchTo2DButton.addEventListener('click', (e) =>
        {
            const showing3D = switchTo2DButton.classList.contains('threeD');
            this._set2D3DView(showing3D);
        });
        document.querySelector(this.props.layers).appendChild(switchTo2DDiv);

        // FILE MENU

        const fileDiv = document.createElement('div');
        fileDiv.className = 'fileMenu';
        fileDiv.innerHTML = `
            <button class="menu">${this.lang['file']}</button>
            <div class="menu">
                <a href="javascript:void(0);" class="saveAs" title="${this.lang['save-as']}">${this.lang['save-as']}</a>  
                <a href="javascript:void(0);" class="exportAsPDF" title="${this.lang['export']}">${this.lang['export']}</a>  
            </div>`;
        
        // show file menu button and content
        const menuButton = fileDiv.querySelector('button.menu');
        const menuDiv = fileDiv.querySelector('div.menu');

        menuButton.addEventListener('click', (e) => {
            const visible = menuDiv.style.display == 'none' || menuDiv.style.display == '' ;
            menuDiv.style.display = visible ? 'flex' : 'none';
        });

        // on click outside hide the menu
        const _menuClickOutside = (e) =>
        {
            if(!fileDiv.contains(e.target) && !menuButton.contains(e.target))
            {
                menuDiv.style.display = 'none';
            }
        };
        window.addEventListener('click', _menuClickOutside);
        window.addEventListener('touchstart', _menuClickOutside);

        // 
        const openDiv = document.createElement('div');
        openDiv.setAttribute('class', 'open');

        const openInputID = 'C3D_openInput_' + new Date().getTime();
        const openLabel = document.createElement('label');
        openLabel.setAttribute('for', openInputID);
        openLabel.innerText = this.lang['open'];
        openLabel.addEventListener('click', (e) => {
            menuDiv.style.display = 'none';
        });
        openDiv.appendChild(openLabel);

        const openInput = document.createElement('input');
        openInput.setAttribute('id', openInputID);
        openInput.setAttribute('type', 'file');
        const accept = isIOS() ? 'application/octet-stream' : '.c3d, application/x-customizer3d';
        openInput.setAttribute('accept', accept);
        openInput.addEventListener('change', (e) => {
            this.textLayer.hide();
            this.imageLayer.hide();
            this.shapeLayer.hide();
            this.file.open(e);
        });

        openDiv.appendChild(openInput);

        menuDiv.prepend(openDiv);

        // 
        const saveAsButton = fileDiv.querySelector('a.saveAs');
        saveAsButton.addEventListener('click', () => {
            this.file.saveAs();
            menuDiv.style.display = 'none';
        });

        //
        const exportAsPDFButton = fileDiv.querySelector('a.exportAsPDF');
        exportAsPDFButton.addEventListener('click', (e) =>
        {
            document.querySelector(this.props.textLayer).style.display = 'none';
            document.querySelector(this.props.imageLayer).style.display = 'none';
            document.querySelector(this.props.shapeLayer).style.display = 'none';

            this.file.export();
            menuDiv.style.display = 'none'; 

        });

        document.querySelector(this.props.layers).appendChild(fileDiv);


        //
        // '*' READ ALL PROPERTIES FROM GLB
        //

        // if material set to '*'
        for (let i = 0; i < data.length; i++)
        {
            const meshName = data[i][0];
            const group = data[i][1].group;
            const materialData = data[i][1];

            if(meshName == '*' && materialData)
            {
                const scene = group ? this.glbScene.getObjectByName(group) : this.glbScene;
                const meshNames = Object.keys(this.props.data);
                
                for (let j = 0; j < scene.children.length; j++)
                {
                    const mesh = scene.children[j];

                    if(!mesh)
                    {
                        console.warn('mesh name in data section not found!');
                    }

                    let found = false;
                    for (let z = 0; z < meshNames.length; z++)
                    {
                        const existMeshName = meshNames[z];
                        if(existMeshName == mesh.name)
                        {
                            found = true;
                            break;
                        }
                    }
                    if(found || mesh.type != 'Mesh') continue;

                    const label = mesh.name + (mesh.material.name ? '(' + mesh.material.name + ')' : '');
                    const layer = document.createElement('div');
                    layer.className = 'layer ' + mesh.name;
                    layer.dataset.mesh = mesh.name;
                    layer.innerHTML = `
                        <div class="title">
                            <img src="${C3D_SERVER}svg/plus.svg?c3d=0.5.0" alt="Icon" class="icon" draggable="false">
                            <p class="name" title="${label}">${label}</p>
                        </div>
                        <div class="content">
                            <div class="layers"></div>
                            <div class="buttons"></div>
                        </div>`;
                    
                    layersDivContent.appendChild(layer);
                    
                    // add button listener
                    layer.querySelector('div.title').addEventListener('click', () =>
                    {
                        this.render2d.scrollTo(mesh.name);
                        this._setNavActive(mesh.name);
                        document.querySelector(this.props.textLayer).style.display = 'none';
                        document.querySelector(this.props.imageLayer).style.display = 'none';
                        document.querySelector(this.props.shapeLayer).style.display = 'none';
                    });

                    this.eventsManager.addEventListener({
                        mesh, 
                        event:'mouseup', 
                        callback:(o) => {
                            this._setNavActive(mesh.name, false);
                        }
                    });

                    await this._createMaterials(mesh, materialData.materials);
                }

            }

        }

        // init. model (e.g. T-Shirt)
        await this.modelInit(this);

        // show UI
        this.showHideUI.show();

    }


    createMaterial(c3d, data)
    {
        if(data.colorOnly || data == 'default')
        {
            return false;
        }

        if(!data.materialOptions) data.materialOptions = {};

        if(data.url && !data.material)
        {
            return new THREE.MeshBasicMaterial(data.materialOptions);
        }

        const materials =
        [
            'MeshBasicMaterial', 
            'MeshLambertMaterial', 
            'MeshPhongMaterial', 
            'MeshStandardMaterial', 
            'MeshPhysicalMaterial',
            'MeshMatcapMaterial'
        ];
        
        for (let i = 0; i < materials.length; i++)
        {
            const material = materials[i];
            if(data.material == material)
            {
                const mat = new THREE[data.material](data.materialOptions);
                return mat;
            }
        }

        return false;
    };





    async _createMaterials(mesh, materials = [])
    {
        this.preloader.show();

        const layersDivContent = document.querySelector(this.props.layers + ' > div.content');
        const layers = layersDivContent.querySelector('div.'+ mesh.name +' > div.content > div.layers');
        const materialButtons = layersDivContent.querySelector('div.'+ mesh.name +' > div.content > div.buttons');
        
        let layer;        

        // loop min. 1 time to set default actions
        if(materials.length == 0) materials = ['default'];

        for (let i = 0; i < materials.length; i++)
        {
            const data = materials[i];

            if(data.url) this.preloader.set(data.url);

            // set material if defined
            const material = this.createMaterial(this, data);
            if(material) mesh.material = material;

            // COLORS

            // change only material color
            if(data.hasOwnProperty('colorOnly'))
            {
                this.layers.addSolid(layers, {color: '#' + mesh.material.color.getHexString(), type: 'colorOnly'});
            }

            // add predefined colors
            else if(data.hasOwnProperty('colors'))
            {

                // create available color array
                for (let j = 0; j < data.colors.length; j++)
                {

                    const color = data.colors[j];   
                    const activeSpan = document.createElement('span');
                    const ce = this.colorEngine;

                    activeSpan.style.backgroundColor = ce.hex(color, false);
                    
                    activeSpan.addEventListener('click', () => 
                    {
                        const spans = materialButtons.querySelectorAll('span');
                        
                        for (let z = 0; z < spans.length; z++)
                        {
                            const span = spans[z];
                            
                            if(span === activeSpan)
                            {
                                span.classList.add('active');
                                this.render2d.renderView(mesh.name);
                                
                                const color = new THREE.Color(data.colors[z]);
                                gsap.to(mesh.material.color, {
                                    r:color.r,
                                    g:color.g,
                                    b:color.b,
                                    duration: 0.3,
                                    onUpdate: () => this.three.render()
                                });
                            }
                            else
                            {
                                span.classList.remove('active');
                            }
                        }
                    });

                    materialButtons.appendChild(activeSpan);

                    if(j == 0) activeSpan.click();
                }

            }


            // TEXTURES

            else if(data.hasOwnProperty('url'))
            {
                if(!layer) layer = await this.layers.addImage(layers, {changeable:false});

                const img = document.createElement('img');
                img.classList.add('texture');
                img.src = data.url;

                await img.decode();

                img.addEventListener('click', () => 
                {
                    const imgs = materialButtons.querySelectorAll('img');
                    
                    for (let j = 0; j < imgs.length; j++)
                    {
                        const activeImg = imgs[j];
                        
                        if(activeImg.src === img.src)
                        {
                            activeImg.classList.add('active');
                            layer.image = img;
                            layer.fileName = data.url.substring(data.url.lastIndexOf('/') + 1);
                            if(layer.fileName.indexOf('?') > -1) layer.fileName = layer.fileName.substring(0, layer.fileName.indexOf('?'));
                            layer.material = data.material;
                            layer.materialOptions = data.materialOptions;
                            layer.repeatX = data.repeatX;
                            layer.repeatY = data.repeatY;
                            this.render2d.renderView(mesh.name);
                            this.render3d.renderView(mesh.name);
                        }
                        else
                        {
                            activeImg.classList.remove('active');
                        }

                    }
                });

                materialButtons.appendChild(img);
                if(i == 0) img.click();
            }
            
            // SOLID LAYER
            
            else if(data.hasOwnProperty('solid'))
            {
                const div = document.createElement('div');
                const img = document.createElement('img');

                div.appendChild(img);

                div.setAttribute('class', 'button');
                div.setAttribute('title', this.lang['add-solid-layer']);

                img.src = C3D_SERVER + 'svg/solid.svg?c3d=0.5.0';
                img.alt = 'Icon';
                img.dataset.type = 'Solid';
                img.draggable = false;
                
                div.addEventListener('click', async () =>
                {
                    await this.layers.addSolid(layers);
                });

                materialButtons.appendChild(div);
            }

            // TEXT LAYER
            
            else if(data.hasOwnProperty('text'))
            {
                const div = document.createElement('div');
                const img = document.createElement('img');

                div.appendChild(img);

                div.setAttribute('class', 'button');
                div.setAttribute('title', this.lang['add-text-layer']);

                img.src = C3D_SERVER + 'svg/text.svg?c3d=0.5.0';
                img.alt = 'Icon';
                img.dataset.type = 'Text';
                img.draggable = false;

                div.addEventListener('click', async () =>
                {
                    await this.layers.addText(layers);
                });

                materialButtons.appendChild(div);
            }

            // IMAGE LAYER
            
            else if(data.hasOwnProperty('image'))
            {
                const div = document.createElement('div');
                const img = document.createElement('img');

                div.appendChild(img);

                div.setAttribute('class', 'button');
                div.setAttribute('title', this.lang['add-image-layer']);

                img.src = C3D_SERVER + 'svg/image.svg?c3d=0.5.0';
                img.alt = 'Icon';
                img.dataset.type = 'Image';
                img.draggable = false;
                
                div.addEventListener('click', async () =>
                {
                    const layer = await this.layers.addImage(layers);
                    layer.input.click();
                });

                materialButtons.appendChild(div);
            }

            // SHAPE LAYER
            
            else if(data.hasOwnProperty('shape'))
            {
                const div = document.createElement('div');
                const img = document.createElement('img');

                div.appendChild(img);

                div.setAttribute('class', 'button');
                div.setAttribute('title', this.lang['add-shape-layer']);

                img.src = C3D_SERVER + 'svg/shapes.svg?c3d=0.5.0';
                img.alt = 'Icon';
                img.dataset.type = 'Image';
                img.draggable = false;
                
                div.addEventListener('click', async () =>
                {
                    const layer = await this.layers.addShape(layers);
                });

                materialButtons.appendChild(div);
            }

            // GENERAL

            else
            {
                materialButtons.innerHTML += `
                <div class="button solid" title="${this.lang['add-solid-layer']}"><img src="${C3D_SERVER}svg/solid.svg?c3d=0.5.0" alt="Icon" data-type="Solid" draggable="false"></div>
                <div class="button text" title="${this.lang['add-text-layer']}"><img src="${C3D_SERVER}svg/text.svg?c3d=0.5.0" alt="Icon" data-type="Text" draggable="false"></div>
                <div class="button image" title="${this.lang['add-image-layer']}"><img src="${C3D_SERVER}svg/image.svg?c3d=0.5.0" alt="Icon" data-type="Image" draggable="false"></div>
                <div class="button shape" title="${this.lang['add-shape-layer']}"><img src="${C3D_SERVER}svg/shapes.svg?c3d=0.5.0" alt="Icon" data-type="Shape" draggable="false"></div>
                `;

                materialButtons.querySelector('div.solid').addEventListener('click', async () =>
                {
                    await this.layers.addSolid(layers);
                });
                
                materialButtons.querySelector('div.text').addEventListener('click', async () =>
                {
                    await this.layers.addText(layers);
                });

                materialButtons.querySelector('div.image').addEventListener('click', async () =>
                {
                    const layer = await this.layers.addImage(layers);
                    layer.input.click();
                });

                // materialButtons.querySelector('div.threeD').addEventListener('click', async () =>
                // {
                //     const layer = await this.layers.addImage(layers, {mimeType:'.glb'});
                //     layer.input.click();
                // });

                // materialButtons.querySelector('div.gradient').addEventListener('click', async () =>
                // {
                //     const layer = await this.layers.addImage(layers, {type:'gradient', changeable: false});
                //     this._setNavActive(mesh.name, false);
                // });

                materialButtons.querySelector('div.shape').addEventListener('click', async () =>
                {
                    await this.layers.addShape(layers);
                });

                // set default material (EDIT AREA)
                mesh.material = new THREE.MeshBasicMaterial({color: 0x0, opacity: 0.1, transparent: true, depthWrite: false});
            }
            
        }

        this.preloader.hide();

    }

}
