export class ContextMenu
{
    constructor(c3d)
    {
        this.c3d = c3d;
        this.el = document.querySelector(this.c3d.props.contextMenu);
        
        this._mleave = this.hide.bind(this);
        this._mdown = this._onClickOutside.bind(this);
    }

    show(parentEl)
    {
        this.el.classList.remove('hide');
        this.el.classList.add('show');

        const bbContainer = document.querySelector(this.c3d.props.container).getBoundingClientRect();
        const bb = parentEl.getBoundingClientRect();
        const bbEl = this.el.getBoundingClientRect();

        let top = bb.y + bb.height - bbContainer.y;
        let left = bb.x;
        
        if(bbEl.height + top > window.innerHeight)
        {
            top -= bbEl.height + top + 16 - window.innerHeight;
        }

        if(bbEl.width + left > window.innerWidth)
        {
            left -= bbEl.width + left + 16 - window.innerWidth;
        }
        
        this.el.style.left = left + 'px';
        this.el.style.top = top + 'px';

        this.el.style.zIndex = this.c3d.zIndex.index; // move to top

        this.el.addEventListener('mouseleave', this._mleave);
        window.addEventListener('mousedown', this._mdown);
        window.addEventListener('touchend', this._mdown);
    }

    hide()
    {
        this.el.classList.remove('show');
        this.el.classList.add('hide');

        this.el.removeEventListener('mouseleave', this._mleave);
        window.removeEventListener('mousedown', this._mdown);
        window.removeEventListener('touchend', this._mdown);
    }

    setHTML(html)
    {
        this.el.innerHTML = html;
    }

    setHTMLObj(el)
    {
        this.setHTML('');
        this.el.appendChild(el);
    }

    setWidth(px)
    {
        this.el.style.width = typeof px == 'string' ? px : px + 'px';
    }

    _onClickOutside(e)
    {
        if (!this.el.contains(e.target))
        {
            this.hide();
        }
    };        

}
