import * as THREE from 'three';
import {getMainUniforms, getMainVertexShader, getMainFragmentShader} from 'customizer3D_dir/three/materials/Shaders.js?c3d=104';
import {getMaxLayers, getTexureSize} from 'customizer3D_dir/settings/GPUInfo.js?c3d=104';


export const setMainMaterial = (c3d, mesh) =>
{
    if(mesh.material) disposeMaterial(mesh);
    if(mesh.material?.uniforms) mesh.material.uniforms.uLayerTextures.value.dispose();
    
    const MAX_LAYERS = getMaxLayers(c3d);
    const dims = getTexureSize(c3d, mesh.name);
    const uniforms = THREE.UniformsUtils.clone(getMainUniforms(c3d));

    uniforms.tBase.value = getDummyCanvasTexture(dims.width, dims.height);
    uniforms.uLayerTextures.value = createTextureArray(c3d, dims.width, dims.height);

    const material = new THREE.RawShaderMaterial(
    {
        glslVersion: THREE.GLSL3,
        uniforms,
        vertexShader: getMainVertexShader(c3d),
        fragmentShader: getMainFragmentShader(c3d),
        transparent: true,
        depthTest: true,
        depthWrite: true,
        premultipliedAlpha: true
    });

    return material;
}



export const createTextureArray = (c3d, width = 1, height = 1) =>
{
    const MAX_LAYERS = getMaxLayers(c3d);
    const data = new Uint8Array(width * height * MAX_LAYERS * 4);
    const texArray = new THREE.DataArrayTexture(data, width, height, MAX_LAYERS);
    
    texArray.format = THREE.RGBAFormat;
    texArray.type = THREE.UnsignedByteType;
    
    return texArray;
}


export const getDummyCanvas = (width = 1, height = 1, color) =>
{
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    if(color)
    {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
    }

    return canvas;
};


export const getDummyCanvasTexture = (width = 1, height = 1, color) =>
{
    const texture = new THREE.CanvasTexture(getDummyCanvas(width, height, color));
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    return texture;
};


export const disposeMaterial = (obj) =>
{
    if (!obj) return;

    if (obj.children && obj.children.length > 0) {
        for (let i = obj.children.length - 1; i >= 0; i--) {
            disposeMaterial(obj.children[i]);
        }
    }

    if (obj.geometry) {
        obj.geometry.dispose();
    }

    if (obj.material) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];

        materials.forEach((mat) => {

            for (const key in mat) {
                if (mat[key] && mat[key].isTexture) {
                    mat[key].dispose();
                }
            }

            if (mat.uniforms) {
                Object.values(mat.uniforms).forEach((u) => {
                    const val = u.value;
                    if (val) {

                        if (val.isTexture) val.dispose();

                        else if (Array.isArray(val)) {
                            val.forEach(v => { if (v && v.isTexture) v.dispose(); });
                        }
                    }
                });
            }

            mat.dispose(); 

        });
    }

    // if (obj.parent) {
    //     obj.parent.remove(obj);
    // }

};