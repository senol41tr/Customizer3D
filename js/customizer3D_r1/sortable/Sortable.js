import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=101';

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
        const deltaY = point.clientY - this.startY;

        if (this.pendingDrag) {
            if (Math.abs(deltaY) < 5) { return; } 

            const rect = this.dragItem.getBoundingClientRect();
            this.dragItem.classList.add('active');
            this.dragItem.style.width = `${rect.width}px`;
            this.dragItem.style.position = 'fixed';
            this.dragItem.style.left = `${rect.left}px`;
            this.dragItem.style.top = `${rect.top}px`;
            this.pendingDrag = false; 

        }

        // if (e.cancelable) e.preventDefault();
        this.dragItem.style.transform = `translate3d(0, ${deltaY}px, 0)`;

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


/*
export class Sortable2
{
    constructor(c3d, callbacks)
    {
        this.c3d = c3d;
        this.callbacks = callbacks;

        this.__moveUp = this.moveUp.bind(this);
        this.__moveDown = this.moveDown.bind(this);

    }

    addElement(root)
    {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.gap = '0.5rem';
        div.innerHTML = `
            <img class="up" src="${C3D_SERVER}svg/arrow-drop-down.svg?c3d=101" style="cursor:pointer; width:8px; rotate:180deg; opacity:0.7;" alt="Arrow Icon">
            <img class="down" src="${C3D_SERVER}svg/arrow-drop-down.svg?c3d=101" style="cursor:pointer; width:8px;opacity:0.7;" alt="Arrow Icon">
        `;
        div.querySelector('img.up').addEventListener('click', this.__moveUp);
        div.querySelector('img.down').addEventListener('click', this.__moveDown);
        
        root.prepend(div);
    }

    moveUp(e)
    {
        const el = e.currentTarget.parentNode.parentNode;
        const previous = el.previousElementSibling;
        if (previous) {
            el.parentNode.insertBefore(el, previous);
            if(this.callbacks?.onDragEnd) this.callbacks.onDragEnd();
        }
    }

    moveDown(e)
    {
        const el = e.currentTarget.parentNode.parentNode;
        const next = el.nextElementSibling;
        if (next) {
            el.parentNode.insertBefore(next, el);
            if(this.callbacks?.onDragEnd) this.callbacks.onDragEnd();
        }
    }

}
*/

/*

import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=101';


// Based on: https://codepen.io/krmfla/pen/NwyKYV

export class Sortable
{
    constructor(c3d, wrapper, callbacks)
    {
        this.c3d = c3d;
        this.wrapper = typeof wrapper == 'string' ? document.querySelector(wrapper) : wrapper; 
        this.callbacks = callbacks;

        this.elements = [];
        this.targetEl;
        this.scopeObj;
    }

    handleDrag(e)
    {
        this.targetEl = e.currentTarget;
        this.targetEl.classList.add("onDrag");
    }

    handleDragEnd(e)
    {
        this.targetEl.classList.remove("onDrag");
        if(this.callbacks?.onDragEnd) this.callbacks.onDragEnd();
    }

    handleDragEnter(e)
    {
        this.wrapper.insertBefore(this.targetEl, e.currentTarget);
    }

    handleTouch(e)
    {
        this.defineScope(this.elements);
        this.targetEl = e.currentTarget;
        this.targetEl.classList.add("onDrag");
    }

    handleTouchEnd()
    {
        this.targetEl.classList.remove("onDrag");
        if(this.callbacks?.onDragEnd) this.callbacks.onDragEnd();
    }

    handleTouchMove(e)
    {
        this.hitTest(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }

    hitTest(thisX, thisY)
    {
        for (let i = 0, max = this.scopeObj.length; i < max; i++)
        {
            if (thisX > this.scopeObj[i].startX && thisX < this.scopeObj[i].endX)
            {
                if (thisY > this.scopeObj[i].startY && thisY < this.scopeObj[i].endY)
                {
                    this.wrapper.insertBefore(this.targetEl, this.scopeObj[i].target);
                    return;
                }
            }
        }
    }

    defineScope(elementArray)
    {
        this.scopeObj = [];
        for (let i = 0, max = elementArray.length; i < max; i++)
        {
            const newObj = {};
            newObj.target = elementArray[i];
            newObj.startX = elementArray[i].offsetLeft;
            newObj.endX = elementArray[i].offsetLeft + elementArray[i].offsetWidth;
            newObj.startY = elementArray[i].offsetTop;
            newObj.endY = elementArray[i].offsetTop + elementArray[i].offsetHeight;
            this.scopeObj.push(newObj);
        }
    }


    addElement(el)
    {
        if(!el.getAttribute('draggable')) el.setAttribute('draggable', 'true');

        if(isMobile())
        {
            el.addEventListener("touchstart", this.handleTouch.bind(this));
            el.addEventListener("touchend", this.handleTouchEnd.bind(this));
            el.addEventListener("touchmove", this.handleTouchMove.bind(this));
        }
        else
        {
            el.addEventListener("dragstart", this.handleDrag.bind(this));
            el.addEventListener("dragend", this.handleDragEnd.bind(this));
            el.addEventListener("dragenter", this.handleDragEnter.bind(this));
        }

        this.elements.push(el);
    }

}
*/
