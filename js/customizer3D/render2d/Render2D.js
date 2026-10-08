import {Size} from 'customizer3D_dir/utils/Size.js?c3d=0.5.1';
import {degToRad} from 'customizer3D_dir/utils/degToRad.js?c3d=0.5.1';
import {calculateAspectRatioFit} from 'customizer3D_dir/utils/calculateAspectRatioFit.js?c3d=0.5.1';
import {applyFilter} from 'customizer3D_dir/layers/Filters/Filters.js?c3d=0.5.1';

export class Render2D
{
    constructor(c3d)
    {
        this.c3d = c3d;

        this._initialized = false;
        this.__onResize = this._onResize.bind(this);

    }

    show()
    {
        if(!this._initialized) this._init();

        // hide UI
        document.querySelector(this.c3d.props.controls).style.visibility = 'hidden';
        this.c3d.textLayer.hide();
        this.c3d.imageLayer.hide();
        this.c3d.shapeLayer.hide();

        const canvas2D = document.querySelector(this.c3d.props.canvas2d);
        const canvas3D = this.c3d.three.getCanvas().parentNode; // div
        
        canvas2D.style.display = 'flex';
        canvas3D.style.display = 'none';

        // scroll to active view
        const activeView = document.querySelector(this.c3d.props.layers + ' div.layer > div.active');
        if(activeView) this.scrollTo(activeView.parentNode.dataset.mesh);
        
        window.addEventListener('resize', this.__onResize);
        this._onResize();
    }

    hide()
    {
        if(!this._initialized) this._init();

        const canvas2D = document.querySelector(this.c3d.props.canvas2d);
        const canvas3D = this.c3d.three.getCanvas().parentNode; // div
        
        canvas2D.style.display = 'none';
        canvas3D.style.display = 'flex';

        document.querySelector(this.c3d.props.controls).style.visibility = 'visible';
        window.removeEventListener('resize', this.__onResize);

    }

    scrollTo(side)
    {
        if(!this._initialized || (side == 'model' && this.c3d.props.availableModelColors)) return;

        document.querySelector(this.c3d.props.canvas2d + ' > div.' + side).scrollIntoView({behavior: 'instant', block: 'center'});

        // const layersDiv = document.querySelector(this.c3d.props.layers);
        // layersDiv.style.top = (window.scrollY + 16) + 'px';
    }

    _init()
    {
        const canvas2dDiv = document.querySelector(this.c3d.props.canvas2d);
        const data = Object.entries(this.c3d.props.data);
        const addCanvas = (meshName, layerDesc) =>
        {
            const div = document.createElement('div');
            div.setAttribute('class', meshName + ' container');

            const label = document.createElement('p');
            label.setAttribute('class', 'label');
            label.innerHTML = '<img src="' + C3D_SERVER + 'svg/arrow-drop-down.svg?c3d=0.5.1" class="arrow"><span class="label">'+ layerDesc +'</span>';
            div.appendChild(label);

            // Canvas
            const meshCanvas = document.createElement('canvas');
            meshCanvas.setAttribute('class', meshName + ' webgl_2d');
            meshCanvas.dataset.mesh = meshName;

            meshCanvas.addEventListener('click', () =>
            {
                this.c3d._setNavActive(meshName, true);
                this.scrollTo(meshName);
                this.c3d.textLayer.hide();
                this.c3d.imageLayer.hide();
                this.c3d.shapeLayer.hide();
            });
            meshCanvas.addEventListener('contextmenu', (e) => {e.preventDefault(); return false;});
            div.appendChild(meshCanvas);

            canvas2dDiv.appendChild(div);
        };

        for (let i = 0; i < data.length; i++)
        {
            const meshName = data[i][0];
            const materialData = data[i][1];
            
            let layerDesc = meshName;

            if(meshName == '*' && materialData)
            {
                const scene = data[i][1].hasOwnProperty('group') ? this.c3d.glbScene.getObjectByName(group) : this.c3d.glbScene;
                const meshNames = Object.keys(this.c3d.props.data);
                
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

                    addCanvas(mesh.name, mesh.name);
                }
            }
            else
            {
                if(this.c3d.props.data[meshName])
                {
                    layerDesc = this.c3d.props.data[meshName].label;
                }
                addCanvas(meshName, layerDesc);
            }
        }

        this._initialized = true;
    }


    renderAll()
    {
        if(!this._initialized) return;
        
        const data = Object.entries(this.c3d.props.data);

        for (let i = 0; i < data.length; i++)
        {
            const meshName = data[i][0];
            const materialData = data[i][1];            
            
            if(meshName == '*' && materialData)
            {
                const scene = data[i][1].hasOwnProperty('group') ? this.c3d.glbScene.getObjectByName(group) : this.c3d.glbScene;
                const meshNames = Object.keys(this.c3d.props.data);
                
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

                    this.renderView(mesh.name);
                }
            }
            else
            {
                this.renderView(meshName);
            }
        }
    }

    renderView(side)
    {
        if(!this._initialized) return;

        const canvas2dDiv = document.querySelector(this.c3d.props.canvas2d);
        const canvas = canvas2dDiv.querySelector('canvas.' + side);
        if(!canvas) return;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const layersDiv = document.querySelector(this.c3d.props.layers);
        const layers = layersDiv.querySelectorAll('[data-mesh=\'' + side + '\'] > div.content > div.layers > div');

        // predefined color(s)
        const span = layersDiv.querySelector('div.'+ side +' > div.content > div.buttons > span.active');
        if(layers.length == 0 && span)
        {
            ctx.save();
            ctx.fillStyle = span.style.backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
            return;
        }

        // render layers
        for (let j = layers.length - 1; j >= 0; j--)
        {
            const layer = layers[j].self;

            if(!layer.visible) continue;

            switch (layer.type)
            {

                case 'colorOnly':
                case 'solid':
                    
                    ctx.save();
                    ctx.fillStyle = layer.color;
                    if(layer.type == 'solid') ctx.globalAlpha = layer.opacity / 100;
                    ctx.globalCompositeOperation = layer.blendMode;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.restore();
                    
                break;
    
                case 'text':
                    
                    const canvasPreview = this.c3d.textLayer.htmlEl.querySelector('canvas.preview');
                    
                    if(layer.text == '' || !canvasPreview) continue;
                    
                    ctx.save();
                    ctx.globalCompositeOperation = layer.blendMode;
                    ctx.globalAlpha = layer.opacity / 100;
                    ctx.drawImage(layer.canvas, 0, 0, canvas.width, canvas.height);
                    ctx.restore();

                break;
    
                case 'image':

                    const textureDims = calculateAspectRatioFit(
                        layer.image.naturalWidth, 
                        layer.image.naturalHeight, 
                        canvas.width,
                        canvas.height
                    );
                    const canvasPreviewImage = this.c3d.imageLayer.htmlEl.querySelector('canvas.preview');
                    const xImage = canvas.width / canvasPreviewImage.width * layer.imagePosition.x;
                    const yImage = canvas.height / canvasPreviewImage.height * layer.imagePosition.y;
                    
                    ctx.save();
                    ctx.globalCompositeOperation = layer.blendMode;
                    ctx.globalAlpha = layer.opacity / 100;
                    ctx.translate(canvas.width / 2 + xImage, canvas.height / 2 + yImage);
                    ctx.rotate(degToRad(layer.rotation));
                    ctx.scale(layer.zoom / 100, layer.zoom / 100);
                    ctx.drawImage(
                        layer.changeable ? layer.canvas : layer.image, 
                        -textureDims.width / 2, 
                        -textureDims.height / 2, 
                        textureDims.width, 
                        textureDims.height
                    );
                    ctx.restore();

                break;

                case 'shape':

                    ctx.save();
                    ctx.globalCompositeOperation = layer.blendMode;
                    ctx.globalAlpha = layer.opacity / 100;
                    ctx.drawImage(layer.canvas, 0, 0, canvas.width, canvas.height);
                    ctx.restore();

                break;
            }

        }

    }

    getCanvasSize(name, DPI = 150)
    {
        const canvas3D = this.c3d.three.getCanvas().parentNode; // div

        let screenDims = Size.htmlDims(document.querySelector(this.c3d.props.container));
        screenDims.width *= 0.75; // give 25% padding
        screenDims.height *= 0.75;

        if(this.c3d.props.data[name])
        {
            if(!this.c3d.props.data[name].printSize)
            {
                return {width: screenDims.width / 2, height: screenDims.height / 4};
            }
            const printDims = this.c3d.props.data[name].printSize;
            const printWidth = new Size({size: printDims.width, DPI}).px;
            const printHeight = new Size({size: printDims.height, DPI}).px;
    
            return calculateAspectRatioFit(printWidth, printHeight, screenDims.width, screenDims.height);
        }

        return {width: screenDims.width, height: screenDims.height};
        console.log('Undefined printSize!');

    }

    destroy()
    {
        this._initialized = false;
        document.querySelector(this.c3d.props.canvas2d).innerHTML = '';
    }

    _onResize()
    {
        const canvases = document.querySelectorAll(this.c3d.props.canvas2d + ' > div > canvas');

        for (let i = 0; i < canvases.length; i++)
        {
            const canvas = canvases[i];
            const {width, height} = this.getCanvasSize(canvas.dataset.mesh);

            canvas.width = width * 2;
            canvas.height = height * 2;
            canvas.style.width = Math.floor(width) + 'px';
            canvas.style.height = Math.floor(height) + 'px';

        }

        this.renderAll();

    }

}
