import * as THREE from 'three';
import * as Materials from 'customizer3D_dir/three/materials/Materials.js?c3d=101';
import {Three} from 'customizer3D_dir/three/Three.js?c3d=101';
import {createMaterial} from 'customizer3D_dir/utils/createMaterial.js?c3d=101';
import {Render3D} from 'customizer3D_dir/three/Render3D.js?c3d=101';
import {GLB} from 'customizer3D_dir/three/loaders/GLB.js?c3d=101';
import {WebXR} from 'customizer3D_dir/three/WebXR.js?c3d=101';
import {Lang} from 'customizer3D_dir/lang/Lang.js?c3d=101';
import {File} from 'customizer3D_dir/file/File.js?c3d=101';
import {EventsManager} from 'customizer3D_dir/events/EventsManager.js?c3d=101';
import {LocalStorage} from 'customizer3D_dir/cookie/LocalStorage.js?c3d=101';
import {Preloader} from 'customizer3D_dir/preloader/Preloader.js?c3d=101';
import {Settings} from 'customizer3D_dir/settings/Settings.js?c3d=101';
import {Layers} from 'customizer3D_dir/layers/Layers.js?c3d=101';
import {TextLayer} from 'customizer3D_dir/layers/TextLayer.js?c3d=101';
import {ImageLayer} from 'customizer3D_dir/layers/ImageLayer.js?c3d=101';
import {ShapeLayer} from 'customizer3D_dir/layers/ShapeLayer.js?c3d=101';
import {Dragable} from 'customizer3D_dir/dragable/Dragable.js?c3d=101';
import {ContextMenu} from 'customizer3D_dir/contextMenu/ContextMenu.js?c3d=101';
import {Help} from 'customizer3D_dir/help/Help.js?c3d=101';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=101';
import {isIOS} from 'customizer3D_dir/utils/isMobile.js?c3d=101';
import {ZIndex} from 'customizer3D_dir/utils/ZIndex.js?c3d=101';
import {ShowHideUI} from 'customizer3D_dir/utils/ShowHideUI.js?c3d=101';
import {fitMeshToScreen} from 'customizer3D_dir/utils/fitMeshToScreen.js?c3d=101';
import {ColorEngine} from 'customizer3D_dir/ColorEngine/ColorEngine.js?c3d=101';
import {Sortable} from 'base/customizer3D_r1/sortable/Sortable.js?c3d=101';

export class Customizer3D
{
    constructor(glbPath, jsPath)
    {
        this.PIXEL_RATIO = 2;//Math.max(2, window.devicePixelRatio);

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
        this.layers = null;
        this.contextMenu = new ContextMenu(this);
        this.help = new Help(this);
        this.localStorage = new LocalStorage(this);
        this.textLayer = new TextLayer(this);
        this.imageLayer = new ImageLayer(this);
        this.shapeLayer = new ShapeLayer(this);
        this.settings = null;
        this.glbScene = null;
        this.zIndex = null;
        this.webXR = null;
        this.showHideUI = null;

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
            secureDiv.innerHTML += '<img src="' + C3D_SERVER + 'svg/plus.svg?c3d=101" alt="Icon" class="close">';
            document.querySelector(this.props.container).appendChild(secureDiv);
        }

        // load builtInFonts
        if(this.textLayer.builtInFonts.length == 0)
        {
            await this.textLayer._loadBuiltInFonts();
        }

        //
        this.three = new Three(this);
        this.three.setupAll();
        this.three.setupLights();

        // add THREE.OrbitControls
        this.three.addControls(this.props.orbitControlOptions);

        //
        this.eventsManager = new EventsManager({
            camera: this.three.camera,
            scene: this.three.scene
        });


        // init. layers
        this.layers = new Layers(this);

        // 
        this.render3d = new Render3D(this);

        // load model
        await this._loadGLB(glbPath);

        // set html, options, tint all loaded svg's etc.
        this.settings = new Settings(this);
        await this.settings.init();

        // 
        // HTML STUFF
        //

        const layersDiv = document.querySelector(this.props.layers);

        layersDiv.innerHTML = `
        <div class="title">
            <div class="title">
                <img src="${C3D_SERVER}svg/layers.svg?c3d=101" alt="Icon" class="icon" draggable="false">
                <p class="title">${this.lang['layers']}</p>
            </div>
            <img src="${C3D_SERVER}svg/arrow-drop-down.svg?c3d=101" alt="Icon" class="rollup" draggable="false">
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

        // https://discourse.threejs.org/t/how-to-prevent-raycast-from-firing-when-i-touch-an-html-element/30262/2
        layersDiv.addEventListener('mouseenter', () =>
        {
            this.eventsManager.raycaster.layers.disableAll();
        });

        layersDiv.addEventListener('mouseleave', () =>
        {
            this.eventsManager.raycaster.layers.enableAll();
        });

        const titleRollUpIcon = layersDiv.querySelector('div.title > img.rollup');
        titleRollUpIcon.addEventListener('click', (e) =>
        {
            const layers = document.querySelector(this.props.layers);
            const content = layers.querySelector('div.content');
            const fileMenu = layers.querySelector('div.fileMenu');
            const visible = content.style.display == 'none';
            
            titleRollUpIcon.style.rotate = visible ? '180deg' : '0deg';
            content.style.display = 
            fileMenu.style.display = visible ? 'flex' : 'none';
            
            layers.dataset.minHeight = window.getComputedStyle(layers)['minHeight'];
            layers.style.minHeight = visible ? layers.dataset.minHeight : 'auto';
        });

        // CONTROLS

        const controlsDiv = document.querySelector(this.props.controls);
        const deviceIcon = isMobile() ? 'tap' : 'mouse';
        controlsDiv.innerHTML = `
            <img src="${C3D_SERVER}svg/zoom-out.svg?c3d=101" class="zoomOut" draggable="false">
            <div class="inputDiv">
                <input type="checkbox" class="checkbox" checked>
                <img src="${C3D_SERVER}svg/${deviceIcon}.svg?c3d=101" class="deviceIcon" draggable="false">
            </div>
            <img src="${C3D_SERVER}svg/zoom-in.svg?c3d=101" class="zoomIn" data-factor="0.01" draggable="false">
        `;

        const dragableControls = new Dragable({
            dragEl: controlsDiv,
            container: controlsDiv,
            root: document.querySelector(this.props.container),
            c3d: this
        });

        controlsDiv.querySelector('img.zoomIn').addEventListener('click', (e) =>
        {
            const event = new WheelEvent('wheel', {
                deltaY: -200,
                deltaMode: 0,
                bubbles: true,
                cancelable: true
            });
            this.three.controls.orbit.enableZoom = true;
            this.three.renderer.domElement.dispatchEvent(event);
            this.three.controls.orbit.enableZoom = false;
        });

        controlsDiv.querySelector('img.zoomOut').addEventListener('click', (e) =>
        {
            const event = new WheelEvent('wheel', {
                deltaY: 200,
                deltaMode: 0,
                bubbles: true,
                cancelable: true
            });
            this.three.controls.orbit.enableZoom = true;
            this.three.renderer.domElement.dispatchEvent(event);
            this.three.controls.orbit.enableZoom = false;
        });
        
        const zoomCheckBox = controlsDiv.querySelector('input.checkbox');
        zoomCheckBox.addEventListener('click', () =>
        {
            const checked = zoomCheckBox.checked;
            if(!isMobile()) this.three.controls.orbit.enableZoom = checked;
            if(isMobile())
            {
                const canvas3d = document.querySelector(this.props.canvas3d);
                canvas3d.style.touchAction = checked ? 'none' : 'auto';
            }
            controlsDiv.querySelector('img.zoomIn').style.display = 
            controlsDiv.querySelector('img.zoomOut').style.display = checked ? 'none' : 'block';
        });

        // WebXR
        const webXRDiv = document.createElement('div');
        webXRDiv.className = 'webXR';
        webXRDiv.innerHTML = `
            <img src="${C3D_SERVER}svg/xr.svg?c3d=101" class="button" alt="XR Button" draggable="false">
        `;
        document.querySelector(this.props.container).appendChild(webXRDiv);
        

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

        // start render
        this.three.start();

        // add onResize event
        window.addEventListener('resize', this.onResize.bind(this));

    }
    
    
    enableAutoZoom()
    {
        this._setAutoZoom(true);
    }

    disableAutoZoom()
    {
        this._setAutoZoom(false);
    }

    _setAutoZoom(auto = true)
    {
        const setZoomCheckbox = document.querySelector(this.props.controls).querySelector('input.checkbox');
        setZoomCheckbox.checked = !auto; // true: manuel zoom, false: auto (default: auto)
        setZoomCheckbox.click();
    }



    // PRIVATE METHODS


    async _loadGLB(path)
    {
        const glbLoader = new GLB({url: path, camera: this.three.camera, preloader: this.preloader});
        const glb = await glbLoader.load();

        this.glbScene = glb.scene;
        this.three.scene.add(this.glbScene);
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
            const meshName = data[i][0];
            const label = data[i][1].label || this.lang[meshName] || data[i][0];
            const group = data[i][1].group;
            const materials = data[i][1].materials;
            const printSize = data[i][1].printSize;

            // create layers bottom
            if(meshName == '*') continue;

            //
            if((!materials || materials[0].image || materials[0].text || materials[0].solid) && printSize)
            {
                const renderer = this.glbScene.getObjectByName(meshName);
                if(!renderer) {
                    alert("Mesh in 3D Model not found!\nLabel or mesh name: " + label);
                    continue;
                }
                renderer.material = Materials.setMainMaterial(this, renderer);
            }

            const layer = document.createElement('div');
            layer.className = 'layer ' + meshName;
            layer.dataset.mesh = meshName;
            layer.innerHTML = `
                <div class="title">
                    <img src="${C3D_SERVER}svg/plus.svg?c3d=101" alt="Icon" class="icon" draggable="false">
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
                this._setNavActive(meshName);
                this.textLayer.hide();
                this.imageLayer.hide();
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
                    layersDiv.dispatchEvent(new MouseEvent('mouseup'));
                }
            });
            
            await this._createMaterials(mesh, materials);

            //
            if(!materials)
            {
                const layers = layersDivContent.querySelector('div.'+ meshName +' > div.content > div.layers');
                layers.__C3D_Sortable = new Sortable(this, layers, {onDragEnd: () => {
                    this.render3d.updateRenderOrder(meshName);
                    this.three.render();
                }});
            }

        }

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
            this.textLayer.hide();
            this.imageLayer.hide();

            let notice = '<img src="' + C3D_SERVER + 'svg/warning.svg?c3d=101" style="width:28px;filter:none !important;align-self: center;">' + this.lang['convert-to-cmyk-notice'];

            notice = notice.replace('[ILLUSTRATOR_SCREENSHOT]', '<a href="' + C3D_SERVER + 'jpg/convert_to_cmyk_illustrator.jpg?c3d=101" target="_blank" style="font-size:0.7rem;">'+ this.lang['screenshot'] +'</a>');
            notice = notice.replace('[COREL_SCREENSHOT]', '<a href="' + C3D_SERVER + 'jpg/convert_to_cmyk_corel.jpg?c3d=101" target="_blank" style="font-size:0.7rem;">'+ this.lang['screenshot'] +'</a>');
            notice = notice.replace('[DOWNLOAD]', '<button class="download">'+ this.lang['download'] +'</button>');
            notice = notice.replace('[PDFTOCMYK_COM]', '<a href="' + C3D_SERVER + 'jpg/pdf2cmyk.com.jpg?c3d=101" target="_blank" style="font-size:0.7rem;">'+ this.lang['screenshot'] +'</a> <a href="https://www.pdf2cmyk.com" target="_blank" style="font-size:0.7rem;">pdf2cmyk.com</a>');

            this.contextMenu.setWidth(220);
            this.contextMenu.setHTML(notice);
            this.contextMenu.show(e.currentTarget);
            
            this.contextMenu.el.querySelector('button.download').addEventListener('click', (e) => {
                this.file.export();
                menuDiv.style.display = 'none';  
                this.contextMenu.hide();  
            });

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
                            <img src="${C3D_SERVER}svg/plus.svg?c3d=101" alt="Icon" class="icon" draggable="false">
                            <p class="name" title="${label}">${label}</p>
                        </div>
                        <div class="content">
                            <div class="layers"></div>
                            <div class="buttons"></div>
                        </div>`;
                    
                    layersDivContent.appendChild(layer);
                    
                    // add button listener
                    layer.querySelector('div.title').addEventListener('click', (e) =>
                    {
                        this._setNavActive(mesh.name);
                        this.textLayer.hide();
                        this.imageLayer.hide();
                    });

                    this.eventsManager.addEventListener({
                        mesh, 
                        event:'mouseup', 
                        callback:(o) => {
                            this._setNavActive(mesh.name, false);
                            layersDiv.dispatchEvent(new MouseEvent('mouseup'));
                            this.textLayer.hide();
                            this.imageLayer.hide();
                        }
                    });

                    await this._createMaterials(mesh, materialData.materials);
                }

            }

        }

        // init. model (e.g. T-Shirt)
        await this.modelInit(this);

        // !!!
        const layersData = Object.keys(this.props.data);
        for (const meshName in layersData)
        {
            const view = layersData[meshName];
            const layers = layersDiv.querySelectorAll('[data-mesh=\'' + view + '\'] > div.content > div.layers > div');

            for (let i = 0; i < layers.length; i++)
            {
                const layer = layers[i].self;

                if(layer.type == 'image')
                {
                    if(!layer.changeable) {
                        layer.image.click();                        
                    }
                }
            }
        }

        // show UI
        this.showHideUI.show();
        this.onResize(); // fit mesh to screen
    }

    _setNavActive(name, rotate = true, fn = 'to')
    {
        const layersDivContent = document.querySelector(this.props.layers + ' > div.content');

        // show if window rolled up
        if(layersDivContent.style.display == 'none') return;
        // layersDivContent.style.display = 'flex';
        // document.querySelector(this.props.layers + ' > div.title > img.icon').style.rotate = '180deg';

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
                if(rotate) this.setView(name, fn);
                title.scrollIntoView();
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
            const material = createMaterial(data);
            if(material) mesh.material = material;

            // hide border
            if(data.url || data.colors) {
                layers.style.border = 'none';
            }


            // COLORS

            // change only material color
            if(data.hasOwnProperty('colorOnly'))
            {
                layer = await this.layers.addSolid(layers, {color: '#' + mesh.material.color.getHexString(), type: 'colorOnly'});
                layer._mesh = mesh;
            }

            // add predefined colors exists
            else if(data.hasOwnProperty('colors'))
            {
                layer = await this.layers.addSolid(layers, {type: 'color'});
                layer._mesh = mesh;

                // create available color array
                for (let j = 0; j < data.colors.length; j++)
                {
                    const activeSpan = document.createElement('span');
                    activeSpan.style.backgroundColor = data.colors[j];
                    
                    activeSpan.addEventListener('click', () => 
                    {
                        const spans = materialButtons.querySelectorAll('span');                        
                        
                        for (let z = 0; z < spans.length; z++)
                        {
                            const span = spans[z];

                            if(span === activeSpan)
                            {
                                span.classList.add('active');
                                layer.color = span.style.backgroundColor;
                                layer.updatePreview();
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

                // strip get parameters
                let image_src = data.url.substring(data.url.lastIndexOf('/') + 1);
                if(image_src.indexOf('?') > -1) image_src = image_src.substring(0, image_src.indexOf('?'));

                const img = document.createElement('img');
                img.classList.add('texture');
                img.dataset.image_src = image_src;
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
                            
                            if(data.material) layer.material = data.material;
                            if(data.repeatX) layer.repeatX = data.repeatX || 1;
                            if(data.repeatY) layer.repeatY = data.repeatY || 1;
                            if(data.materialOptions) layer.materialOptions = data.materialOptions;
                            
                            const mesh = this.glbScene.getObjectByName(layer.name);
                            
                            if(mesh.material)
                            {
                                if(mesh.material.map) mesh.material.map.dispose();
                                if(mesh.material.matcap) mesh.material.matcap.dispose();
                            }
                            else
                            {
                                const material = createMaterial(data);
                                mesh.material = material;
                            }

                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            canvas.width = layer.image.naturalWidth;
                            canvas.height = layer.image.naturalHeight;
                            ctx.drawImage(layer.image, 0, 0);

                            const texture = new THREE.CanvasTexture(canvas);
                            texture.colorSpace = THREE.SRGBColorSpace;
                            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                            texture.offset.set(0, 0);
                            texture.repeat.set(layer.repeatX, layer.repeatY);

                            switch (layer.material)
                            {
                                case 'MeshMatcapMaterial':

                                    mesh.material.matcap = texture;

                                break;

                                case 'MeshBasicMaterial': 
                                case 'MeshLambertMaterial':  
                                case 'MeshPhongMaterial': 
                                case 'MeshStandardMaterial':  
                                case 'MeshPhysicalMaterial': 

                                    mesh.material.map = texture;

                                break;
                            
                                default:

                                    mesh.material.map = texture;

                                break;
                            }

                            mesh.material.needsUpdate = true;
                            this.three.render();
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

                img.src = C3D_SERVER + 'svg/solid.svg?c3d=101';
                img.alt = 'Icon';
                img.dataset.type = 'Solid';
                img.draggable = false;
                
                div.addEventListener('click', async () =>
                {
                    await this.layers.addSolid(layers);
                    this._setNavActive(mesh.name, false);
                    this.three.render();
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

                img.src = C3D_SERVER + 'svg/text.svg?c3d=101';
                img.alt = 'Icon';
                img.dataset.type = 'Text';
                img.draggable = false;

                div.addEventListener('click', async () =>
                {
                    await this.layers.addText(layers);
                    this._setNavActive(mesh.name, false);
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

                img.src = C3D_SERVER + 'svg/image.svg?c3d=101';
                img.alt = 'Icon';
                img.dataset.type = 'Image';
                img.draggable = false;
                
                div.addEventListener('click', async () =>
                {
                    const imageLayer = await this.layers.addImage(layers);
                    this.imageLayer.layer = imageLayer;
                    imageLayer.input = this.imageLayer._addSelectImageInput();
                    imageLayer.input.click();
                    this._setNavActive(mesh.name, false);
                });

                materialButtons.appendChild(div);
            }

            // GENERAL

            else
            {
                materialButtons.innerHTML += `
                <div class="button solid" title="${this.lang['add-solid-layer']}">
                    <img src="${C3D_SERVER}svg/solid.svg?c3d=101" alt="Icon" draggable="false">
                </div>

                <div class="button gradient" title="${this.lang['add-gradient-layer']}">
                    <img src="${C3D_SERVER}svg/gradient.svg?c3d=101" alt="Icon" draggable="false">
                </div>

                <div class="button text" title="${this.lang['add-text-layer']}">
                    <img src="${C3D_SERVER}svg/text.svg?c3d=101" alt="Icon" draggable="false">
                </div>

                <div class="button image" title="${this.lang['add-image-layer']}">
                    <img src="${C3D_SERVER}svg/image.svg?c3d=101" alt="Icon" draggable="false">
                </div>

                <div class="button threeD" title="${this.lang['add-3d-model']}">
                    <img src="${C3D_SERVER}svg/3D.svg?c3d=101" alt="Icon" draggable="false">
                </div>

                <div class="button shape" title="${this.lang['add-shape-layer']}" style="pointer-events:none; opacity:0.4;">
                    <img src="${C3D_SERVER}svg/shapes.svg?c3d=101" alt="Icon" draggable="false">
                </div>
                `;


                materialButtons.querySelector('div.solid').addEventListener('click', async () =>
                {
                    await this.layers.addSolid(layers);
                    this._setNavActive(mesh.name, false);
                    this.three.render();
                });
                
                materialButtons.querySelector('div.text').addEventListener('click', async () =>
                {
                    await this.layers.addText(layers);
                    this._setNavActive(mesh.name, false);
                });

                materialButtons.querySelector('div.image').addEventListener('click', async () =>
                {
                    const layer = await this.layers.addImage(layers);
                    layer.input.click();
                });

                materialButtons.querySelector('div.threeD').addEventListener('click', async () =>
                {
                    const layer = await this.layers.addImage(layers, {mimeType:'.glb'});
                    layer.input.click();
                });

                materialButtons.querySelector('div.gradient').addEventListener('click', async () =>
                {
                    const layer = await this.layers.addImage(layers, {type:'gradient', changeable: false});
                    this._setNavActive(mesh.name, false);
                });

                materialButtons.querySelector('div.shape').addEventListener('click', async () =>
                {
                    await this.layers.addShape(layers);
                    this._setNavActive(mesh.name, false);
                });

            }
            
        }

        this.preloader.hide();

        this.onResize(); // fit GLB to Screen
        this.three.controls.saveSettings();
    }

    onResize()
    {
        if (!this.props.three?.cameraOptions?.position?.z)
        {
            fitMeshToScreen(this.three.camera, this.glbScene, 1.5);
        }
    }

}
