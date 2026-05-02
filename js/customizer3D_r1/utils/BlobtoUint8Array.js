export const BlobtoUint8Array = async (blob) =>
{
    const uint8Array = await new Promise((resolve, reject) =>
    {

        const reader = new FileReader();

        reader.onload = () =>
        {
            const arrayBuffer = reader.result;
            const uint8Array = new Uint8Array(arrayBuffer);
            resolve(uint8Array);
        };

        reader.readAsArrayBuffer(blob);

    });

    return uint8Array;
}
