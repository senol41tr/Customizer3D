import * as THREE from 'three';

export const fitMeshToScreen = (camera, mesh, padding = 1.25) =>
{
    const boundingBox = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    const fov = camera.fov * (Math.PI / 180);
    const aspect = camera.aspect;
    const distanceHeight = (size.y / 2) / Math.tan(fov / 2);
    const distanceWidth = (size.x / 2) / (Math.tan(fov / 2) * aspect);
    const finalDistance = Math.max(distanceHeight, distanceWidth) * padding;
    const safeDistance = isNaN(finalDistance) || finalDistance < 0.1 ? 100 : finalDistance;

    camera.position.set(center.x, center.y, center.z + safeDistance);
    // camera.near = 0.1;
    // camera.far = safeDistance * 10; 
    // camera.updateProjectionMatrix();
    // camera.lookAt(center);
}
