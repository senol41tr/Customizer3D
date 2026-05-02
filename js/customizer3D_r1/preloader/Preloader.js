export class Preloader
{
    constructor(c3d)
    {
        this.c3d = c3d;
        this.el = document.querySelector(this.c3d.props.preloader);
        this.p = this.el.querySelector('p');
    }

    show()
    {
        if(this.c3d?.zIndex) this.el.style.zIndex = this.c3d.zIndex.index;
        this.el.classList.remove('hide');
        this.el.classList.add('show');
    }

    hide()
    {
        this.el.classList.remove('show');
        this.el.classList.add('hide');
        this.set('');
    }

    set(txt)
    {
        if(typeof txt != 'string') txt = txt.toString();
        if(txt.indexOf('</') < 0) txt = txt.substring(txt.lastIndexOf('/') + 1);
        txt = '<b>' + this.c3d.lang['please-wait'] + '</b><br>' + txt;
        
        this.p.innerHTML = txt;
    }
    
}
