import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=0.5.1';

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
        this._mmove = this._onMouseMove.bind(this);
        this._xy = {x: 0, y: 0};
        
        if(isMobile())
        {
            this.dragEl.addEventListener('touchstart', this._mdown);
            this.dragEl.addEventListener('touchend', this._mup);
        }
        else
        {
            this.dragEl.addEventListener('mousedown', this._mdown);
            this.dragEl.addEventListener('mouseup', this._mup);
            this.root.addEventListener('mouseup', this._mup);
        }
    }

    destroy()
    {
        this.dragEl.removeEventListener('touchstart', this._mdown);
        this.dragEl.removeEventListener('touchend', this._mup);
        this.dragEl.removeEventListener('mousedown', this._mdown);
        this.dragEl.removeEventListener('mouseup', this._mup);
        this.root.removeEventListener('mouseup', this._mup);
        window.removeEventListener('resize', this._resetPos);
        window.removeEventListener('mousemove', this._mmove);
        window.removeEventListener('touchmove', this._mmove);
    }

    _onMouseDown(e)
    {
        e = this._setMobileTouchEvents(e);
        const bbDragEl = this.dragEl.getBoundingClientRect();
        const bb = this.root.getBoundingClientRect();
        const bbContainer = this.container.getBoundingClientRect();
        setTimeout(() => {
            const bbContainer = this.container.getBoundingClientRect();
            if(bbContainer.x + bbContainer.width > bb.width) {
                this.container.style.left = (bb.width - bbContainer.width) + 'px';
            }
        }, 200);
        
        this._xy.x = e.clientX - bbDragEl.x + bb.x;
        this._xy.y = e.clientY - bbDragEl.y + bb.y;

        if(isMobile()) document.body.style.overflow = 'hidden'; // https://stackoverflow.com/a/6411611
        this.container.style.zIndex = this.c3d.zIndex.index; // move to top

        if(isMobile()) window.addEventListener('touchmove', this._mmove);
        else window.addEventListener('mousemove', this._mmove);
    }

    _onMouseUp()
    {
        if(isMobile()) window.removeEventListener('touchmove', this._mmove);
        else window.removeEventListener('mousemove', this._mmove);

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
        // if(y + bbContainer.height > bb.height) y = bb.height - bbContainer.height;
        
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
