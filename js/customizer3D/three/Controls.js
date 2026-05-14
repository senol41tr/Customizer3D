import * as THREE from 'three';
import {OrbitControls} from "three_dir/controls/OrbitControls.js?c3d=104";
import {mergeRecursive} from 'customizer3D_dir/utils/mergeRecursive.js?c3d=104';
import {isIOS} from 'customizer3D_dir/utils/isMobile.js?c3d=104';
import gsap from 'base/gsap@3.13.0/gsap@3.13.0.esm.js';

export class Controls
{
    constructor(c3d, three)
    {
        this.c3d = c3d;
        this.three = three;

        this.orbit = new OrbitControls(this.three.camera, this.three.renderer.domElement);
        
        // for increasing performance
        // this.orbit.addEventListener( 'change', () => this.three.render());

        this._preSettings = null;
        
        // set orbitcontrol options
        this.updateOptions();
    }

    updateOptions()
    {
        const o = this.c3d.props.three?.orbitControlOptions ? {...this.c3d.props.three.orbitControlOptions} : {};
        if(typeof(o.enableDamping) === 'undefined') o.enableDamping = true;
        if(typeof(o.dampingFactor) === 'undefined') o.dampingFactor = isIOS() ? 0.075 : 0.15;
        if(typeof(o.target) === 'undefined') o.target = new THREE.Vector3(0,0,0);
        if(typeof(o.minDistance) === 'undefined') o.minDistance = 0;
        if(typeof(o.maxDistance) === 'undefined') o.maxDistance = Infinity;
        if(typeof(o.minPolarAngle) === 'undefined') o.minPolarAngle = 0;
        if(typeof(o.maxPolarAngle) === 'undefined') o.maxPolarAngle = Math.PI;

        mergeRecursive(this.orbit, o);
        
        this.orbit.update();
    }
    destroy()
    {
        this.orbit.dispose();
    }

    update()
    {   
        this.orbit.update();
    }

    saveSettings()
    {
        this._preSettings =
        {
            position: this.c3d.three.camera.position.clone(),
            rotation: this.c3d.three.camera.rotation.clone(),
            controlCenter: new THREE.Vector3() //this.orbit.target.clone()
        };
    }

    // https://stackoverflow.com/questions/16525043/reset-camera-using-orbitcontrols-js
    restoreSettings(fn = 'to')
    {
        if(!this._preSettings) return;

        // this.c3d.three.camera.position.copy(this._preSettings.position);
        // this.c3d.three.camera.rotation.copy(this._preSettings.rotation);
        // this.orbit.target.copy(this._preSettings.controlCenter);
        
        gsap[fn](this.c3d.three.camera.position, {
            x:this._preSettings.position.x, 
            y:this._preSettings.position.y, 
            z:this._preSettings.position.z
        });
        
        gsap[fn](this.c3d.three.camera.rotation, {
            x:this._preSettings.rotation.x, 
            y:this._preSettings.rotation.y, 
            z:this._preSettings.rotation.z
        });
        
        gsap[fn](this.orbit.target, {
            x:this._preSettings.controlCenter.x, 
            y:this._preSettings.controlCenter.y, 
            z:this._preSettings.controlCenter.z
        });

    }

}
