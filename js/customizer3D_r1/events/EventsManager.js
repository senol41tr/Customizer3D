/*
 * BETA
 * 03.03.2025
 * 
 * 
// _onMouseEnter(e)
// {
//     this.c3d.eventsManager.raycaster.layers.disableAll();
// }

// _onMouseLeave(e)
// {
//     this.c3d.eventsManager.raycaster.layers.enableAll();
// }
 * 
 * 
 */

import * as THREE from 'three';
import {isMobile} from 'customizer3D_dir/utils/isMobile.js?c3d=103';

export class EventsManager
{
    constructor(o)
    {
        // arguments
        this.meshes = o.hasOwnProperty('meshes') ? o.meshes : undefined;
        this.camera = o.hasOwnProperty('camera') ? o.camera : undefined;
        this.scene = o.hasOwnProperty('scene') ? o.scene : undefined;
        this.htmlElement = o.hasOwnProperty('htmlElement') ? o.htmlElement : window;

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
        // e.preventDefault();

        const touch = (e.touches && e.touches[0]) || (e.pointerType && e.pointerType === 'touch' && e);
        const clientX = (touch || e).clientX;
        const clientY = (touch || e).clientY;

        let intersected;

        this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;

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



            /*
        const hit = intersected[0];
        const hitPoint = hit.point;

        // 2. CHECK THE MASK: Is this point inside the mask's area?
        // We use a Raycaster "down" towards the mask to see if it hits
        const maskRaycaster = new THREE.Raycaster();
        
        // We shoot a ray from the camera toward the hit point
        maskRaycaster.setFromCamera(this.mouse, this.camera);
        const maskHit = maskRaycaster.intersectObjects(this.events.map(o => o.mesh));

        if (maskHit.length > 0) {
            // SUCCESS: The mouse is over the visible part of the stencil!
            console.log("Valid hit inside the mask:", hit.object.name);
            // Trigger your 98-file logic here...
        }
        */

            
            for (let i = 0; i < this.events.length; i++)
            {
                const o = this.events[i];
// console.log(intersected[0].object.name);

                if(o.event == 'mouseup')
                {
                    // if(o.mesh.isGroup && intersected[0].object.parent === o.mesh || o.mesh.name == intersected[0].object.name)
                    if(o.mesh.isGroup && intersected[0].object.parent === o.mesh || o.mesh.name == intersected[0].object.name)
                    {
                        o.callback(o);
                    }
                }
            }
        }
    }
}
