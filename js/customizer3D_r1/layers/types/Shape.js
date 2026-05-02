export class Shape
{
    constructor(root, c3d, data)
    {
        this.type = 'shape';

        this.root = root;
        this.c3d = c3d;
        this.div = null;

        this.color = data.color || '#eeff00';
        this.strokeColor = data.strokeColor || '#1100ff';
        this.opacity = data.opacity || 100;
        this.radius = data.radius || 1;
        this.points = data.points || [];
        this.material = data.material;
        this.materialOptions = data.materialOptions;
        this.repeatX = data.repeatX || 1;
        this.repeatY = data.repeatY || 1;
        
        this._insertHTML();
    }

    get name()
    {
        return this.root.parentNode.parentNode.dataset.mesh;
    }

    _insertHTML()
    {
        const div = document.createElement('div');
        div.setAttribute('class', this.type);
        div.self = this;
        
        div.innerHTML = `
            <p class="title">${this.c3d.lang['shape']}</p>
            <img src="${C3D_SERVER}svg/delete-bin.svg" title="${this.c3d.lang['delete-layer']}" class="remove">
        `;

        div.querySelector('p.title').addEventListener('click', () =>
        {
            this.c3d.shapeLayer.show(this);
        }); 

        div.querySelector('img.remove').addEventListener('click', async () =>
        {
            if(this.input) this.input.remove();
            div.remove();
            this.c3d.shapeLayer.hide();
        });


        this.root.prepend(div);
        div.querySelector('p.title').click();

    }

}
