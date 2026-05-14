import * as THREE from 'three';
import { DefaultLoader } from './DefaultLoader.js?c3d=103';
import {SVGLoader} from 'three_dir/loaders/SVGLoader.js?c3d=103';

export class SVG extends DefaultLoader
{
    constructor(o)
    {
        if(typeof(o) === 'string') o = {url:o};
        o.loader = 'svg';
        super(o);
    }

    _init()
    {
        const group = new THREE.Group();
        this.obj.name = this.props.name || 'svg';
    
        for ( let i = 0; i < this.obj.paths.length; i ++ )
        {
        
            const path = this.obj.paths[ i ];
        
            const material = new THREE.MeshBasicMaterial( {
                color: path.color,
                side: THREE.DoubleSide,
                // opacity: path.userData.style.fillOpacity,
                // transparent: true,
                depthWrite: false
            } );
        
            const shapes = SVGLoader.createShapes(path);
        
            for ( let j = 0; j < shapes.length; j ++ ) {
        
                const shape = shapes[ j ];
                const geometry = new THREE.ShapeGeometry( shape );
                geometry.applyMatrix4(new THREE.Matrix4().makeScale ( 1, -1, 1 ));
                const mesh = new THREE.Mesh( geometry, material );
                group.add( mesh );    
            }
        }
        
        // https://discourse.threejs.org/t/does-three-have-any-kind-of-independent-unit-i-understand-that-a-unit-in-three-is-abstract-but-scale-set-seems-to-be-relative-to-the-models-imported-size/16019/2
        var size = new THREE.Box3().setFromObject( group ).getSize( new THREE.Vector3() );
        var scaleVec = new THREE.Vector3(1, 1, 1).divide( size );
        var scale = Math.min( scaleVec.x, Math.min( scaleVec.y, scaleVec.z ));
        group.scale.setScalar(scale);

        this.obj = group;
    }
}
