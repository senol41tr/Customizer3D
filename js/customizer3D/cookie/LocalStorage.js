export class LocalStorage
{
    constructor(c3d)
    {
        this.c3d = c3d;
        this.htmlEl = document.querySelector(this.c3d.props.container);

        if(this.get('hideDialog') == null)
        {
            this.showDialog();
        }
    }

    set(name, value)
    {
        window.localStorage.setItem(name, value);
    }

    setAsArray(name, value)
    {
        this.set(name, JSON.stringify(value));
    }

    get(name)
    {
        return window.localStorage.getItem(name);
    }

    getAsArray(name)
    {
        return JSON.parse(this.get(name)) || [];
    }

    delete(name)
    {
        window.localStorage.removeItem(name);
    }

    showDialog()
    {
        this.div = document.createElement('div');
        this.div.setAttribute('class', 'cookies');
        this.div.addEventListener('click', this._hideDialog.bind(this));
        this.div.innerHTML = this.c3d.lang['cookie-information'];
        this.div.innerHTML += '<img src="' + C3D_SERVER + 'svg/plus.svg?c3d=0.5.1" alt="Icon" class="close">';
        this.htmlEl.appendChild(this.div);
    }

    _hideDialog()
    {
        this.set('hideDialog', true);
        this.div.remove();
    }
    
}
