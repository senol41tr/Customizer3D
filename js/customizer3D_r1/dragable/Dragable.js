import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=101';

export class Dragable
{
    constructor(o)
    {
        this.c3d = o.c3d;
        this.dragEl = o.dragEl;
        this.container = o.container;
        this.root = o.root;

        this._mup = this._onMouseUp.bind(this);
        this._mdown = this._onMouseDown.bind(this);
        this._resetPos = this._resetPosition.bind(this);
        this._mmove = this._onMouseMove.bind(this);
        this._menter = this._onMouseEnter.bind(this);
        this._mleave = this._onMouseLeave.bind(this);
        this._resetPositionFn = this._resetPosition.bind(this);
        this._resetPositionID = 0;
        this._xy = {x:0, y:0};
        
        if(isMobile())
        {
            this.dragEl.addEventListener('touchstart', this._mdown);
            this.dragEl.addEventListener('touchend', this._mup);
        }
        else
        {
            this.dragEl.addEventListener('mousedown', this._mdown);
            this.dragEl.addEventListener('mouseup', this._mup);
            this.root.addEventListener('mouseleave', this._mup);
            this.root.addEventListener('mouseup', this._mup);
            this.container.addEventListener('mouseenter', this._menter);
            this.container.addEventListener('mouseleave', this._mleave);
            window.addEventListener('resize', this._resetPos);
        }
    }

    destroy()
    {
        this.dragEl.removeEventListener('touchstart', this._mdown);
        this.dragEl.removeEventListener('touchend', this._mup);
        this.dragEl.removeEventListener('mousedown', this._mdown);
        this.dragEl.removeEventListener('mouseup', this._mup);
        this.root.removeEventListener('mouseleave', this._mup);
        this.root.removeEventListener('mouseup', this._mup);
        window.removeEventListener('resize', this._resetPos);
        window.removeEventListener('mousemove', this._mmove);
        window.removeEventListener('touchmove', this._mmove);
        this.container.removeEventListener('mouseenter', this._menter);
        this.container.removeEventListener('mouseleave', this._mleave);
    }

    _onMouseDown(e)
    {
        e = this._setMobileTouchEvents(e);
        const bbDragEl = this.dragEl.getBoundingClientRect();
        const bb = this.root.getBoundingClientRect();
        
        this._xy.x = e.clientX - bbDragEl.x + bb.x;
        this._xy.y = e.clientY - bbDragEl.y + bb.y;

        if(isMobile()) document.body.style.overflow = 'hidden'; // https://stackoverflow.com/a/6411611
        this.container.style.zIndex = this.c3d.zIndex.index; // move to top

        window.addEventListener('mousemove', this._mmove);
        window.addEventListener('touchmove', this._mmove);
    }

    _onMouseUp()
    {
        window.removeEventListener('mousemove', this._mmove);
        window.removeEventListener('touchmove', this._mmove);
        this._resetPositionID = setTimeout(this._resetPositionFn, 200); // !!!

        if(isMobile()) document.body.style.overflow = 'auto';
    }

    _onMouseMove(e)
    {
        e = this._setMobileTouchEvents(e);

        const bbContainer = this.container.getBoundingClientRect();
        const bb = this.root.getBoundingClientRect();

        let x = Math.max(0, e.clientX - this._xy.x);
        let y = Math.max(0, e.clientY - this._xy.y);

        if(x + bbContainer.width > bb.width) x = bb.width - bbContainer.width - bb.x;
        if(y + bbContainer.height > bb.height) y = bb.height - bbContainer.height;
        
        this.container.style.left = x + 'px';
        this.container.style.top = y + 'px';
        this.container.style.bottom = 'auto';
        this.container.style.right = 'auto';
        this.container.style.transform = 'none';
    }

    _onMouseEnter(e)
    {
        this.c3d.eventsManager.raycaster.layers.disableAll();
    }

    _onMouseLeave(e)
    {
        this.c3d.eventsManager.raycaster.layers.enableAll();
    }

    _resetPosition()
    {
        const bbContainer = this.container.getBoundingClientRect();
        const bb = this.root.getBoundingClientRect();

        let x = Math.max(0, bbContainer.x - bb.x);
        let y = Math.max(0, bbContainer.y - bb.y);

        if(bbContainer.x + bbContainer.width > bb.width + bb.x) x = bb.width - bbContainer.width;
        if(bbContainer.y + bbContainer.height > bb.height + bb.y) y = bb.height - bbContainer.height;

        this.container.style.left = x + 'px';
        this.container.style.top = y + 'px';
        this.container.style.bottom = 'auto';
        this.container.style.right = 'auto';
        this.container.style.transform = 'none';

        clearTimeout(this._resetPositionID);
        
    }

    _setMobileTouchEvents(e)
    {
        if(e.type.startsWith('touch') && e.touches.length)
        {
            e.clientX = e.touches[0].clientX;
            e.clientY = e.touches[0].clientY;    
        }
        return e;
    }

}
