// _onMouseEnter(e)
// {
//     this.c3d.eventsManager.raycaster.layers.disableAll();
// }

// _onMouseLeave(e)
// {
//     this.c3d.eventsManager.raycaster.layers.enableAll();
// }

import * as THREE from 'three';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=107';

export class EventsManager
{
    constructor(o)
    {
        // arguments
        this.c3d = o.c3d;
        this.meshes = o.meshes || undefined;
        this.camera = this.c3d.three.camera;
        this.scene = o.scene || this.c3d.three.scene;
        this.htmlElement = o.htmlElement || this.c3d.three.getCanvas();

        // vars
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.events = [];
        
        // add event listener
        if(isMobile()) this.htmlElement.addEventListener('touchstart', this.onMouseUp.bind(this));
        else this.htmlElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    }

    addEventListener(o)
    {
        if(o.mesh instanceof Array)
        {
            for (let i = 0; i < o.mesh.length; i++)
            {
                const oClone = {...o};
                oClone.mesh = o.mesh[i];
                this.events.push(oClone);
            }
        }
        else
        {
            this.events.push(o);
            
        }
    }

    onMouseUp(e)
    {
        e.preventDefault();

        const touch = (e.touches && e.touches[0]) || (e.pointerType && e.pointerType === 'touch' && e);
        const clientX = (touch || e).clientX;
        const clientY = (touch || e).clientY;
        const rect = this.c3d.three.getCanvas().getBoundingClientRect();

        let intersected;

        this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        if(this.meshes != undefined)
        {
            intersected = this.raycaster.intersectObjects(this.meshes);
        }
        else
        {
            intersected = this.raycaster.intersectObjects(this.scene.children, true);
        }

        if (intersected.length > 0)
        {
            
            for (let i = 0; i < this.events.length; i++)
            {
                const o = this.events[i];
                // console.log(intersected[0].object.name);

                if(o.event == 'mouseup')
                {
                    // if(o.mesh.isGroup && intersected[0].object.parent === o.mesh || o.mesh.name == intersected[0].object.name)
                    if(o.mesh.name == intersected[0].object.name)
                    {
                        o.callback(o);
                        break;
                    }
                }
            }
        }
    }
}
