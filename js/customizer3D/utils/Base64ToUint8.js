
export const Base64ToUint8 = (base64) =>
{
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}
