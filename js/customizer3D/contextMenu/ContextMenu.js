export class ContextMenu
{
    constructor(c3d)
    {
        this.c3d = c3d;
        this.el = document.querySelector(this.c3d.props.contextMenu);
        
        this._mdown = this._onClickOutside.bind(this);
        this._menter = this._onMouseEnter.bind(this);
        this._mleave = this._onMouseLeave.bind(this);
    }

    show(parentEl, hideOnMouseOut = true)
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
            top = window.innerHeight - bbEl.height - 32; // 2rem
        }

        if(bbEl.width + left > window.innerWidth)
        {
            left = window.innerWidth - bbEl.width - 32;
        }
        
        this.el.style.left = left + 'px';
        this.el.style.top = top + 'px';

        this.el.style.zIndex = this.c3d.zIndex.index; // move to top

        if(hideOnMouseOut)
        {
            this.el.addEventListener('mouseenter', this._menter);
            this.el.addEventListener('mouseleave', this._mleave);
            window.addEventListener('mousedown', this._mdown);
            window.addEventListener('touchend', this._mdown);
        }
    }

    hide()
    {
        this.el.classList.remove('show');
        this.el.classList.add('hide');
        this.setHTML('');

        this.el.removeEventListener('mouseenter', this._menter);
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

    setPosition(left, top)
    {
        this.el.style.left = left + 'px';
        this.el.style.top = top + 'px';
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
    }
    
    _onMouseEnter(e)
    {
        this.c3d.eventsManager.raycaster.layers.disableAll();
    }

    _onMouseLeave(e)
    {
        this.hide();
        this.c3d.eventsManager.raycaster.layers.enableAll();
    }

}
