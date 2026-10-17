import * as THREE from 'three';

export const fitMeshToScreen = (camera, mesh, padding = 1.25, centerMesh = true) =>
{
    const boundingBox = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);

    if (size.x === 0 || size.y === 0) return;

    const distance = Math.abs(camera.position.z - center.z);
    const safeDistance = isNaN(distance) || distance < 0.1 ? 10 : distance;

    const fovInRadians = camera.fov * (Math.PI / 180);
    const aspect = camera.aspect;

    const visibleHeight = 2 * Math.tan(fovInRadians / 2) * safeDistance;
    const visibleWidth = visibleHeight * aspect;

    const scaleX = (visibleWidth / size.x) / padding;
    const scaleY = (visibleHeight / size.y) / padding;

    const finalScale = Math.min(scaleX, scaleY);
    const safeScale = isNaN(finalScale) || finalScale <= 0 ? 1 : finalScale;

    mesh.scale.set(safeScale, safeScale, safeScale);

    if (centerMesh)
    {
        mesh.position.x += (camera.position.x - center.x);
        mesh.position.y += (camera.position.y - center.y);
    }
}
