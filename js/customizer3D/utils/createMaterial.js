import * as THREE from 'three';

export const createMaterial = (data) =>
{
    if(data.colorOnly || data == 'default')
    {
        return false;
    }

    if(!data.materialOptions) data.materialOptions = {};

    if(data.url && !data.material)
    {
        return new THREE.MeshBasicMaterial(data.materialOptions);
    }

    const materials =
    [
        'MeshBasicMaterial', 
        'MeshLambertMaterial', 
        'MeshPhongMaterial', 
        'MeshStandardMaterial', 
        'MeshPhysicalMaterial',
        'MeshMatcapMaterial'
    ];
    
    for (let i = 0; i < materials.length; i++)
    {
        const material = materials[i];
        if(data.material == material)
        {
            const mat = new THREE[data.material](data.materialOptions);
            return mat;
        }
    }

    return false;
};
