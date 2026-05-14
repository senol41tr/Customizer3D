import * as THREE from 'three';

export class Lights
{
    constructor(three)
    {
        this.three = three;

        this.lights = new THREE.Group();
        this.lights.name = 'LightGroup';
        this.three.scene.add(this.lights);
    }

    studio()
    {
        // ambient
        let light = this.addLight({
            name: 'AmbientLight',
            color: 0xffffff,
            intensity: 1.1
        });
        
        // front
        light = this.addLight({
            name: 'DirectionalLight',
            color: 0xffffff,
            intensity: 1.0,
            position: {x:0, y: 0, z:30}
        });

        // let helper = new THREE.DirectionalLightHelper( light, 5 );
        // this.three.scene.add( helper );
    
        // back
        light = this.addLight({
            name: 'DirectionalLight',
            color: 0xffffff,
            intensity: 1.0,
            position: {x:0, y: 0, z:-30}
        });

        // helper = new THREE.DirectionalLightHelper( light, 5 );
        // this.three.scene.add( helper );
        
        // right
        light = this.addLight({
            name: 'DirectionalLight',
            color: 0xffffff,
            intensity: 1.0,
            position: {x:30, y: 0, z:0}
        });

        // helper = new THREE.DirectionalLightHelper( light, 5 );
        // this.three.scene.add( helper );
        
        // left
        light = this.addLight({
            name: 'DirectionalLight',
            color: 0xffffff,
            intensity: 1.0,
            position: {x:-30, y: 0, z:0}
        });

        // helper = new THREE.DirectionalLightHelper( light, 5 );
        // this.three.scene.add( helper );

        // top
        light = this.addLight({
            name: 'DirectionalLight',
            color: 0xffffff,
            intensity: 1.0,
            position: {x:0, y: 30, z:0}
        });

        // helper = new THREE.DirectionalLightHelper( light, 5 );
        // this.three.scene.add( helper );

        // bottom
        light = this.addLight({
            name: 'DirectionalLight',
            color: 0xffffff,
            intensity: 1.0,
            position: {x:0, y: -30, z:0}
        });

        // helper = new THREE.DirectionalLightHelper( light, 5 );
        // this.three.scene.add( helper );

        return this;
    }

    addLight(options)
    {
        const light = new THREE[options.name](options.color, options.intensity);

        if(options.position) light.position.set( options.position.x, options.position.y, options.position.z );

        this.lights.add(light);

        return light;
    }
}
