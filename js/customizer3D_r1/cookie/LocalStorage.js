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

    setObject(name, value)
    {
        this.setAsArray(name, value);    
    }

    getObject(name)
    {
        const arr = this.getAsArray(name);
        return arr.length == 0 ? null : arr;
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
        this.div.innerHTML += '<img src="' + C3D_SERVER + 'svg/plus.svg?c3d=101" alt="Icon" class="close">';
        this.htmlEl.appendChild(this.div);
    }

    _hideDialog()
    {
        this.set('hideDialog', true);
        this.div.remove();
    }
    
}
