import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=107';

export class Sortable
{
    constructor(c3d, container, callbacks) {
        this.c3d = c3d;
        this.container = container;
        this.callbacks = callbacks;
        
        this.dragItem = null;
        this.startY = 0;
        this.initialY = 0;
        this.time = 0;
        this.selector = `
            div.image:not(.active), 
            div.text:not(.active), 
            div.solid:not(.active), 
            div.gradient:not(.active),
            div.shape:not(.active)
        `;

        this.onMove = this.onMove.bind(this);
        this.onEnd = this.onEnd.bind(this);

    }

    addElement(el)
    {
        el.addEventListener(isMobile() ? 'touchstart' : 'mousedown', (e) => this.onStart(e));
    }

    onStart(e)
    {
        this.time = new Date().getTime();
        const item = e.target.closest(this.selector);
        
        if (!item) return;

        document.querySelector(this.c3d.props.layers).style.overflow = 'hidden';
        const point = e.touches ? e.touches[0] : e;

        this.pendingDrag = true; 
        this.dragItem = item;
        this.startY = point.clientY;

        if(isMobile())
        {
            window.addEventListener('touchmove', this.onMove);
            window.addEventListener('touchend', this.onEnd);
        }
        else
        {
            window.addEventListener('mousemove', this.onMove);
            window.addEventListener('mouseup', this.onEnd);
        }
    }

    onMove(e) {
        if (!this.dragItem || this.time + 250 >= new Date().getTime()) return;

        const point = e.touches ? e.touches[0] : e;
        const layersRect = document.querySelector(this.c3d.props.layers).getBoundingClientRect();
        const rect = this.dragItem.getBoundingClientRect();
        const deltaY = point.clientY - this.startY;

        if (this.pendingDrag) {
            if (Math.abs(deltaY) < 5) { return; } 

            
            this.dragItem.classList.add('active');
            // this.dragItem.style.width = `${rect.width}px`;
            this.dragItem.style.position = 'fixed';
            this.dragItem.style.zIndex = 10000;
            // this.dragItem.style.left = `${rect.left}px`;
            // this.dragItem.style.top = `${rect.top}px`;
            this.pendingDrag = false; 

        }

        // if (e.cancelable) e.preventDefault();
        // this.dragItem.style.transform = `translate3d(0, ${deltaY}px, 0)`;
        this.dragItem.style.top = `${deltaY}px`;

        const siblings = [...this.container.querySelectorAll(this.selector)];

        const nextSibling = siblings.find(sib => {
            return point.clientY <= sib.getBoundingClientRect().top + sib.offsetHeight / 2;
        });

        try {
            if (nextSibling) {

                if (nextSibling !== this.dragItem && this.container.contains(nextSibling)) {
                    this.container.insertBefore(this.dragItem, nextSibling);
                }
            } else {

                const lastChild = this.container.lastElementChild;
                if (lastChild !== this.dragItem) {
                    this.container.appendChild(this.dragItem);
                }
            }
        } catch (err) {
            // this.onEnd();
        }
    }

    onEnd()
    {
        if (!this.dragItem) return;

        this.dragItem.classList.remove('active');
        this.dragItem.style.position = '';
        this.dragItem.style.width = '';
        this.dragItem.style.left = '';
        this.dragItem.style.top = '';
        this.dragItem.style.transform = '';

        if(isMobile())
        {
            window.removeEventListener('touchmove', this.onMove);
            window.removeEventListener('touchend', this.onEnd);
        }
        else
        {
            window.removeEventListener('mousemove', this.onMove);
            window.removeEventListener('mouseup', this.onEnd);
        }

        this.dragItem = null;
        if(this.callbacks?.onDragEnd && this.time + 250 <= new Date().getTime()) this.callbacks.onDragEnd();
        document.querySelector(this.c3d.props.layers).style.overflow = 'auto';
    }
}
