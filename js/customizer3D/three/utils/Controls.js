import { isMobile } from 'customizer3D_dir/utils/isMobile.js??c3d=0.5.5';

export class Controls {
    constructor(mesh, domElement) {
        this.domElement = domElement || document.body;

        this.rotateSpeed = 0.005;
        this.panSpeed = 0.001;

        this.isDragging = false;
        this.isPanning = false;
        this.previousPosition = { x: 0, y: 0 };
        this.initialPinchDistance = 0;

        this.mesh = mesh;

        this.__onPointerDown = this._onPointerDown.bind(this);
        this.__onPointerMove = this._onPointerMove.bind(this);
        this.__onPointerUp = this._onPointerUp.bind(this);
        this.__onWheel = this._onWheel.bind(this);

        if(!isMobile()) this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    set mesh(mesh) {
        if (!mesh || !mesh.scale) return;
        this._mesh = mesh;
        
        this.meshScale = mesh.scale.x;
        this.meshNextScale = this.meshScale;

        this.zoomSpeed = this.meshScale * 0.1;
        this.minScale = this.meshScale * 0.05;
        this.maxScale = this.meshScale * 20;
    }

    get mesh() {
        return this._mesh;
    }


    _getPointerData(e) {
        const isTouch = e.touches && e.touches.length > 0;
        const count = isTouch ? e.touches.length : 1;

        if (isTouch && count >= 2) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            return {
                count,
                x: (t1.clientX + t2.clientX) / 2,
                y: (t1.clientY + t2.clientY) / 2,
                distance: Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
            };
        }

        const source = isTouch ? e.touches[0] : e;
        return {
            count,
            x: source.clientX,
            y: source.clientY,
            distance: 0
        };
    }


    _onPointerDown(e) {
        if (!this._mesh) return;

        const pointer = this._getPointerData(e);

        this.isDragging = true;
        this.isPanning = (e.button === 2) || (pointer.count === 2);
        this.previousPosition = { x: pointer.x, y: pointer.y };

        if (pointer.count === 2) {
            this.initialPinchDistance = pointer.distance;
        }
    }

    _onPointerMove(e) {
        if (!this.isDragging || !this._mesh) return;
        if (e.cancelable) e.preventDefault();

        const pointer = this._getPointerData(e);
        const deltaX = pointer.x - this.previousPosition.x;
        const deltaY = pointer.y - this.previousPosition.y;

        if (pointer.count === 2) {
            const distanceDiff = pointer.distance - this.initialPinchDistance;
            
            this.meshNextScale += distanceDiff * (this.zoomSpeed * 0.1);
            this.meshNextScale = Math.min(Math.max(this.meshNextScale, this.minScale), this.maxScale);
            this._mesh.scale.setScalar(this.meshNextScale);
            
            this.initialPinchDistance = pointer.distance;

            this._mesh.position.x += deltaX * this.panSpeed;
            this._mesh.position.y -= deltaY * this.panSpeed;

        } else if (this.isPanning) {
            this._mesh.position.x += deltaX * this.panSpeed;
            this._mesh.position.y -= deltaY * this.panSpeed;

        } else {
            this._mesh.rotation.y += deltaX * this.rotateSpeed;
            this._mesh.rotation.x += deltaY * this.rotateSpeed;
        }

        this.previousPosition = { x: pointer.x, y: pointer.y };
    }

    _onPointerUp() {
        this.isDragging = false;
        this.isPanning = false;
        this.initialPinchDistance = 0;
    }

    _onWheel(e) {
        if (!this._mesh) return;
        e.preventDefault();

        const delta = Math.sign(e.deltaY);
        
        if (delta < 0) {
            this.meshNextScale += this.zoomSpeed;
        } else {
            this.meshNextScale -= this.zoomSpeed;
        }

        this.meshNextScale = Math.min(Math.max(this.meshNextScale, this.minScale), this.maxScale);

        this._mesh.scale.setScalar(this.meshNextScale);
    }


    addEventListeners()
    {
        if(isMobile())
        {
            this.domElement.addEventListener('touchstart', this.__onPointerDown);
            this.domElement.addEventListener('touchmove', this.__onPointerMove, { passive: false });
            this.domElement.addEventListener('touchend', this.__onPointerUp);
            return;
        }

        this.domElement.addEventListener('mousedown', this.__onPointerDown);
        this.domElement.addEventListener('mousemove', this.__onPointerMove);
        this.domElement.addEventListener('wheel', this.__onWheel, { passive: false });
        window.addEventListener('mouseup', this.__onPointerUp);

    }

    removeEventListeners()
    {
        if(isMobile())
        {
            this.domElement.removeEventListener('touchstart', this.__onPointerDown);
            this.domElement.removeEventListener('touchmove', this.__onPointerMove);
            this.domElement.removeEventListener('touchend', this.__onPointerUp);
            return;
        }

        this.domElement.removeEventListener('mousedown', this.__onPointerDown);
        this.domElement.removeEventListener('mousemove', this.__onPointerMove);
        this.domElement.removeEventListener('wheel', this.__onWheel);
        window.removeEventListener('mouseup', this.__onPointerUp);

    }
}