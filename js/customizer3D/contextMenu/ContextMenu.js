export class ContextMenu
{
    constructor(c3d)
    {
        this.c3d = c3d;
        this.el = document.querySelector(this.c3d.props.contextMenu);
        
        this._mleave = this.hide.bind(this);
        this._mdown = this._onClickOutside.bind(this);
        this._resize = this._onResize.bind(this);
    }

    show(parentEl)
    {
        this.el.classList.remove('hide');
        this.el.classList.add('show');

        const bbContainer = document.querySelector(this.c3d.props.container).getBoundingClientRect();
        const bbEl = this.el.getBoundingClientRect();

        let bb, top, left;
        
        if(!parentEl)
        {
            this._onResize();
            window.addEventListener('resize', this._resize);
        }
        else
        {
        
            bb = parentEl.getBoundingClientRect();
            top = bb.y + bb.height - bbContainer.y;
            left = bb.x;
            
            if(bbEl.height + top > window.innerHeight)
            {
                top -= bbEl.height + top + 16 - window.innerHeight;
            }

            if(bbEl.width + left > window.innerWidth)
            {
                left -= bbEl.width + left + 16 - window.innerWidth;
            }

            this.el.addEventListener('mouseleave', this._mleave);
            window.addEventListener('mousedown', this._mdown);
            window.addEventListener('touchend', this._mdown);

        }

        this.el.style.left = left + 'px';
        this.el.style.top = top + 'px';

        this.el.style.zIndex = this.c3d.zIndex.index; // move to top
    }

    hide()
    {
        this.el.classList.remove('show');
        this.el.classList.add('hide');

        this.el.removeEventListener('mouseleave', this._mleave);
        window.removeEventListener('mousedown', this._mdown);
        window.removeEventListener('touchend', this._mdown);
        window.removeEventListener('resize', this._resize);
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
    }
    
    _onResize()
    {
        const bbContainer = document.querySelector(this.c3d.props.container).getBoundingClientRect();
        const bbEl = this.el.getBoundingClientRect();
        const left = (bbContainer.width - bbEl.width) / 2;
        const top = (bbContainer.height - bbEl.height) / 2 / 1.666;

        this.el.style.left = left + 'px';
        this.el.style.top = top + 'px';
    }

}
