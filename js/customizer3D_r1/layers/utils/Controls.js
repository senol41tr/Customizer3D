import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=102';

export class Controls
{
    constructor(mesh, domElement)
    {
        this._mesh = mesh;
        this.domElement = domElement || document.body;

        this.meshScale = mesh?.scale?.x;
        this.meshNextScale = this.meshScale;

        this.rotateSpeed = 0.005;
        this.panSpeed = 0.01;

        this.isDragging = false;
        this.previousMousePosition = {
            x: 0,
            y: 0
        };
        this.initialPinchDistance = 0;

        this.__mDown = this._mDown.bind(this);
        this.__mUp = this._mUp.bind(this);
        this.__mMove = this._mMove.bind(this);
        this.__mWheel = this._mWheel.bind(this);
        
        this.__tStart = this._tStart.bind(this);
        this.__tMove = this._tMove.bind(this);
        this.__tEnd = this._tEnd.bind(this);

        if(!isMobile()) this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    }

    set mesh(mesh)
    {
        this._mesh = mesh;
        this.meshScale = mesh.scale.x;
        this.meshNextScale = this.meshScale;
    }


    _mDown(e)
    {
        this.isDragging = true;
        this.isPanning = (e.button === 2);

        this.previousMousePosition = {
            x: e.clientX,
            y: e.clientY
        };
    }

    _mMove(e)
    {
        if (!this.isDragging) return;

        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        if (this.isPanning)
        {

            this._mesh.position.x += deltaX * this.panSpeed;
            this._mesh.position.y -= deltaY * this.panSpeed;
        }
        else
        {

            this._mesh.rotation.y += deltaX * this.rotateSpeed;
            this._mesh.rotation.x += deltaY * this.rotateSpeed;
        }

        this.previousMousePosition = {
            x: e.clientX,
            y: e.clientY
        };
    }

    _mUp()
    {
        this.isDragging = false;
        this.isPanning = false;
    }

    _mWheel(e)
    {
        e.preventDefault();

        // const delta = Math.sign(e.deltaY);
        // const zoomSpeed = this.meshScale / 10;

        // if(delta < 0) this.meshNextScale += zoomSpeed;
        // else this.meshNextScale -= zoomSpeed;

        // if(this.meshNextScale < zoomSpeed) this.meshNextScale = zoomSpeed;
        // if(this.meshNextScale > this.meshScale * 10) this.meshNextScale = this.meshScale * 10;

        // this._mesh.scale.setScalar(this.meshNextScale);
    }

    _tStart(e)
    {
        if (e.touches.length === 1)
        {

            this.isDragging = true;
            this.previousMousePosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
        else if (e.touches.length === 2)
        {
            this.isDragging = false;
            this.initialPinchDistance = this._getDistance(e.touches[0], e.touches[1]);
        }
    }

    _tMove(e)
    {
        e.preventDefault();

        const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
        const deltaY = e.touches[0].clientY - this.previousMousePosition.y;

        if (e.touches.length === 1 && this.isDragging)
        {
            this._mesh.rotation.y += deltaX * this.rotateSpeed;
            this._mesh.rotation.x += deltaY * this.rotateSpeed;

            this.previousMousePosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
        // else if (e.touches.length === 2)
        // {
        //     const currentDistance = this._getDistance(e.touches[0], e.touches[1]);
        //     const isZoomIn = currentDistance >= this.initialPinchDistance;
        //     const zoomSpeed = this.meshScale / 70;

        //     if(isZoomIn) this.meshNextScale += zoomSpeed;
        //     else this.meshNextScale -= zoomSpeed;

        //     if(this.meshNextScale < zoomSpeed) this.meshNextScale = zoomSpeed;
        //     if(this.meshNextScale > this.meshScale * 70) this.meshNextScale = this.meshScale * 70;

        //     this._mesh.scale.setScalar(this.meshNextScale);


        //     this.initialPinchDistance = currentDistance;
        //     const panSpeed = 0.0001;
        //     this._mesh.position.x += deltaX * panSpeed;
        //     this._mesh.position.y -= deltaY * panSpeed;
        // }
    }

    _tEnd()
    {
        this.isDragging = false;
        this.initialPinchDistance = 0;
    }

    addEventListeners()
    {
        this.domElement.addEventListener('mousedown', this.__mDown);
        this.domElement.addEventListener('mousemove', this.__mMove);
        this.domElement.addEventListener('wheel', this.__mWheel);
        window.addEventListener('mouseup', this.__mUp);
    }

    removeEventListeners()
    {
        this.domElement.removeEventListener('mousedown', this.__mDown);
        this.domElement.removeEventListener('mousemove', this.__mMove);
        this.domElement.removeEventListener('wheel', this.__mWheel);
        window.removeEventListener('mouseup', this.__mUp);
    }

    addTouchEvents()
    {
        this.domElement.addEventListener('touchstart', this.__tStart);
        this.domElement.addEventListener('touchmove', this.__tMove);
        this.domElement.addEventListener('touchend', this.__tEnd);
    }

    removeTouchEvents()
    {
        this.domElement.removeEventListener('touchstart', this.__tStart);
        this.domElement.removeEventListener('touchmove', this.__tMove);
        this.domElement.removeEventListener('touchend', this.__tEnd);
    }

    _getDistance(t1, t2)
    {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // reset()
    // {
    //     this._mesh.rotation.set(0, 0, 0);
    //     this._mesh.position.set(0, 0, 0);
    //     this._mesh.scale.set(1, 1, 1);
    // }
}